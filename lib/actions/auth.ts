'use server'

import { createClient } from '@supabase/supabase-js'
import { signUpSchema, type SignUpFormData } from '../validations/auth'
import { redirect } from 'next/navigation'

// 환경 변수 확인 및 Supabase 클라이언트 생성
function createSupabaseClient() {
  // 서버 액션에서는 클라이언트와 서버 환경 변수 모두 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  console.log('=== 환경 변수 디버깅 ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY)
  console.log('최종 SUPABASE_URL 존재:', !!supabaseUrl)
  console.log('최종 SUPABASE_ANON_KEY 존재:', !!supabaseAnonKey)
  console.log('최종 SUPABASE_URL 길이:', supabaseUrl?.length || 0)
  console.log('최종 SUPABASE_ANON_KEY 길이:', supabaseAnonKey?.length || 0)
  console.log('========================')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다!')
    return null
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}


export async function signUp(formData: SignUpFormData) {
  // Supabase 클라이언트 생성
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    return {
      error: '서버 설정 오류입니다. 환경 변수를 확인해주세요.'
    }
  }

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
