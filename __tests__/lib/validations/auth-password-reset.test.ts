import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth'

describe('forgotPasswordSchema', () => {
  it('validates correct email', () => {
    const validData = {
      email: 'test@example.com',
    }

    const result = forgotPasswordSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it('rejects empty email', () => {
    const invalidData = {
      email: '',
    }

    const result = forgotPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('이메일을 입력해주세요')
    }
  })

  it('rejects invalid email format', () => {
    const invalidData = {
      email: 'invalid-email',
    }

    const result = forgotPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('올바른 이메일 형식을 입력해주세요')
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
      const result = forgotPasswordSchema.safeParse({ email })
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
      const result = forgotPasswordSchema.safeParse({ email })
      expect(result.success).toBe(false)
    })
  })
})

describe('resetPasswordSchema', () => {
  it('validates correct password and confirmation', () => {
    const validData = {
      password: 'StrongPassword123',
      confirmPassword: 'StrongPassword123',
    }

    const result = resetPasswordSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it('rejects short password', () => {
    const invalidData = {
      password: 'short',
      confirmPassword: 'short',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 최소 8자 이상이어야 합니다')
    }
  })

  it('rejects password without uppercase', () => {
    const invalidData = {
      password: 'lowercase123',
      confirmPassword: 'lowercase123',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다')
    }
  })

  it('rejects password without lowercase', () => {
    const invalidData = {
      password: 'UPPERCASE123',
      confirmPassword: 'UPPERCASE123',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다')
    }
  })

  it('rejects password without number', () => {
    const invalidData = {
      password: 'NoNumbersHere',
      confirmPassword: 'NoNumbersHere',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다')
    }
  })

  it('rejects mismatched passwords', () => {
    const invalidData = {
      password: 'StrongPassword123',
      confirmPassword: 'DifferentPassword123',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다')
      expect(result.error.issues[0].path).toEqual(['confirmPassword'])
    }
  })

  it('rejects empty password', () => {
    const invalidData = {
      password: '',
      confirmPassword: '',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 최소 8자 이상이어야 합니다')
    }
  })

  it('rejects empty confirmation password', () => {
    const invalidData = {
      password: 'StrongPassword123',
      confirmPassword: '',
    }

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다')
    }
  })

  it('accepts strong passwords', () => {
    const strongPasswords = [
      'StrongPassword123',
      'MySecure123Pass',
      'Complex1Password',
      'Secure123Test',
    ]

    strongPasswords.forEach(password => {
      const result = resetPasswordSchema.safeParse({
        password,
        confirmPassword: password,
      })
      expect(result.success).toBe(true)
    })
  })

  it('rejects missing fields', () => {
    const invalidData = {}

    const result = resetPasswordSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2) // password and confirmPassword required
    }
  })
})

