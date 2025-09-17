/**
 * @jest-environment node
 */

import { forgotPassword, resetPassword } from '@/lib/actions/auth'

// Mock Supabase
const mockResetPasswordForEmail = jest.fn()
const mockUpdateUser = jest.fn()
const mockCreateClient = jest.fn(() => ({
  auth: {
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
  },
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  jest.resetModules()
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3002',
  }
  jest.clearAllMocks()
})

afterEach(() => {
  process.env = originalEnv
})

describe('forgotPassword Server Action', () => {
  it('validates email format', async () => {
    const result = await forgotPassword({
      email: 'invalid-email',
    })

    expect(result.error).toBe('입력 정보를 다시 확인해주세요')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('validates required email field', async () => {
    const result = await forgotPassword({
      email: '',
    })

    expect(result.error).toBe('입력 정보를 다시 확인해주세요')
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
  })

  it('handles successful password reset request', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: null,
    })

    const result = await forgotPassword({
      email: 'test@example.com',
    })

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: 'http://localhost:3002/reset-password'
    })
    expect(result.success).toBe(true)
    expect(result.message).toBe('비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.')
  })

  it('returns success message even for non-existent email (security)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'User not found', status: 400 },
    })

    const result = await forgotPassword({
      email: 'nonexistent@example.com',
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.')
  })

  it('handles missing environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

    const result = await forgotPassword({
      email: 'test@example.com',
    })

    expect(result.error).toBe('서버 설정 오류입니다. 환경 변수를 확인해주세요.')
  })

  it('handles unexpected errors gracefully', async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'))

    const result = await forgotPassword({
      email: 'test@example.com',
    })

    // Should return success message for security (email enumeration protection)
    expect(result.success).toBe(true)
    expect(result.message).toBe('비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.')
  })
})

describe('resetPassword Server Action', () => {
  it('validates password requirements', async () => {
    const result = await resetPassword({
      password: 'weak',
      confirmPassword: 'weak',
    })

    expect(result.error).toBe('입력 정보를 다시 확인해주세요')
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('validates password confirmation', async () => {
    const result = await resetPassword({
      password: 'StrongPassword123',
      confirmPassword: 'DifferentPassword123',
    })

    expect(result.error).toBe('입력 정보를 다시 확인해주세요')
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('handles successful password reset', async () => {
    mockUpdateUser.mockResolvedValue({
      error: null,
    })

    const { redirect } = require('next/navigation')
    redirect.mockImplementation(() => {
      const error = new Error('NEXT_REDIRECT')
      error.message = 'NEXT_REDIRECT'
      throw error
    })

    await expect(resetPassword({
      password: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })).rejects.toThrow('NEXT_REDIRECT')

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'NewPassword123'
    })
    expect(redirect).toHaveBeenCalledWith('/signin?message=password-updated')
  })

  it('handles invalid refresh token error', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Invalid refresh token', status: 400 },
    })

    const result = await resetPassword({
      password: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    expect(result.error).toBe('재설정 링크가 만료되었거나 유효하지 않습니다. 새로운 재설정 링크를 요청해주세요.')
  })

  it('handles password too short error', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password should be at least 6 characters', status: 400 },
    })

    const result = await resetPassword({
      password: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    expect(result.error).toBe('비밀번호는 최소 6자 이상이어야 합니다')
  })

  it('handles same password error', async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: 'New password should be different from the old password', status: 400 },
    })

    const result = await resetPassword({
      password: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    expect(result.error).toBe('새 비밀번호는 기존 비밀번호와 달라야 합니다')
  })

  it('handles missing environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

    const result = await resetPassword({
      password: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    expect(result.error).toBe('서버 설정 오류입니다. 환경 변수를 확인해주세요.')
  })

  it('handles unexpected errors', async () => {
    mockUpdateUser.mockRejectedValue(new Error('Network error'))

    const result = await resetPassword({
      password: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    })

    expect(result.error).toBe('서버 오류가 발생했습니다: Network error')
  })
})

