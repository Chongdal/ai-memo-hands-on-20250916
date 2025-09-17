import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: '비밀번호 재설정 | AI 메모장',
  description: '새로운 비밀번호를 설정하세요',
}

// 서버 컴포넌트에서 세션 확인 (재설정 토큰이 있는지)
async function checkResetSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // 재설정 세션이 없으면 비밀번호 찾기 페이지로 리다이렉트
  if (!session) {
    redirect('/forgot-password?error=invalid-token')
  }
}

export default async function ResetPasswordPage() {
  await checkResetSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
