'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createNoteSchema, updateNoteSchema, type CreateNoteFormData, type UpdateNoteFormData } from '../validations/notes'

// notes 테이블 존재 확인 함수 (테이블 생성은 수동으로 처리)
async function createNotesTableIfNotExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    console.log('=== notes 테이블 존재 확인 ===')
    
    // 테이블 존재 확인
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'notes')
      .eq('table_schema', 'public')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('테이블 존재 확인 실패:', checkError)
      return false
    }
    
    if (!tableExists) {
      console.log('notes 테이블이 존재하지 않습니다. 수동으로 생성해주세요.')
      return false
    }
    
    console.log('notes 테이블 확인 성공!')
    console.log('=================================')
    return true
    
  } catch (error) {
    console.error('테이블 확인 중 예외 발생:', error)
    return false
  }
}

export async function createNote(formData: CreateNoteFormData) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        error: '로그인이 필요합니다. 다시 로그인해주세요.'
      }
    }

    // 유효성 검사
    const validatedFields = createNoteSchema.safeParse(formData)
    
    if (!validatedFields.success) {
      return {
        error: '입력 정보를 다시 확인해주세요',
        fieldErrors: validatedFields.error.flatten().fieldErrors
      }
    }

    const { title, content } = validatedFields.data

    // Supabase를 통해 노트 생성
    const { data, error } = await supabase
      .from('notes')
      .insert({
        title,
        content: content || '',
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('=== Supabase 노트 생성 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.code)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      // 테이블이 없는 경우 자동으로 생성 시도
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        console.log('notes 테이블이 없습니다. 자동 생성을 시도합니다...')
        
        const tableCreated = await createNotesTableIfNotExists(supabase)
        
        if (tableCreated) {
          console.log('테이블 생성 성공! 노트 생성을 다시 시도합니다...')
          
          // 테이블 생성 후 다시 노트 생성 시도
          const { data: retryData, error: retryError } = await supabase
            .from('notes')
            .insert({
              title,
              content: content || '',
              user_id: user.id,
            })
            .select()
            .single()
          
          if (retryError) {
            console.error('테이블 생성 후 재시도에서도 실패:', retryError)
            return { error: `노트 생성 중 오류가 발생했습니다: ${retryError.message}` }
          }
          
          console.log('=== 노트 생성 성공 (테이블 자동 생성 후) ===')
          console.log('생성된 노트:', retryData)
          console.log('========================')
          
          // 노트 생성 후 자동으로 요약 및 태그 생성 (비동기)
          if (retryData?.id && content) {
            const promises = []
            
            // 요약 생성 (100자 이상)
            if (content.length >= 100) {
              console.log('노트 내용이 충분하므로 요약 생성을 시작합니다...')
              promises.push(
                generateSummary(retryData.id, content).catch(error => {
                  console.error('요약 생성 실패:', error)
                })
              )
            } else {
              console.log('노트 내용이 짧아 요약 생성을 건너뜁니다.')
            }

            // 태그 생성 (50자 이상)
            if (content.length >= 50) {
              console.log('노트 내용이 충분하므로 태그 생성을 시작합니다...')
              promises.push(
                generateTags(retryData.id, content).catch(error => {
                  console.error('태그 생성 실패:', error)
                })
              )
            } else {
              console.log('노트 내용이 짧아 태그 생성을 건너뜁니다.')
            }
            
            // 모든 AI 처리가 완료될 때까지 대기
            if (promises.length > 0) {
              console.log('AI 처리가 완료될 때까지 대기 중...')
              await Promise.allSettled(promises)
              console.log('AI 처리 완료!')
            }
          }
          
          // 성공 시 노트 목록 페이지로 리다이렉트
          redirect('/notes')
          
        } else {
          console.log('🔧 자동 테이블 생성에 실패했습니다. 수동 생성이 필요합니다.')
          return { 
            error: `📋 데이터베이스 설정이 필요합니다!

🔗 Supabase 대시보드 (https://supabase.com/dashboard)에 접속해서:
1. 프로젝트 선택
2. 왼쪽 메뉴에서 "SQL Editor" 클릭  
3. "New query" 버튼 클릭
4. 아래 SQL 코드를 복사해서 붙여넣고 "Run" 클릭:

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own notes" ON notes FOR ALL USING (auth.uid() = user_id);

✅ 테이블 생성 후 다시 노트를 저장해보세요!` 
          }
        }
      } else {
        let errorMessage = '노트 생성 중 오류가 발생했습니다'
        
        if (error.code === '23505') {
          errorMessage = '이미 존재하는 노트입니다'
        } else if (error.code === '42501') {
          errorMessage = '노트를 생성할 권한이 없습니다'
        }

        return { error: errorMessage }
      }
    }

    console.log('=== 노트 생성 성공 ===')
    console.log('생성된 노트:', data)
    console.log('========================')

    // 노트 생성 후 자동으로 요약 및 태그 생성 (비동기)
    if (data?.id && content) {
      const promises = []
      
      // 요약 생성 (100자 이상)
      if (content.length >= 100) {
        console.log('노트 내용이 충분하므로 요약 생성을 시작합니다...')
        promises.push(
          generateSummary(data.id, content).catch(error => {
            console.error('요약 생성 실패:', error)
            // 요약 생성 실패가 노트 생성을 방해하지 않도록 에러를 로그만 남김
          })
        )
      } else {
        console.log('노트 내용이 짧아 요약 생성을 건너뜁니다.')
      }

      // 태그 생성 (50자 이상)
      if (content.length >= 50) {
        console.log('노트 내용이 충분하므로 태그 생성을 시작합니다...')
        promises.push(
          generateTags(data.id, content).catch(error => {
            console.error('태그 생성 실패:', error)
            // 태그 생성 실패가 노트 생성을 방해하지 않도록 에러를 로그만 남김
          })
        )
      } else {
        console.log('노트 내용이 짧아 태그 생성을 건너뜁니다.')
      }
      
      // 모든 AI 처리가 완료될 때까지 대기
      if (promises.length > 0) {
        console.log('AI 처리가 완료될 때까지 대기 중...')
        await Promise.allSettled(promises)
        console.log('AI 처리 완료!')
      }
    }

    console.log('노트 생성 완료!')
    
    // 성공 시 노트 목록 페이지로 리다이렉트
    redirect('/notes')
    
  } catch (error) {
    console.error('노트 생성 중 오류:', error)
    return {
      error: error instanceof Error ? error.message : '노트 생성 중 오류가 발생했습니다.'
    }
  }
}

