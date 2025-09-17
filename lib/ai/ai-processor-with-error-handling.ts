// lib/ai/ai-processor-with-error-handling.ts
// AI 처리를 에러 핸들링과 자동 복구 로직으로 감싸는 래퍼
// 재시도, 백오프, 콘텐츠 축약 등의 복구 메커니즘 제공
// 토큰 사용량 추적 기능 포함
// 관련 파일: lib/ai/error-handler.ts, lib/ai/gemini-client.ts, lib/actions/notes.ts, lib/ai/token-usage-tracker.ts

import { 
  AIError, 
  AIErrorType, 
  classifyError, 
  logAIError, 
  calculateBackoffDelay, 
  shouldRetry, 
  shouldAutoRetry 
} from './error-handler'
import { TokenUsageTracker, TokenUsageType } from './token-usage-tracker'

export interface AIProcessingOptions {
  maxRetries?: number
  enableAutoRetry?: boolean
  enableContentTruncation?: boolean
  maxContentLength?: number
  userId?: string
  noteId?: string
  usageType?: TokenUsageType
  trackTokenUsage?: boolean
  onProgress?: (status: string) => void
  onError?: (error: AIError) => void
}

export interface AIProcessingResult<T> {
  success: boolean
  data?: T
  error?: AIError
  attempts: number
  totalDuration: number
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cost: number
  }
}

// AI 처리를 에러 핸들링으로 감싸는 메인 함수
export async function processWithErrorHandling<T>(
  operation: (content: string) => Promise<T>,
  content: string,
  options: AIProcessingOptions = {}
): Promise<AIProcessingResult<T>> {
  const {
    maxRetries = 3,
    enableAutoRetry = true,
    enableContentTruncation = true,
    maxContentLength = 8000,
    userId,
    noteId,
    usageType = TokenUsageType.SUMMARY_GENERATION,
    trackTokenUsage = true,
    onProgress,
    onError
  } = options

  const startTime = Date.now()
  let attempts = 0
  let lastError: AIError | null = null
  let currentContent = content
  let tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number; cost: number } | undefined

  // 토큰 추적기 초기화
  const tokenTracker = trackTokenUsage ? TokenUsageTracker.getInstance() : null

  while (attempts <= maxRetries) {
    attempts++
    
    try {
      onProgress?.(`AI 처리 시도 중... (${attempts}/${maxRetries + 1})`)
      
      // AI 처리 실행
      const result = await operation(currentContent)
      
      const totalDuration = Date.now() - startTime
      
      // 토큰 사용량 계산 및 기록 (성공 시)
      if (tokenTracker && userId && noteId) {
        let actualInputTokens = 0
        let actualOutputTokens = 0
        
        // 결과에서 실제 토큰 사용량 추출
        if (result && typeof result === 'object' && 'usage' in result) {
          const usage = (result as { usage: { promptTokens: number; completionTokens: number } }).usage
          actualInputTokens = usage.promptTokens || 0
          actualOutputTokens = usage.completionTokens || 0
        } else {
          // fallback: 추정값 사용
          const estimatedTokens = tokenTracker.estimateTokens(currentContent, true)
          actualInputTokens = estimatedTokens.inputTokens
          actualOutputTokens = estimatedTokens.estimatedOutputTokens
        }
        
        const totalTokens = actualInputTokens + actualOutputTokens
        const cost = tokenTracker.calculateCost(actualInputTokens, actualOutputTokens)
        
        tokenUsage = {
          inputTokens: actualInputTokens,
          outputTokens: actualOutputTokens,
          totalTokens,
          cost
        }
        
        // 토큰 사용량 기록
        await tokenTracker.recordUsage({
          userId,
          noteId,
          type: usageType,
          inputTokens: actualInputTokens,
          outputTokens: actualOutputTokens,
          totalTokens,
          model: 'gemini-2.0-flash-001',
          processingTime: totalDuration,
          success: true
        })
      }
      
      // 성공 로그
      console.log(`AI 처리 성공: ${attempts}회 시도, ${totalDuration}ms${tokenUsage ? `, ${tokenUsage.totalTokens} tokens, $${tokenUsage.cost.toFixed(4)}` : ''}`)
      
      return {
        success: true,
        data: result,
        attempts,
        totalDuration,
        tokenUsage
      }
      
    } catch (error) {
      // 에러 분류 및 로깅
      const aiError = classifyError(error as Error, { userId, noteId })
      logAIError(aiError)
      
      lastError = aiError
      onError?.(aiError)
      
      // 토큰 사용량 기록 (실패 시)
      if (tokenTracker && userId && noteId) {
        const estimatedTokens = tokenTracker.estimateTokens(currentContent, true)
        if (estimatedTokens) {
          await tokenTracker.recordUsage({
            userId,
            noteId,
            type: usageType,
            inputTokens: estimatedTokens.inputTokens,
            outputTokens: 0, // 실패 시 출력 토큰 없음
            totalTokens: estimatedTokens.inputTokens,
            model: 'gemini-2.0-flash-001',
            processingTime: Date.now() - startTime,
            success: false,
            errorType: aiError.type
          })
        }
      }
      
      // 재시도 가능 여부 확인
      if (attempts > maxRetries || !shouldRetry(aiError, attempts - 1)) {
        break
      }
      
      // 자동 재시도 여부 확인
      if (!enableAutoRetry || !shouldAutoRetry(aiError)) {
        break
      }
      
      // 콘텐츠 축약 시도 (내용이 너무 긴 경우)
      if (aiError.type === AIErrorType.CONTENT_TOO_LONG && enableContentTruncation) {
        const truncatedContent = truncateContent(currentContent, maxContentLength * 0.8)
        if (truncatedContent !== currentContent) {
          currentContent = truncatedContent
          onProgress?.('내용을 축약하여 다시 시도합니다...')
          console.log(`내용 축약: ${content.length} -> ${currentContent.length}자`)
          continue // 즉시 재시도 (백오프 없이)
        }
      }
      
      // 백오프 대기
      if (attempts <= maxRetries) {
        const delay = calculateBackoffDelay(attempts - 1)
        onProgress?.(`${delay / 1000}초 후 재시도합니다...`)
        await sleep(delay)
      }
    }
  }
  
  const totalDuration = Date.now() - startTime
  
  return {
    success: false,
    error: lastError || classifyError('Unknown error occurred', { userId, noteId }),
    attempts,
    totalDuration,
    tokenUsage
  }
}

