'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPages?: number // 표시할 페이지 번호 개수
  className?: string
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPages = 5,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) return null

  // 표시할 페이지 번호 범위 계산
  const getPageNumbers = () => {
    const pages: number[] = []
    const half = Math.floor(showPages / 2)
    
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, currentPage + half)
    
    // 시작이나 끝에 가까울 때 조정
    if (currentPage <= half) {
      end = Math.min(totalPages, showPages)
    } else if (currentPage >= totalPages - half) {
      start = Math.max(1, totalPages - showPages + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()
  const showFirstPage = pageNumbers[0] > 1
  const showLastPage = pageNumbers[pageNumbers.length - 1] < totalPages
  const showFirstEllipsis = pageNumbers[0] > 2
  const showLastEllipsis = pageNumbers[pageNumbers.length - 1] < totalPages - 1

  return (
    <nav className={`flex items-center justify-center space-x-1 ${className}`} aria-label="페이지네이션">
      {/* 이전 페이지 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* 첫 페이지 */}
      {showFirstPage && (
        <>
          <Button
            variant={1 === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(1)}
            aria-label="1페이지로 이동"
            aria-current={1 === currentPage ? "page" : undefined}
          >
            1
          </Button>
          {showFirstEllipsis && (
            <span className="px-2 py-1 text-gray-500">...</span>
          )}
        </>
      )}

      {/* 페이지 번호들 */}
      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          aria-label={`${page}페이지로 이동`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {/* 마지막 페이지 */}
      {showLastPage && (
        <>
          {showLastEllipsis && (
            <span className="px-2 py-1 text-gray-500">...</span>
          )}
          <Button
            variant={totalPages === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            aria-label={`${totalPages}페이지로 이동`}
            aria-current={totalPages === currentPage ? "page" : undefined}
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* 다음 페이지 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  )
}

interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  className?: string
}

export function PaginationInfo({ 
  currentPage, 
  totalPages, 
  totalCount, 
  itemsPerPage,
  className = ''
}: PaginationInfoProps) {
  if (totalCount === 0) return null

  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalCount)

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <span>
        총 {totalCount.toLocaleString()}개 중 {start.toLocaleString()}-{end.toLocaleString()}개 표시
      </span>
      {totalPages > 1 && (
        <span className="ml-2">
          ({currentPage}/{totalPages} 페이지)
        </span>
      )}
    </div>
  )
}

