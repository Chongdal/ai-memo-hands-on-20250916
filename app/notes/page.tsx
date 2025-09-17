import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import { UserNav } from '@/components/auth/user-nav'
import { getNotesWithPagination } from '@/lib/actions/notes'
import { NotesPageClient } from './notes-page-client'

export const metadata: Metadata = {
  title: '내 노트 | AI 메모장',
  description: '작성한 노트들을 확인하고 관리하세요',
}

// 서버 컴포넌트에서 인증 상태 확인
async function checkAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    redirect('/signin?message=login-required')
  }
  
  return user
}


// interface NotesPageProps {
//   searchParams: Promise<{
//     page?: string
//     sort?: string
//   }>
// } // 사용하지 않음

export default async function NotesPage({ searchParams }: { searchParams: { page?: string; search?: string; sort?: string } }) {
  await checkAuth()

  // searchParams를 await 처리
  const params = await searchParams

  // URL 파라미터 파싱
  const page = parseInt(params.page || '1', 10)
  const sortString = (params.sort || 'updated_at_desc') as string
  
  // 정렬 파라미터 파싱
  const parseSortOption = (sortOption: string) => {
    // updated_at_desc, created_at_asc, title_desc 형태 처리
    if (sortOption.startsWith('updated_at_')) {
      const order = sortOption.replace('updated_at_', '') as 'asc' | 'desc'
      return {
        sortBy: 'updated_at' as const,
        sortOrder: order || 'desc'
      }
    } else if (sortOption.startsWith('created_at_')) {
      const order = sortOption.replace('created_at_', '') as 'asc' | 'desc'
      return {
        sortBy: 'created_at' as const,
        sortOrder: order || 'desc'
      }
    } else if (sortOption.startsWith('title_')) {
      const order = sortOption.replace('title_', '') as 'asc' | 'desc'
      return {
        sortBy: 'title' as const,
        sortOrder: order || 'desc'
      }
    }
    
    // 기본값
    return {
      sortBy: 'updated_at' as const,
      sortOrder: 'desc' as const
    }
  }
  
  const { sortBy, sortOrder } = parseSortOption(sortString)
  
  // 노트 데이터 조회
  const notesData = await getNotesWithPagination({
    page,
    limit: 12,
    sortBy,
    sortOrder
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
            <FileText className="h-6 w-6" />
            <span className="text-lg font-semibold">AI 메모장</span>
          </Link>
          <UserNav />
        </div>

        {/* 클라이언트 컴포넌트로 위임 */}
        <NotesPageClient 
          initialData={notesData}
          initialSort={sortString as 'updated_at_desc' | 'updated_at_asc' | 'created_at_desc' | 'created_at_asc' | 'title_asc' | 'title_desc'}
          initialPage={page}
        />
      </div>
    </div>
  )
}
