# 코딩 표준 - AI 메모장

## 목표 (GOAL)

- 깔끔하고 단순하며, 읽기 쉽고 모듈화된 코드를 작성한다.
- 요청한 것만 정확히 구현한다.
- 시니어 개발자처럼 깊게 고민한다.

---

## 개발 환경 (DEVELOPMENT ENVIRONMENT)

- 의존성 설치: `pnpm install`
- 개발 서버 실행: `pnpm dev`
- Drizzle 관련 명령어:
  - 마이그레이션 파일 생성: `pnpm drizzle-kit generate`
  - 마이그레이션 적용: `pnpm drizzle-kit migrate`
  - 스키마 DB에 반영: `pnpm drizzle-kit push`
  - DB 스키마 가져오기(introspect): `pnpm drizzle-kit pull`
  - 마이그레이션 충돌 검사: `pnpm drizzle-kit check`
  - 마이그레이션 스냅샷 업그레이드: `pnpm drizzle-kit up`
  - Drizzle Studio 실행: `pnpm drizzle-kit studio`
- 테스트 실행: `pnpm test`

---

## UI 규칙 (UI COMPONENTS)

- UI 컴포넌트는 **shadcn/ui** 사용
- 스타일링은 반드시 **Tailwind CSS** 사용

---

## 프레임워크 규칙 (FRAMEWORK)

- 라우팅은 반드시 **Next.js App Router**(`/app` 디렉토리) 사용
- 서버 로직은 **Server Actions**으로 구현

---

## 데이터베이스 & ORM (DATABASE & ORM)

- 데이터베이스: **Supabase Postgres**
- 모든 테이블은 `/drizzle/schema.ts`의 **Drizzle Schema**로 정의
- 마이그레이션은 **Drizzle Kit**으로 실행
- 권한 스코프는 **서버 코드에서 처리**

### 사용 원칙

- **인증/세션**: Supabase Auth API 사용 (`signIn*`, `signOut*`, `getUser*`, `onAuthStateChange` 등)
- **데이터 CRUD**: DrizzleORM으로 처리
- **권한 제어**: 모든 Drizzle 쿼리는 사용자 스코프를 WHERE로 직접 강제

---

## 인증 & 보안 (AUTH & SECURITY)

- **인증/세션은 Supabase Auth** 사용
- **클라이언트에서 직접 외부 API 호출 금지** (예: Gemini API) → 서버사이드에서만 호출

---

## 호스팅 & 인프라 (HOSTING & INFRA)

- 배포는 **Vercel** 사용

---

## 주석 규칙 (COMMENTS)

- 모든 파일은 **4줄의 헤더 주석**으로 시작해야 한다:
  1. 코드베이스 내 정확한 파일 위치
  2. 이 파일이 무엇을 하는지 설명
  3. 이 파일이 왜 존재하는지 설명
  4. 관련된 2~4개 파일 목록
- 복잡하거나 직관적이지 않은 부분은 반드시 주석 추가
- 적은 주석보다 많은 주석이 낫다

### 헤더 주석 예시

```typescript
// app/notes/[id]/page.tsx
// 노트 상세 페이지 - 개별 노트의 내용을 표시하고 편집할 수 있는 페이지
// 사용자가 특정 노트를 조회, 수정, 삭제할 수 있는 기능을 제공
// 관련 파일: components/notes/note-detail-view.tsx, lib/actions/notes.ts, app/notes/[id]/edit/page.tsx
```

---

## 파일 길이 (FILE LENGTH)

- 모든 파일은 **500 LOC 이하** 유지
- 파일은 모듈화되고 단일 목적을 가져야 한다

---

## UI 디자인 원칙 (UI DESIGN PRINCIPLES)

- 단순하고 깔끔하며 미니멀한 UI
- Apple/Notion 수준의 직관적인 UX 지향

---

## 데이터베이스 변경 (DATABASE CHANGES)

- AI는 DB 변경 권한 없음
- 모든 변경은 사용자 본인이 수행
- DB 관련 제안은 가능하되 직접 실행 금지

---

## 출력 스타일 (OUTPUT STYLE)

- 짧고 명확한 문장
- 충분한 맥락 제공
- 가정과 결론을 명확히 설명

---

## 타입스크립트 규칙

- 모든 함수와 변수에 적절한 타입 지정
- `any` 타입 사용 금지 (불가피한 경우 주석으로 이유 설명)
- 인터페이스와 타입을 적절히 활용
- 제네릭을 사용하여 재사용 가능한 코드 작성

---

## 에러 처리 규칙

- 모든 비동기 함수는 try-catch로 에러 처리
- 사용자 친화적인 에러 메시지 제공
- 개발 환경에서는 상세한 에러 로그 출력
- 프로덕션에서는 민감한 정보 노출 방지

---

## 성능 최적화

- 불필요한 리렌더링 방지 (React.memo, useMemo, useCallback 활용)
- 이미지 최적화 (Next.js Image 컴포넌트 사용)
- 적절한 로딩 상태 표시
- 서버 컴포넌트와 클라이언트 컴포넌트 적절히 분리

---

## 테스트 규칙

- 모든 새로운 기능에 대해 단위 테스트 작성
- 컴포넌트는 렌더링 테스트 및 사용자 상호작용 테스트
- 서버 액션은 성공/실패 시나리오 모두 테스트
- 테스트 커버리지 80% 이상 유지
