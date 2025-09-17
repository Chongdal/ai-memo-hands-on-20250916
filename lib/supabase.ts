import { createBrowserClient } from '@supabase/ssr'

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// 클라이언트 사이드용 Supabase 클라이언트 (브라우저에서 사용)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)