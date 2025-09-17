// lib/ai/errors.ts
// AI 서비스 에러 타입 및 클래스 정의
// Gemini API 에러를 구조화하고 적절한 에러 핸들링을 위한 타입들
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/utils.ts

/**
 * Gemini API 에러 타입
 */
export enum GeminiErrorType {
  API_KEY_INVALID = 'API_KEY_INVALID',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Gemini API 에러 클래스
 */
export class GeminiError extends Error {
  constructor(
    public type: GeminiErrorType,
    message: string,
    public originalError?: Error | unknown,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GeminiError';
  }

  /**
   * 에러가 재시도 가능한지 확인
   */
  isRetryable(): boolean {
    const retryableTypes = [
      GeminiErrorType.NETWORK_ERROR,
      GeminiErrorType.TIMEOUT,
      GeminiErrorType.RATE_LIMIT_EXCEEDED
    ];
    return retryableTypes.includes(this.type);
  }

  /**
   * 사용자 친화적인 에러 메시지 반환
   */
  getUserFriendlyMessage(): string {
    switch (this.type) {
      case GeminiErrorType.API_KEY_INVALID:
        return 'AI 서비스 인증에 실패했습니다.';
      case GeminiErrorType.QUOTA_EXCEEDED:
        return 'AI 서비스 사용량이 초과되었습니다.';
      case GeminiErrorType.TIMEOUT:
        return 'AI 서비스 응답 시간이 초과되었습니다.';
      case GeminiErrorType.CONTENT_FILTERED:
        return '요청한 내용이 정책에 위배되어 처리할 수 없습니다.';
      case GeminiErrorType.NETWORK_ERROR:
        return '네트워크 연결에 문제가 있습니다.';
      case GeminiErrorType.RATE_LIMIT_EXCEEDED:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case GeminiErrorType.INVALID_REQUEST:
        return '잘못된 요청입니다.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  }
}

/**
 * HTTP 상태 코드를 기반으로 에러 타입 결정
 */
export function getErrorTypeFromStatus(statusCode: number): GeminiErrorType {
  switch (statusCode) {
    case 401:
    case 403:
      return GeminiErrorType.API_KEY_INVALID;
    case 429:
      return GeminiErrorType.RATE_LIMIT_EXCEEDED;
    case 400:
      return GeminiErrorType.INVALID_REQUEST;
    case 413:
      return GeminiErrorType.QUOTA_EXCEEDED;
    default:
      return GeminiErrorType.UNKNOWN;
  }
}

/**
 * 원시 에러를 GeminiError로 변환
 */
export function parseGeminiError(error: Error | unknown): GeminiError {
  if (error instanceof GeminiError) {
    return error;
  }

  // 네트워크 에러
  if ((error as { code?: string })?.code === 'ECONNREFUSED' || (error as { code?: string })?.code === 'ENOTFOUND') {
    return new GeminiError(
      GeminiErrorType.NETWORK_ERROR,
      '네트워크 연결 실패',
      error
    );
  }

  // 타임아웃 에러
  if ((error as { code?: string })?.code === 'ETIMEDOUT' || (error as { name?: string })?.name === 'TimeoutError') {
    return new GeminiError(
      GeminiErrorType.TIMEOUT,
      '요청 시간 초과',
      error
    );
  }

  // HTTP 상태 코드 기반 에러
  if ((error as { status?: number })?.status || (error as { statusCode?: number })?.statusCode) {
    const statusCode = (error as { status?: number })?.status || (error as { statusCode?: number })?.statusCode;
    if (statusCode) {
      const errorType = getErrorTypeFromStatus(statusCode);
      const errorMessage = (error as { message?: string })?.message || '알 수 없는 오류';
      return new GeminiError(
        errorType,
        errorMessage,
        error,
        statusCode
      );
    }
  }

  // 기본 에러
  const errorMessage = (error as { message?: string })?.message || '알 수 없는 오류가 발생했습니다.';
  return new GeminiError(
    GeminiErrorType.UNKNOWN,
    errorMessage,
    error
  );
}
