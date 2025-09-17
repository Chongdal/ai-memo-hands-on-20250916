// lib/ai/error-handler.ts
// AI 처리 에러를 체계적으로 처리하는 핸들러
// 에러 분류, 사용자 메시지 생성, 자동 복구 로직 제공
// 관련 파일: lib/ai/gemini-client.ts, lib/actions/notes.ts

export enum AIErrorType {
  // API 관련 에러
  API_KEY_INVALID = 'api_key_invalid',
  API_KEY_MISSING = 'api_key_missing',
  QUOTA_EXCEEDED = 'quota_exceeded',
  RATE_LIMITED = 'rate_limited',
  
  // 네트워크 에러
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  CONNECTION_FAILED = 'connection_failed',
  
  // 콘텐츠 관련 에러
  CONTENT_FILTERED = 'content_filtered',
  CONTENT_TOO_LONG = 'content_too_long',
  CONTENT_INVALID = 'content_invalid',
  
  // 서비스 에러
  SERVICE_UNAVAILABLE = 'service_unavailable',
  MODEL_OVERLOADED = 'model_overloaded',
  
  // 기타
  UNKNOWN_ERROR = 'unknown_error',
  PARSING_ERROR = 'parsing_error'
}

export enum ErrorSeverity {
  LOW = 'low',           // 사용자가 쉽게 해결 가능
  MEDIUM = 'medium',     // 재시도나 간단한 조치 필요
  HIGH = 'high',         // 시스템 관리자 개입 필요
  CRITICAL = 'critical'  // 즉시 대응 필요
}

export interface AIError {
  type: AIErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  suggestedActions: string[]
  retryable: boolean
  autoRetry: boolean
  maxRetries: number
  originalError?: Error
  timestamp: Date
  noteId?: string
  userId?: string
}

// 에러 분류 및 메시지 정의
const ERROR_CONFIG: Record<AIErrorType, Omit<AIError, 'message' | 'originalError' | 'timestamp' | 'noteId' | 'userId'>> = {
  [AIErrorType.API_KEY_INVALID]: {
    type: AIErrorType.API_KEY_INVALID,
    severity: ErrorSeverity.CRITICAL,
    userMessage: '일시적으로 AI 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
    suggestedActions: ['잠시 후 다시 시도', '관리자에게 문의'],
    retryable: false,
    autoRetry: false,
    maxRetries: 0
  },
  
  [AIErrorType.API_KEY_MISSING]: {
    type: AIErrorType.API_KEY_MISSING,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'AI 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.',
    suggestedActions: ['관리자에게 문의'],
    retryable: false,
    autoRetry: false,
    maxRetries: 0
  },
  
  [AIErrorType.QUOTA_EXCEEDED]: {
    type: AIErrorType.QUOTA_EXCEEDED,
    severity: ErrorSeverity.HIGH,
    userMessage: '오늘의 AI 처리 한도를 초과했습니다. 내일 다시 시도하거나 수동으로 요약과 태그를 작성해보세요.',
    suggestedActions: ['내일 다시 시도', '수동으로 요약/태그 작성', '관리자에게 문의'],
    retryable: false,
    autoRetry: false,
    maxRetries: 0
  },
  
  [AIErrorType.RATE_LIMITED]: {
    type: AIErrorType.RATE_LIMITED,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'AI 서비스 요청이 너무 빈번합니다. 잠시 후 다시 시도해주세요.',
    suggestedActions: ['1-2분 후 다시 시도'],
    retryable: true,
    autoRetry: true,
    maxRetries: 2
  },
  
  [AIErrorType.NETWORK_ERROR]: {
    type: AIErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
    suggestedActions: ['인터넷 연결 확인', '다시 시도'],
    retryable: true,
    autoRetry: true,
    maxRetries: 3
  },
  
  [AIErrorType.TIMEOUT]: {
    type: AIErrorType.TIMEOUT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'AI 처리 시간이 초과되었습니다. 노트 내용이 너무 길거나 서비스가 혼잡할 수 있습니다.',
    suggestedActions: ['다시 시도', '노트 내용 줄이기'],
    retryable: true,
    autoRetry: true,
    maxRetries: 2
  },
  
  [AIErrorType.CONNECTION_FAILED]: {
    type: AIErrorType.CONNECTION_FAILED,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    suggestedActions: ['잠시 후 다시 시도', '인터넷 연결 확인'],
    retryable: true,
    autoRetry: true,
    maxRetries: 3
  },
  
  [AIErrorType.CONTENT_FILTERED]: {
    type: AIErrorType.CONTENT_FILTERED,
    severity: ErrorSeverity.LOW,
    userMessage: '노트 내용이 AI 처리 정책에 위배됩니다. 내용을 수정한 후 다시 시도해주세요.',
    suggestedActions: ['내용 수정 후 재시도', '수동으로 요약/태그 작성'],
    retryable: false,
    autoRetry: false,
    maxRetries: 0
  },
  
  [AIErrorType.CONTENT_TOO_LONG]: {
    type: AIErrorType.CONTENT_TOO_LONG,
    severity: ErrorSeverity.LOW,
    userMessage: '노트 내용이 너무 깁니다. 내용을 줄이거나 수동으로 요약과 태그를 작성해보세요.',
    suggestedActions: ['내용 줄이기', '수동으로 요약/태그 작성', '자동 축약 후 재시도'],
    retryable: true,
    autoRetry: true,
    maxRetries: 1
  },
  
  [AIErrorType.CONTENT_INVALID]: {
    type: AIErrorType.CONTENT_INVALID,
    severity: ErrorSeverity.LOW,
    userMessage: '노트 내용을 분석할 수 없습니다. 텍스트 내용을 확인하고 다시 시도해주세요.',
    suggestedActions: ['내용 확인 후 재시도', '수동으로 요약/태그 작성'],
    retryable: false,
    autoRetry: false,
    maxRetries: 0
  },
  
  [AIErrorType.SERVICE_UNAVAILABLE]: {
    type: AIErrorType.SERVICE_UNAVAILABLE,
    severity: ErrorSeverity.HIGH,
    userMessage: 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
    suggestedActions: ['잠시 후 다시 시도', '수동으로 요약/태그 작성'],
    retryable: true,
    autoRetry: true,
    maxRetries: 2
  },
  
  [AIErrorType.MODEL_OVERLOADED]: {
    type: AIErrorType.MODEL_OVERLOADED,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'AI 서비스가 혼잡합니다. 잠시 후 다시 시도해주세요.',
    suggestedActions: ['잠시 후 다시 시도'],
    retryable: true,
    autoRetry: true,
    maxRetries: 2
  },
  
  [AIErrorType.UNKNOWN_ERROR]: {
    type: AIErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity.MEDIUM,
    userMessage: '예상치 못한 오류가 발생했습니다. 다시 시도하거나 관리자에게 문의해주세요.',
    suggestedActions: ['다시 시도', '관리자에게 문의'],
    retryable: true,
    autoRetry: false,
    maxRetries: 1
  },
  
  [AIErrorType.PARSING_ERROR]: {
    type: AIErrorType.PARSING_ERROR,
    severity: ErrorSeverity.LOW,
    userMessage: 'AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
    suggestedActions: ['다시 시도'],
    retryable: true,
    autoRetry: true,
    maxRetries: 2
  }
}

