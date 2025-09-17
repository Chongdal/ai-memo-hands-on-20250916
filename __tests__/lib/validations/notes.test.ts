import { createNoteSchema, updateNoteSchema } from '@/lib/validations/notes'

describe('Notes Validations', () => {
  describe('createNoteSchema', () => {
    it('validates valid note data', () => {
      const validData = {
        title: '유효한 노트 제목',
        content: '유효한 노트 내용'
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('validates note with empty content', () => {
      const validData = {
        title: '제목만 있는 노트',
        content: ''
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.content).toBe('')
      }
    })

    it('validates note without content field', () => {
      const validData = {
        title: '제목만 있는 노트'
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.content).toBe('')
      }
    })

    it('trims whitespace from title', () => {
      const dataWithWhitespace = {
        title: '  공백이 있는 제목  ',
        content: '내용'
      }

      const result = createNoteSchema.safeParse(dataWithWhitespace)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.title).toBe('공백이 있는 제목')
      }
    })

    it('rejects empty title', () => {
      const invalidData = {
        title: '',
        content: '내용'
      }

      const result = createNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('제목을 입력해주세요')
      }
    })

    it('rejects whitespace-only title', () => {
      const invalidData = {
        title: '   ',
        content: '내용'
      }

      const result = createNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('제목을 입력해주세요')
      }
    })

    it('rejects title longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201)
      const invalidData = {
        title: longTitle,
        content: '내용'
      }

      const result = createNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('제목은 200자 이내로 입력해주세요')
      }
    })

    it('accepts title with exactly 200 characters', () => {
      const maxTitle = 'a'.repeat(200)
      const validData = {
        title: maxTitle,
        content: '내용'
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects content longer than 10000 characters', () => {
      const longContent = 'a'.repeat(10001)
      const invalidData = {
        title: '제목',
        content: longContent
      }

      const result = createNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('본문은 10,000자 이내로 입력해주세요')
      }
    })

    it('accepts content with exactly 10000 characters', () => {
      const maxContent = 'a'.repeat(10000)
      const validData = {
        title: '제목',
        content: maxContent
      }

      const result = createNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('handles special characters in title and content', () => {
      const specialCharData = {
        title: '특수문자 테스트! @#$%^&*()',
        content: '특수문자 내용\n줄바꿈\t탭\r\n윈도우 줄바꿈'
      }

      const result = createNoteSchema.safeParse(specialCharData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data).toEqual(specialCharData)
      }
    })

    it('handles unicode characters', () => {
      const unicodeData = {
        title: '유니코드 테스트 🚀 한글 English 日本語',
        content: '이모지 테스트 😀😃😄😁😆😅😂🤣'
      }

      const result = createNoteSchema.safeParse(unicodeData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data).toEqual(unicodeData)
      }
    })
  })

  describe('updateNoteSchema', () => {
    it('validates valid update data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '수정된 제목',
        content: '수정된 내용'
      }

      const result = updateNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('rejects invalid UUID format', () => {
      const invalidData = {
        id: 'invalid-uuid',
        title: '제목',
        content: '내용'
      }

      const result = updateNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('올바르지 않은 노트 ID입니다')
      }
    })

    it('applies same title validation as create schema', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
        content: '내용'
      }

      const result = updateNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('제목을 입력해주세요')
      }
    })

    it('applies same content validation as create schema', () => {
      const longContent = 'a'.repeat(10001)
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '제목',
        content: longContent
      }

      const result = updateNoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('본문은 10,000자 이내로 입력해주세요')
      }
    })

    it('handles missing content field in update', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '제목만 수정'
      }

      const result = updateNoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.content).toBe('')
      }
    })
  })
})

