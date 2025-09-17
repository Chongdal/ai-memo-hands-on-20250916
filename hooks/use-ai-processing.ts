// hooks/use-ai-processing.ts
// AI 처리 상태를 관리하는 커스텀 훅
// 요약, 태그 생성 등의 AI 처리 상태를 독립적으로 관리
// 관련 파일: lib/types/ai-status.ts, components/ai/ai-status-indicator.tsx

'use client'

import { useState, useCallback, useRef } from 'react'
import { 
  AIProcessingStatus, 
  AIProcessingState, 
  AIProcessingStates,
  AIProcessingResult 
} from '@/lib/types/ai-status'

export function useAIProcessing() {
  const [states, setStates] = useState<AIProcessingStates>({
    summary: { status: AIProcessingStatus.IDLE },
    tags: { status: AIProcessingStatus.IDLE }
  })

  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // 처리 시작
  const startProcessing = useCallback((type: 'summary' | 'tags', message?: string) => {
    const defaultMessages = {
      summary: 'AI 요약 생성 중...',
      tags: 'AI 태그 생성 중...'
    }

    setStates(prev => ({
      ...prev,
      [type]: {
        status: AIProcessingStatus.PROCESSING,
        message: message || defaultMessages[type],
        startTime: new Date(),
        error: undefined,
        endTime: undefined
      }
    }))

    // 타임아웃 설정 (10초)
    if (timeoutRefs.current[type]) {
      clearTimeout(timeoutRefs.current[type])
    }

    timeoutRefs.current[type] = setTimeout(() => {
      setStates(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          status: AIProcessingStatus.TIMEOUT,
          message: '처리 시간이 초과되었습니다',
          error: '요청 시간 초과 (10초)',
          endTime: new Date()
        }
      }))
    }, 10000)
  }, [])

  // 성공 완료
  const setSuccess = useCallback((type: 'summary' | 'tags', data?: any, message?: string) => {
    if (timeoutRefs.current[type]) {
      clearTimeout(timeoutRefs.current[type])
      delete timeoutRefs.current[type]
    }

    const defaultMessages = {
      summary: '요약 생성 완료',
      tags: '태그 생성 완료'
    }

    setStates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        status: AIProcessingStatus.SUCCESS,
        message: message || defaultMessages[type],
        endTime: new Date(),
        error: undefined
      }
    }))
  }, [])

  // 에러 처리
  const setError = useCallback((type: 'summary' | 'tags', error: string, message?: string) => {
    if (timeoutRefs.current[type]) {
      clearTimeout(timeoutRefs.current[type])
      delete timeoutRefs.current[type]
    }

    const defaultMessages = {
      summary: '요약 생성 실패',
      tags: '태그 생성 실패'
    }

    setStates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        status: AIProcessingStatus.ERROR,
        message: message || defaultMessages[type],
        error: error,
        endTime: new Date()
      }
    }))
  }, [])

  // 상태 초기화
  const reset = useCallback((type: 'summary' | 'tags') => {
    if (timeoutRefs.current[type]) {
      clearTimeout(timeoutRefs.current[type])
      delete timeoutRefs.current[type]
    }

    setStates(prev => ({
      ...prev,
      [type]: { status: AIProcessingStatus.IDLE }
    }))
  }, [])

  // 모든 상태 초기화
  const resetAll = useCallback(() => {
    Object.keys(timeoutRefs.current).forEach(key => {
      clearTimeout(timeoutRefs.current[key])
    })
    timeoutRefs.current = {}

    setStates({
      summary: { status: AIProcessingStatus.IDLE },
      tags: { status: AIProcessingStatus.IDLE }
    })
  }, [])

  // 처리 시간 계산
  const getDuration = useCallback((type: 'summary' | 'tags'): number => {
    const state = states[type]
    if (!state.startTime || !state.endTime) return 0
    return state.endTime.getTime() - state.startTime.getTime()
  }, [states])

  // 현재 처리 중인지 확인
  const isProcessing = useCallback((type?: 'summary' | 'tags'): boolean => {
    if (type) {
      return states[type].status === AIProcessingStatus.PROCESSING
    }
    return Object.values(states).some(state => state.status === AIProcessingStatus.PROCESSING)
  }, [states])

  // 에러 상태인지 확인
  const hasError = useCallback((type?: 'summary' | 'tags'): boolean => {
    if (type) {
      return states[type].status === AIProcessingStatus.ERROR || 
             states[type].status === AIProcessingStatus.TIMEOUT
    }
    return Object.values(states).some(state => 
      state.status === AIProcessingStatus.ERROR || 
      state.status === AIProcessingStatus.TIMEOUT
    )
  }, [states])

  // 성공 상태인지 확인
  const isSuccess = useCallback((type?: 'summary' | 'tags'): boolean => {
    if (type) {
      return states[type].status === AIProcessingStatus.SUCCESS
    }
    return Object.values(states).every(state => 
      state.status === AIProcessingStatus.SUCCESS || 
      state.status === AIProcessingStatus.IDLE
    )
  }, [states])

  return {
    states,
    startProcessing,
    setSuccess,
    setError,
    reset,
    resetAll,
    getDuration,
    isProcessing,
    hasError,
    isSuccess
  }
}
