// lib/types/ai-status.ts
// AI 처리 상태 관리를 위한 타입 정의
// 요약, 태그 생성 등 AI 기능의 처리 상태를 추적
// 관련 파일: hooks/use-ai-processing.ts, components/ai/ai-status-indicator.tsx

export enum AIProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout'
}

export interface AIProcessingState {
  status: AIProcessingStatus
  message?: string
  error?: string
  startTime?: Date
  endTime?: Date
  progress?: number // 0-100 (선택사항)
}

export interface AIProcessingStates {
  summary: AIProcessingState
  tags: AIProcessingState
}

export interface AIProcessingResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  duration?: number
}

// AI 처리 이벤트 타입
export interface AIProcessingEvent {
  type: 'summary' | 'tags'
  status: AIProcessingStatus
  message?: string
  error?: string
  data?: unknown
}
