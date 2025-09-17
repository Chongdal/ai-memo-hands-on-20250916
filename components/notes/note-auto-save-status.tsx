'use client'

import { StatusIndicator } from '@/components/ui/status-indicator'
import { AutoSaveStatus } from '@/hooks/use-simple-auto-save'

interface NoteAutoSaveStatusProps {
  status: AutoSaveStatus
  lastSaved: Date | null
  error: string | null
  className?: string
}

const statusMessages = {
  idle: '',
  saving: '저장 중...',
  saved: '저장됨',
  error: '저장 실패'
}

const statusTypes = {
  idle: 'idle' as const,
  saving: 'loading' as const,
  saved: 'success' as const,
  error: 'error' as const
}

export function NoteAutoSaveStatus({ 
  status, 
  lastSaved, 
  error, 
  className = '' 
}: NoteAutoSaveStatusProps) {
  // idle 상태이고 마지막 저장 시간이 없으면 아무것도 표시하지 않음
  if (status === 'idle' && !lastSaved) {
    return null
  }

  const getDisplayMessage = () => {
    if (status === 'error' && error) {
      return error
    }
    
    if (status === 'saved' && lastSaved) {
      const timeAgo = getTimeAgo(lastSaved)
      return `${timeAgo} 저장됨`
    }
    
    return statusMessages[status]
  }

  return (
    <div className={`${className}`}>
      <StatusIndicator
        status={statusTypes[status]}
        message={getDisplayMessage()}
        showIcon={status !== 'idle'}
      />
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return '방금'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}분 전`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}시간 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

