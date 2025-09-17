'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteActions } from '@/components/notes/note-actions'
import { NotesSortDropdown, type SortOption, parseSortOption } from '@/components/notes/notes-sort-dropdown'
import { NotesPagination } from '@/components/notes/notes-pagination'
import { getNotesWithPagination } from '@/lib/actions/notes'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  user_id: string
}

interface NotesData {
  notes: Note[]
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  error: string | null
}

interface NotesPageClientProps {
  initialData: NotesData
  initialSort: SortOption
  initialPage: number
}

// 날짜 포맷팅 함수
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  
  // 날짜를 한국 시간대로 맞춤 (UTC 오프셋 고려)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = today.getTime() - targetDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    // 오늘인 경우 시간도 표시
    return `오늘 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  } else if (diffDays === 1) {
    return `어제 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`
  } else if (diffDays <= 7 && diffDays > 0) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export function NotesPageClient({ initialData, initialSort, initialPage }: NotesPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [notesData, setNotesData] = useState<NotesData>(initialData)
  const [currentSort, setCurrentSort] = useState<SortOption>(initialSort)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)

  // URL 파라미터 업데이트
  const updateURL = (page: number, sort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (page !== 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    
    if (sort !== 'updated_at_desc') {
      params.set('sort', sort)
    } else {
      params.delete('sort')
    }
    
    const queryString = params.toString()
    const newURL = queryString ? `?${queryString}` : '/notes'
    
    router.push(newURL, { scroll: false })
  }

  // 데이터 새로고침
  const refreshData = async (page: number, sort: SortOption) => {
    setIsLoading(true)
    
    try {
      const { sortBy, sortOrder } = parseSortOption(sort)
      const newData = await getNotesWithPagination({
        page,
        limit: 12,
        sortBy,
        sortOrder
      })
      
      setNotesData(newData)
      setCurrentPage(page)
      setCurrentSort(sort)
    } catch (error) {
      console.error('데이터 새로고침 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 정렬 변경 핸들러
  const handleSortChange = (newSort: SortOption) => {
    const newPage = 1 // 정렬 변경 시 첫 페이지로
    updateURL(newPage, newSort)
    refreshData(newPage, newSort)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    updateURL(newPage, currentSort)
    refreshData(newPage, currentSort)
  }

  // 노트 삭제 후 새로고침
  const handleNoteDeleted = () => {
    // 현재 페이지에 노트가 1개뿐이고 첫 페이지가 아니라면 이전 페이지로
    let targetPage = currentPage
    if (notesData.notes.length === 1 && currentPage > 1) {
      targetPage = currentPage - 1
    }
    
    updateURL(targetPage, currentSort)
    refreshData(targetPage, currentSort)
  }

  if (notesData.error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
        <p className="text-gray-600 mb-8">{notesData.error}</p>
        <Button asChild>
          <Link href="/notes/new">새 노트 작성하기</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">내 노트</h1>
          <p className="mt-2 text-gray-600">
            {notesData.totalCount > 0 
              ? `총 ${notesData.totalCount}개의 노트가 있습니다`
              : '아직 작성한 노트가 없습니다'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* 정렬 드롭다운 */}
          {notesData.totalCount > 0 && (
            <NotesSortDropdown
              value={currentSort}
              onChange={handleSortChange}
            />
          )}
          
          {/* 새 노트 작성 버튼 */}
          <Button asChild>
            <Link href="/notes/new">
              <Plus className="w-4 h-4 mr-2" />
              새 노트 작성
            </Link>
          </Button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">노트를 불러오는 중...</p>
        </div>
      )}

      {/* 노트 목록 */}
      {!isLoading && (
        <>
          {notesData.notes.length === 0 ? (
            // 빈 상태 UI
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <CardTitle className="text-xl mb-2">첫 번째 노트를 작성해보세요!</CardTitle>
                <CardDescription className="mb-6">
                  아이디어, 할 일, 메모 등 무엇이든 기록할 수 있습니다.
                </CardDescription>
                <Button asChild>
                  <Link href="/notes/new">
                    <Plus className="w-4 h-4 mr-2" />
                    노트 작성하기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 노트 목록 */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notesData.notes.map((note) => (
                  <Card key={note.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">
                            <Link 
                              href={`/notes/${note.id}`}
                              className="hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {note.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="flex items-center text-sm mt-1">
                            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                            {formatDate(note.updated_at)}
                          </CardDescription>
                        </div>
                        <div className="ml-2 flex-shrink-0">
                          <NoteActions 
                            noteId={note.id} 
                            noteTitle={note.title}
                            onDelete={handleNoteDeleted}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    {note.content && (
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {note.content}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {/* 페이지네이션 */}
              <div className="mt-8">
                <NotesPagination
                  currentPage={notesData.currentPage}
                  totalPages={notesData.totalPages}
                  totalCount={notesData.totalCount}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* 하단 정보 */}
      {notesData.notes.length > 0 && !isLoading && (
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>각 노트의 수정 및 삭제 버튼을 사용하여 노트를 관리할 수 있습니다</p>
        </div>
      )}
    </>
  )
}
