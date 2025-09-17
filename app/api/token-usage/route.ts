// app/api/token-usage/route.ts
// 토큰 사용량 조회 API 엔드포인트
// 사용자별 토큰 사용량 통계를 제공
// 관련 파일: lib/ai/token-usage-tracker.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // URL 파라미터에서 기간 확인
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'daily'
    const limit = parseInt(searchParams.get('limit') || '30')

    // 토큰 사용량 데이터 조회
    const { data: usageData, error: usageError } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (usageError) {
      console.error('토큰 사용량 조회 실패:', usageError)
      return NextResponse.json({ error: '사용량 데이터를 불러올 수 없습니다.' }, { status: 500 })
    }

    // 통계 계산
    const stats = calculateUsageStats(usageData || [], period)
    
    return NextResponse.json({
      success: true,
      data: {
        usage: usageData || [],
        stats,
        period,
        limit
      }
    })

  } catch (error) {
    console.error('토큰 사용량 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 사용량 통계 계산 함수
function calculateUsageStats(usageData: Array<{
  total_tokens: number
  input_tokens: number
  output_tokens: number
  cost: number
  success: boolean
  processing_time: number
  created_at: string
}>, period: string) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  let filteredData = usageData
  
  if (period === 'daily') {
    filteredData = usageData.filter(item => 
      new Date(item.created_at) >= startOfDay
    )
  } else if (period === 'monthly') {
    filteredData = usageData.filter(item => 
      new Date(item.created_at) >= startOfMonth
    )
  }

  const totalTokens = filteredData.reduce((sum, item) => sum + (item.total_tokens || 0), 0)
  const inputTokens = filteredData.reduce((sum, item) => sum + (item.input_tokens || 0), 0)
  const outputTokens = filteredData.reduce((sum, item) => sum + (item.output_tokens || 0), 0)
  const totalCost = filteredData.reduce((sum, item) => sum + (item.cost || 0), 0)
  const requestCount = filteredData.length
  const successCount = filteredData.filter(item => item.success).length
  const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 0
  const averageTokensPerRequest = requestCount > 0 ? totalTokens / requestCount : 0
  const averageProcessingTime = filteredData.reduce((sum, item) => sum + (item.processing_time || 0), 0) / requestCount

  return {
    totalTokens,
    inputTokens,
    outputTokens,
    totalCost,
    requestCount,
    successRate,
    averageTokensPerRequest,
    averageProcessingTime
  }
}