// Rate limiting을 위한 메모리 저장소 (실제 운영에서는 Redis 등 사용 권장)
const regenerationLimits = new Map<string, number>()

// 재생성 제한 확인 함수
function checkRegenerationLimit(userId: string, type: 'summary' | 'tags'): boolean {
  const key = `${userId}:${type}`
  const lastRegeneration = regenerationLimits.get(key)
  const now = Date.now()
  
  if (lastRegeneration && (now - lastRegeneration) < 5000) { // 5초 제한
    return false
  }
  
  regenerationLimits.set(key, now)
  return true
}

// 요약 재생성 서버 액션
export async function regenerateAISummary(noteId: string): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  try {
    console.log('=== 요약 재생성 시작 ===')
    console.log('Note ID:', noteId)

    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('인증 실패:', authError)
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 2. 노트 소유권 확인
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, title, content, user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('노트 조회 실패:', noteError)
      return { success: false, error: '노트를 찾을 수 없습니다.' }
    }

    if (note.user_id !== user.id) {
      console.error('권한 없음: 노트 소유자가 아님')
      return { success: false, error: '노트를 수정할 권한이 없습니다.' }
    }

    // 3. 재생성 제한 확인
    if (!checkRegenerationLimit(user.id, 'summary')) {
      console.error('재생성 제한: 5초 이내 재요청')
      return { success: false, error: '잠시 후 다시 시도해주세요. (5초 간격 제한)' }
    }

    // 4. 노트 내용 길이 확인
    if (!note.content || note.content.length < 100) {
      console.log('내용이 너무 짧아 요약 재생성을 건너뜁니다.')
      return { success: false, error: '내용이 너무 짧아 요약을 생성할 수 없습니다. (최소 100자 필요)' }
    }

    // 5. 기존 요약 삭제 (새로운 요약으로 교체)
    const { error: deleteError } = await supabase
      .from('summaries')
      .delete()
      .eq('note_id', noteId)

    if (deleteError) {
      console.error('기존 요약 삭제 실패:', deleteError)
      // 삭제 실패해도 계속 진행
    }

    // 6. 새 요약 생성
    const result = await generateSummary(noteId, note.content)

    // 7. 재생성 이력 로깅
    console.log('요약 재생성 완료:', {
      noteId,
      userId: user.id,
      success: result.success,
      timestamp: new Date().toISOString()
    })

    return result

  } catch (error) {
    console.error('요약 재생성 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
    }
  }
}

