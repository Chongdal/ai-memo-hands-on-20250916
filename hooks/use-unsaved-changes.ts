'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 저장되지 않은 변경사항 감지 및 페이지 이탈 방지 훅
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean, message?: string) {
  const router = useRouter()
  const hasUnsavedRef = useRef(hasUnsavedChanges)

  // 현재 상태를 ref에 저장 (이벤트 핸들러에서 최신 값 참조용)
  useEffect(() => {
    hasUnsavedRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  useEffect(() => {
    const defaultMessage = '저장되지 않은 변경사항이 있습니다. 정말 페이지를 떠나시겠습니까?'
    const warningMessage = message || defaultMessage

    // 브라우저 새로고침/닫기 방지
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        event.preventDefault()
        event.returnValue = warningMessage
        return warningMessage
      }
    }

    // 라우터 네비게이션 방지 (Next.js 내부 네비게이션)
    const handleRouteChange = () => {
      if (hasUnsavedRef.current) {
        const confirmed = window.confirm(warningMessage)
        if (!confirmed) {
          // 네비게이션 취소를 위해 현재 URL로 다시 이동
          window.history.pushState(null, '', window.location.href)
          throw new Error('Route change cancelled by user')
        }
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Next.js 라우터 이벤트는 직접 처리하기 어려우므로
    // 대신 popstate 이벤트를 사용 (뒤로가기/앞으로가기)
    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedRef.current) {
        const confirmed = window.confirm(warningMessage)
        if (!confirmed) {
          // 원래 상태로 복원
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [message])

  // 수동으로 네비게이션을 확인하는 함수
  const confirmNavigation = (targetUrl?: string): boolean => {
    if (!hasUnsavedChanges) return true
    
    const warningMessage = message || '저장되지 않은 변경사항이 있습니다. 정말 페이지를 떠나시겠습니까?'
    return window.confirm(warningMessage)
  }

  return { confirmNavigation }
}

