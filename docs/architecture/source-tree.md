# 소스 트리 구조 - AI 메모장

## 프로젝트 루트 구조

```
ai-memo-hands-on-bmad-setup-4/
├── app/                          # Next.js App Router 디렉토리
├── components/                   # 재사용 가능한 React 컴포넌트
├── lib/                         # 유틸리티, 액션, 설정 등
├── hooks/                       # 커스텀 React 훅
├── __tests__/                   # 테스트 파일
├── docs/                        # 프로젝트 문서
├── public/                      # 정적 파일
├── drizzle/                     # 데이터베이스 마이그레이션 (생성 예정)
└── 설정 파일들
```

---

## `/app` 디렉토리 (Next.js App Router)

```
app/
├── favicon.ico                  # 파비콘
├── globals.css                  # 전역 스타일
├── layout.tsx                   # 루트 레이아웃
├── page.tsx                     # 홈페이지
├── api/                         # API 라우트
│   └── health/
│       └── route.ts            # 헬스체크 API
├── notes/                       # 노트 관련 페이지
│   ├── page.tsx                # 노트 목록 페이지
│   ├── notes-page-client.tsx   # 노트 목록 클라이언트 컴포넌트
│   ├── new/
│   │   └── page.tsx           # 새 노트 작성 페이지
│   └── [id]/                  # 동적 라우트 (노트 상세)
│       ├── page.tsx           # 노트 상세 페이지
│       ├── note-detail-client.tsx
│       ├── not-found.tsx      # 404 페이지
│       └── edit/
│           └── page.tsx       # 노트 편집 페이지
├── signin/                     # 로그인 페이지
│   └── page.tsx
├── signup/                     # 회원가입 페이지
│   └── page.tsx
├── forgot-password/            # 비밀번호 찾기
├── reset-password/            # 비밀번호 재설정
│   └── page.tsx
├── onboarding/                # 온보딩 페이지
│   └── page.tsx
└── test-gemini/               # Gemini API 테스트 페이지
    ├── page.tsx
    └── test-client.tsx
```

---

## `/components` 디렉토리

```
components/
├── ui/                         # shadcn/ui 기본 컴포넌트
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── label.tsx
│   ├── modal.tsx
│   ├── pagination.tsx
│   ├── select.tsx
│   ├── breadcrumb.tsx
│   └── status-indicator.tsx
├── auth/                       # 인증 관련 컴포넌트
│   ├── auth-provider.tsx       # 인증 컨텍스트 프로바이더
│   ├── signin-form.tsx         # 로그인 폼
│   ├── signup-form.tsx         # 회원가입 폼
│   ├── forgot-password-form.tsx
│   ├── reset-password-form.tsx
│   └── user-nav.tsx           # 사용자 네비게이션
├── notes/                      # 노트 관련 컴포넌트
│   ├── note-form.tsx          # 노트 작성/편집 폼
│   ├── note-detail-view.tsx   # 노트 상세 보기
│   ├── note-edit-view.tsx     # 노트 편집 보기
│   ├── note-actions.tsx       # 노트 액션 (삭제, 편집 등)
│   ├── note-breadcrumb.tsx    # 노트 브레드크럼
│   ├── note-auto-save-status.tsx
│   ├── notes-pagination.tsx   # 노트 목록 페이지네이션
│   └── notes-sort-dropdown.tsx
└── home-content.tsx           # 홈페이지 콘텐츠
```

---

## `/lib` 디렉토리

```
lib/
├── actions/                    # Server Actions
│   ├── auth.ts                # 인증 관련 액션
│   ├── notes.ts               # 노트 관련 액션
│   └── gemini.ts              # AI 관련 액션
├── ai/                        # AI 관련 모듈 (생성 예정)
│   ├── types.ts               # AI 타입 정의
│   ├── errors.ts              # AI 에러 처리
│   ├── config.ts              # AI 설정
│   ├── utils.ts               # AI 유틸리티
│   └── gemini-client.ts       # Gemini API 클라이언트
├── db/                        # 데이터베이스 관련
│   ├── index.ts               # DB 연결 설정
│   └── schema.ts              # Drizzle 스키마 정의
├── auth/                      # 인증 관련 (빈 디렉토리)
├── utils/                     # 유틸리티 함수
│   └── date-format.ts         # 날짜 포맷팅
├── validations/               # 데이터 검증
│   ├── auth.ts                # 인증 관련 검증
│   └── notes.ts               # 노트 관련 검증
├── supabase.ts                # Supabase 클라이언트 (클라이언트용)
├── supabase-server.ts         # Supabase 클라이언트 (서버용)
└── utils.ts                   # 공통 유틸리티
```

---

## `/hooks` 디렉토리

```
hooks/
├── use-auto-save.ts           # 자동 저장 훅
├── use-debounce.ts            # 디바운스 훅
├── use-simple-auto-save.ts    # 간단한 자동 저장
└── use-unsaved-changes.ts     # 저장되지 않은 변경사항 감지
```

