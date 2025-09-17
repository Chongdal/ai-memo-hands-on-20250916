// __tests__/lib/ai/gemini-client.test.ts
// Gemini 클라이언트 단위 테스트
// 클라이언트 초기화, 에러 핸들링, 토큰 관리 등을 테스트
// 관련 파일: lib/ai/gemini-client.ts, lib/ai/utils.ts, lib/ai/errors.ts

import { GeminiClient } from '@/lib/ai/gemini-client';
import { GeminiError, GeminiErrorType } from '@/lib/ai/errors';
import { estimateTokens, validateTokenLimit } from '@/lib/ai/utils';

// 환경변수 모킹
const mockEnv = {
  GEMINI_API_KEY: 'test-api-key',
  GEMINI_MODEL: 'gemini-2.0-flash-001',
  GEMINI_MAX_TOKENS: '8192',
  GEMINI_TIMEOUT_MS: '10000',
  NODE_ENV: 'test'
};

describe('GeminiClient', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...process.env, ...mockEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    // 각 테스트마다 싱글톤 인스턴스 리셋
    GeminiClient.resetInstance();
  });

  describe('초기화', () => {
    test('올바른 설정으로 클라이언트가 초기화되어야 함', () => {
      const client = new GeminiClient();
      expect(client).toBeDefined();
      
      const config = client.getConfig();
      expect(config.model).toBe('gemini-2.0-flash-001');
      expect(config.maxTokens).toBe(8192);
      expect(config.timeout).toBe(10000);
    });

    test('API 키가 없으면 에러가 발생해야 함', () => {
      delete process.env.GEMINI_API_KEY;
      
      expect(() => {
        new GeminiClient();
      }).toThrow(GeminiError);
      
      // 환경변수 복원
      process.env.GEMINI_API_KEY = mockEnv.GEMINI_API_KEY;
    });

    test('싱글톤 패턴이 정상 작동해야 함', () => {
      const client1 = GeminiClient.getInstance();
      const client2 = GeminiClient.getInstance();
      
      expect(client1).toBe(client2);
    });
  });

  describe('요청 검증', () => {
    let client: GeminiClient;

    beforeEach(() => {
      client = new GeminiClient();
    });

    test('빈 프롬프트는 에러가 발생해야 함', async () => {
      await expect(client.generateText({
        prompt: ''
      })).rejects.toThrow(GeminiError);

      await expect(client.generateText({
        prompt: '   '
      })).rejects.toThrow(GeminiError);
    });

    test('잘못된 maxTokens 값은 에러가 발생해야 함', async () => {
      await expect(client.generateText({
        prompt: 'test',
        maxTokens: 0
      })).rejects.toThrow(GeminiError);

      await expect(client.generateText({
        prompt: 'test',
        maxTokens: 100000
      })).rejects.toThrow(GeminiError);
    });

    test('잘못된 temperature 값은 에러가 발생해야 함', async () => {
      await expect(client.generateText({
        prompt: 'test',
        temperature: -1
      })).rejects.toThrow(GeminiError);

      await expect(client.generateText({
        prompt: 'test',
        temperature: 3
      })).rejects.toThrow(GeminiError);
    });
  });

  describe('토큰 관리', () => {
    test('토큰 수 추정이 정상 작동해야 함', () => {
      expect(estimateTokens('')).toBe(0);
      expect(estimateTokens('hello')).toBe(2); // 5글자 / 4 = 1.25 -> 2
      expect(estimateTokens('a'.repeat(100))).toBe(25); // 100글자 / 4 = 25
    });

    test('토큰 제한 검증이 정상 작동해야 함', () => {
      expect(validateTokenLimit(1000, 8192)).toBe(true);
      expect(validateTokenLimit(7000, 8192)).toBe(false); // 여유분 고려하면 초과
      expect(validateTokenLimit(6000, 8192)).toBe(true);
    });
  });

  describe('에러 처리', () => {
    test('GeminiError의 재시도 가능 여부가 올바르게 판단되어야 함', () => {
      const retryableError = new GeminiError(
        GeminiErrorType.NETWORK_ERROR,
        'Network error'
      );
      expect(retryableError.isRetryable()).toBe(true);

      const nonRetryableError = new GeminiError(
        GeminiErrorType.API_KEY_INVALID,
        'Invalid API key'
      );
      expect(nonRetryableError.isRetryable()).toBe(false);
    });

    test('사용자 친화적인 에러 메시지가 반환되어야 함', () => {
      const error = new GeminiError(
        GeminiErrorType.QUOTA_EXCEEDED,
        'Quota exceeded'
      );
      
      expect(error.getUserFriendlyMessage()).toBe(
        'AI 서비스 사용량이 초과되었습니다.'
      );
    });
  });

  describe('설정 관리', () => {
    test('설정 정보가 올바르게 반환되어야 함', () => {
      const client = new GeminiClient();
      const config = client.getConfig();

      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('debug');
      expect(config).toHaveProperty('rateLimitPerMinute');
    });

    test('민감한 정보는 설정에서 제외되어야 함', () => {
      const client = new GeminiClient();
      const config = client.getConfig();

      expect(config).not.toHaveProperty('apiKey');
    });
  });
});

describe('유틸리티 함수', () => {
  describe('estimateTokens', () => {
    test('다양한 텍스트 길이에 대해 올바른 토큰 수를 추정해야 함', () => {
      expect(estimateTokens('안녕하세요')).toBe(2); // 5글자
      expect(estimateTokens('Hello World')).toBe(3); // 11글자
      expect(estimateTokens('a'.repeat(1000))).toBe(250); // 1000글자
    });

    test('빈 문자열은 0 토큰이어야 함', () => {
      expect(estimateTokens('')).toBe(0);
      expect(estimateTokens('   ')).toBe(1); // 공백도 문자로 계산
    });
  });

  describe('validateTokenLimit', () => {
    test('여유분을 고려한 토큰 제한 검증이 정상 작동해야 함', () => {
      const maxTokens = 1000;
      const reservedTokens = Math.floor(maxTokens * 0.25); // 250

      expect(validateTokenLimit(700, maxTokens)).toBe(true); // 700 < 750
      expect(validateTokenLimit(800, maxTokens)).toBe(false); // 800 > 750
    });
  });
});

// 통합 테스트용 (실제 API 호출)
describe('Gemini API 통합 테스트', () => {
  // 실제 API 키가 있을 때만 실행
  const hasRealApiKey = process.env.GEMINI_API_KEY && 
                       process.env.GEMINI_API_KEY !== 'test-api-key';

  test.skipIf(!hasRealApiKey)('실제 API 호출이 성공해야 함', async () => {
    const client = GeminiClient.getInstance();
    
    const response = await client.generateText({
      prompt: '안녕하세요! 간단히 인사해주세요.',
      maxTokens: 50
    });

    expect(response).toBeDefined();
    expect(response.text).toBeTruthy();
    expect(typeof response.text).toBe('string');
    expect(response.usage.totalTokens).toBeGreaterThan(0);
    expect(response.latencyMs).toBeGreaterThan(0);
  }, 15000); // 15초 타임아웃

  test.skipIf(!hasRealApiKey)('헬스체크가 성공해야 함', async () => {
    const client = GeminiClient.getInstance();
    
    const isHealthy = await client.healthCheck();
    expect(isHealthy).toBe(true);
  }, 10000);
});
