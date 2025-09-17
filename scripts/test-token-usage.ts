// scripts/test-token-usage.ts
// 토큰 사용량 테스트 스크립트
// AI 요약과 태그 생성을 테스트하여 토큰 사용량이 정상적으로 기록되는지 확인

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 환경 변수 로드
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTokenUsage() {
  console.log('=== 토큰 사용량 테스트 시작 ===')
  
  try {
    // 1. 현재 토큰 사용량 조회
    console.log('\n1. 현재 토큰 사용량 조회...')
    const { data: currentUsage, error: currentError } = await supabase
      .from('token_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (currentError) {
      console.error('토큰 사용량 조회 실패:', currentError)
      return
    }
    
    console.log('최근 5개 기록:')
    currentUsage?.forEach((record, index) => {
      console.log(`${index + 1}. ${record.type} - ${record.total_tokens} tokens - $${record.cost} - ${new Date(record.created_at).toLocaleString()}`)
    })
    
    // 2. 총 사용량 계산
    const { data: totalUsage, error: totalError } = await supabase
      .from('token_usage')
      .select('total_tokens, cost')
    
    if (!totalError && totalUsage) {
      const totalTokens = totalUsage.reduce((sum, record) => sum + record.total_tokens, 0)
      const totalCost = totalUsage.reduce((sum, record) => sum + record.cost, 0)
      
      console.log(`\n총 토큰 사용량: ${totalTokens.toLocaleString()} tokens`)
      console.log(`총 비용: $${totalCost.toFixed(6)}`)
    }
    
    // 3. 오늘 사용량 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayUsage, error: todayError } = await supabase
      .from('token_usage')
      .select('total_tokens, cost')
      .gte('created_at', today.toISOString())
    
    if (!todayError && todayUsage) {
      const todayTokens = todayUsage.reduce((sum, record) => sum + record.total_tokens, 0)
      const todayCost = todayUsage.reduce((sum, record) => sum + record.cost, 0)
      
      console.log(`\n오늘 사용량: ${todayTokens.toLocaleString()} tokens`)
      console.log(`오늘 비용: $${todayCost.toFixed(6)}`)
    }
    
    console.log('\n=== 테스트 완료 ===')
    console.log('이제 AI 요약이나 태그 생성을 실행한 후 다시 이 스크립트를 실행해보세요!')
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error)
  }
}

// 스크립트 실행
testTokenUsage()
