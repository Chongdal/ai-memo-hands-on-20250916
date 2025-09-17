-- Epic 4: AI 요약 및 태그 생성 기능을 위한 데이터베이스 테이블 생성
-- 이 스크립트를 Supabase SQL Editor에서 실행해주세요.

-- 1. summaries 테이블 생성 (AI 요약 저장)
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    model VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. note_tags 테이블 생성 (AI 태그 저장)
CREATE TABLE IF NOT EXISTS note_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL
);

-- 3. token_usage 테이블 생성 (토큰 사용량 모니터링)
CREATE TABLE IF NOT EXISTS token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE, -- Optional, for note-specific usage
    type VARCHAR(50) NOT NULL, -- e.g., 'summary_generation', 'tag_generation', 'regeneration'
    model VARCHAR(50) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost DECIMAL(10, 6) NOT NULL, -- USD cost
    processing_time INTEGER, -- in ms
    success BOOLEAN NOT NULL,
    error_type VARCHAR(100), -- If failed, what type of error
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 (사용자는 자신의 노트 관련 데이터만 접근 가능)
CREATE POLICY "Users can only access summaries of their own notes" ON summaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = summaries.note_id 
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access tags of their own notes" ON note_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM notes 
            WHERE notes.id = note_tags.note_id 
            AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access their own token usage" ON token_usage
    FOR ALL USING (auth.uid() = user_id);

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS summaries_note_id_idx ON summaries(note_id);
CREATE INDEX IF NOT EXISTS summaries_created_at_idx ON summaries(created_at DESC);

CREATE INDEX IF NOT EXISTS note_tags_note_id_idx ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS note_tags_tag_idx ON note_tags(tag);

CREATE INDEX IF NOT EXISTS token_usage_user_id_idx ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS token_usage_created_at_idx ON token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS token_usage_type_idx ON token_usage(type);

-- 완료 메시지
SELECT 'Epic 4 데이터베이스 테이블 생성 완료!' as message;
