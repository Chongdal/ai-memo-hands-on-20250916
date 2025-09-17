import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { UserNav } from '@/components/auth/user-nav'
import { getNoteById } from '@/lib/actions/notes'
import { NoteDetailPageClient } from './note-detail-client'

interface NoteDetailPageProps {
  params: {
    id: string
  }
  searchParams: {
    mode?: 'view' | 'edit'
  }
}

export const metadata: Metadata = {
  title: '노트 상세 | AI 메모장',
  description: '노트를 확인하고 편집하세요',
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

export default async function NoteDetailPage({ params, searchParams }: NoteDetailPageProps) {
  await checkAuth()
  const { note, error } = await getNoteById((await params).id)

  if (error || !note) {
    // 노트를 찾을 수 없거나 권한이 없는 경우
    notFound()
  }

  const urlParams = await searchParams
  const mode = urlParams.mode === 'edit' ? 'edit' : 'view'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
            <span className="text-lg font-semibold">AI 메모장</span>
          </Link>
          <UserNav />
        </div>

        {/* 클라이언트 컴포넌트로 위임 */}
        <NoteDetailPageClient 
          note={note}
          initialMode={mode}
        />
      </div>
    </div>
  )
}

