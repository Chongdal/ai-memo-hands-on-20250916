'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteBreadcrumb } from '@/components/notes/note-breadcrumb'
import { NoteDetailView } from '@/components/notes/note-detail-view'
import { NoteEditView } from '@/components/notes/note-edit-view'
import { NoteActions } from '@/components/notes/note-actions'
// import { NoteSummary } from '@/components/notes/note-summary' // 사용하지 않음
// import { NoteTags } from '@/components/notes/note-tags' // 사용하지 않음
import { getNoteSummary, getNoteTags, regenerateAISummary, regenerateAITags, updateSummary, updateTags } from '@/lib/actions/notes'
import { NoteSummaryWithEditor } from '@/components/notes/note-summary-with-editor'
import { NoteTagsWithEditor } from '@/components/notes/note-tags-with-editor'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  user_id: string
}

interface NoteDetailPageClientProps {
  note: Note
  initialMode: 'view' | 'edit'
}

export function NoteDetailPageClient({ note, initialMode }: NoteDetailPageClientProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [currentNote, setCurrentNote] = useState(note)
  
  // 요약 관련 상태
  const [summary, setSummary] = useState<string>('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  // const [summaryError, setSummaryError] = useState<string>('') // 사용하지 않음

  // 태그 관련 상태
  const [tags, setTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  // const [tagsError, setTagsError] = useState<string>('') // 사용하지 않음

  // 컴포넌트 마운트 시 요약 및 태그 로드
  useEffect(() => {
    const loadSummary = async () => {
      if (!note.id) return
      
      setSummaryLoading(true)
      // setSummaryError('') // 사용하지 않음
      
      try {
        const result = await getNoteSummary(note.id)
        if (result.success) {
          setSummary(result.summary || '')
        } else {
          // setSummaryError(result.error || '요약을 불러올 수 없습니다.') // 사용하지 않음
          console.error('요약 로드 실패:', result.error)
        }
      } catch (error) {
        // setSummaryError('요약 로드 중 오류가 발생했습니다.') // 사용하지 않음
        console.error('요약 로드 오류:', error)
      } finally {
        setSummaryLoading(false)
      }
    }

    const loadTags = async () => {
      if (!note.id) return
      
      setTagsLoading(true)
      // setTagsError('') // 사용하지 않음
      
      try {
        const result = await getNoteTags(note.id)
        if (result.success) {
          setTags(result.tags || [])
        } else {
          // setTagsError(result.error || '태그를 불러올 수 없습니다.') // 사용하지 않음
          console.error('태그 로드 실패:', result.error)
        }
      } catch (error) {
        // setTagsError('태그 로드 중 오류가 발생했습니다.') // 사용하지 않음
        console.error('태그 로드 오류:', error)
      } finally {
        setTagsLoading(false)
      }
    }

    loadSummary()
    loadTags()
  }, [note.id])

  // 요약 재생성 핸들러
  const handleRegenerateSummary = async () => {
    try {
      setSummaryLoading(true)
      // setSummaryError('') // 사용하지 않음

      const result = await regenerateAISummary(note.id)
      
      if (result.success && result.summary) {
        setSummary(result.summary)
      } else {
        // setSummaryError(result.error || '요약 재생성에 실패했습니다.') // 사용하지 않음
        console.error('요약 재생성 실패:', result.error)
      }
    } catch (error) {
      // setSummaryError('요약 재생성 중 오류가 발생했습니다.') // 사용하지 않음
      console.error('요약 재생성 오류:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  // 태그 재생성 핸들러
  const handleRegenerateTags = async () => {
    try {
      setTagsLoading(true)
      // setTagsError('') // 사용하지 않음

      const result = await regenerateAITags(note.id)
      
      if (result.success && result.tags) {
        setTags(result.tags)
      } else {
        // setTagsError(result.error || '태그 재생성에 실패했습니다.') // 사용하지 않음
        console.error('태그 재생성 실패:', result.error)
      }
    } catch (error) {
      // setTagsError('태그 재생성 중 오류가 발생했습니다.') // 사용하지 않음
      console.error('태그 재생성 오류:', error)
    } finally {
      setTagsLoading(false)
    }
  }

  // 요약 편집 핸들러
  const handleEditSummary = async (newSummary: string) => {
    try {
      const result = await updateSummary(note.id, newSummary)
      
      if (result.success && result.summary) {
        setSummary(result.summary)
        return { success: true }
      } else {
        return { success: false, error: result.error || '요약 업데이트에 실패했습니다.' }
      }
    } catch (error) {
      console.error('요약 편집 오류:', error)
      return { success: false, error: '요약 편집 중 오류가 발생했습니다.' }
    }
  }

  // 태그 편집 핸들러
  const handleEditTags = async (newTags: string[]) => {
    try {
      const result = await updateTags(note.id, newTags)
      
      if (result.success && result.tags) {
        setTags(result.tags)
        return { success: true }
      } else {
        return { success: false, error: result.error || '태그 업데이트에 실패했습니다.' }
      }
    } catch (error) {
      console.error('태그 편집 오류:', error)
      return { success: false, error: '태그 편집 중 오류가 발생했습니다.' }
    }
  }

  // 모드 전환 시 URL 업데이트
  const handleModeChange = async (newMode: 'view' | 'edit') => {
    // 편집 모드에서 보기 모드로 전환할 때 자동 저장 대기
    if (mode === 'edit' && newMode === 'view') {
      console.log('편집 모드 종료 - 자동 저장 대기')
      // 자동 저장이 완료될 시간을 제공
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setMode(newMode)
    const params = new URLSearchParams()
    if (newMode === 'edit') {
      params.set('mode', 'edit')
    }
    const queryString = params.toString()
    const newURL = queryString ? `?${queryString}` : `/notes/${note.id}`
    router.push(newURL, { scroll: false })
  }

  // 노트 업데이트 핸들러 (useCallback으로 안정화)
  const handleNoteUpdate = useCallback((data: { title: string; content: string }) => {
    setCurrentNote(prev => ({
      ...prev,
      title: data.title,
      content: data.content,
      updated_at: new Date().toISOString()
    }))
  }, [])

  // 노트 삭제 후 목록으로 이동
  const handleNoteDeleted = () => {
    router.push('/notes')
  }

  return (
    <>
      {/* 브레드크럼 */}
      <div className="mb-6">
        <NoteBreadcrumb noteTitle={currentNote.title} />
      </div>

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* 뒤로 가기 버튼 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              console.log('목록으로 이동 - 현재 모드:', mode)
              
              // 편집 모드에서 목록으로 이동할 때 자동 저장 대기
              if (mode === 'edit') {
                console.log('편집 모드에서 목록 이동 - 자동 저장 대기')
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
              
              // 라우터 캐시를 새로고침하여 최신 데이터를 보여줌
              router.push('/notes')
              router.refresh()
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>

          {/* 모드 전환 버튼 */}
          {mode === 'view' ? (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => handleModeChange('edit')}
            >
              <Edit className="w-4 h-4 mr-2" />
              편집
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleModeChange('view')}
            >
              <Eye className="w-4 h-4 mr-2" />
              보기
            </Button>
          )}
        </div>

        {/* 노트 액션 (수정/삭제) - 보기 모드에서만 표시 */}
        {mode === 'view' && (
          <div className="flex items-center space-x-2">
            <NoteActions 
              noteId={currentNote.id} 
              noteTitle={currentNote.title}
              onDelete={handleNoteDeleted}
              showEditButton={false} // 이미 편집 버튼이 있으므로 숨김
            />
          </div>
        )}
      </div>

      {/* 노트 내용 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
        {mode === 'view' ? (
          <>
            <NoteDetailView note={currentNote} />
            
            {/* AI 요약 표시 (편집 가능) - 100자 이상일 때만 */}
            <NoteSummaryWithEditor 
              noteId={currentNote.id}
              summary={summary}
              content={currentNote.content || undefined}
              onEdit={handleEditSummary}
              onRegenerate={handleRegenerateSummary}
              isLoading={summaryLoading}
            />
            
            {/* AI 태그 표시 (편집 가능) */}
            <NoteTagsWithEditor 
              noteId={currentNote.id}
              tags={tags}
              onEdit={handleEditTags}
              onRegenerate={handleRegenerateTags}
              isLoading={tagsLoading}
            />
          </>
        ) : (
          <NoteEditView 
            note={currentNote} 
            onSave={handleNoteUpdate}
          />
        )}
      </div>

      {/* 하단 도움말 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        {mode === 'view' ? (
          <p>노트를 편집하려면 &quot;편집&quot; 버튼을 클릭하세요</p>
        ) : (
          <p>변경사항은 자동으로 저장됩니다</p>
        )}
      </div>
    </>
  )
}

