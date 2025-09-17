import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { NoteForm } from '@/components/notes/note-form'
import { UserNav } from '@/components/auth/user-nav'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: '새 노트 작성 | AI 메모장',
  description: '새로운 노트를 작성하여 아이디어를 기록하세요',
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

export default async function NewNotePage() {
  await checkAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center space-x-2 hover:text-blue-600 transition-colors">
            <FileText className="h-6 w-6" />
            <span className="text-lg font-semibold">AI 메모장</span>
          </Link>
          <UserNav />
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">새 노트 작성</h1>
          <p className="mt-2 text-gray-600">
            새로운 아이디어나 정보를 기록해보세요
          </p>
        </div>

        {/* 노트 작성 폼 */}
        <NoteForm mode="create" />
      </div>
    </div>
  )
}
