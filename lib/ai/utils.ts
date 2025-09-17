// lib/ai/utils.ts
// AI 서비스 관련 유틸리티 함수들
// 토큰 계산, 재시도 로직, 로깅 등의 공통 기능
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/types.ts, lib/ai/errors.ts

import { APIUsageLog } from './types';
import { GeminiError } from './errors';

/**
 * 텍스트의 대략적인 토큰 수 추정
 * @param text 분석할 텍스트
 * @returns 추정 토큰 수
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // 대략적인 계산: 1 토큰 ≈ 4 문자 (한국어/영어 혼합 기준)
  // 실제로는 더 복잡하지만 추정치로 사용
  return Math.ceil(text.length / 4);
}

/**
 * 토큰 제한 검증
 * @param inputTokens 입력 토큰 수
 * @param maxTokens 최대 허용 토큰 수
 * @returns 제한 내인지 여부
 */
export function validateTokenLimit(
  inputTokens: number,
  maxTokens: number = 8192
): boolean {
  // 응답용 토큰도 고려하여 여유분 확보 (약 25%)
  const reservedTokens = Math.floor(maxTokens * 0.25);
  return inputTokens <= maxTokens - reservedTokens;
}

/**
 * 토큰 제한 초과 시 텍스트 자르기
 * @param text 원본 텍스트
 * @param maxTokens 최대 토큰 수
 * @returns 제한 내로 잘린 텍스트
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number = 8192
): string {
  const estimatedTokens = estimateTokens(text);
  
  if (validateTokenLimit(estimatedTokens, maxTokens)) {
    return text;
  }

  // 안전 여유분을 고려한 최대 문자 수 계산
  const reservedTokens = Math.floor(maxTokens * 0.25);
  const maxChars = (maxTokens - reservedTokens) * 4;
  
  if (text.length <= maxChars) {
    return text;
  }

  // 문장 단위로 자르기 시도
  const truncated = text.substring(0, maxChars);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('。') // 한국어 마침표
  );

  if (lastSentenceEnd > maxChars * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // 문장 경계를 찾지 못한 경우 단순 자르기
  return truncated + '...';
}

/**
 * 재시도 로직을 포함한 함수 실행
 * @param operation 실행할 함수
 * @param maxRetries 최대 재시도 횟수
 * @param backoffMs 기본 백오프 시간 (ms)
 * @returns 함수 실행 결과
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // GeminiError인 경우 재시도 가능 여부 확인
      if (error instanceof GeminiError && !error.isRetryable()) {
        throw error;
      }

      // 마지막 시도인 경우 에러 던지기
      if (attempt >= maxRetries) {
        break;
      }

      // 지수 백오프로 대기
      const waitTime = backoffMs * Math.pow(2, attempt - 1);
      await sleep(waitTime);

      console.warn(`[Retry ${attempt}/${maxRetries}] Operation failed, retrying in ${waitTime}ms...`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  throw lastError!;
}

/**
 * 지정된 시간만큼 대기
 * @param ms 대기 시간 (밀리초)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API 사용량 로그 기록
 * @param log 로그 데이터
 */
export function logAPIUsage(log: APIUsageLog): void {
  const logData = {
    timestamp: log.timestamp.toISOString(),
    model: log.model,
    inputTokens: log.inputTokens,
    outputTokens: log.outputTokens,
    totalTokens: log.inputTokens + log.outputTokens,
    latencyMs: log.latencyMs,
    success: log.success,
    error: log.error,
    requestId: log.requestId
  };

  // 개발 환경에서는 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('[Gemini API Usage]', logData);
  }

  // 프로덕션에서는 실제 로깅 시스템으로 전송
  // TODO: 로깅 시스템 연동 (예: Winston, Sentry 등)
  if (process.env.NODE_ENV === 'production') {
    // 실제 로깅 시스템에 전송하는 로직 구현 예정
  }
}

/**
 * 에러가 재시도 불가능한 타입인지 확인
 * @param error 확인할 에러
 * @returns 재시도 불가능 여부
 */
export function isNonRetryableError(error: unknown): boolean {
  if (error instanceof GeminiError) {
    return !error.isRetryable();
  }

  // 일반적인 재시도 불가능한 에러들
  const nonRetryableMessages = [
    'invalid api key',
    'quota exceeded',
    'content filtered',
    'invalid request'
  ];

  const errorMessage = ((error as { message?: string })?.message || '').toLowerCase();
  return nonRetryableMessages.some(msg => errorMessage.includes(msg));
}

/**
 * 요청 ID 생성 (로깅 및 추적용)
 * @returns 고유 요청 ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `gemini_${timestamp}_${random}`;
}

/**
 * 안전한 JSON 파싱
 * @param jsonString JSON 문자열
 * @param fallback 파싱 실패 시 반환할 기본값
 * @returns 파싱된 객체 또는 기본값
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * 민감한 정보를 마스킹
 * @param text 마스킹할 텍스트
 * @param visibleChars 보여줄 문자 수 (시작과 끝)
 * @returns 마스킹된 텍스트
 */
export function maskSensitiveData(text: string, visibleChars: number = 4): string {
  if (!text || text.length <= visibleChars * 2) {
    return '*'.repeat(text.length);
  }

  const start = text.substring(0, visibleChars);
  const end = text.substring(text.length - visibleChars);
  const middle = '*'.repeat(text.length - visibleChars * 2);

  return `${start}${middle}${end}`;
}
