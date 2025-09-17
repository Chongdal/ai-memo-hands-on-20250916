// components/notes/note-tags-with-editor.tsx
// 편집 기능이 포함된 태그 컴포넌트
// TagEditor를 사용하여 태그 편집 기능 제공
// 관련 파일: components/ai/tag-editor.tsx, lib/actions/notes.ts

'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TagEditor } from '@/components/ai/tag-editor'

interface NoteTagsWithEditorProps {
  noteId: string
  tags?: string[]
  onEdit: (tags: string[]) => Promise<{ success: boolean; error?: string }>
  onRegenerate?: () => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function NoteTagsWithEditor({
  noteId,
  tags,
  onEdit,
  onRegenerate,
  isLoading = false,
  disabled = false,
  className = ''
}: NoteTagsWithEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // 태그 재생성 핸들러
  const handleRegenerate = async () => {
    if (!onRegenerate) return
    
    setIsGenerating(true)
    try {
      await onRegenerate()
    } catch (error) {
      console.error('태그 재생성 오류:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className={className}>
      <TagEditor
        noteId={noteId}
        initialTags={tags || []}
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
            {isGenerating ? '재생성 중...' : 'AI 태그 생성'}
          </Button>
        </div>
      )}
    </div>
  )
}
