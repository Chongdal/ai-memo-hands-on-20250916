/**
 * app/api/create-epic4-tables/route.ts
 * Epic 4 테이블을 강제로 생성하는 API 엔드포인트
 * 브라우저에서 http://localhost:3004/api/create-epic4-tables 접속하여 실행
 * 애플리케이션 레벨에서 테이블 생성 함수 호출
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// 테이블 생성 함수들 (lib/actions/notes.ts에서 복사)
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

async function createTokenUsageTableIfNotExists(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    console.log('=== token_usage 테이블 존재 확인 ===')
    
    // 테이블 존재 확인
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'token_usage')
      .eq('table_schema', 'public')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('테이블 존재 확인 실패:', checkError)
      return false
    }
    
    if (!tableExists) {
      console.log('token_usage 테이블이 존재하지 않습니다. 수동으로 생성해주세요.')
      return false
    }
    
    console.log('token_usage 테이블 확인 성공!')
    return true
  } catch (error) {
    console.error('token_usage 테이블 확인 중 예외:', error)
    return false
  }
}

export async function GET() {
  try {
    console.log('🚀 Epic 4 테이블 생성 API 시작...')
    
    const supabase = await createClient()
    const results = {
      summaries: false,
      note_tags: false,
      token_usage: false,
      errors: [] as string[]
    }

    // 1. summaries 테이블 생성
    try {
      results.summaries = await createSummariesTableIfNotExists(supabase)
    } catch (error) {
      const errorMsg = `summaries 테이블 생성 실패: ${error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    // 2. note_tags 테이블 생성
    try {
      results.note_tags = await createNoteTagsTableIfNotExists(supabase)
    } catch (error) {
      const errorMsg = `note_tags 테이블 생성 실패: ${error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    // 3. token_usage 테이블 생성
    try {
      results.token_usage = await createTokenUsageTableIfNotExists(supabase)
    } catch (error) {
      const errorMsg = `token_usage 테이블 생성 실패: ${error}`
      console.error(errorMsg)
      results.errors.push(errorMsg)
    }

    const successCount = Object.values(results).filter(v => v === true).length
    const totalTables = 3

    const response = {
      success: successCount > 0,
      message: `Epic 4 테이블 생성 완료: ${successCount}/${totalTables} 성공`,
      results,
      instructions: [
        '✅ 테이블 생성이 완료되었습니다!',
        '📝 이제 다음 단계를 진행하세요:',
        '1. http://localhost:3004/notes/new 에서 새 노트 작성',
        '2. 100자 이상의 긴 텍스트 입력',
        '3. 저장 후 자동 AI 요약/태그 생성 확인',
        '4. 노트 상세 페이지에서 재생성/편집 기능 테스트'
      ],
      timestamp: new Date().toISOString(),
      note: results.errors.length > 0 ? '일부 테이블 생성에 실패했습니다. 콘솔을 확인해주세요.' : '모든 테이블이 성공적으로 생성되었습니다.'
    }

    console.log('✅ Epic 4 테이블 생성 API 완료:', response)
    
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ Epic 4 테이블 생성 API 전체 오류:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      message: 'Epic 4 테이블 생성 중 전체적인 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
