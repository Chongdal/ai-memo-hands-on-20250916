import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// 환경 변수에서 데이터베이스 URL 가져오기
const connectionString = process.env.DATABASE_URL || 
  (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`
    : undefined)

if (!connectionString) {
  throw new Error('Database connection string not found')
}

// PostgreSQL 클라이언트 생성
const client = postgres(connectionString, { 
  prepare: false,
  max: 1, // 개발 환경에서는 연결 수 제한
})

// Drizzle ORM 인스턴스 생성
export const db = drizzle(client, { schema })

// 타입 내보내기
export * from './schema'
