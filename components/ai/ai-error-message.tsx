// components/ai/ai-error-message.tsx
// AI 처리 에러를 사용자에게 친화적으로 표시하는 컴포넌트
// 에러 타입별 맞춤 메시지, 재시도 버튼, 대안 제시 기능 제공
// 관련 파일: lib/ai/error-handler.ts, components/ai/ai-status-indicator.tsx

'use client'

import { AlertTriangle, RefreshCw, ExternalLink, MessageCircle, Clock, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIError, AIErrorType, ErrorSeverity } from '@/lib/ai/error-handler'

interface AIErrorMessageProps {
  error: AIError
  onRetry?: () => void
  onDismiss?: () => void
  showRetryButton?: boolean
  showContactSupport?: boolean
  className?: string
}

export function AIErrorMessage({
  error,
  onRetry,
  onDismiss,
  showRetryButton = true,
  showContactSupport = true,
  className = ''
}: AIErrorMessageProps) {
  
  // 에러 타입별 아이콘 반환
  const getErrorIcon = () => {
    switch (error.type) {
      case AIErrorType.NETWORK_ERROR:
      case AIErrorType.CONNECTION_FAILED:
        return <Wifi className="h-5 w-5" />
      case AIErrorType.TIMEOUT:
        return <Clock className="h-5 w-5" />
      case AIErrorType.RATE_LIMITED:
      case AIErrorType.QUOTA_EXCEEDED:
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  // 심각도별 스타일 반환
  const getSeverityStyles = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700'
        }
      case ErrorSeverity.HIGH:
        return {
          container: 'bg-orange-50 border-orange-200',
          icon: 'text-orange-600',
          title: 'text-orange-800',
          message: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700'
        }
      case ErrorSeverity.MEDIUM:
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case ErrorSeverity.LOW:
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  // 에러 타입별 제목 반환
  const getErrorTitle = () => {
    switch (error.type) {
      case AIErrorType.API_KEY_INVALID:
      case AIErrorType.API_KEY_MISSING:
        return 'AI 서비스 설정 오류'
      case AIErrorType.QUOTA_EXCEEDED:
        return 'AI 처리 한도 초과'
      case AIErrorType.RATE_LIMITED:
        return 'AI 요청 제한'
      case AIErrorType.NETWORK_ERROR:
        return '네트워크 연결 오류'
      case AIErrorType.TIMEOUT:
        return 'AI 처리 시간 초과'
      case AIErrorType.CONNECTION_FAILED:
        return 'AI 서비스 연결 실패'
      case AIErrorType.CONTENT_FILTERED:
        return '내용 정책 위배'
      case AIErrorType.CONTENT_TOO_LONG:
        return '내용 길이 초과'
      case AIErrorType.CONTENT_INVALID:
        return '내용 분석 불가'
      case AIErrorType.SERVICE_UNAVAILABLE:
        return 'AI 서비스 일시 중단'
      case AIErrorType.MODEL_OVERLOADED:
        return 'AI 서비스 혼잡'
      case AIErrorType.PARSING_ERROR:
        return 'AI 응답 처리 오류'
      default:
        return '예상치 못한 오류'
    }
  }

  const styles = getSeverityStyles()

  return (
    <div className={`p-4 rounded-lg border ${styles.container} ${className}`}>
      <div className="flex items-start space-x-3">
        {/* 에러 아이콘 */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* 에러 제목 */}
          <h3 className={`text-sm font-medium ${styles.title}`}>
            {getErrorTitle()}
          </h3>
          
          {/* 에러 메시지 */}
          <p className={`mt-1 text-sm ${styles.message}`}>
            {error.userMessage}
          </p>
          
          {/* 제안된 조치사항 */}
          {error.suggestedActions.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-medium ${styles.title} mb-2`}>
                권장 조치사항:
              </p>
              <ul className={`text-xs ${styles.message} space-y-1`}>
                {error.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-current rounded-full flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 액션 버튼들 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* 재시도 버튼 */}
            {showRetryButton && error.retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                다시 시도
              </Button>
            )}
            
            {/* 지원 문의 버튼 */}
            {showContactSupport && (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('mailto:support@example.com?subject=AI 처리 오류 문의', '_blank')}
                className="gap-1"
              >
                <MessageCircle className="h-3 w-3" />
                문의하기
              </Button>
            )}
            
            {/* 도움말 링크 */}
            {(error.type === AIErrorType.CONTENT_FILTERED || error.type === AIErrorType.CONTENT_TOO_LONG) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/help/ai-guidelines', '_blank')}
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                도움말
              </Button>
            )}
            
            {/* 닫기 버튼 */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="ml-auto"
              >
                닫기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 간단한 에러 메시지 컴포넌트
interface SimpleAIErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function SimpleAIError({ message, onRetry, className = '' }: SimpleAIErrorProps) {
  return (
    <div className={`p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{message}</span>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="gap-1 text-red-600 hover:text-red-700"
          >
            <RefreshCw className="h-3 w-3" />
            재시도
          </Button>
        )}
      </div>
    </div>
  )
}

// 에러 토스트 메시지
interface AIErrorToastProps {
  error: AIError
  onRetry?: () => void
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function AIErrorToast({ 
  error, 
  onRetry, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 5000 
}: AIErrorToastProps) {
  // 자동 닫기
  if (autoClose) {
    setTimeout(() => {
      onClose()
    }, autoCloseDelay)
  }

  const styles = getSeverityStyles(error.severity)

  return (
    <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border shadow-lg z-50 ${styles.container}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle className={`h-4 w-4 mt-0.5 ${styles.icon}`} />
          <div>
            <p className={`text-sm font-medium ${styles.title}`}>
              AI 처리 오류
            </p>
            <p className={`text-xs ${styles.message} mt-1`}>
              {error.userMessage}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {onRetry && error.retryable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  )
}

// 심각도별 스타일 헬퍼 함수
function getSeverityStyles(severity: ErrorSeverity) {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return {
        container: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        title: 'text-red-800',
        message: 'text-red-700'
      }
    case ErrorSeverity.HIGH:
      return {
        container: 'bg-orange-50 border-orange-200',
        icon: 'text-orange-600',
        title: 'text-orange-800',
        message: 'text-orange-700'
      }
    case ErrorSeverity.MEDIUM:
      return {
        container: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-800',
        message: 'text-yellow-700'
      }
    case ErrorSeverity.LOW:
    default:
      return {
        container: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-800',
        message: 'text-blue-700'
      }
  }
}
