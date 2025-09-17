'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../lib/validations/auth'
import { forgotPassword } from '../../lib/actions/auth'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await forgotPassword(data)
      
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess(true)
        setMessage(result.message || '비밀번호 재설정 링크를 이메일로 발송했습니다.')
      }
    } catch {
      setError('예상치 못한 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">이메일을 확인해주세요</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            이메일이 오지 않았나요? 스팸 폴더도 확인해보세요.
          </div>
          <Button asChild className="w-full">
            <Link href="/signin">로그인 페이지로 돌아가기</Link>
          </Button>
          <div className="text-center">
            <button
              onClick={() => {
                setSuccess(false)
                setMessage(null)
                setError(null)
              }}
              className="text-sm text-primary hover:underline"
            >
              다른 이메일로 다시 시도
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
        <CardDescription>
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '발송 중...' : '재설정 링크 발송'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            비밀번호가 기억나셨나요?{' '}
            <Link href="/signin" className="text-primary hover:underline">
              로그인하기
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

