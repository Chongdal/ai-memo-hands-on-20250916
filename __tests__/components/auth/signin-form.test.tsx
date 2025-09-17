import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '@/components/auth/signin-form'
import { signIn } from '@/lib/actions/auth'

// Mock the signIn action
jest.mock('@/lib/actions/auth', () => ({
  signIn: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>

describe('SignInForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<SignInForm />)
    
    expect(screen.getByText('로그인')).toBeInTheDocument()
    expect(screen.getByText('AI 메모장에 로그인하여 시작해보세요')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByText('비밀번호를 잊으셨나요?')).toBeInTheDocument()
    expect(screen.getByText('회원가입하기')).toBeInTheDocument()
  })

  it('validates email field', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const submitButton = screen.getByRole('button', { name: '로그인' })
    await user.click(submitButton)
    
    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
  })

  it('validates password field', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)
    
    const passwordInput = screen.getByLabelText('비밀번호') as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: /toggle password/i }) || 
                        passwordInput.parentElement?.querySelector('button')
    
    expect(passwordInput.type).toBe('password')
    
    if (toggleButton) {
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('text')
      
      await user.click(toggleButton)
      expect(passwordInput.type).toBe('password')
    }
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ success: true })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('displays error message on login failure', async () => {
    const user = userEvent.setup()
    const errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다'
    mockSignIn.mockResolvedValue({ error: errorMessage })
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))
    
    render(<SignInForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const passwordInput = screen.getByLabelText('비밀번호')
    const submitButton = screen.getByRole('button', { name: '로그인' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    expect(screen.getByText('로그인 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})
