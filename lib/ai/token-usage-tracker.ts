// lib/ai/token-usage-tracker.ts
// Gemini API 토큰 사용량을 추적하고 모니터링하는 시스템
// 실시간 사용량 기록, 통계 생성, 임계값 관리 기능 제공
// 관련 파일: lib/db/schema.ts, lib/actions/notes.ts

export enum TokenUsageType {
  SUMMARY_GENERATION = 'summary_generation',
  TAG_GENERATION = 'tag_generation',
  REGENERATION = 'regeneration',
  MANUAL_EDIT = 'manual_edit'
}

export interface TokenUsage {
  id?: string
  userId: string
  noteId: string
  type: TokenUsageType
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  cost: number // USD 기준
  timestamp: Date
  processingTime: number // milliseconds
  success: boolean
  errorType?: string
}

export interface TokenUsageStats {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  totalCost: number
  requestCount: number
  successRate: number
  averageTokensPerRequest: number
  averageProcessingTime: number
}

export interface TokenUsageThreshold {
  daily: number
  weekly: number
  monthly: number
  costDaily: number // USD
  costMonthly: number // USD
}

// Gemini API 가격 정보 (2024년 기준, USD)
const GEMINI_PRICING = {
  'gemini-2.0-flash-001': {
    inputTokensPer1M: 0.075,  // $0.075 per 1M input tokens
    outputTokensPer1M: 0.30   // $0.30 per 1M output tokens
  },
  'gemini-1.5-pro': {
    inputTokensPer1M: 3.50,
    outputTokensPer1M: 10.50
  }
}

export class TokenUsageTracker {
  private static instance: TokenUsageTracker
  private thresholds: TokenUsageThreshold = {
    daily: 100000,      // 일일 10만 토큰
    weekly: 500000,     // 주간 50만 토큰
    monthly: 2000000,   // 월간 200만 토큰
    costDaily: 10.0,    // 일일 $10
    costMonthly: 100.0  // 월간 $100
  }

  private constructor() {}

  public static getInstance(): TokenUsageTracker {
    if (!TokenUsageTracker.instance) {
      TokenUsageTracker.instance = new TokenUsageTracker()
    }
    return TokenUsageTracker.instance
  }

  // 토큰 사용량 추정 (요청 전)
  public estimateTokens(text: string, includePrompt: boolean = true): {
    inputTokens: number
    estimatedOutputTokens: number
    estimatedTotalTokens: number
  } {
    // 간단한 토큰 추정 (실제로는 더 정확한 토크나이저 필요)
    const baseInputTokens = Math.ceil(text.length / 4) // 대략 4글자당 1토큰
    const promptTokens = includePrompt ? 200 : 0 // 프롬프트 토큰 추정
    const inputTokens = baseInputTokens + promptTokens
    
    // 출력 토큰은 입력의 20-30% 정도로 추정
    const estimatedOutputTokens = Math.ceil(inputTokens * 0.25)
    const estimatedTotalTokens = inputTokens + estimatedOutputTokens

    return {
      inputTokens,
      estimatedOutputTokens,
      estimatedTotalTokens
    }
  }

  // 비용 계산
  public calculateCost(inputTokens: number, outputTokens: number, model: string = 'gemini-2.0-flash-001'): number {
    const pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING] || GEMINI_PRICING['gemini-2.0-flash-001']
    
    const inputCost = (inputTokens / 1000000) * pricing.inputTokensPer1M
    const outputCost = (outputTokens / 1000000) * pricing.outputTokensPer1M
    
