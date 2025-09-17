// app/test-gemini/page.tsx
// Gemini API 테스트 페이지
// API 호출 및 응답 상태를 확인하기 위한 테스트 인터페이스
// 관련 파일: lib/actions/gemini.ts, lib/ai/gemini-client.ts

import { Metadata } from 'next';
import GeminiTestClient from './test-client';

export const metadata: Metadata = {
  title: 'Gemini API 테스트 | AI 메모장',
  description: 'Gemini API 연동 상태 및 기능을 테스트합니다.',
};

export default function GeminiTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧪 Gemini API 테스트
            </h1>
            <p className="text-gray-600">
              Google Gemini API의 연동 상태와 기능을 테스트할 수 있습니다.
            </p>
          </div>

          <GeminiTestClient />
        </div>
      </div>
    </div>
  );
}
