import { createNote, getNotes } from '@/lib/actions/notes'
import { createClient } from '@/lib/supabase'

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(),
}))

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

describe('Notes Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabase as any)
  })

  describe('createNote', () => {
    it('creates note successfully for authenticated user', async () => {
      const mockUser = { id: 'user-123' }
      const mockNoteData = {
        id: 'note-123',
        title: '테스트 노트',
        content: '테스트 내용',
        user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockNoteData,
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const formData = {
        title: '테스트 노트',
        content: '테스트 내용'
      }

      try {
        await createNote(formData)
      } catch (error) {
        // redirect throws an error in Next.js, which is expected
        expect(error).toBeDefined()
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('notes')
      expect(mockInsert).toHaveBeenCalledWith({
        title: '테스트 노트',
        content: '테스트 내용',
        user_id: 'user-123'
      })
    })

    it('returns error for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const formData = {
        title: '테스트 노트',
        content: '테스트 내용'
      }

      const result = await createNote(formData)

      expect(result).toEqual({
        error: '로그인이 필요합니다. 다시 로그인해주세요.'
      })
    })

    it('returns error for invalid form data', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const formData = {
        title: '', // 빈 제목 - 유효성 검사 실패
        content: '테스트 내용'
      }

      const result = await createNote(formData)

      expect(result).toEqual({
        error: '입력 정보를 다시 확인해주세요',
        fieldErrors: {
          title: ['제목을 입력해주세요']
        }
      })
    })

    it('handles database error', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'PGRST116' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const formData = {
        title: '테스트 노트',
        content: '테스트 내용'
      }

      const result = await createNote(formData)

      expect(result).toEqual({
        error: '테이블을 찾을 수 없습니다. 데이터베이스 설정을 확인해주세요.'
      })
    })

    it('handles empty content correctly', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'note-123' },
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        insert: mockInsert
      })

      const formData = {
        title: '제목만 있는 노트',
        content: undefined
      }

      try {
        await createNote(formData)
      } catch (error) {
        // redirect throws an error, which is expected
      }

      expect(mockInsert).toHaveBeenCalledWith({
        title: '제목만 있는 노트',
        content: '',
        user_id: 'user-123'
      })
    })
  })

  describe('getNotes', () => {
    it('gets notes successfully for authenticated user', async () => {
      const mockUser = { id: 'user-123' }
      const mockNotes = [
        {
          id: 'note-1',
          title: '첫 번째 노트',
          content: '첫 번째 내용',
          user_id: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'note-2',
          title: '두 번째 노트',
          content: '두 번째 내용',
          user_id: 'user-123',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockOrder = jest.fn().mockResolvedValue({
        data: mockNotes,
        error: null
      })

      const mockEq = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await getNotes()

      expect(result).toEqual({
        notes: mockNotes,
        error: null
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('notes')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false })
    })

    it('returns error for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await getNotes()

      expect(result).toEqual({
        error: '로그인이 필요합니다. 다시 로그인해주세요.',
        notes: []
      })
    })

    it('handles database error', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST116' }
      })

      const mockEq = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await getNotes()

      expect(result).toEqual({
        error: '노트를 불러오는 중 오류가 발생했습니다',
        notes: []
      })
    })

    it('returns empty array when no notes exist', async () => {
      const mockUser = { id: 'user-123' }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockOrder = jest.fn().mockResolvedValue({
        data: [],
        error: null
      })

      const mockEq = jest.fn().mockReturnValue({
        order: mockOrder
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await getNotes()

      expect(result).toEqual({
        notes: [],
        error: null
      })
    })
  })
})

