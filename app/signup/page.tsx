import { Metadata } from 'next'
import { SignUpForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: '회원가입 | AI 메모장',
  description: 'AI 메모장 서비스에 가입하세요',
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <SignUpForm />
      </div>
    </div>
  )
}
