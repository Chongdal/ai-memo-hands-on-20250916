// components/ai/ai-status-indicator.tsx
// AI 처리 상태를 표시하는 컴포넌트
// 로딩, 성공, 에러 상태를 아이콘과 메시지로 표시하고 재시도 기능 제공
// 관련 파일: lib/types/ai-status.ts, hooks/use-ai-processing.ts

'use client'

import { AIProcessingState, AIProcessingStatus } from '@/lib/types/ai-status'
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIStatusIndicatorProps {
  state: AIProcessingState
  type: 'summary' | 'tags'
  onRetry?: () => void
  showRetryButton?: boolean
  className?: string
}

export function AIStatusIndicator({ 
  state, 
  type, 
  onRetry, 
  showRetryButton = true,
  className = '' 
}: AIStatusIndicatorProps) {
  
  // 상태별 아이콘 반환
  const getIcon = () => {
    switch (state.status) {
      case AIProcessingStatus.PROCESSING:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case AIProcessingStatus.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case AIProcessingStatus.ERROR:
        return <XCircle className="h-4 w-4 text-red-500" />
      case AIProcessingStatus.TIMEOUT:
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  // 상태별 배경색 반환
  const getBackgroundColor = () => {
    switch (state.status) {
      case AIProcessingStatus.PROCESSING:
        return 'bg-blue-50 border-blue-200'
      case AIProcessingStatus.SUCCESS:
        return 'bg-green-50 border-green-200'
      case AIProcessingStatus.ERROR:
        return 'bg-red-50 border-red-200'
      case AIProcessingStatus.TIMEOUT:
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  // 상태별 텍스트 색상 반환
  const getTextColor = () => {
    switch (state.status) {
      case AIProcessingStatus.PROCESSING:
        return 'text-blue-700'
      case AIProcessingStatus.SUCCESS:
        return 'text-green-700'
      case AIProcessingStatus.ERROR:
        return 'text-red-700'
      case AIProcessingStatus.TIMEOUT:
        return 'text-orange-700'
      default:
        return 'text-gray-700'
    }
  }

  // 처리 시간 계산
  const getDurationText = () => {
    if (!state.startTime || !state.endTime) return null
    const duration = state.endTime.getTime() - state.startTime.getTime()
    return `(${(duration / 1000).toFixed(1)}초)`
  }

  // IDLE 상태에서는 아무것도 표시하지 않음
  if (state.status === AIProcessingStatus.IDLE) {
    return null
  }

  const typeLabel = type === 'summary' ? '요약' : '태그'

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${getBackgroundColor()} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${typeLabel} ${state.message}`}
    >
      <div className="flex items-center space-x-2">
        {getIcon()}
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {state.message}
          </span>
          {state.error && (
            <span className="text-xs text-gray-500 mt-0.5">
              {state.error}
            </span>
          )}
          {getDurationText() && (
            <span className="text-xs text-gray-500 mt-0.5">
              {getDurationText()}
            </span>
          )}
        </div>
      </div>

      {/* 재시도 버튼 */}
      {showRetryButton && 
       (state.status === AIProcessingStatus.ERROR || state.status === AIProcessingStatus.TIMEOUT) && 
       onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-2 gap-1"
          aria-label={`${typeLabel} 재시도`}
        >
          <RefreshCw className="h-3 w-3" />
          재시도
        </Button>
      )}
    </div>
  )
}

// 다중 상태 표시 컴포넌트
interface AIMultiStatusIndicatorProps {
  summaryState: AIProcessingState
  tagsState: AIProcessingState
  onRetrySummary?: () => void
  onRetryTags?: () => void
  className?: string
}

export function AIMultiStatusIndicator({
  summaryState,
  tagsState,
  onRetrySummary,
  onRetryTags,
  className = ''
}: AIMultiStatusIndicatorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <AIStatusIndicator
        state={summaryState}
        type="summary"
        onRetry={onRetrySummary}
      />
      <AIStatusIndicator
        state={tagsState}
        type="tags"
        onRetry={onRetryTags}
      />
    </div>
  )
}

// 간단한 로딩 표시 컴포넌트
interface AISimpleLoadingProps {
  isLoading: boolean
  message?: string
  className?: string
}

export function AISimpleLoading({ 
  isLoading, 
  message = 'AI 처리 중...', 
  className = '' 
}: AISimpleLoadingProps) {
  if (!isLoading) return null

  return (
    <div className={`flex items-center space-x-2 p-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      <span className="text-sm text-blue-700">{message}</span>
    </div>
  )
}
