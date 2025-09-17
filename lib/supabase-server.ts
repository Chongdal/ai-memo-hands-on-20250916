import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 서버 사이드용 Supabase 클라이언트 (서버 컴포넌트/액션에서 사용)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // 서버 컴포넌트에서는 쿠키 설정이 제한될 수 있음
          console.error('Cookie setting failed:', error)
        }
      },
    },
  })
}
