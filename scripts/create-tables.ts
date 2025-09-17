#!/usr/bin/env tsx

/**
 * scripts/create-tables.ts
 * Drizzle을 사용하여 Epic 4 테이블들을 직접 생성하는 스크립트
 * 네트워크 문제로 drizzle-kit push가 안될 때 사용
 * 실행: pnpm tsx scripts/create-tables.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { summaries, noteTags, tokenUsage } from '../lib/db/schema'

// 환경변수에서 DATABASE_URL 가져오기
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

console.log('🔗 데이터베이스 연결 중...')
console.log('URL:', databaseUrl.replace(/:[^:]*@/, ':****@')) // 비밀번호 숨김

// PostgreSQL 클라이언트 생성
const client = postgres(databaseUrl)
const db = drizzle(client)

async function createTables() {
  try {
    console.log('\n📋 Epic 4 테이블 생성 시작...')

    // 1. summaries 테이블 생성
    console.log('⚡ summaries 테이블 생성 중...')
    await client`
      CREATE TABLE IF NOT EXISTS "summaries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "note_id" uuid NOT NULL,
        "model" varchar(50) NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `

    // 2. note_tags 테이블 생성
    console.log('⚡ note_tags 테이블 생성 중...')
    await client`
      CREATE TABLE IF NOT EXISTS "note_tags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "note_id" uuid NOT NULL,
        "tag" varchar(50) NOT NULL
      )
    `

    // 3. token_usage 테이블 생성
    console.log('⚡ token_usage 테이블 생성 중...')
    await client`
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
      )
    `

    // 4. Foreign Key 제약조건 추가
    console.log('🔗 Foreign Key 제약조건 추가 중...')
    
    // notes 테이블이 존재하는지 확인 후 FK 추가
    try {
      await client`
        ALTER TABLE "summaries" 
        ADD CONSTRAINT "summaries_note_id_notes_id_fk" 
        FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade ON UPDATE no action
      `
    } catch (error) {
      console.log('  - summaries FK는 이미 존재하거나 건너뜀')
    }

    try {
      await client`
        ALTER TABLE "note_tags" 
        ADD CONSTRAINT "note_tags_note_id_notes_id_fk" 
        FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade ON UPDATE no action
      `
    } catch (error) {
      console.log('  - note_tags FK는 이미 존재하거나 건너뜀')
    }

    try {
      await client`
        ALTER TABLE "token_usage" 
        ADD CONSTRAINT "token_usage_note_id_notes_id_fk" 
        FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE cascade ON UPDATE no action
      `
    } catch (error) {
      console.log('  - token_usage note_id FK는 이미 존재하거나 건너뜀')
    }

    try {
      await client`
        ALTER TABLE "token_usage" 
        ADD CONSTRAINT "token_usage_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES auth.users("id") ON DELETE cascade ON UPDATE no action
      `
    } catch (error) {
      console.log('  - token_usage user_id FK는 이미 존재하거나 건너뜀')
    }

    // 5. RLS 정책 설정
    console.log('🔐 Row Level Security 설정 중...')
    
    await client`ALTER TABLE "summaries" ENABLE ROW LEVEL SECURITY`
    await client`ALTER TABLE "note_tags" ENABLE ROW LEVEL SECURITY`
    await client`ALTER TABLE "token_usage" ENABLE ROW LEVEL SECURITY`

    // 6. RLS 정책 생성
    console.log('📋 RLS 정책 생성 중...')
    
    try {
      await client`
        CREATE POLICY "Users can only access summaries of their own notes" ON "summaries"
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM "notes" 
            WHERE "notes"."id" = "summaries"."note_id" 
            AND "notes"."user_id" = auth.uid()
          )
        )
      `
    } catch (error) {
      console.log('  - summaries 정책은 이미 존재')
    }

    try {
      await client`
        CREATE POLICY "Users can only access tags of their own notes" ON "note_tags"
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM "notes" 
            WHERE "notes"."id" = "note_tags"."note_id" 
            AND "notes"."user_id" = auth.uid()
          )
        )
      `
    } catch (error) {
      console.log('  - note_tags 정책은 이미 존재')
    }

    try {
      await client`
        CREATE POLICY "Users can only access their own token usage" ON "token_usage"
        FOR ALL USING (auth.uid() = "user_id")
      `
    } catch (error) {
      console.log('  - token_usage 정책은 이미 존재')
    }

    // 7. 인덱스 생성
    console.log('📊 인덱스 생성 중...')
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "summaries_note_id_idx" ON "summaries"("note_id")',
      'CREATE INDEX IF NOT EXISTS "summaries_created_at_idx" ON "summaries"("created_at" DESC)',
      'CREATE INDEX IF NOT EXISTS "note_tags_note_id_idx" ON "note_tags"("note_id")',
      'CREATE INDEX IF NOT EXISTS "note_tags_tag_idx" ON "note_tags"("tag")',
      'CREATE INDEX IF NOT EXISTS "token_usage_user_id_idx" ON "token_usage"("user_id")',
      'CREATE INDEX IF NOT EXISTS "token_usage_created_at_idx" ON "token_usage"("created_at" DESC)',
      'CREATE INDEX IF NOT EXISTS "token_usage_type_idx" ON "token_usage"("type")'
    ]

    for (const indexSql of indexes) {
      await client.unsafe(indexSql)
    }

    console.log('\n✅ Epic 4 테이블 생성 완료!')
    console.log('📊 생성된 테이블:')
    console.log('   - summaries (AI 요약)')
    console.log('   - note_tags (AI 태그)')
    console.log('   - token_usage (토큰 사용량 모니터링)')
    console.log('\n🎉 이제 Epic 4 AI 기능을 테스트할 수 있습니다!')

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 데이터베이스 연결 종료')
  }
}

// 스크립트 실행
if (require.main === module) {
  createTables().catch(console.error)
}

export { createTables }
