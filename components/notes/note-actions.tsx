'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/modal'
import { deleteNote } from '@/lib/actions/notes'

interface NoteActionsProps {
  noteId: string
  noteTitle: string
  onDelete?: () => void
  showEditButton?: boolean
}

export function NoteActions({ noteId, noteTitle, onDelete, showEditButton = true }: NoteActionsProps) {
  const router = useRouter()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleEdit = () => {
    router.push(`/notes/${noteId}?mode=edit`)
  }

  const handleDeleteClick = () => {
    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deleteNote(noteId)
      
      if (result.error) {
        setDeleteError(result.error)
        setIsDeleting(false)
        return
      }

      // 삭제 성공
      setIsDeleteModalOpen(false)
      setIsDeleting(false)
      
      // 부모 컴포넌트에 삭제 완료 알림
      if (onDelete) {
        onDelete()
      } else {
        // 페이지 새로고침으로 목록 업데이트
        router.refresh()
      }
      
    } catch (error) {
      console.error('삭제 중 오류:', error)
      setDeleteError('삭제 중 예상치 못한 오류가 발생했습니다')
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false)
      setDeleteError(null)
    }
  }

  return (
    <>
      <div className="flex space-x-2">
        {showEditButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center space-x-1"
          >
            <Edit className="w-3 h-3" />
            <span>수정</span>
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteClick}
          className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="w-3 h-3" />
          <span>삭제</span>
        </Button>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="노트 삭제"
        message={`"${noteTitle}" 노트를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={isDeleting}
      />

      {deleteError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {deleteError}
        </div>
      )}
    </>
  )
}
