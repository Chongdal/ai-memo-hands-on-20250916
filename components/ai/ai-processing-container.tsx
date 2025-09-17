// components/ai/ai-processing-container.tsx
// AI 처리 상태를 통합적으로 관리하는 컨테이너 컴포넌트
// 요약과 태그 생성을 독립적으로 관리하고 재시도 기능 제공
// 관련 파일: hooks/use-ai-processing.ts, lib/actions/notes.ts, components/ai/ai-status-indicator.tsx

'use client'

import { useCallback } from 'react'
import { useAIProcessing } from '@/hooks/use-ai-processing'
import { AIMultiStatusIndicator } from '@/components/ai/ai-status-indicator'
import { NoteSummary } from '@/components/notes/note-summary'
import { NoteTags } from '@/components/notes/note-tags'
import { generateSummary, generateTags } from '@/lib/actions/notes'

interface AIProcessingContainerProps {
  noteId: string
  noteContent: string
  summary?: string
  tags?: string[]
  showSummary?: boolean
  showTags?: boolean
  showStatusIndicators?: boolean
  onSummaryUpdate?: (summary: string) => void
  onTagsUpdate?: (tags: string[]) => void
}

export function AIProcessingContainer({
  noteId,
  noteContent,
  summary,
  tags,
  showSummary = true,
  showTags = true,
  showStatusIndicators = true,
  onSummaryUpdate,
  onTagsUpdate
}: AIProcessingContainerProps) {
  const {
    states,
    startProcessing,
    setSuccess,
    setError,
    reset,
    isProcessing
  } = useAIProcessing()

  // 요약 생성 처리
  const handleGenerateSummary = useCallback(async () => {
    if (isProcessing('summary')) return

    reset('summary')
    startProcessing('summary', 'AI 요약 생성 중...')

    try {
      const result = await generateSummary(noteId, noteContent)
      
      if (result.success && result.summary) {
        setSuccess('summary', result.summary, '요약 생성 완료')
        onSummaryUpdate?.(result.summary)
      } else {
        setError('summary', result.error || '요약 생성에 실패했습니다.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
      setError('summary', errorMessage)
    }
  }, [noteId, noteContent, isProcessing, reset, startProcessing, setSuccess, setError, onSummaryUpdate])

  // 태그 생성 처리
  const handleGenerateTags = useCallback(async () => {
    if (isProcessing('tags')) return

    reset('tags')
    startProcessing('tags', 'AI 태그 생성 중...')

    try {
      const result = await generateTags(noteId, noteContent)
      
      if (result.success && result.tags) {
        setSuccess('tags', result.tags, '태그 생성 완료')
        onTagsUpdate?.(result.tags)
      } else {
        setError('tags', result.error || '태그 생성에 실패했습니다.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
      setError('tags', errorMessage)
    }
  }, [noteId, noteContent, isProcessing, reset, startProcessing, setSuccess, setError, onTagsUpdate])

  // 요약 재시도
  const handleRetrySummary = useCallback(() => {
    handleGenerateSummary()
  }, [handleGenerateSummary])

  // 태그 재시도
  const handleRetryTags = useCallback(() => {
    handleGenerateTags()
  }, [handleGenerateTags])

  // 자동 생성 트리거 (필요시 사용) - 현재 사용하지 않음
  // const triggerAutoGeneration = useCallback(() => {
  //   if (noteContent.length >= 100 && !summary && states.summary.status === 'idle') {
  //     handleGenerateSummary()
  //   }
  //   
  //   if (noteContent.length >= 50 && (!tags || tags.length === 0) && states.tags.status === 'idle') {
  //     handleGenerateTags()
  //   }
  // }, [noteContent, summary, tags, states, handleGenerateSummary, handleGenerateTags])

  return (
    <div className="space-y-4">
      {/* 상태 표시기 (선택적) */}
      {showStatusIndicators && (
        <AIMultiStatusIndicator
          summaryState={states.summary}
          tagsState={states.tags}
          onRetrySummary={handleRetrySummary}
          onRetryTags={handleRetryTags}
        />
      )}

      {/* 요약 표시 */}
      {showSummary && (
        <NoteSummary
          noteId={noteId}
          summary={summary}
          processingState={states.summary}
          onRetry={handleRetrySummary}
        />
      )}

      {/* 태그 표시 */}
      {showTags && (
        <NoteTags
          noteId={noteId}
          tags={tags}
          processingState={states.tags}
          onRetry={handleRetryTags}
        />
      )}
    </div>
  )
}

// 간단한 버전 - 기존 컴포넌트와의 호환성을 위한 래퍼
interface SimpleAIContainerProps {
  noteId: string
  noteContent: string
  initialSummary?: string
  initialTags?: string[]
}

export function SimpleAIContainer({
  noteId,
  noteContent,
  initialSummary,
  initialTags
}: SimpleAIContainerProps) {
  return (
    <AIProcessingContainer
      noteId={noteId}
      noteContent={noteContent}
      summary={initialSummary}
      tags={initialTags}
      showStatusIndicators={false} // 간단한 버전에서는 상태 표시기 숨김
    />
  )
}

// 수동 트리거 버전 - 사용자가 직접 생성 버튼을 클릭하는 경우
interface ManualAIContainerProps {
  noteId: string
  noteContent: string
  summary?: string
  tags?: string[]
}

export function ManualAIContainer({
  noteId,
  noteContent,
  summary,
  tags
}: ManualAIContainerProps) {
  const {
    states,
    startProcessing,
    setSuccess,
    setError,
    isProcessing
  } = useAIProcessing()

  const handleManualGenerate = async (type: 'summary' | 'tags') => {
    if (isProcessing(type)) return

    const action = type === 'summary' ? generateSummary : generateTags
    const message = type === 'summary' ? 'AI 요약 생성 중...' : 'AI 태그 생성 중...'

    startProcessing(type, message)

    try {
      const result = await action(noteId, noteContent)
      
      if (result.success) {
        if (type === 'summary') {
          setSuccess(type, (result as { success: boolean; summary?: string }).summary, '요약 생성 완료')
        } else {
          setSuccess(type, (result as { success: boolean; tags?: string[] }).tags, '태그 생성 완료')
        }
      } else {
        setError(type, result.error || `${type === 'summary' ? '요약' : '태그'} 생성에 실패했습니다.`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예기치 않은 오류가 발생했습니다.'
      setError(type, errorMessage)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => handleManualGenerate('summary')}
          disabled={isProcessing('summary')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isProcessing('summary') ? '생성 중...' : '요약 생성'}
        </button>
        
        <button
          onClick={() => handleManualGenerate('tags')}
          disabled={isProcessing('tags')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isProcessing('tags') ? '생성 중...' : '태그 생성'}
        </button>
      </div>

      <AIMultiStatusIndicator
        summaryState={states.summary}
        tagsState={states.tags}
        onRetrySummary={() => handleManualGenerate('summary')}
        onRetryTags={() => handleManualGenerate('tags')}
      />

      <NoteSummary
        noteId={noteId}
        summary={summary}
        processingState={states.summary}
        onRetry={() => handleManualGenerate('summary')}
      />

      <NoteTags
        noteId={noteId}
        tags={tags}
        processingState={states.tags}
        onRetry={() => handleManualGenerate('tags')}
      />
    </div>
  )
}
