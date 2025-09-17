// components/notes/note-summary.tsx
// 노트 요약을 표시하는 컴포넌트
// AI가 생성한 요약을 불릿 포인트 형태로 표시하고 개선된 상태 관리 시스템 사용
// 관련 파일: lib/actions/notes.ts, app/notes/[id]/page.tsx, components/ai/ai-status-indicator.tsx

'use client'

import { AIProcessingState } from '@/lib/types/ai-status'
import { AIStatusIndicator } from '@/components/ai/ai-status-indicator'
import { CompactRegenerateButton } from '@/components/ai/regenerate-button'
// import { SummaryEditor } from '@/components/ai/summary-editor' // 사용하지 않음

interface NoteSummaryProps {
  noteId: string
  summary?: string
  processingState?: AIProcessingState
  onRetry?: () => void
  onRegenerate?: () => Promise<void>
  onEdit?: (summary: string) => Promise<{ success: boolean; error?: string }>
  showRegenerateButton?: boolean
  showEditButton?: boolean
  // 하위 호환성을 위한 레거시 props
  isLoading?: boolean
  error?: string
}

export function NoteSummary({ 
  noteId: _noteId, 
  summary, 
  processingState, 
  onRetry,
  onRegenerate,
  onEdit: _onEdit,
  showRegenerateButton = true,
  showEditButton: _showEditButton = true,
  // 레거시 props
  isLoading = false, 
  error 
}: NoteSummaryProps) {
  // 새로운 상태 시스템 사용
  if (processingState) {
    // 처리 상태가 있으면 상태 표시
    if (processingState.status !== 'idle' && processingState.status !== 'success') {
      return (
        <div className="mt-4">
          <AIStatusIndicator
            state={processingState}
            type="summary"
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
            <span className="text-sm text-blue-700 font-medium">AI 요약 생성 중...</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">노트 내용을 분석하여 핵심 포인트를 추출하고 있습니다.</p>
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
            <span className="text-sm text-red-700 font-medium">요약 생성 실패</span>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
      )
    }
  }

  // 요약이 없는 경우
  if (!summary || summary.trim() === '') {
    return null
  }

  // 요약을 줄바꿈으로 분할하고 불릿 포인트 처리
  const summaryLines = summary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="font-medium text-gray-900">AI 요약</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {summaryLines.length}개 포인트
          </span>
        </div>
        
        {showRegenerateButton && onRegenerate && (
          <CompactRegenerateButton
            type="summary"
            onRegenerate={onRegenerate}
            isProcessing={processingState?.status === 'processing'}
          />
        )}
      </div>
      
      <div className="space-y-2">
        {summaryLines.map((line, index) => {
          // 이미 불릿 포인트가 있는지 확인
          const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim()
          
          return (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1 text-sm">•</span>
              <span className="text-sm text-gray-700 leading-relaxed">{cleanLine}</span>
            </div>
          )
        })}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          AI가 생성한 요약입니다. 정확성을 위해 원본 내용을 확인해주세요.
        </p>
      </div>
    </div>
  )
}