// 태그 재생성 서버 액션
export async function regenerateAITags(noteId: string): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    console.log('=== 태그 재생성 시작 ===')
    console.log('Note ID:', noteId)

    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('인증 실패:', authError)
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 2. 노트 소유권 확인
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, title, content, user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('노트 조회 실패:', noteError)
      return { success: false, error: '노트를 찾을 수 없습니다.' }
    }

    if (note.user_id !== user.id) {
      console.error('권한 없음: 노트 소유자가 아님')
      return { success: false, error: '노트를 수정할 권한이 없습니다.' }
    }

    // 3. 재생성 제한 확인
    if (!checkRegenerationLimit(user.id, 'tags')) {
      console.error('재생성 제한: 5초 이내 재요청')
      return { success: false, error: '잠시 후 다시 시도해주세요. (5초 간격 제한)' }
    }

    // 4. 노트 내용 길이 확인
    if (!note.content || note.content.length < 50) {
      console.log('내용이 너무 짧아 태그 재생성을 건너뜁니다.')
      return { success: false, error: '내용이 너무 짧아 태그를 생성할 수 없습니다. (최소 50자 필요)' }
    }

    // 5. 새 태그 생성 (generateTags 함수에서 기존 태그 삭제 처리)
    const result = await generateTags(noteId, note.content)

    // 6. 재생성 이력 로깅
    console.log('태그 재생성 완료:', {
      noteId,
      userId: user.id,
      success: result.success,
      timestamp: new Date().toISOString()
    })

    return result

  } catch (error) {
    console.error('태그 재생성 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
    }
  }
}

export async function getNotes() {
  // 기존 함수는 호환성을 위해 유지하되, 새로운 함수로 위임
  return await getNotesWithPagination({
    page: 1,
    limit: 1000, // 기존 동작과 동일하게 모든 노트 조회
    sortBy: 'updated_at',
    sortOrder: 'desc'
  })
}

// 페이지네이션과 정렬을 지원하는 새로운 노트 조회 함수
export async function getNotesWithPagination(options: {
  page?: number
  limit?: number
  sortBy?: 'updated_at' | 'created_at' | 'title'
  sortOrder?: 'asc' | 'desc'
} = {}) {
  // 기본값 설정
  const {
    page = 1,
    limit = 12,
    sortBy = 'updated_at',
    sortOrder = 'desc'
  } = options

  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      error: '로그인이 필요합니다. 다시 로그인해주세요.',
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      hasNextPage: false,
      hasPrevPage: false
    }
  }

  try {
    // 전체 노트 개수 조회 (페이지네이션용)
    const { count, error: countError } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('=== 노트 개수 조회 에러 ===')
      console.error('에러:', countError)
      console.error('========================')
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)
    
    // 페이지네이션 계산
    const offset = (page - 1) * limit
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // 정렬 옵션 설정
    const ascending = sortOrder === 'asc'

    // 사용자의 노트 목록 조회 (페이지네이션 적용)
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .range(offset, offset + limit - 1)

    // 정렬 적용
    if (sortBy === 'title') {
      query = query.order('title', { ascending })
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending })
    } else {
      query = query.order('updated_at', { ascending })
    }

    const { data, error } = await query

    if (error) {
      console.error('=== 노트 조회 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.code)
      console.error('========================')
      
      return {
        error: '노트를 불러오는 중 오류가 발생했습니다',
        notes: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        hasNextPage: false,
        hasPrevPage: false
      }
    }

    console.log('=== 노트 조회 성공 ===')
    console.log(`페이지: ${page}/${totalPages}, 총 ${totalCount}개 노트 중 ${data?.length || 0}개 조회`)
    console.log(`정렬: ${sortBy} ${sortOrder}`)
    console.log('========================')

    return {
      notes: data || [],
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage,
      hasPrevPage,
      error: null
    }
    
  } catch (catchError) {
    console.error('=== 노트 조회 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`,
      notes: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      hasNextPage: false,
      hasPrevPage: false
    }
  }
}

