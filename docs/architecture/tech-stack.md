# 기술 스택 - AI 메모장

## 프론트엔드

### 프레임워크 & 라이브러리
- **Next.js 14+** - React 기반 풀스택 프레임워크
  - App Router 사용 (Pages Router 사용 금지)
  - Server Actions 활용
  - Server Components와 Client Components 적절히 분리
- **React 18+** - UI 라이브러리
- **TypeScript 5+** - 타입 안전성 보장

### UI & 스타일링
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트 라이브러리
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **Radix UI** - 접근성이 좋은 헤드리스 UI 컴포넌트
- **Lucide React** - 아이콘 라이브러리

### 상태 관리
- **React Hooks** (useState, useEffect, useContext 등)
- **Server Actions** - 서버 상태 관리
- **Optimistic Updates** - 사용자 경험 향상

---

## 백엔드

### 서버 환경
- **Next.js API Routes** - API 엔드포인트
- **Server Actions** - 서버 로직 처리
- **Node.js** - 런타임 환경

### 데이터베이스
- **Supabase Postgres** - 관계형 데이터베이스
- **Drizzle ORM** - 타입 안전한 ORM
  - 스키마 정의: `lib/db/schema.ts`
  - 마이그레이션 관리
  - 타입 추론 지원

### 인증
- **Supabase Auth** - 사용자 인증 및 세션 관리
  - 이메일/비밀번호 인증
  - 세션 관리
  - 권한 제어

---

## AI & 외부 서비스

### AI 서비스
- **Google Gemini API** - 텍스트 생성 및 분석
  - 요약 생성
  - 태그 생성
  - 토큰 사용량 관리

### 외부 API 통합
- **서버 사이드에서만 호출** - 보안 강화
- **에러 핸들링 및 재시도 로직** 구현
- **Rate Limiting** 적용

---

## 개발 도구

### 패키지 매니저
- **pnpm** - 빠르고 효율적인 패키지 매니저

### 개발 환경
- **TypeScript** - 정적 타입 검사
- **ESLint** - 코드 품질 검사
- **Prettier** - 코드 포맷팅
- **Tailwind CSS IntelliSense** - CSS 자동완성

### 테스트
- **Jest** - 테스트 프레임워크
- **@testing-library/react** - React 컴포넌트 테스트
- **@testing-library/jest-dom** - DOM 테스트 유틸리티

---

## 배포 & 호스팅

### 호스팅
- **Vercel** - 프론트엔드 및 API 배포
  - 자동 배포 (Git 연동)
  - Preview 환경 제공
  - Edge Functions 지원

### 데이터베이스 호스팅
- **Supabase Cloud** - 관리형 PostgreSQL
  - 자동 백업
  - 실시간 기능
  - 대시보드 제공

---

## 모니터링 & 분석

### 에러 추적
- **Console Logging** (개발 환경)
- **Sentry** (프로덕션 - 선택사항)

### 성능 모니터링
- **Vercel Analytics** - 웹 성능 분석
- **Next.js Built-in Analytics** - Core Web Vitals

---

## 환경 변수

### 필수 환경 변수
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash-001
GEMINI_MAX_TOKENS=8192
GEMINI_TIMEOUT_MS=10000

# 개발 환경
NODE_ENV=development
```

---

## 의존성 관리

### 주요 의존성
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "drizzle-orm": "^0.29.0",
    "@google/genai": "^1.20.0",
    "tailwindcss": "^3.0.0",
    "@radix-ui/react-*": "^1.0.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^13.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0"
  }
}
```

---

## 버전 관리

### Node.js 버전
- **Node.js 18+** 권장
- **pnpm 8+** 권장

### 브라우저 지원
- **Chrome** 90+
- **Firefox** 90+
- **Safari** 14+
- **Edge** 90+

---

## 보안 고려사항

### API 보안
- 모든 외부 API 호출은 서버 사이드에서만 실행
- API 키는 환경변수로 관리
- Rate Limiting 적용

### 데이터 보안
- 사용자별 데이터 격리
- SQL Injection 방지 (Drizzle ORM 사용)
- XSS 방지 (React의 기본 보안 기능 활용)

### 인증 보안
- JWT 토큰 기반 인증
- HTTPS 강제 사용
- 세션 만료 관리
