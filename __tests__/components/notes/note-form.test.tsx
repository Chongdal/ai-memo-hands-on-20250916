import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteForm } from '@/components/notes/note-form'
import { createNote } from '@/lib/actions/notes'

// Mock the server action
jest.mock('@/lib/actions/notes', () => ({
  createNote: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

const mockCreateNote = createNote as jest.MockedFunction<typeof createNote>

describe('NoteForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(<NoteForm mode="create" />)
    
    expect(screen.getByText('새 노트 작성')).toBeInTheDocument()
    expect(screen.getByLabelText('제목 *')).toBeInTheDocument()
    expect(screen.getByLabelText('본문')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '노트 저장' })).toBeInTheDocument()
    expect(screen.getByText('취소')).toBeInTheDocument()
  })

  it('renders edit form correctly with initial data', () => {
    const initialData = {
      title: '테스트 제목',
      content: '테스트 내용'
    }
    
    render(<NoteForm mode="edit" initialData={initialData} />)
    
    expect(screen.getByText('노트 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('테스트 제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('테스트 내용')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정 완료' })).toBeInTheDocument()
  })

  it('shows character count for title and content', async () => {
    const user = userEvent.setup()
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    const contentTextarea = screen.getByLabelText('본문')
    
    await user.type(titleInput, 'abc')
    await user.type(contentTextarea, 'abcde')
    
    expect(screen.getByText('3/200')).toBeInTheDocument()
    expect(screen.getByText('5/10,000')).toBeInTheDocument()
  })

  it('validates required title field', async () => {
    const user = userEvent.setup()
    render(<NoteForm mode="create" />)
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('validates title length limit', async () => {
    const user = userEvent.setup()
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    const longTitle = 'a'.repeat(201)
    
    await user.type(titleInput, longTitle)
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('제목은 200자 이내로 입력해주세요')).toBeInTheDocument()
    })
  })

  it('validates content length limit', async () => {
    const user = userEvent.setup()
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    const contentTextarea = screen.getByLabelText('본문')
    const longContent = 'a'.repeat(10001)
    
    await user.type(titleInput, 'Valid Title')
    // 긴 텍스트는 직접 설정
    fireEvent.change(contentTextarea, { target: { value: longContent } })
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('본문은 10,000자 이내로 입력해주세요')).toBeInTheDocument()
    }, { timeout: 10000 })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockCreateNote.mockResolvedValue(undefined)
    
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    const contentTextarea = screen.getByLabelText('본문')
    
    // fireEvent를 사용하여 직접 값 설정
    fireEvent.change(titleInput, { target: { value: '테스트 제목' } })
    fireEvent.change(contentTextarea, { target: { value: '테스트 내용' } })
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({
        title: '테스트 제목',
        content: '테스트 내용'
      })
    })
  })

  it('handles server error', async () => {
    const user = userEvent.setup()
    mockCreateNote.mockResolvedValue({
      error: '서버 오류가 발생했습니다'
    })
    
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    await user.type(titleInput, '테스트 제목')
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('서버 오류가 발생했습니다')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockCreateNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    await user.type(titleInput, '테스트 제목')
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    await user.click(submitButton)
    
    expect(screen.getByText('저장 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('allows empty content', async () => {
    const user = userEvent.setup()
    mockCreateNote.mockResolvedValue(undefined)
    
    render(<NoteForm mode="create" />)
    
    const titleInput = screen.getByLabelText('제목 *')
    fireEvent.change(titleInput, { target: { value: '제목만 있는 노트' } })
    
    const submitButton = screen.getByRole('button', { name: '노트 저장' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreateNote).toHaveBeenCalledWith({
        title: '제목만 있는 노트',
        content: ''
      })
    })
  })
})
