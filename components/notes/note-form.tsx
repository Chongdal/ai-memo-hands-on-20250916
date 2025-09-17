'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createNoteSchema, updateNoteSchema, type CreateNoteFormData, type UpdateNoteFormData } from '../../lib/validations/notes'
import { createNote, updateNote } from '../../lib/actions/notes'

interface NoteFormProps {
  mode?: 'create' | 'edit'
  initialData?: {
    id?: string
    title: string
    content: string
  }
}

export function NoteForm({ mode = 'create', initialData }: NoteFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateNoteFormData | UpdateNoteFormData>({
    resolver: mode === 'edit' 
      ? zodResolver(updateNoteSchema) as unknown as Resolver<CreateNoteFormData | UpdateNoteFormData>
      : zodResolver(createNoteSchema) as unknown as Resolver<CreateNoteFormData | UpdateNoteFormData>,
    defaultValues: {
      ...(mode === 'edit' && initialData?.id ? { id: initialData.id } : {}),
      title: initialData?.title || '',
      content: initialData?.content || '',
    }
  })

  const title = watch('title')
  const content = watch('content')

  const onSubmit = useCallback(async (data: CreateNoteFormData | UpdateNoteFormData) => {
    setIsLoading(true)
    setError(null)
    setFieldErrors(null)

    try {
      let result
      if (mode === 'edit') {
        result = await updateNote(data as UpdateNoteFormData)
      } else {
        result = await createNote(data as CreateNoteFormData)
      }
      
      if (result?.error) {
        setError(result.error)
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors)
        }
      }
      // 성공 시 서버 액션에서 redirect가 처리됨
    } catch {
      setError('예상치 못한 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  // 키보드 단축키 지원
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        handleSubmit(onSubmit)()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSubmit, onSubmit])

  const titleLength = title?.length || 0
  const contentLength = content?.length || 0

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {mode === 'create' ? '새 노트 작성' : '노트 수정'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? '새로운 노트를 작성해보세요. 제목은 필수이며, 본문은 선택사항입니다.'
            : '노트 내용을 수정할 수 있습니다.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">제목 *</Label>
              <span className={`text-xs ${titleLength > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                {titleLength}/200
              </span>
            </div>
            <Input
              id="title"
              type="text"
              placeholder="노트 제목을 입력하세요"
              aria-required="true"
              aria-invalid={!!(errors.title || fieldErrors?.title)}
              aria-describedby={errors.title || fieldErrors?.title ? 'title-error' : undefined}
              {...register('title')}
              className={errors.title || fieldErrors?.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-red-600" role="alert">
                {errors.title.message}
              </p>
            )}
            {fieldErrors?.title && (
              <p id="title-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.title[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">본문</Label>
              <span className={`text-xs ${contentLength > 10000 ? 'text-red-500' : 'text-gray-500'}`}>
                {contentLength}/10,000
              </span>
            </div>
            <textarea
              id="content"
              placeholder="노트 내용을 입력하세요..."
              aria-invalid={!!(errors.content || fieldErrors?.content)}
              aria-describedby={errors.content || fieldErrors?.content ? 'content-error' : undefined}
              {...register('content')}
              className={`min-h-[300px] w-full resize-y rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.content || fieldErrors?.content ? 'border-red-500' : 'border-input'
              }`}
              style={{
                minHeight: '300px',
                maxHeight: '600px',
              }}
              onInput={(e) => {
                const textarea = e.target as HTMLTextAreaElement
                textarea.style.height = 'auto'
                textarea.style.height = Math.min(textarea.scrollHeight, 600) + 'px'
              }}
            />
            {errors.content && (
              <p id="content-error" className="text-sm text-red-600" role="alert">
                {errors.content.message}
              </p>
            )}
            {fieldErrors?.content && (
              <p id="content-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.content[0]}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? (mode === 'create' ? '저장 중...' : '수정 중...')
                  : (mode === 'create' ? '노트 저장' : '수정 완료')
                }
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/notes">취소</Link>
              </Button>
            </div>
            
            <div className="text-sm text-gray-500">
              <span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  Ctrl
                </kbd>
                {' + '}
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  S
                </kbd>
                {` 빠른 ${mode === 'create' ? '저장' : '수정'}`}
              </span>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// 키보드 단축키 지원을 위한 훅
export function useKeyboardShortcuts(onSave: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        onSave()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave])
}
