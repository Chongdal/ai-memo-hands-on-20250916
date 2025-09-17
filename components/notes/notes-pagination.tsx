'use client'

import { Pagination, PaginationInfo } from '@/components/ui/pagination'

interface NotesPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  className?: string
}

export function NotesPagination({ 
  currentPage, 
  totalPages, 
  totalCount, 
  onPageChange, 
  className = '' 
}: NotesPaginationProps) {
  // 페이지가 1개 이하이면 페이지네이션을 숨김
  if (totalPages <= 1) return null

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* 페이지네이션 정보 */}
      <PaginationInfo
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={12}
      />
      
      {/* 페이지네이션 컨트롤 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}

