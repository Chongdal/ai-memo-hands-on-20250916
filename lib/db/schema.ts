import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// Zod 스키마 생성
export const insertNoteSchema = createInsertSchema(notes, {
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내로 입력해주세요'),
  content: z.string().max(10000, '본문은 10,000자 이내로 입력해주세요').optional(),
})

export const selectNoteSchema = createSelectSchema(notes)

export const summaries = pgTable('summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  model: varchar('model', { length: 50 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const noteTags = pgTable('note_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 50 }).notNull(),
})

export const tokenUsage = pgTable('token_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }), // Optional, for note-specific usage
  type: varchar('type', { length: 50 }).notNull(), // e.g., 'summary_generation', 'tag_generation', 'regeneration'
  model: varchar('model', { length: 50 }).notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  cost: decimal('cost', { precision: 10, scale: 6 }).notNull(), // USD cost
  processingTime: integer('processing_time'), // in ms
  success: boolean('success').notNull(),
  errorType: varchar('error_type', { length: 100 }), // If failed, what type of error
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Zod 스키마 생성
export const insertSummarySchema = createInsertSchema(summaries)
export const selectSummarySchema = createSelectSchema(summaries)

export const insertNoteTagSchema = createInsertSchema(noteTags)
export const selectNoteTagSchema = createSelectSchema(noteTags)

export const insertTokenUsageSchema = createInsertSchema(tokenUsage)
export const selectTokenUsageSchema = createSelectSchema(tokenUsage)

// 타입 정의
export type Note = typeof notes.$inferSelect
export type InsertNote = typeof notes.$inferInsert
export type NewNote = z.infer<typeof insertNoteSchema>

export type Summary = typeof summaries.$inferSelect
export type InsertSummary = typeof summaries.$inferInsert

export type NoteTag = typeof noteTags.$inferSelect
export type InsertNoteTag = typeof noteTags.$inferInsert

export type TokenUsage = typeof tokenUsage.$inferSelect
export type InsertTokenUsage = typeof tokenUsage.$inferInsert

