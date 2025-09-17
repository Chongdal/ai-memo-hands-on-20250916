'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInSchema, type SignInFormData } from '../../lib/validations/auth'
// import { signIn } from '../../lib/actions/auth' // 사용하지 않음
import { supabase } from '@/lib/supabase'

export function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-updated') {
      setSuccess('비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.')
    } else if (message === 'login-required') {
      setError('로그인이 필요한 페이지입니다. 로그인해주세요.')
    }
  }, [searchParams])

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // 클라이언트 사이드에서 직접 로그인 시도
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        let errorMessage = '로그인 중 오류가 발생했습니다'
        
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다'
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
        } else if (authError.message.includes('Too many requests')) {
          errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.'
        } else if (authError.message.includes('User not found')) {
          errorMessage = '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.'
        }
        
        setError(errorMessage)
        return
      }

      if (authData.user) {
        console.log('클라이언트 사이드 로그인 성공:', authData.user.email)
        // 로그인 성공 시 노트 페이지로 리다이렉트
        router.push('/notes')
        router.refresh()
      }
    } catch (error) {
      console.error('로그인 에러:', error)
      setError('예상치 못한 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        <CardDescription>
          AI 메모장에 로그인하여 시작해보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              {success}
            </div>
          )}
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>

          <div className="text-center">
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              회원가입하기
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
