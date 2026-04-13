import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { signup } from '@/api/auth'

interface SignupProps {
  onNavigateToLogin: () => void
  onSuccess: (token: string, email: string) => Promise<void>
}

export function Signup({ onNavigateToLogin, onSuccess }: SignupProps) {
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                     = useState<string | null>(null)

  const signupMutation = useMutation({
    mutationFn: () => signup({ email, password }),
    onSuccess: async (token, email) => {
      await onSuccess(token, email)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setError('Email already in use. Please choose another.')
      } else {
        setError('Signup failed. Please try again.')
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    signupMutation.mutate()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--color-bg-deep)',
    border: '2px solid var(--color-border)',
    color: 'var(--color-text-primary)', padding: '8px 12px',
    fontSize: 10, fontFamily: 'inherit', borderRadius: 2, outline: 'none',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--color-bg-deep)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle at 30% 40%, rgba(96,128,240,0.05) 0%, transparent 50%),
          radial-gradient(circle at 70% 60%, rgba(0,212,170,0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px', position: 'relative' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 24, color: 'var(--color-accent)',
            textShadow: '0 0 20px var(--color-accent-glow)',
            letterSpacing: 4, marginBottom: 8,
          }}>
            CODE REALM
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 2 }}>
            BEGIN YOUR JOURNEY
          </div>
        </div>

        <div className="game-panel-elevated" style={{ padding: 24 }}>
          <div style={{
            fontSize: 10, color: 'var(--color-text-secondary)',
            letterSpacing: 2, marginBottom: 20, textAlign: 'center',
          }}>
            CREATE ACCOUNT
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: 8,
                color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6,
              }}>EMAIL</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: 8,
                color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6,
              }}>PASSWORD</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 8,
                color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6,
              }}>CONFIRM PASSWORD</label>
              <input
                type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {error && (
              <div style={{
                fontSize: 9, color: 'var(--color-danger)', marginBottom: 12,
                padding: '6px 10px', background: 'rgba(232,64,64,0.1)',
                border: '1px solid rgba(232,64,64,0.3)', borderRadius: 2,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="game-btn"
              disabled={signupMutation.isPending}
              style={{ width: '100%', padding: '10px', fontSize: 10, letterSpacing: 2 }}
            >
              {signupMutation.isPending ? 'CREATING...' : 'JOIN REALM'}
            </button>
          </form>

          <div className="pixel-divider" style={{ margin: '16px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
            </span>
            <button
              onClick={onNavigateToLogin}
              style={{
                background: 'none', border: 'none',
                color: 'var(--color-accent)', fontSize: 9,
                cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
