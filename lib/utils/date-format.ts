// lib/utils/date-format.ts
// 날짜 포맷팅 유틸리티 함수들
// 모든 컴포넌트에서 일관된 날짜 표시를 위해 사용
// 관련 파일: components/notes/note-detail-view.tsx, app/notes/notes-page-client.tsx

/**
 * 상대적 시간 표시 (오늘, 어제, N일 전)
 * 노트 목록에서 사용
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  
  // 시간대 문제를 해결하기 위해 로컬 시간으로 변환
  const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000))
  const localNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
  
  // 날짜만 비교하기 위해 시간을 0으로 설정
  const dateOnly = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  const nowOnly = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate())
  
  const diffTime = nowOnly.getTime() - dateOnly.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    // 오늘인 경우 시간도 표시
    return `오늘 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  } else if (diffDays === 1) {
    return `어제 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  } else if (diffDays <= 7 && diffDays > 0) {
    return `${diffDays}일 전`
  } else if (diffDays < 0) {
    // 미래 날짜 (시간대 문제로 발생할 수 있음)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * 절대적 시간 표시 (년월일 시분)
 * 노트 상세 페이지에서 사용
 */
export function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 자동 저장 상태용 시간 표시
 * 방금, N분 전, N시간 전 형태
 */
export function formatTimeAgo(date: Date): string {
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
