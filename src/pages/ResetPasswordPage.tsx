import { useMemo, useState, type FormEvent } from 'react'
import { ApiError, resetPassword } from '../api/client'
import { AuthBrand } from '../components/AuthBrand'

export function ResetPasswordPage() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') ?? '', [])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')

    setSubmitting(true)
    try {
      const result = await resetPassword(token, password)
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <AuthBrand />
          <div className="auth-card auth-single-card">
            <h2 className="auth-card-title">Invalid reset link</h2>
            <p className="auth-card-desc">This password reset link is missing or invalid.</p>
            <p className="auth-link">
              <a href="/forgot-password">Request a new reset link</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AuthBrand />

        <form className="auth-card auth-single-card" onSubmit={handleSubmit}>
          <h2 className="auth-card-title">Reset password</h2>
          <p className="auth-card-desc">Choose a new password for your account.</p>
          <div className="form-field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              aria-describedby="reset-password-hint"
            />
          </div>
          <p id="reset-password-hint" className="auth-hint">
            At least 8 characters.
          </p>
          <button type="submit" className="btn btn-auth-primary" disabled={submitting || Boolean(message)}>
            {submitting ? 'Please wait...' : 'Reset password'}
          </button>
          {error && <p className="auth-error">{error}</p>}
          {message && (
            <>
              <p className="auth-success">{message}</p>
              <p className="auth-link">
                <a href="/">Sign in with your new password</a>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
