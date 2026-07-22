import { useState, type FormEvent } from 'react'
import { ApiError, requestPasswordReset } from '../api/client'
import { AuthBrand } from '../components/AuthBrand'

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')

    setSubmitting(true)
    try {
      const result = await requestPasswordReset(email)
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AuthBrand />

        <form className="auth-card auth-single-card" onSubmit={handleSubmit}>
          <h2 className="auth-card-title">Forgot password</h2>
          <p className="auth-card-desc">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <div className="form-field">
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" name="email" type="email" required autoComplete="email" />
          </div>
          <button type="submit" className="btn btn-auth-primary" disabled={submitting}>
            {submitting ? 'Please wait...' : 'Send reset link'}
          </button>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}
          <p className="auth-link">
            <a href="/">Back to sign in</a>
          </p>
        </form>
      </div>
    </div>
  )
}
