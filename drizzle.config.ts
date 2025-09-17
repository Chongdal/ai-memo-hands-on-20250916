import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
config({path: '.env.local'})

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 
      (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD
        ? `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`
        : ''),
  },
  verbose: true,
  strict: true,
})
