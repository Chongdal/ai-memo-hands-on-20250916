// components/ai/summary-editor.tsx
// 요약을 편집할 수 있는 인라인 에디터 컴포넌트
// 편집/읽기 모드 전환, 실시간 미리보기, 문자수 제한 기능 제공
// 관련 파일: lib/actions/notes.ts, components/notes/note-summary.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit3, Save, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SummaryEditorProps {
  noteId: string
  initialSummary: string
  onSave: (summary: string) => Promise<{ success: boolean; error?: string }>
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function SummaryEditor({
  noteId: _noteId,
  initialSummary,
  onSave,
  isLoading = false,
  disabled = false,
  className = ''
}: SummaryEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(initialSummary)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const maxLength = 1000
  const remainingChars = maxLength - editValue.length

  // 편집 모드 시작
  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(initialSummary)
    setError('')
    
    // 다음 틱에서 포커스 설정
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(editValue.length, editValue.length)
      }
    }, 0)
  }

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(initialSummary)
    setError('')
  }

  // 저장
  const handleSave = async () => {
    if (editValue.trim() === '') {
      setError('요약 내용을 입력해주세요.')
      return
    }

    if (editValue.length > maxLength) {
      setError(`요약은 최대 ${maxLength}자까지 입력 가능합니다.`)
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await onSave(editValue.trim())
      
      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      setError('저장 중 오류가 발생했습니다.')
      console.error('요약 저장 오류:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  // 텍스트에어리어 높이 자동 조정
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight()
    }
  }, [isEditing, editValue])

  // 읽기 모드 렌더링
  if (!isEditing) {
    const summaryLines = initialSummary
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    return (
      <div className={`mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-medium text-gray-900">AI 요약</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {summaryLines.length}개 포인트
            </span>
          </div>
          
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              disabled={isLoading}
              className="gap-1"
              title="요약 편집"
            >
              <Edit3 className="h-3 w-3" />
              편집
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {summaryLines.map((line, index) => {
            const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim()
            
            return (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1 text-sm">•</span>
                <span className="text-sm text-gray-700 leading-relaxed">{cleanLine}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 편집 모드 렌더링
  return (
    <div className={`mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Edit3 className="h-4 w-4 text-blue-600" />
          <h3 className="font-medium text-blue-900">요약 편집</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            취소
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || editValue.trim() === ''}
            className="gap-1"
          >
            <Save className="h-3 w-3" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* 편집 영역 */}
      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="요약 내용을 입력하세요..."
          className={`
            w-full min-h-[120px] p-3 border rounded-md resize-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${remainingChars < 0 ? 'border-red-300' : 'border-gray-300'}
          `}
          disabled={isSaving}
        />

        {/* 문자수 카운터 */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">
            Ctrl+Enter로 저장, Esc로 취소
          </span>
          <span className={remainingChars < 0 ? 'text-red-600' : remainingChars < 50 ? 'text-orange-600' : 'text-gray-500'}>
            {editValue.length} / {maxLength}
          </span>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 실시간 미리보기 */}
      {editValue.trim() && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-2">미리보기</h4>
          <div className="space-y-2">
            {editValue
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .map((line, index) => {
                const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim()
                
                return (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1 text-sm">•</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{cleanLine}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
