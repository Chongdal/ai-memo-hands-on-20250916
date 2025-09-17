// lib/ai/types.ts
// AI 관련 타입 정의
// Gemini API와 AI 서비스의 공통 타입들을 정의
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/errors.ts, lib/ai/config.ts

/**
 * Gemini API 응답 타입
 */
export interface GeminiResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

/**
 * AI 텍스트 생성 요청 파라미터
 */
export interface TextGenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
}

/**
 * AI 텍스트 생성 응답
 */
export interface TextGenerationResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  latencyMs: number;
}

/**
 * AI 서비스 공통 인터페이스
 */
export interface AIService {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
  healthCheck(): Promise<boolean>;
}

/**
 * API 사용량 로그
 */
export interface APIUsageLog {
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  requestId?: string;
}

/**
 * AI 설정 인터페이스
 */
export interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeout: number;
  debug: boolean;
  rateLimitPerMinute: number;
}
