'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useDebounce } from './use-debounce'
import { saveNoteDraft } from '@/lib/actions/notes'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveOptions {
  delay?: number // 디바운스 지연 시간 (기본: 3000ms)
  enabled?: boolean // 자동 저장 활성화 여부
  onSave?: (result: any) => void // 저장 성공 콜백
  onError?: (error: any) => void // 저장 실패 콜백
}

interface AutoSaveResult {
  status: AutoSaveStatus
  lastSaved: Date | null
  save: () => Promise<void> // 수동 저장 함수
  error: string | null
}

/**
 * 자동 저장 훅
 */
export function useAutoSave(
  noteId: string,
  data: { title: string; content: string },
  options: AutoSaveOptions = {}
): AutoSaveResult {
  const {
    delay = 3000,
    enabled = true,
    onSave,
    onError
  } = options

  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 이전 데이터 추적 (변경사항 감지용)
  const prevDataRef = useRef<typeof data | null>(null)
  const isSavingRef = useRef(false)
  const initializedRef = useRef(false)
  
  // 디바운스된 데이터
  const debouncedData = useDebounce(data, delay)

  // 저장 함수
  const saveData = useCallback(async (dataToSave: typeof data) => {
    if (isSavingRef.current) return
    
    setStatus('saving')
    setError(null)
    isSavingRef.current = true

    try {
      const result = await saveNoteDraft(noteId, {
        title: dataToSave.title,
        content: dataToSave.content
      })

      if (result.success) {
        setStatus('saved')
        setLastSaved(new Date())
        prevDataRef.current = { ...dataToSave }
        console.log('자동 저장 성공 - prevData 업데이트:', prevDataRef.current)
        onSave?.(result)
        
        // 2초 후 idle 상태로 변경
        setTimeout(() => {
          setStatus('idle')
        }, 2000)
      } else {
        throw new Error(result.error || '저장에 실패했습니다')
      }
    } catch (err) {
      console.error('자동 저장 실패:', err)
      const errorMessage = err instanceof Error ? err.message : '저장에 실패했습니다'
      setError(errorMessage)
      setStatus('error')
      onError?.(err)
      
      // 5초 후 idle 상태로 변경 (재시도 가능하도록)
      setTimeout(() => {
        setStatus('idle')
        setError(null)
      }, 5000)
    } finally {
      isSavingRef.current = false
    }
  }, [noteId, onSave, onError])

  // 수동 저장 함수
  const manualSave = useCallback(async () => {
    await saveData(data)
  }, [saveData, data])

  // 디바운스된 데이터 변경 시 자동 저장
  useEffect(() => {
    if (!enabled) {
      console.log('자동 저장 비활성화됨')
      return
    }
    
    // 초기화 체크
    if (!initializedRef.current) {
      console.log('자동 저장 훅 초기화:', debouncedData)
      prevDataRef.current = { ...debouncedData }
      initializedRef.current = true
      return
    }

    // 데이터가 변경되었는지 확인
    const hasChanges = prevDataRef.current ? (
      prevDataRef.current.title !== debouncedData.title ||
      prevDataRef.current.content !== debouncedData.content
    ) : true

    console.log('자동 저장 체크:', {
      hasChanges,
      isSaving: isSavingRef.current,
      initialized: initializedRef.current,
      prevTitle: prevDataRef.current?.title,
      currentTitle: debouncedData.title,
      prevContent: prevDataRef.current?.content?.substring(0, 50),
      currentContent: debouncedData.content?.substring(0, 50)
    })

    if (hasChanges && !isSavingRef.current) {
      console.log('자동 저장 시작...')
      saveData(debouncedData)
    }
  }, [debouncedData, enabled, saveData])

  // 컴포넌트 언마운트 시 마지막 저장 시도
  useEffect(() => {
    return () => {
      if (enabled && !isSavingRef.current && prevDataRef.current) {
        const hasChanges = 
          prevDataRef.current.title !== data.title ||
          prevDataRef.current.content !== data.content

        if (hasChanges) {
          // 비동기이지만 최대한 저장 시도
          saveData(data).catch(console.error)
        }
      }
    }
  }, [data, enabled, saveData])

  return {
    status,
    lastSaved,
    save: manualSave,
    error
  }
}

