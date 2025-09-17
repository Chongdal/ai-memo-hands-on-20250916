import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react'

export type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning'

interface StatusIndicatorProps {
  status: StatusType
  message?: string
  className?: string
  showIcon?: boolean
}

const statusConfig = {
  idle: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    defaultMessage: '대기 중'
  },
  loading: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    defaultMessage: '처리 중...',
    animate: 'animate-spin'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    defaultMessage: '완료'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    defaultMessage: '오류 발생'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    defaultMessage: '주의 필요'
  }
}

export function StatusIndicator({ 
  status, 
  message, 
  className = '', 
  showIcon = true 
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <Icon 
          className={`w-4 h-4 ${config.color}`} 
        />
      )}
      <span className={`text-sm ${config.color}`}>
        {displayMessage}
      </span>
    </div>
  )
}

interface StatusBadgeProps {
  status: StatusType
  message?: string
  className?: string
}

export function StatusBadge({ status, message, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayMessage = message || config.defaultMessage

  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
      ${config.bgColor} ${config.color} ${className}
    `}>
      <Icon className="w-3 h-3" />
      <span>{displayMessage}</span>
    </div>
  )
}

