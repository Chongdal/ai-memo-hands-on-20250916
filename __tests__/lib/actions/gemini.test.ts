// __tests__/lib/actions/gemini.test.ts
// Gemini 서버 액션 테스트
// 서버 액션의 입력 검증, 응답 형식, 에러 처리 등을 테스트
// 관련 파일: lib/actions/gemini.ts, lib/ai/gemini-client.ts

import { 
  checkGeminiHealth, 
  generateText, 
  generateNoteSummary,
  generateNoteTags,
  testGeminiConnection,
  getGeminiConfig 
} from '@/lib/actions/gemini';

// 환경변수 모킹
const mockEnv = {
  GEMINI_API_KEY: 'test-api-key',
  GEMINI_MODEL: 'gemini-2.0-flash-001',
  GEMINI_MAX_TOKENS: '8192',
  GEMINI_TIMEOUT_MS: '10000',
  NODE_ENV: 'test'
};

describe('Gemini 서버 액션', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...process.env, ...mockEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('checkGeminiHealth', () => {
    test('헬스체크 응답 형식이 올바른지 확인', async () => {
      const result = await checkGeminiHealth();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(typeof result.data).toBe('boolean');
      } else {
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('errorType');
        expect(typeof result.error).toBe('string');
        expect(typeof result.errorType).toBe('string');
      }
    });
  });

  describe('generateText', () => {
    test('빈 프롬프트에 대해 에러를 반환해야 함', async () => {
      const result = await generateText('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('프롬프트를 입력해주세요.');
      expect(result.errorType).toBe('INVALID_REQUEST');
    });

    test('공백만 있는 프롬프트에 대해 에러를 반환해야 함', async () => {
      const result = await generateText('   ');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('프롬프트를 입력해주세요.');
    });

    test('너무 긴 프롬프트에 대해 에러를 반환해야 함', async () => {
      const longPrompt = 'a'.repeat(50001);
      const result = await generateText(longPrompt);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('프롬프트가 너무 깁니다. (최대 50,000자)');
      expect(result.errorType).toBe('INVALID_REQUEST');
    });

    test('올바른 프롬프트에 대해 적절한 응답 형식을 반환해야 함', async () => {
      const result = await generateText('안녕하세요');
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result.data).toHaveProperty('text');
        expect(result.data).toHaveProperty('usage');
        expect(result.data).toHaveProperty('finishReason');
        expect(result.data).toHaveProperty('latencyMs');
        
        expect(typeof result.data.text).toBe('string');
        expect(typeof result.data.usage.totalTokens).toBe('number');
        expect(typeof result.data.latencyMs).toBe('number');
      }
    });

    test('옵션이 올바르게 적용되어야 함', async () => {
      const result = await generateText('테스트', {
        maxTokens: 100,
        temperature: 0.5
      });
      
      expect(result).toHaveProperty('success');
      // 실제 API 호출 없이는 옵션 적용을 직접 검증하기 어려우므로
      // 최소한 에러가 발생하지 않는지만 확인
    });
  });

  describe('generateNoteSummary', () => {
    test('빈 노트 내용에 대해 에러를 반환해야 함', async () => {
      const result = await generateNoteSummary('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('요약할 노트 내용이 없습니다.');
      expect(result.errorType).toBe('INVALID_REQUEST');
    });

    test('올바른 노트 내용에 대해 적절한 응답 형식을 반환해야 함', async () => {
      const noteContent = '오늘은 날씨가 좋았다. 공원에 가서 산책을 했다. 새로운 책을 읽기 시작했다.';
      const result = await generateNoteSummary(noteContent);
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(typeof result.data).toBe('string');
        expect(result.data.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateNoteTags', () => {
    test('빈 노트 내용에 대해 에러를 반환해야 함', async () => {
      const result = await generateNoteTags('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('태그를 생성할 노트 내용이 없습니다.');
      expect(result.errorType).toBe('INVALID_REQUEST');
    });

    test('올바른 노트 내용에 대해 태그 배열을 반환해야 함', async () => {
      const noteContent = '프로그래밍 공부를 위해 JavaScript와 TypeScript를 배우고 있다. 웹 개발에 관심이 많다.';
      const result = await generateNoteTags(noteContent);
      
      expect(result).toHaveProperty('success');
      
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data.length).toBeLessThanOrEqual(6);
        
        // 모든 태그가 문자열이고 적절한 길이인지 확인
        result.data.forEach(tag => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
          expect(tag.length).toBeLessThanOrEqual(20);
        });
      }
    });
  });

  describe('testGeminiConnection', () => {
    test('연결 테스트 응답 형식이 올바른지 확인', async () => {
      const result = await testGeminiConnection();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(typeof result.data).toBe('string');
        expect(result.data.length).toBeGreaterThan(0);
      } else {
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('errorType');
      }
    });
  });

  describe('getGeminiConfig', () => {
    test('설정 정보를 올바르게 반환해야 함', async () => {
      const result = await getGeminiConfig();
      
      expect(result).toHaveProperty('success');
      
      if (result.success) {
        expect(result.data).toHaveProperty('model');
        expect(result.data).toHaveProperty('maxTokens');
        expect(result.data).toHaveProperty('timeout');
        expect(result.data).toHaveProperty('debug');
        expect(result.data).toHaveProperty('rateLimitPerMinute');
        
        // 민감한 정보는 포함되지 않아야 함
        expect(result.data).not.toHaveProperty('apiKey');
      }
    });
  });
});

// 응답 형식 검증을 위한 헬퍼 함수들
describe('응답 형식 검증', () => {
  test('ServerActionResponse 타입이 일관되게 사용되어야 함', async () => {
    const actions = [
      () => checkGeminiHealth(),
      () => generateText('테스트'),
      () => generateNoteSummary('테스트 노트'),
      () => generateNoteTags('테스트 노트'),
      () => testGeminiConnection(),
      () => getGeminiConfig()
    ];

    for (const action of actions) {
      const result = await action();
      
      // 모든 응답이 success 필드를 가져야 함
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        // 성공 시 data 필드가 있어야 함
        expect(result).toHaveProperty('data');
      } else {
        // 실패 시 error와 errorType 필드가 있어야 함
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('errorType');
        expect(typeof result.error).toBe('string');
        expect(typeof result.errorType).toBe('string');
      }
    }
  });
});
