import { useState, type FormEvent } from 'react'
import { ApiError, useAuth } from '../contexts/AuthContext'
import { AuthBrand } from '../components/AuthBrand'

export function AuthPage() {
  const { login, register } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [registerSubmitting, setRegisterSubmitting] = useState(false)

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginError(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')

    setLoginSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setLoginSubmitting(false)
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setRegisterError(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')

    setRegisterSubmitting(true)
    try {
      await register(email, password)
    } catch (err) {
      setRegisterError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setRegisterSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AuthBrand />

        <div className="auth-cards">
          <form className="auth-card" onSubmit={handleLogin} autoComplete="on">
            <h2 className="auth-card-title">Sign in</h2>
            <p className="auth-card-desc">Access your saved vacation plans</p>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input id="login-email" name="email" type="email" required autoComplete="username" />
            </div>
            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <p className="auth-link auth-link-inline">
              <a href="/forgot-password">Forgot password?</a>
            </p>
            <button type="submit" className="btn btn-auth-primary" disabled={loginSubmitting}>
              {loginSubmitting ? 'Please wait...' : 'Sign in'}
            </button>
            {loginError && <p className="auth-error">{loginError}</p>}
          </form>

          <form className="auth-card" onSubmit={handleRegister} autoComplete="on">
            <h2 className="auth-card-title">Create account</h2>
            <p className="auth-card-desc">Register to start planning your next trip</p>
            <div className="form-field">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                aria-describedby="register-password-hint"
              />
            </div>
            <p id="register-password-hint" className="auth-hint">
              At least 8 characters.
            </p>
            <button type="submit" className="btn btn-auth-secondary" disabled={registerSubmitting}>
              {registerSubmitting ? 'Please wait...' : 'Register'}
            </button>
            {registerError && <p className="auth-error">{registerError}</p>}
          </form>
        </div>
      </div>
    </div>
  )
}
