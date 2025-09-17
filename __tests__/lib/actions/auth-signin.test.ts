/**
 * @jest-environment node
 */

import { signIn } from '@/lib/actions/auth'

// Mock Supabase
const mockSignInWithPassword = jest.fn()
const mockCreateClient = jest.fn(() => ({
  auth: {
    signInWithPassword: mockSignInWithPassword,
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
  }
  jest.clearAllMocks()
})

afterEach(() => {
  process.env = originalEnv
})

describe('signIn Server Action', () => {
  it('validates email format', async () => {
    const result = await signIn({
      email: 'invalid-email',
      password: 'password123',
    })

    expect(result.error).toBe('입력 정보를 다시 확인해주세요')
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('validates required fields', async () => {
    const result = await signIn({
      email: '',
      password: '',
    })

    expect(result.error).toBe('입력 정보를 다시 확인해주세요')
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('handles successful login', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockSignInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock redirect to throw NEXT_REDIRECT error (normal behavior)
    const { redirect } = require('next/navigation')
    redirect.mockImplementation(() => {
      const error = new Error('NEXT_REDIRECT')
      error.message = 'NEXT_REDIRECT'
      throw error
    })

    await expect(signIn({
      email: 'test@example.com',
      password: 'password123',
    })).rejects.toThrow('NEXT_REDIRECT')

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(redirect).toHaveBeenCalledWith('/')
  })

  it('handles invalid credentials error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const result = await signIn({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    expect(result.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다')
  })

  it('handles email not confirmed error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email not confirmed', status: 400 },
    })

    const result = await signIn({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.error).toBe('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.')
  })

  it('handles too many requests error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Too many requests', status: 429 },
    })

    const result = await signIn({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.error).toBe('너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.')
  })

  it('handles user not found error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not found', status: 400 },
    })

    const result = await signIn({
      email: 'nonexistent@example.com',
      password: 'password123',
    })

    expect(result.error).toBe('등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.')
  })

  it('handles missing environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

    const result = await signIn({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.error).toBe('서버 설정 오류입니다. 환경 변수를 확인해주세요.')
  })

  it('handles unexpected errors', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Network error'))

    const result = await signIn({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.error).toBe('서버 오류가 발생했습니다: Network error')
  })
})