// 특정 노트 조회 함수
export async function getNoteById(noteId: string) {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      error: '로그인이 필요합니다. 다시 로그인해주세요.',
      note: null
    }
  }

  try {
    // 노트 조회 (본인 소유의 노트만)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('=== 노트 조회 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.code)
      console.error('========================')
      
      if (error.code === 'PGRST116') {
        return {
          error: '노트를 찾을 수 없습니다',
          note: null
        }
      }
      
      return {
        error: '노트를 불러오는 중 오류가 발생했습니다',
        note: null
      }
    }

    return {
      note: data,
      error: null
    }
    
  } catch (catchError) {
    console.error('=== 노트 조회 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`,
      note: null
    }
  }
}

// 노트 수정 함수
export async function updateNote(formData: UpdateNoteFormData) {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      error: '로그인이 필요합니다. 다시 로그인해주세요.'
    }
  }

  // 유효성 검사
  const validatedFields = updateNoteSchema.safeParse(formData)
  
  if (!validatedFields.success) {
    return {
      error: '입력 정보를 다시 확인해주세요',
      fieldErrors: validatedFields.error.flatten().fieldErrors
    }
  }

  const { id, title, content } = validatedFields.data

  try {
    // 먼저 노트가 존재하고 본인 소유인지 확인
    const { data: existingNote, error: checkError } = await supabase
      .from('notes')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (checkError || !existingNote) {
      return { error: '노트를 찾을 수 없습니다' }
    }

    if (existingNote.user_id !== user.id) {
      return { error: '이 노트를 수정할 권한이 없습니다' }
    }

    // 노트 수정 (updated_at은 트리거에 의해 자동 업데이트)
    const { data, error } = await supabase
      .from('notes')
      .update({
        title,
        content: content || '',
        updated_at: new Date().toISOString(), // 명시적으로 업데이트
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('=== Supabase 노트 수정 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.code)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      let errorMessage = '노트 수정 중 오류가 발생했습니다'
      
      if (error.code === '23505') {
        errorMessage = '중복된 노트 제목입니다'
      } else if (error.code === '42501') {
        errorMessage = '노트를 수정할 권한이 없습니다'
      }

      return { error: errorMessage }
    }

    console.log('=== 노트 수정 성공 ===')
    console.log('수정된 노트:', data)
    console.log('========================')

    // 성공 시 노트 목록 페이지로 리다이렉트
    redirect('/notes')
    
  } catch (catchError) {
    // Next.js redirect는 예외를 던지는 것이 정상 동작이므로 다시 던짐
    if (catchError instanceof Error && catchError.message === 'NEXT_REDIRECT') {
      throw catchError
    }
    
    console.error('=== 노트 수정 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`
    }
  }
}

// 노트 삭제 함수
export async function deleteNote(noteId: string) {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      error: '로그인이 필요합니다. 다시 로그인해주세요.',
      success: false
    }
  }

  try {
    // 먼저 노트가 존재하고 본인 소유인지 확인
    const { data: existingNote, error: checkError } = await supabase
      .from('notes')
      .select('id, user_id, title')
      .eq('id', noteId)
      .single()

    if (checkError || !existingNote) {
      return { 
        error: '노트를 찾을 수 없습니다',
        success: false 
      }
    }

    if (existingNote.user_id !== user.id) {
      return { 
        error: '이 노트를 삭제할 권한이 없습니다',
        success: false 
      }
    }

    // 노트 삭제
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)

    if (error) {
      console.error('=== Supabase 노트 삭제 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.code)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      let errorMessage = '노트 삭제 중 오류가 발생했습니다'
      
      if (error.code === '42501') {
        errorMessage = '노트를 삭제할 권한이 없습니다'
      }

      return { 
        error: errorMessage,
        success: false 
      }
    }

    console.log('=== 노트 삭제 성공 ===')
    console.log('삭제된 노트 ID:', noteId)
    console.log('삭제된 노트 제목:', existingNote.title)
    console.log('========================')

    return {
      success: true,
      error: null
    }
    
  } catch (catchError) {
    console.error('=== 노트 삭제 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`,
      success: false
    }
  }
}

