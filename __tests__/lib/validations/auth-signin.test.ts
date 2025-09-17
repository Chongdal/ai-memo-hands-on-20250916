import { signInSchema } from '@/lib/validations/auth'

describe('signInSchema', () => {
  it('validates correct email and password', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    }

    const result = signInSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it('rejects empty email', () => {
    const invalidData = {
      email: '',
      password: 'password123',
    }

    const result = signInSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('이메일을 입력해주세요')
    }
  })

  it('rejects invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
    }

    const result = signInSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('올바른 이메일 형식을 입력해주세요')
    }
  })

  it('rejects empty password', () => {
    const invalidData = {
      email: 'test@example.com',
      password: '',
    }

    const result = signInSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호를 입력해주세요')
    }
  })

  it('accepts any password length for login', () => {
    const validData = {
      email: 'test@example.com',
      password: '123', // Short password should be allowed for login
    }

    const result = signInSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    const invalidData = {}

    const result = signInSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2) // email and password required
    }
  })

  it('accepts valid email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'test123@test-domain.com',
    ]

    validEmails.forEach(email => {
      const result = signInSchema.safeParse({
        email,
        password: 'password',
      })
      expect(result.success).toBe(true)
    })
  })

  it('rejects invalid email formats', () => {
    const invalidEmails = [
      'plainaddress',
      '@missingusername.com',
      'username@.com',
      'username@com',
      'username..double.dot@example.com',
    ]

    invalidEmails.forEach(email => {
      const result = signInSchema.safeParse({
        email,
        password: 'password',
      })
      expect(result.success).toBe(false)
    })
  })
})

