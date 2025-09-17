// lib/ai/config.ts
// AI 서비스 설정 관리
// 환경별 설정을 관리하고 검증하는 함수들
// 관련 파일: lib/ai/gemini-client.ts, .env.local, .env.example

import { AIConfig } from './types';

/**
 * Gemini API 설정을 환경변수에서 로드
 */
export function getGeminiConfig(): AIConfig {
  const config: AIConfig = {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-001',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192', 10),
    timeout: parseInt(process.env.GEMINI_TIMEOUT_MS || '10000', 10),
    debug: process.env.NODE_ENV === 'development',
    rateLimitPerMinute: parseInt(process.env.GEMINI_RATE_LIMIT || '60', 10)
  };

  // 필수 설정 검증
  validateConfig(config);

  return config;
}

/**
 * 설정 유효성 검증
 */
export function validateConfig(config: AIConfig): void {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('GEMINI_API_KEY is required');
  }

  if (config.maxTokens <= 0 || config.maxTokens > 32768) {
    errors.push('GEMINI_MAX_TOKENS must be between 1 and 32768');
  }

  if (config.timeout <= 0 || config.timeout > 60000) {
    errors.push('GEMINI_TIMEOUT_MS must be between 1 and 60000');
  }

  if (config.rateLimitPerMinute <= 0 || config.rateLimitPerMinute > 1000) {
    errors.push('GEMINI_RATE_LIMIT must be between 1 and 1000');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid Gemini configuration: ${errors.join(', ')}`);
  }
}

/**
 * 환경별 설정 오버라이드
 */
export function getEnvironmentConfig(): Partial<AIConfig> {
  const env = process.env.NODE_ENV;

  switch (env) {
    case 'development':
      return {
        debug: true,
        timeout: 15000, // 개발 환경에서는 더 긴 타임아웃
        rateLimitPerMinute: 30 // 개발 환경에서는 더 보수적인 레이트 리미트
      };
    
    case 'test':
      return {
        debug: false,
        timeout: 5000, // 테스트 환경에서는 짧은 타임아웃
        rateLimitPerMinute: 10
      };
    
    case 'production':
      return {
        debug: false,
        timeout: 10000,
        rateLimitPerMinute: 60
      };
    
    default:
      return {};
  }
}

/**
 * 완전한 설정 객체 생성 (기본값 + 환경별 오버라이드)
 */
export function createGeminiConfig(): AIConfig {
  const baseConfig = getGeminiConfig();
  const envConfig = getEnvironmentConfig();
  
  return {
    ...baseConfig,
    ...envConfig
  };
}

/**
 * 설정이 올바르게 로드되었는지 확인
 */
export function isConfigured(): boolean {
  try {
    const config = getGeminiConfig();
    return !!config.apiKey;
  } catch {
    return false;
  }
}

/**
 * 디버그 모드에서 설정 정보 출력 (민감한 정보 제외)
 */
export function debugConfig(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const config = createGeminiConfig();
    console.log('[Gemini Config]', {
      model: config.model,
      maxTokens: config.maxTokens,
      timeout: config.timeout,
      debug: config.debug,
      rateLimitPerMinute: config.rateLimitPerMinute,
      apiKeyConfigured: !!config.apiKey
    });
  } catch (error) {
    console.error('[Gemini Config Error]', error);
  }
}
