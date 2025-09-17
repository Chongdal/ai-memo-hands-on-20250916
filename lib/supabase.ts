import { createClient } from '@supabase/supabase-js'

// 개발 환경에서 환경 변수가 없을 때 더미 값 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-project-id.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15LXByb2plY3QtaWQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTQ2NzI4MCwiZXhwIjoxOTYxMDQzMjgwfQ.dummy-signature'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