// 노트 부분 업데이트 함수 (자동 저장용)
export async function updateNotePartial(noteId: string, data: { title?: string; content?: string }) {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return {
      error: '로그인이 필요합니다. 다시 로그인해주세요.',
      success: false
    }
  }

  // 업데이트할 데이터가 없으면 성공 처리
  if (!data.title && !data.content) {
    return {
      success: true,
      error: null
    }
  }

  try {
    // 먼저 노트가 존재하고 본인 소유인지 확인
    const { data: existingNote, error: checkError } = await supabase
      .from('notes')
      .select('id, user_id, title, content')
      .eq('id', noteId)
      .single()

    if (checkError || !existingNote) {
      return { 
        error: '노트를 찾을 수 없습니다',
        success: false 
      }
    }

    if (existingNote.user_id !== user.id) {
      return { 
        error: '이 노트를 수정할 권한이 없습니다',
        success: false 
      }
    }

    // 변경사항이 있는지 확인
    const hasChanges = 
      (data.title !== undefined && data.title !== existingNote.title) ||
      (data.content !== undefined && data.content !== existingNote.content)

    if (!hasChanges) {
      return {
        success: true,
        error: null,
        unchanged: true
      }
    }

    // 업데이트할 필드만 포함
    const updateData: {
      updated_at: string
      title?: string
      content?: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) {
      updateData.title = data.title
    }
    if (data.content !== undefined) {
      updateData.content = data.content
    }

    // 노트 부분 업데이트
    const { data: updatedNote, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('=== Supabase 노트 부분 업데이트 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.code)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      let errorMessage = '노트 저장 중 오류가 발생했습니다'
      
      if (error.code === '23505') {
        errorMessage = '중복된 노트 제목입니다'
      } else if (error.code === '42501') {
        errorMessage = '노트를 수정할 권한이 없습니다'
      }

      return { 
        error: errorMessage,
        success: false 
      }
    }

    console.log('=== 노트 부분 업데이트 성공 ===')
    console.log('업데이트된 필드:', Object.keys(updateData))
    console.log('노트 ID:', noteId)
    console.log('========================')

    return {
      success: true,
      error: null,
      note: updatedNote
    }
    
  } catch (catchError) {
    console.error('=== 노트 부분 업데이트 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`,
      success: false
    }
  }
}

// 초안 저장 함수 (자동 저장 전용, 더 관대한 검증)
export async function saveNoteDraft(noteId: string, data: { title?: string; content?: string }) {
  // 기본적으로 updateNotePartial과 동일하지만 더 관대한 검증
  return await updateNotePartial(noteId, data)
}

// summaries 테이블 생성 함수
async function createSummariesTableIfNotExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    console.log('=== summaries 테이블 존재 확인 ===')
    
    // 테이블 존재 확인
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'summaries')
      .eq('table_schema', 'public')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('테이블 존재 확인 실패:', checkError)
      return false
    }
    
    if (!tableExists) {
      console.log('summaries 테이블이 존재하지 않습니다. 수동으로 생성해주세요.')
      return false
    }
    
    console.log('summaries 테이블 확인 성공!')
    return true
  } catch (error) {
    console.error('summaries 테이블 확인 중 예외:', error)
    return false
  }
}

// note_tags 테이블 존재 확인 함수
async function createNoteTagsTableIfNotExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    console.log('=== note_tags 테이블 존재 확인 ===')
    
    // 테이블 존재 확인
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'note_tags')
      .eq('table_schema', 'public')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('테이블 존재 확인 실패:', checkError)
      return false
    }
    
    if (!tableExists) {
      console.log('note_tags 테이블이 존재하지 않습니다. 수동으로 생성해주세요.')
      return false
    }
    
    console.log('note_tags 테이블 확인 성공!')
    return true
  } catch (error) {
    console.error('note_tags 테이블 확인 중 예외:', error)
    return false
  }
}

