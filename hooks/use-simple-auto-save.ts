'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { saveNoteDraft } from '@/lib/actions/notes'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SimpleAutoSaveOptions {
  delay?: number
  enabled?: boolean
}

interface SimpleAutoSaveResult {
  status: AutoSaveStatus
  lastSaved: Date | null
  save: () => Promise<void>
  error: string | null
}

/**
 * 간단한 자동 저장 훅 - 복잡한 로직 제거
 */
export function useSimpleAutoSave(
  noteId: string,
  data: { title: string; content: string },
  options: SimpleAutoSaveOptions = {}
): SimpleAutoSaveResult {
  const { delay = 3000, enabled = true } = options

  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const lastDataRef = useRef<typeof data | null>(null)
  const currentDataRef = useRef(data)

  // 저장 함수
  const performSave = useCallback(async (dataToSave: typeof data) => {
    if (isSavingRef.current) {
      console.log('이미 저장 중이므로 스킵')
      return
    }

    console.log('저장 시작:', dataToSave)
    setStatus('saving')
    setError(null)
    isSavingRef.current = true

    try {
      const result = await saveNoteDraft(noteId, {
        title: dataToSave.title,
        content: dataToSave.content
      })

      if (result.success) {
        console.log('저장 성공')
        setStatus('saved')
        setLastSaved(new Date())
        lastDataRef.current = { ...dataToSave }
        
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        throw new Error(result.error || '저장 실패')
      }
    } catch (err) {
      console.error('저장 오류:', err)
      const errorMessage = err instanceof Error ? err.message : '저장 실패'
      setError(errorMessage)
      setStatus('error')
      
      setTimeout(() => {
        setStatus('idle')
        setError(null)
      }, 5000)
    } finally {
      isSavingRef.current = false
    }
  }, [noteId])

  // 현재 데이터를 ref에 업데이트
  useEffect(() => {
    currentDataRef.current = data
  }, [data])

  // 수동 저장 - 안정적인 함수 참조
  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    await performSave(currentDataRef.current)
  }, [performSave])

  // 자동 저장 로직
  useEffect(() => {
    if (!enabled) return

    // 초기 설정
    if (!lastDataRef.current) {
      lastDataRef.current = { ...data }
      console.log('초기 데이터 설정:', data)
      return
    }

    // 변경사항 확인
    const hasChanges = 
      lastDataRef.current.title !== data.title ||
      lastDataRef.current.content !== data.content

    console.log('변경사항 체크:', {
      hasChanges,
      prevTitle: lastDataRef.current.title,
      currentTitle: data.title,
      prevContent: lastDataRef.current.content.substring(0, 30),
      currentContent: data.content.substring(0, 30)
    })

    if (!hasChanges) return

    // 기존 타이머 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      console.log('자동 저장 타이머 실행')
      performSave(data)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, delay, performSave])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    lastSaved,
    save: manualSave,
    error
  }
}