// 콘텐츠 축약 함수
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) {
    return content
  }
  
  // 문장 단위로 축약 시도
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  let truncated = ''
  
  for (const sentence of sentences) {
    const candidate = truncated + sentence + '. '
    if (candidate.length > maxLength) {
      break
    }
    truncated = candidate
  }
  
  // 문장 단위 축약이 불가능하면 단순 자르기
  if (truncated.length === 0) {
    truncated = content.substring(0, maxLength - 3) + '...'
  }
  
  return truncated.trim()
}

// 비동기 대기 함수
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 요약 생성 래퍼
export async function generateSummaryWithErrorHandling(
  noteId: string,
  content: string,
  options: Omit<AIProcessingOptions, 'noteId'> = {}
): Promise<AIProcessingResult<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }>> {
  return processWithErrorHandling(
    async (processContent) => {
      // Gemini API 호출을 위한 동적 import
      const { GeminiClient } = await import('@/lib/ai/gemini-client')
      
      const SUMMARY_PROMPT = `
다음 노트 내용을 3-6개의 핵심 불릿 포인트로 요약해주세요.
각 불릿 포인트는 명확하고 간결해야 하며, 노트의 주요 내용을 포함해야 합니다.

노트 내용:
${processContent}

요약 형식:
• 첫 번째 핵심 포인트
• 두 번째 핵심 포인트
• 세 번째 핵심 포인트
(필요시 최대 6개까지)

요구사항:
- 한국어로 작성
- 각 포인트는 한 문장으로 구성
- 노트의 핵심 내용만 포함
- 불필요한 세부사항 제외
`
      
      const geminiClient = GeminiClient.getInstance()
      const response = await geminiClient.generateText({
        prompt: SUMMARY_PROMPT,
        maxTokens: 500
      })
      
      if (!response.text) {
        throw new Error('요약 생성에 실패했습니다.')
      }
      
      // 실제 토큰 사용량을 포함한 결과 반환
      return {
        text: response.text,
        usage: response.usage
      }
    },
    content,
    { ...options, noteId, usageType: TokenUsageType.SUMMARY_GENERATION }
  )
}

// 태그 생성 래퍼
export async function generateTagsWithErrorHandling(
  noteId: string,
  content: string,
  options: Omit<AIProcessingOptions, 'noteId'> = {}
): Promise<AIProcessingResult<{ tags: string[]; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }>> {
  return processWithErrorHandling(
    async (processContent) => {
      // Gemini API 호출을 위한 동적 import
      const { GeminiClient } = await import('@/lib/ai/gemini-client')
      
      const TAG_PROMPT = `
다음 노트 내용을 분석하여 관련성 높은 태그를 3-6개 생성해주세요.

노트 내용:
${processContent}

태그 생성 규칙:
1. 한국어 키워드로만 구성
2. 각 태그는 1-3단어로 간결하게
3. 노트의 주제, 카테고리, 핵심 개념을 반영
4. 최대 6개까지만 생성
5. 중복 제거

출력 형식:
회의, 프로젝트, 아이디어, 계획, 업무, 개발

(쉼표로 구분된 태그 목록만 출력)
`
      
      const geminiClient = GeminiClient.getInstance()
      const response = await geminiClient.generateText({
        prompt: TAG_PROMPT,
        maxTokens: 200
      })
      
      if (!response.text) {
        throw new Error('태그 생성에 실패했습니다.')
      }
      
      // 태그 파싱
      const rawTags = response.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      if (rawTags.length === 0) {
        throw new Error('유효한 태그를 생성할 수 없습니다.')
      }
      
      // 실제 토큰 사용량을 포함한 결과 반환
      return {
        tags: rawTags,
        usage: response.usage
      }
    },
    content,
    { ...options, noteId, usageType: TokenUsageType.TAG_GENERATION }
  )
}

// 사용자별 에러 통계 추적
interface UserErrorStats {
  userId: string
  totalErrors: number
  errorsByType: Record<AIErrorType, number>
  lastErrorTime: Date
  consecutiveErrors: number
}

const userErrorStats = new Map<string, UserErrorStats>()

export function trackUserError(userId: string, error: AIError): void {
  const stats = userErrorStats.get(userId) || {
    userId,
    totalErrors: 0,
    errorsByType: {} as Record<AIErrorType, number>,
    lastErrorTime: new Date(),
    consecutiveErrors: 0
  }
  
  stats.totalErrors++
  stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1
  stats.lastErrorTime = new Date()
  stats.consecutiveErrors++
  
  userErrorStats.set(userId, stats)
  
  // 연속 에러가 많은 경우 경고 로그
  if (stats.consecutiveErrors >= 5) {
    console.warn(`User ${userId} has ${stats.consecutiveErrors} consecutive AI errors`)
  }
}

export function resetUserErrorCount(userId: string): void {
  const stats = userErrorStats.get(userId)
  if (stats) {
    stats.consecutiveErrors = 0
    userErrorStats.set(userId, stats)
  }
}

export function getUserErrorStats(userId: string): UserErrorStats | null {
  return userErrorStats.get(userId) || null
}