// token_usage 테이블 존재 확인 함수 (사용하지 않음)
// async function createTokenUsageTableIfNotExists(supabase: ReturnType<typeof createClient>) {
//   try {
//     console.log('=== token_usage 테이블 존재 확인 ===')
//     
//     // 테이블 존재 확인
//     const { data: tableExists, error: checkError } = await supabase
//       .from('information_schema.tables')
//       .select('table_name')
//       .eq('table_name', 'token_usage')
//       .eq('table_schema', 'public')
//       .single()
//     
//     if (checkError && checkError.code !== 'PGRST116') {
//       console.error('테이블 존재 확인 실패:', checkError)
//       return false
//     }
//     
//     if (!tableExists) {
//       console.log('token_usage 테이블이 존재하지 않습니다. 수동으로 생성해주세요.')
//       return false
//     }
//     
//     console.log('token_usage 테이블 확인 성공!')
//     return true
//   } catch (error) {
//     console.error('token_usage 테이블 확인 중 예외:', error)
//     return false
//   }
// }

// 토큰 추정 함수 (간단한 구현) - 사용하지 않음
// function estimateTokens(text: string): number {
//   // 대략적인 토큰 수 계산 (1 토큰 ≈ 4 문자)
//   return Math.ceil(text.length / 4)
// }

// 토큰 제한 검증 함수 - 사용하지 않음
// function validateTokenLimit(inputTokens: number, maxTokens: number = 8192): boolean {
//   // 응답용 토큰도 고려하여 여유분 확보
//   const reservedTokens = 2000
//   return inputTokens <= maxTokens - reservedTokens
// }

// 요약 생성 서버 액션 (에러 핸들링 강화)
export async function generateSummary(noteId: string, content: string): Promise<{
  success: boolean
  summary?: string
  error?: string
  errorDetails?: unknown
}> {
  try {
    console.log('=== 요약 생성 시작 ===')
    console.log('Note ID:', noteId)
    console.log('Content length:', content.length)

    // 1. 짧은 노트 필터링
    if (content.length < 100) {
      console.log('내용이 너무 짧아 요약 생성을 건너뜁니다.')
      return { success: true, summary: '' }
    }

    // 2. 사용자 정보 가져오기 (에러 추적용)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // 3. 에러 핸들링이 포함된 AI 처리
    const { generateSummaryWithErrorHandling } = await import('@/lib/ai/ai-processor-with-error-handling')
    
    const result = await generateSummaryWithErrorHandling(noteId, content, {
      userId,
      maxRetries: 3,
      enableAutoRetry: true,
      enableContentTruncation: true,
      onProgress: (status) => console.log('요약 생성 진행:', status),
      onError: (error) => console.error('요약 생성 에러:', error)
    })

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error?.userMessage || '요약 생성에 실패했습니다.',
        errorDetails: result.error
      }
    }

    // 결과에서 텍스트 추출 (usage 정보가 포함된 경우)
    const summaryText = typeof result.data === 'string' ? result.data : (result.data as { text: string }).text

    // 4. 테이블 확인 및 데이터베이스 저장
    await createSummariesTableIfNotExists(supabase)

    const { error: insertError } = await supabase
      .from('summaries')
      .insert({
        note_id: noteId,
        model: 'gemini-2.0-flash-001',
        content: summaryText
      })

    if (insertError) {
      console.error('요약 저장 실패:', insertError)
      return { success: false, error: '요약 저장에 실패했습니다.' }
    }

    console.log(`요약 생성 완료! (${result.attempts}회 시도, ${result.totalDuration}ms)`)
    return { success: true, summary: summaryText }

  } catch (error) {
    console.error('요약 생성 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
    }
  }
}

// 노트의 요약 조회 함수
export async function getNoteSummary(noteId: string): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('summaries')
      .select('content')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        return { success: true, summary: '' }
      }
      console.error('요약 조회 실패:', error)
      return { success: false, error: '요약을 불러올 수 없습니다.' }
    }

    return { success: true, summary: data?.content || '' }
  } catch (error) {
    console.error('요약 조회 중 오류:', error)
    return { success: false, error: '요약 조회 중 오류가 발생했습니다.' }
  }
}

