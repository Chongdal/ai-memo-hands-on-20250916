'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSimpleAutoSave } from '@/hooks/use-simple-auto-save'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { NoteAutoSaveStatus } from './note-auto-save-status'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

interface NoteEditViewProps {
  note: Note
  onSave?: (data: { title: string; content: string }) => void
  className?: string
}

export function NoteEditView({ note, onSave, className = '' }: NoteEditViewProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')

  // 변경사항 감지
  const hasUnsavedChanges = title !== note.title || content !== (note.content || '')

  // 간단한 자동 저장 훅
  const autoSave = useSimpleAutoSave(
    note.id,
    { title, content },
    {
      delay: 3000,
      enabled: true
    }
  )

  // 저장 성공 시 상위 컴포넌트에 알림
  useEffect(() => {
    if (autoSave.status === 'saved') {
      onSave?.({ title, content })
    }
  }, [autoSave.status, title, content, onSave])

  // 저장되지 않은 변경사항 경고
  useUnsavedChanges(hasUnsavedChanges)

  // 컴포넌트 언마운트 시 마지막 저장 시도
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges)
  const autoSaveRef = useRef(autoSave.save)
  
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
    autoSaveRef.current = autoSave.save
  }, [hasUnsavedChanges, autoSave.save])
  
  useEffect(() => {
    return () => {
      // 변경사항이 있으면 마지막으로 저장 시도
      if (hasUnsavedChangesRef.current) {
        console.log('컴포넌트 언마운트 - 마지막 저장 시도')
        autoSaveRef.current()
      }
    }
  }, []) // 빈 의존성 배열

  // 키보드 단축키 (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        event.stopPropagation()
        console.log('Ctrl+S 감지 - 수동 저장 시작')
        autoSave.save().then(() => {
          console.log('Ctrl+S 저장 완료')
        }).catch((error) => {
          console.error('Ctrl+S 저장 실패:', error)
        })
      }
    }
    
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [autoSave])

  // 텍스트 영역 변경 핸들러
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setContent(newValue)
  }, [])

  // 텍스트 영역 자동 크기 조절 (별도 함수)
  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    // 현재 커서 위치 저장
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    
    // 높이 조절
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 600) + 'px'
    
    // 커서 위치 복원
    textarea.setSelectionRange(selectionStart, selectionEnd)
  }, [])

  // content가 변경될 때마다 높이 조절
  useEffect(() => {
    const textarea = document.getElementById('edit-content') as HTMLTextAreaElement
    if (textarea) {
      adjustTextareaHeight(textarea)
    }
  }, [content, adjustTextareaHeight])

  const titleLength = title.length
  const contentLength = content.length

  return (
    <div className={`${className}`}>
      {/* 자동 저장 상태 */}
      <div className="mb-4 flex justify-end">
        <NoteAutoSaveStatus
          status={autoSave.status}
          lastSaved={autoSave.lastSaved}
          error={autoSave.error}
        />
      </div>

      {/* 제목 편집 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="edit-title" className="text-base font-medium">
            제목 *
          </Label>
          <span className={`text-sm ${titleLength > 200 ? 'text-red-500' : 'text-gray-500'}`}>
            {titleLength}/200
          </span>
        </div>
        <Input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="노트 제목을 입력하세요"
          className="text-2xl font-bold border-2 border-dashed border-gray-300 focus:border-blue-500 transition-colors"
          maxLength={200}
        />
      </div>

      {/* 내용 편집 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="edit-content" className="text-base font-medium">
            내용
          </Label>
          <span className={`text-sm ${contentLength > 10000 ? 'text-red-500' : 'text-gray-500'}`}>
            {contentLength.toLocaleString()}/10,000
          </span>
        </div>
        <textarea
          id="edit-content"
          value={content}
          onChange={handleTextareaChange}
          placeholder="노트 내용을 입력하세요..."
          className="w-full min-h-[400px] p-4 border-2 border-dashed border-gray-300 rounded-md focus:border-blue-500 focus:outline-none transition-colors resize-none font-mono"
          style={{
            minHeight: '400px',
            maxHeight: '600px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
          maxLength={10000}
          rows={20}
          spellCheck={false}
        />
      </div>

      {/* 편집 도움말 */}
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
        <div className="flex flex-col space-y-1">
          <div>
            • 변경사항은 3초 후 자동으로 저장됩니다
          </div>
          <div>
            • <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">S</kbd> 로 즉시 저장할 수 있습니다
          </div>
          <div>
            • 저장 상태는 우측 상단에서 확인할 수 있습니다
          </div>
        </div>
      </div>
    </div>
  )
}