// 에러 분류 함수
export function classifyError(error: Error | string, context?: { noteId?: string; userId?: string }): AIError {
  const errorMessage = typeof error === 'string' ? error : error.message
  const originalError = typeof error === 'string' ? undefined : error
  
  let errorType = AIErrorType.UNKNOWN_ERROR
  
  // 에러 메시지 기반 분류
  if (errorMessage.includes('API key')) {
    errorType = errorMessage.includes('invalid') ? AIErrorType.API_KEY_INVALID : AIErrorType.API_KEY_MISSING
  } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
    errorType = AIErrorType.QUOTA_EXCEEDED
  } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    errorType = AIErrorType.RATE_LIMITED
  } else if (errorMessage.includes('timeout') || errorMessage.includes('시간 초과')) {
    errorType = AIErrorType.TIMEOUT
  } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
    errorType = AIErrorType.NETWORK_ERROR
  } else if (errorMessage.includes('connection') || errorMessage.includes('연결')) {
    errorType = AIErrorType.CONNECTION_FAILED
  } else if (errorMessage.includes('content filtered') || errorMessage.includes('policy')) {
    errorType = AIErrorType.CONTENT_FILTERED
  } else if (errorMessage.includes('too long') || errorMessage.includes('token limit')) {
    errorType = AIErrorType.CONTENT_TOO_LONG
  } else if (errorMessage.includes('invalid content') || errorMessage.includes('잘못된 내용')) {
    errorType = AIErrorType.CONTENT_INVALID
  } else if (errorMessage.includes('service unavailable') || errorMessage.includes('503')) {
    errorType = AIErrorType.SERVICE_UNAVAILABLE
  } else if (errorMessage.includes('overloaded') || errorMessage.includes('busy')) {
    errorType = AIErrorType.MODEL_OVERLOADED
  } else if (errorMessage.includes('parse') || errorMessage.includes('parsing')) {
    errorType = AIErrorType.PARSING_ERROR
  }
  
  const config = ERROR_CONFIG[errorType]
  
  return {
    ...config,
    message: errorMessage,
    originalError,
    timestamp: new Date(),
    noteId: context?.noteId,
    userId: context?.userId
  }
}

// 에러 로깅 함수
export function logAIError(error: AIError): void {
  console.error('=== AI Error Log ===')
  console.error('Type:', error.type)
  console.error('Severity:', error.severity)
  console.error('Message:', error.message)
  console.error('User ID:', error.userId)
  console.error('Note ID:', error.noteId)
  console.error('Timestamp:', error.timestamp.toISOString())
  console.error('Original Error:', error.originalError)
  console.error('==================')
  
  // 실제 운영에서는 여기에 외부 로깅 서비스 연동
  // 예: Sentry, LogRocket, DataDog 등
  if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
    console.error('🚨 HIGH SEVERITY ERROR - Admin notification required')
  }
}

// 백오프 알고리즘 (지수적 대기)
export function calculateBackoffDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000) // 최대 30초
}

// 재시도 가능 여부 확인
export function shouldRetry(error: AIError, currentAttempt: number): boolean {
  return error.retryable && currentAttempt < error.maxRetries
}

// 자동 재시도 여부 확인
export function shouldAutoRetry(error: AIError): boolean {
  return error.autoRetry && error.retryable
}
