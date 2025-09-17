import { z } from 'zod'

// 노트 생성 스키마
export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요'),
  content: z
    .string()
    .max(10000, '본문은 10,000자 이내로 입력해주세요')
    .optional()
    .default(''),
})

// 노트 수정 스키마
export const updateNoteSchema = z.object({
  id: z.string().uuid('올바르지 않은 노트 ID입니다'),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이내로 입력해주세요'),
  content: z
    .string()
    .max(10000, '본문은 10,000자 이내로 입력해주세요')
    .optional()
    .default(''),
})

// 타입 정의
export type CreateNoteFormData = z.infer<typeof createNoteSchema>
export type UpdateNoteFormData = z.infer<typeof updateNoteSchema>
