// app/test-gemini/test-client.tsx
// Gemini API 테스트 클라이언트 컴포넌트
// 실제 API 호출 테스트 및 응답 확인 기능
// 관련 파일: lib/actions/gemini.ts, components/ui/button.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  checkGeminiHealth,
  generateText,
  generateNoteSummary,
  generateNoteTags,
  testGeminiConnection,
  getGeminiConfig
} from '@/lib/actions/gemini';

interface TestResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorType?: string;
  duration?: number;
}

export default function GeminiTestClient() {
  const [healthResult, setHealthResult] = useState<TestResult | null>(null);
  const [textResult, setTextResult] = useState<TestResult | null>(null);
  const [summaryResult, setSummaryResult] = useState<TestResult | null>(null);
  const [tagsResult, setTagsResult] = useState<TestResult | null>(null);
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [configResult, setConfigResult] = useState<TestResult | null>(null);
  
  const [textPrompt, setTextPrompt] = useState('안녕하세요! 간단한 인사말을 해주세요.');
  const [noteContent, setNoteContent] = useState(`오늘은 프로그래밍 공부를 했다. 
JavaScript와 TypeScript의 차이점에 대해 학습했고, 
Next.js를 사용한 웹 애플리케이션 개발 방법을 익혔다. 
특히 Server Actions의 활용법이 인상적이었다.
내일은 데이터베이스 연동을 공부할 예정이다.`);

  const [loading, setLoading] = useState<string | null>(null);

  const runTest = async (
    testName: string,
    testFunction: () => Promise<unknown>,
    setResult: (result: TestResult) => void
  ) => {
    setLoading(testName);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      setResult({
        success: true,
        data: result,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        duration
      });
    } finally {
      setLoading(null);
    }
  };

  const TestResultCard = ({ 
    title, 
    result, 
    onTest, 
    testKey 
  }: { 
    title: string;
    result: TestResult | null;
    onTest: () => void;
    testKey: string;
  }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Button
          onClick={onTest}
          disabled={loading === testKey}
          className="min-w-[80px]"
        >
          {loading === testKey ? '테스트 중...' : '테스트'}
        </Button>
      </div>
      
      {result && (
        <div className={`p-3 rounded-md border ${
          result.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ 성공' : '❌ 실패'}
            </span>
            {result.duration && (
              <span className="text-xs text-gray-500">
                ({result.duration}ms)
              </span>
            )}
          </div>
          
          {result.success && result.data !== undefined && (
            <div className="text-sm text-gray-700">
              <strong>응답:</strong>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {typeof result.data === 'string' 
                  ? result.data 
                  : JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
          
          {!result.success && result.error && (
            <div className="text-sm text-red-700">
              <strong>에러:</strong> {result.error}
              {result.errorType && (
                <div className="text-xs mt-1">
                  <strong>타입:</strong> {result.errorType}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헬스체크 테스트 */}
      <TestResultCard
        title="🏥 헬스체크"
        result={healthResult}
        testKey="health"
        onTest={() => runTest('health', checkGeminiHealth, setHealthResult)}
      />

      {/* 연결 테스트 */}
      <TestResultCard
        title="🔗 연결 테스트"
        result={connectionResult}
        testKey="connection"
        onTest={() => runTest('connection', testGeminiConnection, setConnectionResult)}
      />

      {/* 설정 정보 테스트 */}
      <TestResultCard
        title="⚙️ 설정 정보"
        result={configResult}
        testKey="config"
        onTest={() => runTest('config', getGeminiConfig, setConfigResult)}
      />

      {/* 텍스트 생성 테스트 */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">💬 텍스트 생성</h3>
          <Button
            onClick={() => runTest('text', () => generateText(textPrompt), setTextResult)}
            disabled={loading === 'text'}
            className="min-w-[80px]"
          >
            {loading === 'text' ? '생성 중...' : '생성'}
          </Button>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            프롬프트:
          </label>
          <textarea
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={2}
            placeholder="테스트할 프롬프트를 입력하세요..."
          />
        </div>
        
        {textResult && (
          <div className={`p-3 rounded-md border ${
            textResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${
                textResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {textResult.success ? '✅ 성공' : '❌ 실패'}
              </span>
              {textResult.duration && (
                <span className="text-xs text-gray-500">
                  ({textResult.duration}ms)
                </span>
              )}
            </div>
            
            {textResult.success && textResult.data ? (
              <div className="text-sm text-gray-700">
                <div className="mb-2">
                  <strong>생성된 텍스트:</strong>
                  <div className="mt-1 p-2 bg-white rounded border">
                    {(textResult.data as { text?: string })?.text || 'N/A'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-4">
                  <div>토큰 사용량: {(textResult.data as { usage?: { totalTokens?: number } })?.usage?.totalTokens || 'N/A'}</div>
                  <div>완료 이유: {(textResult.data as { finishReason?: string })?.finishReason || 'N/A'}</div>
                </div>
              </div>
            ) : null}
            
            {!textResult.success && textResult.error && (
              <div className="text-sm text-red-700">
                <strong>에러:</strong> {textResult.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 노트 요약 테스트 */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">📝 노트 요약</h3>
          <Button
            onClick={() => runTest('summary', () => generateNoteSummary(noteContent), setSummaryResult)}
            disabled={loading === 'summary'}
            className="min-w-[80px]"
          >
            {loading === 'summary' ? '요약 중...' : '요약'}
          </Button>
        </div>
        
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            노트 내용:
          </label>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={4}
            placeholder="요약할 노트 내용을 입력하세요..."
          />
        </div>
        
        {summaryResult && (
          <div className={`p-3 rounded-md border ${
            summaryResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${
                summaryResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {summaryResult.success ? '✅ 성공' : '❌ 실패'}
              </span>
              {summaryResult.duration && (
                <span className="text-xs text-gray-500">
                  ({summaryResult.duration}ms)
                </span>
              )}
            </div>
            
            {summaryResult.success && summaryResult.data ? (
              <div className="text-sm text-gray-700">
                <strong>생성된 요약:</strong>
                <div className="mt-1 p-2 bg-white rounded border">
                  {String(summaryResult.data)}
                </div>
              </div>
            ) : null}
            
            {!summaryResult.success && summaryResult.error && (
              <div className="text-sm text-red-700">
                <strong>에러:</strong> {summaryResult.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 태그 생성 테스트 */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">🏷️ 태그 생성</h3>
          <Button
            onClick={() => runTest('tags', () => generateNoteTags(noteContent), setTagsResult)}
            disabled={loading === 'tags'}
            className="min-w-[80px]"
          >
            {loading === 'tags' ? '생성 중...' : '생성'}
          </Button>
        </div>
        
        {tagsResult && (
          <div className={`p-3 rounded-md border ${
            tagsResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-medium ${
                tagsResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {tagsResult.success ? '✅ 성공' : '❌ 실패'}
              </span>
              {tagsResult.duration && (
                <span className="text-xs text-gray-500">
                  ({tagsResult.duration}ms)
                </span>
              )}
            </div>
            
            {tagsResult.success && tagsResult.data ? (
              <div className="text-sm text-gray-700">
                <strong>생성된 태그:</strong>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(tagsResult.data as string[]).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            
            {!tagsResult.success && tagsResult.error && (
              <div className="text-sm text-red-700">
                <strong>에러:</strong> {tagsResult.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 전체 테스트 실행 */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={async () => {
            await runTest('health', checkGeminiHealth, setHealthResult);
            await new Promise(resolve => setTimeout(resolve, 500));
            await runTest('connection', testGeminiConnection, setConnectionResult);
            await new Promise(resolve => setTimeout(resolve, 500));
            await runTest('config', getGeminiConfig, setConfigResult);
            await new Promise(resolve => setTimeout(resolve, 500));
            await runTest('text', () => generateText(textPrompt), setTextResult);
            await new Promise(resolve => setTimeout(resolve, 500));
            await runTest('summary', () => generateNoteSummary(noteContent), setSummaryResult);
            await new Promise(resolve => setTimeout(resolve, 500));
            await runTest('tags', () => generateNoteTags(noteContent), setTagsResult);
          }}
          disabled={loading !== null}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? '테스트 실행 중...' : '🚀 모든 테스트 실행'}
        </Button>
      </div>
    </div>
  );
}