---

## `/__tests__` 디렉토리

```
__tests__/
├── components/                 # 컴포넌트 테스트
│   ├── auth/
│   │   ├── forgot-password-form.test.tsx
│   │   ├── reset-password-form.test.tsx
│   │   └── signin-form.test.tsx
│   └── notes/
│       └── note-form.test.tsx
└── lib/                       # 라이브러리 테스트
    ├── actions/
    │   ├── auth-password-reset.test.ts
    │   ├── auth-signin.test.ts
    │   ├── gemini.test.ts
    │   └── notes.test.ts
    ├── ai/                    # AI 관련 테스트 (생성 예정)
    │   └── gemini-client.test.ts
    └── validations/
        ├── auth-password-reset.test.ts
        ├── auth-signin.test.ts
        └── notes.test.ts
```

---

## `/docs` 디렉토리

```
docs/
├── architecture.md            # 메인 아키텍처 문서
├── architecture/              # 상세 아키텍처 문서
│   ├── coding-standards.md    # 코딩 표준
│   ├── tech-stack.md          # 기술 스택
│   └── source-tree.md         # 소스 트리 구조 (이 문서)
├── prd.md                     # 제품 요구사항 문서
├── epics/                     # 에픽 문서들
│   ├── README.md
│   ├── epic-1-user-authentication.md
│   ├── epic-2-note-management.md
│   ├── epic-3-voice-memo.md
│   ├── epic-4-ai-summarization-tagging.md
│   ├── epic-5-search-filtering.md
│   └── epic-6-data-export.md
└── stories/                   # 사용자 스토리 문서들
    ├── 1.1.story.md
    ├── 1.2.story.md
    ├── 1.3.story.md
    ├── 2.1.story.md
    ├── 2.2.story.md
    ├── 2.3.story.md
    ├── 4.1.story.md
    ├── 4.2.story.md
    ├── 4.3.story.md
    ├── 4.4.story.md
    ├── 4.5.story.md
    ├── 4.6.story.md
    ├── 4.7.story.md
    └── 4.8.story.md
```

---

## 루트 설정 파일들

```
├── .env.local                 # 환경 변수 (로컬)
├── .env.example               # 환경 변수 예시
├── components.json            # shadcn/ui 설정
├── drizzle.config.ts          # Drizzle ORM 설정
├── eslint.config.mjs          # ESLint 설정
├── jest.config.js             # Jest 설정
├── jest.setup.js              # Jest 설정 초기화
├── middleware.ts              # Next.js 미들웨어
├── next-env.d.ts              # Next.js 타입 정의
├── next.config.ts             # Next.js 설정
├── package.json               # 패키지 정의
├── pnpm-lock.yaml             # pnpm 잠금 파일
├── pnpm-workspace.yaml        # pnpm 워크스페이스 설정
├── postcss.config.mjs         # PostCSS 설정
├── README.md                  # 프로젝트 README
├── supabase-setup.sql         # Supabase 초기 설정 SQL
├── tailwind.config.js         # Tailwind CSS 설정
└── tsconfig.json              # TypeScript 설정
```

---

## 파일 명명 규칙

### 컴포넌트 파일
- **kebab-case** 사용: `note-detail-view.tsx`
- **기능-목적** 형태로 명명: `user-nav.tsx`, `notes-pagination.tsx`

### 페이지 파일
- **page.tsx** - 페이지 컴포넌트
- **layout.tsx** - 레이아웃 컴포넌트
- **loading.tsx** - 로딩 컴포넌트
- **error.tsx** - 에러 컴포넌트
- **not-found.tsx** - 404 페이지

### 서버 액션 파일
- **기능별 분리**: `auth.ts`, `notes.ts`, `gemini.ts`
- **동사형 함수명**: `saveNote`, `deleteNote`, `generateSummary`

### 테스트 파일
- **원본파일명.test.tsx** 형태
- **테스트 대상과 동일한 디렉토리 구조**

---

## 디렉토리 생성 규칙

### 새로운 기능 추가 시
1. **컴포넌트**: `/components/{기능명}/`
2. **페이지**: `/app/{기능명}/`
3. **서버 액션**: `/lib/actions/{기능명}.ts`
4. **테스트**: `/__tests__/{원본경로}/`

### AI 기능 확장 시
1. **AI 모듈**: `/lib/ai/`
2. **AI 컴포넌트**: `/components/ai/`
3. **AI 테스트**: `/__tests__/lib/ai/`

---

## 주의사항

### 파일 위치 원칙
- **Server Components**: `/app` 디렉토리
- **Client Components**: `/components` 디렉토리 (상단에 'use client' 지시어)
- **Server Actions**: `/lib/actions` 디렉토리
- **유틸리티**: `/lib/utils` 또는 `/lib/{기능명}`

### Import 경로
- **절대 경로** 사용: `@/components/ui/button`
- **상대 경로** 최소화
- **타입 import**: `import type { ... }`
