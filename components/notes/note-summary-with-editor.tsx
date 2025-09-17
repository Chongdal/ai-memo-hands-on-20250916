// components/notes/note-summary-with-editor.tsx
// 편집 기능이 포함된 요약 컴포넌트
// SummaryEditor를 사용하여 인라인 편집 기능 제공
// 관련 파일: components/ai/summary-editor.tsx, lib/actions/notes.ts

'use client'

import { useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryEditor } from '@/components/ai/summary-editor'

interface NoteSummaryWithEditorProps {
  noteId: string
  summary?: string
  content?: string // 노트 내용 (100자 체크용)
  onEdit: (summary: string) => Promise<{ success: boolean; error?: string }>
  onRegenerate?: () => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function NoteSummaryWithEditor({
  noteId,
  summary,
  content,
  onEdit,
  onRegenerate,
  isLoading = false,
  disabled = false,
  className = ''
}: NoteSummaryWithEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // 노트 내용이 100자 미만이면 컴포넌트를 렌더링하지 않음
  if (!content || content.length < 100) {
    return null
  }

  // 요약 재생성 핸들러
  const handleRegenerate = async () => {
    if (!onRegenerate) return
    
    setIsGenerating(true)
    try {
      await onRegenerate()
    } catch (error) {
      console.error('요약 재생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 요약이 없는 경우 - 재생성 버튼만 표시
  if (!summary || summary.trim() === '') {
    return (
      <div className={`mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium text-gray-900">AI 요약</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              생성되지 않음
            </span>
          </div>
          
          {!disabled && onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isLoading || isGenerating}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? '생성 중...' : '요약 생성'}
            </Button>
          )}
        </div>
        
        <div className="mt-3 text-sm text-gray-500">
          AI가 노트 내용을 분석하여 요약을 생성합니다.
        </div>
      </div>
    )
  }

  // 요약이 있는 경우 - 편집 가능한 요약 표시
  return (
    <div className={className}>
      <SummaryEditor
        noteId={noteId}
        initialSummary={summary}
        onSave={onEdit}
        isLoading={isLoading}
        disabled={disabled}
      />
      
      {/* 재생성 버튼 */}
      {!disabled && onRegenerate && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isLoading || isGenerating}
            className="gap-1 text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? '재생성 중...' : '다시 생성'}
          </Button>
        </div>
      )}
    </div>
  )
}
