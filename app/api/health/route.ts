// app/api/health/route.ts
// 시스템 헬스체크 API 엔드포인트
// 데이터베이스, Gemini API 등 외부 서비스 상태 확인
// 관련 파일: lib/actions/gemini.ts, lib/ai/gemini-client.ts

import { NextResponse } from 'next/server';
import { checkGeminiHealth } from '@/lib/actions/gemini';

/**
 * 헬스체크 응답 타입
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    gemini: {
      status: 'up' | 'down';
      responseTimeMs?: number;
      error?: string;
    };
    database: {
      status: 'up' | 'down';
      responseTimeMs?: number;
      error?: string;
    };
  };
  version: string;
  uptime: number;
}

/**
 * GET /api/health
 * 시스템 헬스체크
 */
export async function GET() {
  // const startTime = Date.now() // 사용하지 않음;
  
  try {
    // Gemini API 상태 확인
    const geminiStartTime = Date.now();
    const geminiHealthResult = await checkGeminiHealth();
    const geminiResponseTime = Date.now() - geminiStartTime;

    // 데이터베이스 상태 확인 (간단한 체크)
    const dbStartTime = Date.now();
    let dbStatus: 'up' | 'down' = 'up';
    let dbError: string | undefined;
    let dbResponseTime: number;

    try {
      // 간단한 DB 연결 테스트 (실제로는 DB 쿼리를 실행해야 함)
      // 현재는 환경변수 존재 여부만 확인
      if (!process.env.DATABASE_URL) {
        throw new Error('Database URL not configured');
      }
      dbResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      dbStatus = 'down';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
      dbResponseTime = Date.now() - dbStartTime;
    }

    // 전체 상태 결정
    let overallStatus: HealthCheckResponse['status'] = 'healthy';
    
    if (!geminiHealthResult.success || dbStatus === 'down') {
      overallStatus = 'unhealthy';
    } else if (geminiResponseTime > 5000 || dbResponseTime > 1000) {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        gemini: {
          status: geminiHealthResult.success ? 'up' : 'down',
          responseTimeMs: geminiResponseTime,
          ...(geminiHealthResult.error && { error: geminiHealthResult.error })
        },
        database: {
          status: dbStatus,
          responseTimeMs: dbResponseTime,
          ...(dbError && { error: dbError })
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };

    // 상태에 따른 HTTP 상태 코드 결정
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: httpStatus });

  } catch (error) {
    console.error('[Health Check Error]', error);
    
    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        gemini: {
          status: 'down',
          error: 'Health check failed'
        },
        database: {
          status: 'down',
          error: 'Health check failed'
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

/**
 * HEAD /api/health
 * 간단한 헬스체크 (응답 본문 없음)
 */
export async function HEAD() {
  try {
    const geminiResult = await checkGeminiHealth();
    const status = geminiResult.success ? 200 : 503;
    return new NextResponse(null, { status });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
