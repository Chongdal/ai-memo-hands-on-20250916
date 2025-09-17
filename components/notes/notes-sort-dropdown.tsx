'use client'

import { ArrowUpDown } from 'lucide-react'
import { Select } from '@/components/ui/select'

export type SortOption = 'updated_at_desc' | 'updated_at_asc' | 'created_at_desc' | 'created_at_asc' | 'title_asc' | 'title_desc'

interface NotesSortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
  className?: string
}

const sortOptions = [
  { value: 'updated_at_desc' as SortOption, label: '최근 수정순' },
  { value: 'updated_at_asc' as SortOption, label: '오래된 수정순' },
  { value: 'created_at_desc' as SortOption, label: '최근 생성순' },
  { value: 'created_at_asc' as SortOption, label: '오래된 생성순' },
  { value: 'title_asc' as SortOption, label: '제목 가나다순' },
  { value: 'title_desc' as SortOption, label: '제목 역순' },
]

export function NotesSortDropdown({ value, onChange, className = '' }: NotesSortDropdownProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      <Select
        options={sortOptions}
        value={value}
        onChange={(newValue) => onChange(newValue as SortOption)}
        placeholder="정렬 방식"
        className="min-w-[140px]"
      />
    </div>
  )
}

// 정렬 옵션을 파싱하는 유틸리티 함수
export function parseSortOption(sortOption: SortOption) {
  // updated_at_desc -> ['updated', 'at', 'desc'] 처리
  if (sortOption.startsWith('updated_at_')) {
    const order = sortOption.replace('updated_at_', '') as 'asc' | 'desc'
    return {
      sortBy: 'updated_at' as const,
      sortOrder: order
    }
  } else if (sortOption.startsWith('created_at_')) {
    const order = sortOption.replace('created_at_', '') as 'asc' | 'desc'
    return {
      sortBy: 'created_at' as const,
      sortOrder: order
    }
  } else if (sortOption.startsWith('title_')) {
    const order = sortOption.replace('title_', '') as 'asc' | 'desc'
    return {
      sortBy: 'title' as const,
      sortOrder: order
    }
  }
  
  // 기본값
  return {
    sortBy: 'updated_at' as const,
    sortOrder: 'desc' as const
  }
}

// 정렬 파라미터를 옵션으로 변환하는 유틸리티 함수
export function createSortOption(sortBy: 'updated_at' | 'created_at' | 'title', sortOrder: 'asc' | 'desc'): SortOption {
  if (sortBy === 'title') {
    return `title_${sortOrder}` as SortOption
  } else if (sortBy === 'created_at') {
    return `created_at_${sortOrder}` as SortOption
  } else {
    return `updated_at_${sortOrder}` as SortOption
  }
}

