// components/notes/note-tags.tsx
// 노트 태그를 표시하는 컴포넌트
// AI가 생성한 태그를 뱃지 형태로 표시하고 개선된 상태 관리 시스템 사용
// 관련 파일: lib/actions/notes.ts, app/notes/[id]/page.tsx, components/ai/ai-status-indicator.tsx

'use client'

import { useRouter } from 'next/navigation'
import { AIProcessingState } from '@/lib/types/ai-status'
import { AIStatusIndicator } from '@/components/ai/ai-status-indicator'
import { CompactRegenerateButton } from '@/components/ai/regenerate-button'

interface NoteTagsProps {
  noteId: string
  tags?: string[]
  processingState?: AIProcessingState
  onRetry?: () => void
  onRegenerate?: () => Promise<void>
  onTagClick?: (tag: string) => void
  showRegenerateButton?: boolean
  // 하위 호환성을 위한 레거시 props
  isLoading?: boolean
  error?: string
}

export function NoteTags({ 
  noteId: _noteId, 
  tags, 
  processingState, 
  onRetry, 
  onRegenerate,
  onTagClick,
  showRegenerateButton = true,
  // 레거시 props
  isLoading = false, 
  error 
}: NoteTagsProps) {
  const router = useRouter()

  // 기본 태그 클릭 핸들러
  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag)
    } else {
      // 기본 동작: 태그로 노트 검색
      router.push(`/notes?search=${encodeURIComponent(tag)}`)
    }
  }

  // 새로운 상태 시스템 사용
  if (processingState) {
    // 처리 상태가 있으면 상태 표시
    if (processingState.status !== 'idle' && processingState.status !== 'success') {
      return (
        <div className="mt-4">
          <AIStatusIndicator
            state={processingState}
            type="tags"
            onRetry={onRetry}
          />
        </div>
      )
    }
  } else {
    // 레거시 상태 처리 (하위 호환성)
    if (isLoading) {
      return (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-blue-700 font-medium">AI 태그 생성 중...</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">노트 내용을 분석하여 관련 태그를 생성하고 있습니다.</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-700 font-medium">태그 생성 실패</span>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )
    }
  }

  // 태그가 없는 경우
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="font-medium text-gray-900">태그</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {tags.length}개
          </span>
        </div>
        
        {showRegenerateButton && onRegenerate && (
          <CompactRegenerateButton
            type="tags"
            onRegenerate={onRegenerate}
            isProcessing={processingState?.status === 'processing'}
          />
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <button
            key={index}
            onClick={() => handleTagClick(tag)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title={`"${tag}" 태그로 검색`}
          >
            <svg className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {tag}
          </button>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          AI가 생성한 태그입니다. 태그를 클릭하면 관련 노트를 검색할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
