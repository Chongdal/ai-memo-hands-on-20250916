'use server'

import { createClient } from '@supabase/supabase-js'
import { signUpSchema, type SignUpFormData } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'
// 환경 변수 로드 함수
function loadEnvVars() {
  // Next.js는 자동으로 .env.local을 로드하지만, 서버 액션에서는 명시적으로 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('=== 환경 변수 디버깅 ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('SUPABASE_URL 길이:', supabaseUrl?.length || 0)
  console.log('SUPABASE_ANON_KEY 길이:', supabaseAnonKey?.length || 0)
  console.log('SUPABASE_URL 앞 20자:', supabaseUrl?.substring(0, 20))
  console.log('========================')
  
  return { supabaseUrl, supabaseAnonKey }
}

// 환경 변수 로드
const { supabaseUrl, supabaseAnonKey } = loadEnvVars()

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function signUp(formData: SignUpFormData) {
  // 환경 변수 확인
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: '서버 설정 오류입니다. 관리자에게 문의해주세요.'
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
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (error) {
      // 에러 메시지를 사용자 친화적으로 변환
      let errorMessage = '회원가입 중 오류가 발생했습니다'
      
      if (error.message.includes('User already registered')) {
        errorMessage = '이미 등록된 이메일입니다'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = '올바른 이메일 형식을 입력해주세요'
      }

      return { error: errorMessage }
    }

    if (data.user) {
      // 회원가입 성공 시 온보딩 페이지로 리다이렉트
      redirect('/onboarding')
    }

    return { success: true }
  } catch {
    return {
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
    }
  }
}