// 태그 정규화 함수
function normalizeTags(rawTags: string[]): string[] {
  return rawTags
    .filter(tag => tag && tag.length > 0)
    .map(tag => tag.replace(/[^\w가-힣\s]/g, '').trim())
    .filter(tag => tag.length >= 1 && tag.length <= 20)
    .filter((tag, index, arr) => arr.indexOf(tag) === index) // 중복 제거
    .slice(0, 6)
}

// 태그 생성 서버 액션 (에러 핸들링 강화)
export async function generateTags(noteId: string, content: string): Promise<{
  success: boolean
  tags?: string[]
  error?: string
  errorDetails?: unknown
}> {
  try {
    console.log('=== 태그 생성 시작 ===')
    console.log('Note ID:', noteId)
    console.log('Content length:', content.length)

    // 1. 짧은 노트 필터링
    if (content.length < 50) {
      console.log('내용이 너무 짧아 태그 생성을 건너뜁니다.')
      return { success: true, tags: [] }
    }

    // 2. 사용자 정보 가져오기 (에러 추적용)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // 3. 에러 핸들링이 포함된 AI 처리
    const { generateTagsWithErrorHandling } = await import('@/lib/ai/ai-processor-with-error-handling')
    
    const result = await generateTagsWithErrorHandling(noteId, content, {
      userId,
      maxRetries: 3,
      enableAutoRetry: true,
      enableContentTruncation: true,
      onProgress: (status) => console.log('태그 생성 진행:', status),
      onError: (error) => console.error('태그 생성 에러:', error)
    })

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error?.userMessage || '태그 생성에 실패했습니다.',
        errorDetails: result.error
      }
    }

    // 결과에서 태그 추출 (usage 정보가 포함된 경우)
    const tagsArray = Array.isArray(result.data) ? result.data : (result.data as { tags: string[] }).tags

    // 4. 태그 정규화
    const normalizedTags = normalizeTags(tagsArray)

    if (normalizedTags.length === 0) {
      return { success: false, error: '유효한 태그를 생성할 수 없습니다.' }
    }

    // 5. 테이블 확인 및 데이터베이스 저장
    await createNoteTagsTableIfNotExists(supabase)

    // 기존 태그 삭제
    const { error: deleteError } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)

    if (deleteError) {
      console.error('기존 태그 삭제 실패:', deleteError)
      // 삭제 실패해도 계속 진행
    }

    // 새 태그 저장
    const tagsToInsert = normalizedTags.map(tag => ({
      note_id: noteId,
      tag: tag
    }))

    const { error: insertError } = await supabase
      .from('note_tags')
      .insert(tagsToInsert)

    if (insertError) {
      console.error('태그 저장 실패:', insertError)
      return { success: false, error: '태그 저장에 실패했습니다.' }
    }

    console.log(`태그 생성 완료! (${result.attempts}회 시도, ${result.totalDuration}ms)`, normalizedTags)
    return { success: true, tags: normalizedTags }

  } catch (error) {
    console.error('태그 생성 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
    }
  }
}

// 노트의 태그 조회 함수
export async function getNoteTags(noteId: string): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('note_tags')
      .select('tag')
      .eq('note_id', noteId)
      .order('tag', { ascending: true })

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        return { success: true, tags: [] }
      }
      console.error('태그 조회 실패:', error)
      return { success: false, error: '태그를 불러올 수 없습니다.' }
    }

    const tags = data?.map(item => item.tag) || []
    return { success: true, tags }
  } catch (error) {
    console.error('태그 조회 중 오류:', error)
    return { success: false, error: '태그 조회 중 오류가 발생했습니다.' }
  }
}

