// lib/ai/gemini-client.ts
// Google Gemini API 클라이언트 래퍼 클래스
// API 연동, 에러 핸들링, 재시도 로직, 사용량 추적 등을 담당
// 관련 파일: lib/ai/types.ts, lib/ai/errors.ts, lib/ai/config.ts, lib/ai/utils.ts

import { GoogleGenAI } from '@google/genai';
import { 
  AIService, 
  TextGenerationRequest, 
  TextGenerationResponse, 
  APIUsageLog 
} from './types';
import { GeminiError, GeminiErrorType, parseGeminiError } from './errors';
import { createGeminiConfig, debugConfig } from './config';
import { 
  estimateTokens, 
  validateTokenLimit, 
  truncateToTokenLimit,
  withRetry, 
  logAPIUsage, 
  generateRequestId 
} from './utils';

/**
 * Google Gemini API 클라이언트 래퍼
 */
export class GeminiClient implements AIService {
  private client: GoogleGenAI;
  private config: ReturnType<typeof createGeminiConfig>;
  private static instance: GeminiClient | null = null;

  constructor() {
    try {
      this.config = createGeminiConfig();
      this.client = new GoogleGenAI({
        apiKey: this.config.apiKey
      });

      // 개발 환경에서 설정 정보 출력
      if (this.config.debug) {
        debugConfig();
      }
    } catch (error) {
      throw new GeminiError(
        GeminiErrorType.API_KEY_INVALID,
        'Failed to initialize Gemini client',
        error
      );
    }
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): GeminiClient {
    if (!GeminiClient.instance) {
      GeminiClient.instance = new GeminiClient();
    }
    return GeminiClient.instance;
  }

  /**
   * 헬스체크 - API 연결 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.generateText({
        prompt: 'Hello',
        maxTokens: 10
      });
      return !!result.text;
    } catch (error) {
      console.error('[Gemini Health Check] Failed:', error);
      return false;
    }
  }

  /**
   * 텍스트 생성
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    try {
      // 입력 검증
      this.validateRequest(request);

      // 토큰 제한 확인 및 조정
      const adjustedPrompt = this.adjustPromptForTokenLimit(request.prompt);
      const inputTokens = estimateTokens(adjustedPrompt);

      // 재시도 로직과 함께 API 호출
      const response = await withRetry(
        () => this.callGeminiAPI(adjustedPrompt, request),
        3, // 최대 3회 재시도
        1000 // 1초 백오프
      );

      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      const outputTokens = estimateTokens(response.text);

      const result: TextGenerationResponse = {
        text: response.text,
        usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens
        },
        finishReason: this.mapFinishReason(response.finishReason),
        latencyMs
      };

      // 사용량 로그 기록
      this.logUsage({
        timestamp: new Date(startTime),
        model: this.config.model,
        inputTokens,
        outputTokens,
        latencyMs,
        success: true,
        requestId
      });

      return result;

    } catch (error) {
      const endTime = Date.now();
      const latencyMs = endTime - startTime;

      // 에러 로그 기록
      this.logUsage({
        timestamp: new Date(startTime),
        model: this.config.model,
        inputTokens: estimateTokens(request.prompt),
        outputTokens: 0,
        latencyMs,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        requestId
      });

      throw parseGeminiError(error);
    }
  }

  /**
   * 실제 Gemini API 호출
   */
  private async callGeminiAPI(
    prompt: string, 
    request: TextGenerationRequest
  ): Promise<{ text: string; finishReason?: string }> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new GeminiError(
          GeminiErrorType.TIMEOUT,
          `Request timed out after ${this.config.timeout}ms`
        ));
      }, this.config.timeout);
    });

    const apiPromise = this.client.models.generateContent({
      model: this.config.model,
      contents: prompt,
      ...(request.temperature && { 
        generationConfig: { 
          temperature: request.temperature,
          ...(request.topK && { topK: request.topK }),
          ...(request.topP && { topP: request.topP }),
          ...(request.maxTokens && { maxOutputTokens: request.maxTokens })
        }
      })
    });

    try {
      const response = await Promise.race([apiPromise, timeoutPromise]) as {
        text: string
        finishReason?: string
      };
      
      if (!response || !response.text) {
        throw new GeminiError(
          GeminiErrorType.UNKNOWN,
          'Empty response from Gemini API'
        );
      }

      return {
        text: response.text,
        finishReason: response.finishReason
      };
    } catch (error: unknown) {
      // Gemini API 특정 에러 처리
      if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429) {
        throw new GeminiError(
          GeminiErrorType.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          error,
          429
        );
      }

      if ((error as { status?: number })?.status === 401 || (error as { status?: number })?.status === 403) {
        const statusCode = (error as { status: number }).status;
        throw new GeminiError(
          GeminiErrorType.API_KEY_INVALID,
          'Invalid API key',
          error,
          statusCode
        );
      }

      if ((error as { message?: string })?.message?.includes('content filtered')) {
        throw new GeminiError(
          GeminiErrorType.CONTENT_FILTERED,
          'Content was filtered by safety settings',
          error
        );
      }

      throw error;
    }
  }

  /**
   * 요청 검증
   */
  private validateRequest(request: TextGenerationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new GeminiError(
        GeminiErrorType.INVALID_REQUEST,
        'Prompt cannot be empty'
      );
    }

    if (request.maxTokens && (request.maxTokens <= 0 || request.maxTokens > 32768)) {
      throw new GeminiError(
        GeminiErrorType.INVALID_REQUEST,
        'maxTokens must be between 1 and 32768'
      );
    }

    if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
      throw new GeminiError(
        GeminiErrorType.INVALID_REQUEST,
        'temperature must be between 0 and 2'
      );
    }
  }

  /**
   * 토큰 제한에 맞게 프롬프트 조정
   */
  private adjustPromptForTokenLimit(prompt: string): string {
    const maxTokens = this.config.maxTokens;
    
    if (validateTokenLimit(estimateTokens(prompt), maxTokens)) {
      return prompt;
    }

    console.warn('[Gemini Client] Prompt too long, truncating...');
    return truncateToTokenLimit(prompt, maxTokens);
  }

  /**
   * Gemini API의 finishReason을 표준 형식으로 매핑
   */
  private mapFinishReason(reason?: string): TextGenerationResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * 사용량 로그 기록
   */
  private logUsage(log: APIUsageLog): void {
    logAPIUsage(log);
  }

  /**
   * 클라이언트 설정 정보 반환 (디버깅용)
   */
  getConfig() {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      timeout: this.config.timeout,
      debug: this.config.debug,
      rateLimitPerMinute: this.config.rateLimitPerMinute
    };
  }

  /**
   * 인스턴스 재설정 (테스트용)
   */
  static resetInstance(): void {
    GeminiClient.instance = null;
  }
}
