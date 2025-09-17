// lib/actions/gemini.ts
// Gemini API 관련 서버 액션
// Next.js Server Actions을 통한 안전한 AI API 접근
// 관련 파일: lib/ai/gemini-client.ts, app/api/health/route.ts

'use server';

import { GeminiClient } from '../ai/gemini-client';
import { GeminiError } from '../ai/errors';
import { TextGenerationRequest, TextGenerationResponse } from '../ai/types';

/**
 * 서버 액션 응답 타입
 */
export interface ServerActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: string;
}

/**
 * Gemini API 헬스체크
 */
export async function checkGeminiHealth(): Promise<ServerActionResponse<boolean>> {
  try {
    const client = GeminiClient.getInstance();
    const isHealthy = await client.healthCheck();
    
    return {
      success: true,
      data: isHealthy
    };
  } catch (error) {
    console.error('[Gemini Health Check Error]', error);
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.getUserFriendlyMessage() 
        : 'AI 서비스 상태 확인에 실패했습니다.',
      errorType: error instanceof GeminiError ? error.type : 'UNKNOWN'
    };
  }
}

/**
 * 텍스트 생성 (기본 테스트용)
 */
export async function generateText(
  prompt: string,
  options?: Partial<TextGenerationRequest>
): Promise<ServerActionResponse<TextGenerationResponse>> {
  try {
    // 입력 검증
    if (!prompt || prompt.trim().length === 0) {
      return {
        success: false,
        error: '프롬프트를 입력해주세요.',
        errorType: 'INVALID_REQUEST'
      };
    }

    if (prompt.length > 50000) {
      return {
        success: false,
        error: '프롬프트가 너무 깁니다. (최대 50,000자)',
        errorType: 'INVALID_REQUEST'
      };
    }

    const client = GeminiClient.getInstance();
    const request: TextGenerationRequest = {
      prompt: prompt.trim(),
      maxTokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      ...options
    };

    const response = await client.generateText(request);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('[Generate Text Error]', error);
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.getUserFriendlyMessage() 
        : 'AI 텍스트 생성에 실패했습니다.',
      errorType: error instanceof GeminiError ? error.type : 'UNKNOWN'
    };
  }
}

/**
 * 노트 요약 생성 (향후 구현용 스텁)
 */
export async function generateNoteSummary(
  noteContent: string
): Promise<ServerActionResponse<string>> {
  try {
    if (!noteContent || noteContent.trim().length === 0) {
      return {
        success: false,
        error: '요약할 노트 내용이 없습니다.',
        errorType: 'INVALID_REQUEST'
      };
    }

    // 요약을 위한 프롬프트 구성
    const prompt = `다음 노트 내용을 3-6개의 핵심 포인트로 요약해주세요. 각 포인트는 명확하고 간결하게 작성해주세요.

노트 내용:
${noteContent}

요약:`;

    const result = await generateText(prompt, {
      maxTokens: 500,
      temperature: 0.3 // 요약은 일관성이 중요하므로 낮은 temperature
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || '요약 생성에 실패했습니다.',
        errorType: result.errorType
      };
    }

    return {
      success: true,
      data: result.data.text
    };
  } catch (error) {
    console.error('[Generate Summary Error]', error);
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.getUserFriendlyMessage() 
        : '노트 요약 생성에 실패했습니다.',
      errorType: error instanceof GeminiError ? error.type : 'UNKNOWN'
    };
  }
}

/**
 * 노트 태그 생성 (향후 구현용 스텁)
 */
export async function generateNoteTags(
  noteContent: string
): Promise<ServerActionResponse<string[]>> {
  try {
    if (!noteContent || noteContent.trim().length === 0) {
      return {
        success: false,
        error: '태그를 생성할 노트 내용이 없습니다.',
        errorType: 'INVALID_REQUEST'
      };
    }

    // 태그 생성을 위한 프롬프트 구성
    const prompt = `다음 노트 내용을 분석하여 관련성 높은 태그를 최대 6개까지 생성해주세요. 
태그는 한국어로, 간단하고 명확하게 작성하며, 쉼표로 구분해주세요.

노트 내용:
${noteContent}

태그:`;

    const result = await generateText(prompt, {
      maxTokens: 200,
      temperature: 0.4
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || '태그 생성에 실패했습니다.',
        errorType: result.errorType
      };
    }

    // 생성된 텍스트에서 태그 추출
    const tagsText = result.data.text.trim();
    const tags = tagsText
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 20)
      .slice(0, 6); // 최대 6개로 제한

    return {
      success: true,
      data: tags
    };
  } catch (error) {
    console.error('[Generate Tags Error]', error);
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.getUserFriendlyMessage() 
        : '노트 태그 생성에 실패했습니다.',
      errorType: error instanceof GeminiError ? error.type : 'UNKNOWN'
    };
  }
}

/**
 * Gemini 클라이언트 설정 정보 반환 (디버깅용)
 */
export async function getGeminiConfig(): Promise<ServerActionResponse<{
  model: string
  maxTokens: number
  timeout: number
  debug: boolean
  rateLimitPerMinute: number
  apiKeyConfigured: boolean
}>> {
  try {
    const client = GeminiClient.getInstance();
    const config = client.getConfig();
    
    return {
      success: true,
      data: {
        ...config,
        apiKeyConfigured: !!process.env.GEMINI_API_KEY
      }
    };
  } catch (error) {
    console.error('[Get Config Error]', error);
    
    return {
      success: false,
      error: '설정 정보를 가져오는데 실패했습니다.',
      errorType: 'UNKNOWN'
    };
  }
}

/**
 * 간단한 연결 테스트
 */
export async function testGeminiConnection(): Promise<ServerActionResponse<string>> {
  try {
    const result = await generateText('안녕하세요! 간단히 인사해주세요.', {
      maxTokens: 50,
      temperature: 0.7
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || '연결 테스트에 실패했습니다.',
        errorType: result.errorType || 'UNKNOWN'
      };
    }

    return {
      success: true,
      data: result.data?.text || '연결 테스트 성공!'
    };
  } catch (error) {
    console.error('[Connection Test Error]', error);
    
    return {
      success: false,
      error: error instanceof GeminiError 
        ? error.getUserFriendlyMessage() 
        : 'AI 서비스 연결 테스트에 실패했습니다.',
      errorType: error instanceof GeminiError ? error.type : 'UNKNOWN'
    };
  }
}
