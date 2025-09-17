import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SignInForm } from '@/components/auth/signin-form'

export const metadata: Metadata = {
  title: '로그인 | AI 메모장',
  description: 'AI 메모장 서비스에 로그인하세요',
}

// 서버 컴포넌트에서 인증 상태 확인
async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // 이미 로그인된 사용자는 홈 페이지로 리다이렉트
    redirect('/')
  }
}

export default async function SignInPage() {
  await checkAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <SignInForm />
      </div>
    </div>
  )
}