// 요약 수동 업데이트 서버 액션
export async function updateSummary(noteId: string, summaryContent: string): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  try {
    console.log('=== 요약 업데이트 시작 ===')
    console.log('Note ID:', noteId)
    console.log('Summary length:', summaryContent.length)

    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('인증 실패:', authError)
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 2. 노트 소유권 확인
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('노트 조회 실패:', noteError)
      return { success: false, error: '노트를 찾을 수 없습니다.' }
    }

    if (note.user_id !== user.id) {
      console.error('권한 없음: 노트 소유자가 아님')
      return { success: false, error: '노트를 수정할 권한이 없습니다.' }
    }

    // 3. 입력 검증
    if (!summaryContent || summaryContent.trim() === '') {
      return { success: false, error: '요약 내용을 입력해주세요.' }
    }

    if (summaryContent.length > 1000) {
      return { success: false, error: '요약은 최대 1000자까지 입력 가능합니다.' }
    }

    // 4. 테이블 존재 확인
    await createSummariesTableIfNotExists(supabase)

    // 5. 기존 요약 확인 및 업데이트/삽입
    const { data: existingSummary, error: checkError } = await supabase
      .from('summaries')
      .select('id')
      .eq('note_id', noteId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('기존 요약 확인 실패:', checkError)
      return { success: false, error: '요약 확인 중 오류가 발생했습니다.' }
    }

    if (existingSummary) {
      // 기존 요약 업데이트
      const { error: updateError } = await supabase
        .from('summaries')
        .update({
          content: summaryContent.trim(),
          model: 'user-edited'
        })
        .eq('note_id', noteId)

      if (updateError) {
        console.error('요약 업데이트 실패:', updateError)
        return { success: false, error: '요약 업데이트에 실패했습니다.' }
      }
    } else {
      // 새 요약 삽입
      const { error: insertError } = await supabase
        .from('summaries')
        .insert({
          note_id: noteId,
          model: 'user-edited',
          content: summaryContent.trim()
        })

      if (insertError) {
        console.error('요약 삽입 실패:', insertError)
        return { success: false, error: '요약 저장에 실패했습니다.' }
      }
    }

    console.log('요약 업데이트 완료!')
    return { success: true, summary: summaryContent.trim() }

  } catch (error) {
    console.error('요약 업데이트 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
    }
  }
}

// 태그 수동 업데이트 서버 액션
export async function updateTags(noteId: string, tags: string[]): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    console.log('=== 태그 업데이트 시작 ===')
    console.log('Note ID:', noteId)
    console.log('Tags:', tags)

    // 1. 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('인증 실패:', authError)
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 2. 노트 소유권 확인
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, user_id')
      .eq('id', noteId)
      .single()

    if (noteError || !note) {
      console.error('노트 조회 실패:', noteError)
      return { success: false, error: '노트를 찾을 수 없습니다.' }
    }

    if (note.user_id !== user.id) {
      console.error('권한 없음: 노트 소유자가 아님')
      return { success: false, error: '노트를 수정할 권한이 없습니다.' }
    }

    // 3. 태그 정규화 및 검증
    const normalizedTags = normalizeTags(tags)

    if (normalizedTags.length > 10) {
      return { success: false, error: '태그는 최대 10개까지 입력 가능합니다.' }
    }

    for (const tag of normalizedTags) {
      if (tag.length > 20) {
        return { success: false, error: '각 태그는 최대 20자까지 입력 가능합니다.' }
      }
    }

    // 4. 테이블 존재 확인
    await createNoteTagsTableIfNotExists(supabase)

    // 5. 기존 태그 삭제
    const { error: deleteError } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)

    if (deleteError) {
      console.error('기존 태그 삭제 실패:', deleteError)
      return { success: false, error: '태그 업데이트에 실패했습니다.' }
    }

    // 6. 새 태그 삽입 (빈 배열이 아닌 경우에만)
    if (normalizedTags.length > 0) {
      const tagsToInsert = normalizedTags.map(tag => ({
        note_id: noteId,
        tag: tag
      }))

      const { error: insertError } = await supabase
        .from('note_tags')
        .insert(tagsToInsert)

      if (insertError) {
        console.error('태그 삽입 실패:', insertError)
        return { success: false, error: '태그 저장에 실패했습니다.' }
      }
    }

    console.log('태그 업데이트 완료!')
    return { success: true, tags: normalizedTags }

  } catch (error) {
    console.error('태그 업데이트 중 오류:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
    }
  }
}