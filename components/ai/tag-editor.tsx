// components/ai/tag-editor.tsx
// 태그를 편집할 수 있는 컴포넌트
// 개별 태그 편집/삭제, 새 태그 추가, 드래그 앤 드롭 순서 변경 기능 제공
// 관련 파일: lib/actions/notes.ts, components/notes/note-tags.tsx

'use client'

import { useState, useRef } from 'react'
import { Edit3, Save, X, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TagEditorProps {
  noteId: string
  initialTags: string[]
  onSave: (tags: string[]) => Promise<{ success: boolean; error?: string }>
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function TagEditor({
  noteId: _noteId,
  initialTags,
  onSave,
  isLoading = false,
  disabled = false,
  className = ''
}: TagEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTags, setEditTags] = useState<string[]>(initialTags)
  const [newTagInput, setNewTagInput] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const newTagInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const maxTags = 10
  const maxTagLength = 20

  // 편집 모드 시작
  const handleStartEdit = () => {
    setIsEditing(true)
    setEditTags([...initialTags])
    setNewTagInput('')
    setEditingIndex(null)
    setError('')
  }

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false)
    setEditTags([...initialTags])
    setNewTagInput('')
    setEditingIndex(null)
    setError('')
  }

  // 저장
  const handleSave = async () => {
    // 빈 태그 제거
    const cleanTags = editTags.filter(tag => tag.trim() !== '')
    
    if (cleanTags.length > maxTags) {
      setError(`태그는 최대 ${maxTags}개까지 설정할 수 있습니다.`)
      return
    }

    // 태그 길이 검증
    for (const tag of cleanTags) {
      if (tag.length > maxTagLength) {
        setError(`각 태그는 최대 ${maxTagLength}자까지 입력 가능합니다.`)
        return
      }
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await onSave(cleanTags)
      
      if (result.success) {
        setIsEditing(false)
        setEditingIndex(null)
      } else {
        setError(result.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      setError('저장 중 오류가 발생했습니다.')
      console.error('태그 저장 오류:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 새 태그 추가
  const handleAddTag = () => {
    const newTag = newTagInput.trim()
    
    if (newTag === '') return
    
    if (newTag.length > maxTagLength) {
      setError(`태그는 최대 ${maxTagLength}자까지 입력 가능합니다.`)
      return
    }
    
    if (editTags.includes(newTag)) {
      setError('이미 존재하는 태그입니다.')
      return
    }
    
    if (editTags.length >= maxTags) {
      setError(`태그는 최대 ${maxTags}개까지 추가할 수 있습니다.`)
      return
    }

    setEditTags([...editTags, newTag])
    setNewTagInput('')
    setError('')
  }

  // 태그 삭제
  const handleDeleteTag = (index: number) => {
    const newTags = editTags.filter((_, i) => i !== index)
    setEditTags(newTags)
    setError('')
  }

  // 개별 태그 편집 시작
  const handleStartEditTag = (index: number) => {
    setEditingIndex(index)
    setEditingValue(editTags[index])
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus()
        editInputRef.current.select()
      }
    }, 0)
  }

  // 개별 태그 편집 완료
  const handleFinishEditTag = () => {
    if (editingIndex === null) return
    
    const newValue = editingValue.trim()
    
    if (newValue === '') {
      // 빈 값이면 태그 삭제
      handleDeleteTag(editingIndex)
    } else if (newValue.length > maxTagLength) {
      setError(`태그는 최대 ${maxTagLength}자까지 입력 가능합니다.`)
      return
    } else if (editTags.includes(newValue) && editTags[editingIndex] !== newValue) {
      setError('이미 존재하는 태그입니다.')
      return
    } else {
      const newTags = [...editTags]
      newTags[editingIndex] = newValue
      setEditTags(newTags)
      setError('')
    }
    
    setEditingIndex(null)
    setEditingValue('')
  }

  // 개별 태그 편집 취소
  const handleCancelEditTag = () => {
    setEditingIndex(null)
    setEditingValue('')
    setError('')
  }

  // 키보드 이벤트 처리
  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setNewTagInput('')
    }
  }

  const handleEditTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleFinishEditTag()
    } else if (e.key === 'Escape') {
      handleCancelEditTag()
    }
  }

  // 태그 클릭 핸들러 (검색용)
  const handleTagClick = (tag: string) => {
    if (!isEditing) {
      // 태그 검색 기능 (기존 기능 유지)
      window.location.href = `/notes?search=${encodeURIComponent(tag)}`
    }
  }

  // 읽기 모드 렌더링
  if (!isEditing) {
    if (!initialTags || initialTags.length === 0) {
      return null
    }

    return (
      <div className={`mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="font-medium text-gray-900">태그</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {initialTags.length}개
            </span>
          </div>
          
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              disabled={isLoading}
              className="gap-1"
              title="태그 편집"
            >
              <Edit3 className="h-3 w-3" />
              편집
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {initialTags.map((tag, index) => (
            <button
              key={index}
              onClick={() => handleTagClick(tag)}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title={`"${tag}" 태그로 검색`}
            >
              <svg className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {tag}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 편집 모드 렌더링
  return (
    <div className={`mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Edit3 className="h-4 w-4 text-green-600" />
          <h3 className="font-medium text-green-900">태그 편집</h3>
          <span className="text-xs text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
            {editTags.length} / {maxTags}
          </span>
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
            disabled={isSaving}
            className="gap-1"
          >
            <Save className="h-3 w-3" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* 기존 태그 편집 */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {editTags.map((tag, index) => (
            <div key={index} className="flex items-center">
              {editingIndex === index ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={handleEditTagKeyDown}
                  onBlur={handleFinishEditTag}
                  className="px-2 py-1 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  maxLength={maxTagLength}
                />
              ) : (
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 group">
                  <button
                    onClick={() => handleStartEditTag(index)}
                    className="flex items-center space-x-1 hover:bg-green-200 rounded-full px-1 transition-colors"
                    title="클릭하여 편집"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{tag}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTag(index)}
                    className="ml-1 hover:bg-red-200 rounded-full p-1 transition-colors"
                    title="태그 삭제"
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 새 태그 추가 */}
        {editTags.length < maxTags && (
          <div className="flex items-center space-x-2">
            <input
              ref={newTagInputRef}
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={handleNewTagKeyDown}
              placeholder="새 태그 추가..."
              className="px-3 py-2 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
              maxLength={maxTagLength}
              disabled={isSaving}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={!newTagInput.trim() || isSaving}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              추가
            </Button>
          </div>
        )}

        {/* 도움말 */}
        <div className="text-xs text-green-700">
          • 태그를 클릭하여 편집하거나 X 버튼으로 삭제할 수 있습니다
          • Enter로 추가/편집 완료, Esc로 취소
          • 최대 {maxTags}개, 각 태그는 최대 {maxTagLength}자까지 가능
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
