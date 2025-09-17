// app/token-usage/page.tsx
// 토큰 사용량 모니터링 페이지
// 사용자의 AI API 사용량과 비용을 확인할 수 있는 페이지
// 관련 파일: components/ai/token-usage-display.tsx, app/api/token-usage/route.ts

import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { TokenUsagePageClient } from './token-usage-page-client'

export default async function TokenUsagePage() {
  // 사용자 인증 확인
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">토큰 사용량 모니터링</h1>
          <p className="mt-2 text-gray-600">
            AI API 사용량과 비용을 실시간으로 확인하고 관리하세요.
          </p>
        </div>

        <TokenUsagePageClient userId={user.id} />
      </div>
    </div>
  )
}