    return inputCost + outputCost
  }

  // 실제 토큰 사용량 기록
  public async recordUsage(usage: Omit<TokenUsage, 'id' | 'cost' | 'timestamp'>): Promise<boolean> {
    try {
      const cost = this.calculateCost(usage.inputTokens, usage.outputTokens, usage.model)
      const timestamp = new Date()

      const fullUsage: TokenUsage = {
        ...usage,
        cost,
        timestamp
      }

      // 데이터베이스에 저장 (Supabase 사용)
      const { createClient } = await import('@/lib/supabase-server')
      const supabase = await createClient()

      // token_usage 테이블 존재 확인
      const tableExists = await this.createTokenUsageTableIfNotExists(supabase)
      
      if (!tableExists) {
        console.log('토큰 사용량 기록을 건너뜁니다 (테이블이 없음)')
        return false
      }

      const { error } = await supabase
        .from('token_usage')
        .insert({
          user_id: fullUsage.userId,
          note_id: fullUsage.noteId,
          type: fullUsage.type,
          input_tokens: fullUsage.inputTokens,
          output_tokens: fullUsage.outputTokens,
          total_tokens: fullUsage.totalTokens,
          model: fullUsage.model,
          cost: fullUsage.cost,
          processing_time: fullUsage.processingTime,
          success: fullUsage.success,
          error_type: fullUsage.errorType,
          created_at: fullUsage.timestamp.toISOString()
        })

      if (error) {
        console.error('토큰 사용량 기록 실패:', error)
        return false
      }

      // 임계값 확인 및 알림
      await this.checkThresholds(fullUsage.userId)

      console.log(`토큰 사용량 기록: ${fullUsage.totalTokens} tokens, $${fullUsage.cost.toFixed(4)}`)
      return true

    } catch (error) {
      console.error('토큰 사용량 기록 중 오류:', error)
      return false
    }
  }

  // 사용량 통계 조회
  public async getUsageStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    type?: TokenUsageType
  ): Promise<TokenUsageStats | null> {
    try {
      const { createClient } = await import('@/lib/supabase-server')
      const supabase = await createClient()

      let query = supabase
        .from('token_usage')
        .select('*')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
      }

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) {
        console.error('사용량 통계 조회 실패:', error)
        return null
      }

      if (!data || data.length === 0) {
        return {
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalCost: 0,
          requestCount: 0,
          successRate: 0,
          averageTokensPerRequest: 0,
          averageProcessingTime: 0
        }
      }

      const totalTokens = data.reduce((sum, record) => sum + record.total_tokens, 0)
      const inputTokens = data.reduce((sum, record) => sum + record.input_tokens, 0)
      const outputTokens = data.reduce((sum, record) => sum + record.output_tokens, 0)
      const totalCost = data.reduce((sum, record) => sum + record.cost, 0)
      const requestCount = data.length
      const successCount = data.filter(record => record.success).length
      const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 0
      const averageTokensPerRequest = requestCount > 0 ? totalTokens / requestCount : 0
      const averageProcessingTime = requestCount > 0 
        ? data.reduce((sum, record) => sum + record.processing_time, 0) / requestCount 
        : 0

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

    } catch (error) {
      console.error('사용량 통계 조회 중 오류:', error)
      return null
    }
  }

  // 일일 사용량 조회
  public async getDailyUsage(userId?: string, date?: Date): Promise<TokenUsageStats | null> {
    const targetDate = date || new Date()
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)

    return this.getUsageStats(userId, startDate, endDate)
  }

  // 월간 사용량 조회
  public async getMonthlyUsage(userId?: string, year?: number, month?: number): Promise<TokenUsageStats | null> {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month !== undefined ? month : now.getMonth()
    
    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)

    return this.getUsageStats(userId, startDate, endDate)
  }

  // 임계값 확인 및 알림
  private async checkThresholds(userId: string): Promise<void> {
    try {
      const dailyUsage = await this.getDailyUsage(userId)
      const monthlyUsage = await this.getMonthlyUsage(userId)

      if (!dailyUsage || !monthlyUsage) return

      // 일일 토큰 임계값 확인
      if (dailyUsage.totalTokens >= this.thresholds.daily) {
        console.warn(`⚠️ 일일 토큰 사용량 임계값 초과: ${dailyUsage.totalTokens}/${this.thresholds.daily}`)
        await this.sendAlert(userId, 'daily_token_threshold', {
          current: dailyUsage.totalTokens,
          threshold: this.thresholds.daily
        })
      }

      // 일일 비용 임계값 확인
      if (dailyUsage.totalCost >= this.thresholds.costDaily) {
        console.warn(`⚠️ 일일 비용 임계값 초과: $${dailyUsage.totalCost.toFixed(2)}/$${this.thresholds.costDaily}`)
        await this.sendAlert(userId, 'daily_cost_threshold', {
          current: dailyUsage.totalCost,
          threshold: this.thresholds.costDaily
        })
      }

      // 월간 토큰 임계값 확인
      if (monthlyUsage.totalTokens >= this.thresholds.monthly) {
        console.warn(`⚠️ 월간 토큰 사용량 임계값 초과: ${monthlyUsage.totalTokens}/${this.thresholds.monthly}`)
        await this.sendAlert(userId, 'monthly_token_threshold', {
          current: monthlyUsage.totalTokens,
          threshold: this.thresholds.monthly
        })
      }

      // 월간 비용 임계값 확인
      if (monthlyUsage.totalCost >= this.thresholds.costMonthly) {
        console.warn(`⚠️ 월간 비용 임계값 초과: $${monthlyUsage.totalCost.toFixed(2)}/$${this.thresholds.costMonthly}`)
        await this.sendAlert(userId, 'monthly_cost_threshold', {
          current: monthlyUsage.totalCost,
          threshold: this.thresholds.costMonthly
        })
      }

    } catch (error) {
      console.error('임계값 확인 중 오류:', error)
    }
  }

  // 알림 발송
  private async sendAlert(userId: string, type: string, data: unknown): Promise<void> {
    console.log(`🚨 알림 발송 - 사용자: ${userId}, 타입: ${type}, 데이터:`, data)
    
    // 실제 운영에서는 이메일, 슬랙, 웹훅 등으로 알림 발송
    // 여기서는 로그만 출력
  }

  // 토큰 사용량 테이블 존재 확인
  private async createTokenUsageTableIfNotExists(supabase: any): Promise<boolean> {
    try {
      console.log('토큰 사용량 테이블 확인 중...')
      
      // 테이블 존재 확인
      const { data: tableExists, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'token_usage')
        .eq('table_schema', 'public')
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('테이블 존재 확인 실패:', checkError)
        return false
      }
      
      if (!tableExists) {
        console.log('token_usage 테이블이 존재하지 않습니다. 수동으로 생성해주세요.')
        return false
      }
      
      console.log('토큰 사용량 테이블 확인 완료')
      return true
    } catch (error) {
      console.error('토큰 사용량 테이블 확인 중 오류:', error)
      return false
    }
  }

  // 임계값 설정
  public setThresholds(thresholds: Partial<TokenUsageThreshold>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  // 임계값 조회
  public getThresholds(): TokenUsageThreshold {
    return { ...this.thresholds }
  }
}
