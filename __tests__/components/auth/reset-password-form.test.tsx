import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { resetPassword } from '@/lib/actions/auth'

// Mock the resetPassword action
jest.mock('@/lib/actions/auth', () => ({
  resetPassword: jest.fn(),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders reset password form correctly', () => {
    render(<ResetPasswordForm />)
    
    expect(screen.getByText('새 비밀번호 설정')).toBeInTheDocument()
    expect(screen.getByText('새로운 비밀번호를 입력해주세요')).toBeInTheDocument()
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비밀번호 재설정' })).toBeInTheDocument()
  })

  it('validates password requirements', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정' })
    
    await user.type(passwordInput, 'weak')
    await user.click(submitButton)
    
    expect(screen.getByText('비밀번호는 최소 8자 이상이어야 합니다')).toBeInTheDocument()
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정' })
    
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'DifferentPassword123')
    await user.click(submitButton)
    
    expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
  })

  it('shows password strength indicator', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    
    // Weak password
    await user.type(passwordInput, 'weak')
    expect(screen.getByText('약함')).toBeInTheDocument()
    
    // Clear and type strong password
    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongPassword123!')
    expect(screen.getByText('강함')).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호') as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인') as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password/i }) || 
                         document.querySelectorAll('button[type="button"]')
    
    expect(passwordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')
    
    if (toggleButtons.length >= 2) {
      await user.click(toggleButtons[0])
      expect(passwordInput.type).toBe('text')
      
      await user.click(toggleButtons[1])
      expect(confirmPasswordInput.type).toBe('text')
    }
  })

  it('submits form with valid passwords', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue({ success: true })
    
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정' })
    
    const password = 'NewPassword123'
    await user.type(passwordInput, password)
    await user.type(confirmPasswordInput, password)
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith({
        password: password,
        confirmPassword: password,
      })
    })
  })

  it('displays error message on failure', async () => {
    const user = userEvent.setup()
    const errorMessage = '재설정 링크가 만료되었습니다'
    mockResetPassword.mockResolvedValue({ error: errorMessage })
    
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정' })
    
    const password = 'NewPassword123'
    await user.type(passwordInput, password)
    await user.type(confirmPasswordInput, password)
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))
    
    render(<ResetPasswordForm />)
    
    const passwordInput = screen.getByLabelText('새 비밀번호')
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인')
    const submitButton = screen.getByRole('button', { name: '비밀번호 재설정' })
    
    const password = 'NewPassword123'
    await user.type(passwordInput, password)
    await user.type(confirmPasswordInput, password)
    await user.click(submitButton)
    
    expect(screen.getByText('설정 중...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})

