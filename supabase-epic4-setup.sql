-- Epic 4: AI 요약 및 태그 생성 기능을 위한 완전한 데이터베이스 설정
-- 이 스크립트를 Supabase SQL Editor에서 실행해주세요.

-- 1. summaries 테이블 생성 (AI 요약 저장)
CREATE TABLE IF NOT EXISTS "summaries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "note_id" uuid NOT NULL,
    "model" varchar(50) NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. note_tags 테이블 생성 (AI 태그 저장)
CREATE TABLE IF NOT EXISTS "note_tags" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "note_id" uuid NOT NULL,
    "tag" varchar(50) NOT NULL
);

-- 3. token_usage 테이블 생성 (토큰 사용량 모니터링)
CREATE TABLE IF NOT EXISTS "token_usage" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "note_id" uuid,
    "type" varchar(50) NOT NULL,
    "model" varchar(50) NOT NULL,
    "input_tokens" integer NOT NULL,
    "output_tokens" integer NOT NULL,
    "total_tokens" integer NOT NULL,
    "cost" numeric(10, 6) NOT NULL,
    "processing_time" integer,
    "success" boolean NOT NULL,
    "error_type" varchar(100),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Foreign Key 제약조건 추가
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_note_id_notes_id_fk" 
    FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" 
    FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_note_id_notes_id_fk" 
    FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE cascade ON UPDATE no action;

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE "summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "note_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "token_usage" ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책 생성 (사용자는 자신의 노트 관련 데이터만 접근 가능)
CREATE POLICY "Users can only access summaries of their own notes" ON "summaries"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "notes" 
            WHERE "notes"."id" = "summaries"."note_id" 
            AND "notes"."user_id" = auth.uid()
        )
    );

CREATE POLICY "Users can only access tags of their own notes" ON "note_tags"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "notes" 
            WHERE "notes"."id" = "note_tags"."note_id" 
            AND "notes"."user_id" = auth.uid()
        )
    );

CREATE POLICY "Users can only access their own token usage" ON "token_usage"
    FOR ALL USING (auth.uid() = "user_id");

-- 7. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "summaries_note_id_idx" ON "summaries"("note_id");
CREATE INDEX IF NOT EXISTS "summaries_created_at_idx" ON "summaries"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "note_tags_note_id_idx" ON "note_tags"("note_id");
CREATE INDEX IF NOT EXISTS "note_tags_tag_idx" ON "note_tags"("tag");

CREATE INDEX IF NOT EXISTS "token_usage_user_id_idx" ON "token_usage"("user_id");
CREATE INDEX IF NOT EXISTS "token_usage_created_at_idx" ON "token_usage"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "token_usage_type_idx" ON "token_usage"("type");

-- 8. 완료 메시지
SELECT 'Epic 4 데이터베이스 테이블 생성 완료! 🎉' as message;
