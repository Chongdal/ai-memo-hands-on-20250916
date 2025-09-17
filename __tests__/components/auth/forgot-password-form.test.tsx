import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { forgotPassword } from '@/lib/actions/auth'

// Mock the forgotPassword action
jest.mock('@/lib/actions/auth', () => ({
  forgotPassword: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockForgotPassword = forgotPassword as jest.MockedFunction<typeof forgotPassword>

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders forgot password form correctly', () => {
    render(<ForgotPasswordForm />)
    
    expect(screen.getByText('비밀번호 찾기')).toBeInTheDocument()
    expect(screen.getByText('가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '재설정 링크 발송' })).toBeInTheDocument()
    expect(screen.getByText('로그인하기')).toBeInTheDocument()
  })

  it('validates email field', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    await user.click(submitButton)
    
    expect(screen.getByText('이메일을 입력해주세요')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    
    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)
    
    expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
  })

  it('submits form with valid email', async () => {
    const user = userEvent.setup()
    mockForgotPassword.mockResolvedValue({ 
      success: true, 
      message: '비밀번호 재설정 링크를 이메일로 발송했습니다.' 
    })
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
      })
    })
  })

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup()
    const successMessage = '비밀번호 재설정 링크를 이메일로 발송했습니다.'
    mockForgotPassword.mockResolvedValue({ 
      success: true, 
      message: successMessage 
    })
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument()
      expect(screen.getByText(successMessage)).toBeInTheDocument()
      expect(screen.getByText('로그인 페이지로 돌아가기')).toBeInTheDocument()
    })
  })

  it('displays error message on failure', async () => {
    const user = userEvent.setup()
    const errorMessage = '서버 오류가 발생했습니다'
    mockForgotPassword.mockResolvedValue({ error: errorMessage })
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockForgotPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Success' }), 100)))
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    expect(screen.getByText('발송 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('allows retry with different email', async () => {
    const user = userEvent.setup()
    mockForgotPassword.mockResolvedValue({ 
      success: true, 
      message: '비밀번호 재설정 링크를 이메일로 발송했습니다.' 
    })
    
    render(<ForgotPasswordForm />)
    
    const emailInput = screen.getByLabelText('이메일')
    const submitButton = screen.getByRole('button', { name: '재설정 링크 발송' })
    
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('이메일을 확인해주세요')).toBeInTheDocument()
    })
    
    const retryButton = screen.getByText('다른 이메일로 다시 시도')
    await user.click(retryButton)
    
    expect(screen.getByText('비밀번호 찾기')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
  })
})

