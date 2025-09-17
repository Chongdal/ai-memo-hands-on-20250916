'use server'

import { createClient } from '@/lib/supabase-server'
import { 
  signUpSchema, 
  signInSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
  type SignUpFormData, 
  type SignInFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData
} from '../validations/auth'
import { redirect } from 'next/navigation'


export async function signUp(formData: SignUpFormData) {
  // Supabase 클라이언트 생성
  const supabase = await createClient()

  // 유효성 검사
  const validatedFields = signUpSchema.safeParse(formData)
  
  if (!validatedFields.success) {
    return {
      error: '입력 정보를 다시 확인해주세요'
    }
  }

  const { email, password } = validatedFields.data

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/callback`
      }
    })

    if (error) {
      // 실제 에러 내용을 로깅
      console.error('=== Supabase 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.status)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      // 에러 메시지를 사용자 친화적으로 변환
      let errorMessage = `회원가입 중 오류가 발생했습니다: ${error.message}`
      
      if (error.message.includes('User already registered')) {
        errorMessage = '이미 등록된 이메일입니다'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다'
      } else if (error.message.includes('Invalid email') || error.message.includes('is invalid')) {
        errorMessage = '올바른 이메일 형식을 입력해주세요. 실제 이메일 주소를 사용해주세요.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 필요합니다'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = '로그인 정보가 올바르지 않습니다'
      } else if (error.code === 'email_address_invalid') {
        errorMessage = '유효한 이메일 주소를 입력해주세요. 예: yourname@gmail.com'
      }

      return { error: errorMessage }
    }

    if (data.user) {
      // 회원가입 성공 시 온보딩 페이지로 리다이렉트
      redirect('/onboarding')
    }

    return { success: true }
  } catch (catchError) {
    // Next.js redirect는 예외를 던지는 것이 정상 동작이므로 다시 던짐
    if (catchError instanceof Error && catchError.message === 'NEXT_REDIRECT') {
      throw catchError
    }
    
    console.error('=== Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`
    }
  }
}

export async function signIn(formData: SignInFormData) {
  // Supabase 클라이언트 생성
  const supabase = await createClient()

  // 유효성 검사
  const validatedFields = signInSchema.safeParse(formData)
  
  if (!validatedFields.success) {
    return {
      error: '입력 정보를 다시 확인해주세요'
    }
  }

  const { email, password } = validatedFields.data

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('=== Supabase 로그인 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.status)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      // 에러 메시지를 사용자 친화적으로 변환
      let errorMessage = `로그인 중 오류가 발생했습니다: ${error.message}`
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.'
      } else if (error.message.includes('User not found')) {
        errorMessage = '등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.'
      }

      return { error: errorMessage }
    }

    if (data.user) {
      console.log('=== 로그인 성공 ===')
      console.log('사용자:', data.user.email)
      console.log('========================')
      
      // 로그인 성공 시 노트 페이지로 리다이렉트
      redirect('/notes')
    }

    return { success: true }
  } catch (catchError) {
    // Next.js redirect는 예외를 던지는 것이 정상 동작이므로 다시 던짐
    if (catchError instanceof Error && catchError.message === 'NEXT_REDIRECT') {
      throw catchError
    }
    
    console.error('=== 로그인 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`
    }
  }
}

export async function forgotPassword(formData: ForgotPasswordFormData) {
  // Supabase 클라이언트 생성
  const supabase = await createClient()

  // 유효성 검사
  const validatedFields = forgotPasswordSchema.safeParse(formData)
  
  if (!validatedFields.success) {
    return {
      error: '입력 정보를 다시 확인해주세요'
    }
  }

  const { email } = validatedFields.data

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/reset-password`
    })

    if (error) {
      console.error('=== Supabase 비밀번호 찾기 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.status)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      // 보안상 모든 경우에 성공 메시지를 반환 (이메일 열거 공격 방지)
      return { 
        success: true,
        message: '비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.'
      }
    }

    return { 
      success: true,
      message: '비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.'
    }
  } catch (catchError) {
    console.error('=== 비밀번호 찾기 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    // 보안상 성공 메시지 반환
    return { 
      success: true,
      message: '비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.'
    }
  }
}

export async function resetPassword(formData: ResetPasswordFormData) {
  // Supabase 클라이언트 생성
  const supabase = await createClient()

  // 유효성 검사
  const validatedFields = resetPasswordSchema.safeParse(formData)
  
  if (!validatedFields.success) {
    return {
      error: '입력 정보를 다시 확인해주세요'
    }
  }

  const { password } = validatedFields.data

  try {
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('=== Supabase 비밀번호 재설정 에러 디버깅 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 코드:', error.status)
      console.error('전체 에러 객체:', error)
      console.error('========================')
      
      let errorMessage = `비밀번호 재설정 중 오류가 발생했습니다: ${error.message}`
      
      if (error.message.includes('Invalid refresh token')) {
        errorMessage = '재설정 링크가 만료되었거나 유효하지 않습니다. 새로운 재설정 링크를 요청해주세요.'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다'
      } else if (error.message.includes('same as the old password')) {
        errorMessage = '새 비밀번호는 기존 비밀번호와 달라야 합니다'
      }

      return { error: errorMessage }
    }

    // 비밀번호 재설정 성공 시 로그인 페이지로 리다이렉트
    redirect('/signin?message=password-updated')
    
    return { success: true }
  } catch (catchError) {
    // Next.js redirect는 예외를 던지는 것이 정상 동작이므로 다시 던짐
    if (catchError instanceof Error && catchError.message === 'NEXT_REDIRECT') {
      throw catchError
    }
    
    console.error('=== 비밀번호 재설정 Catch 블록 에러 디버깅 ===')
    console.error('Catch 에러:', catchError)
    console.error('========================')
    
    return {
      error: `서버 오류가 발생했습니다: ${catchError instanceof Error ? catchError.message : '알 수 없는 오류'}`
    }
  }
}
