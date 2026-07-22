import { useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { PlannerPage } from './pages/PlannerPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

function App() {
  const { user, loading } = useAuth()
  const path = window.location.pathname

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-brand-tagline">Loading...</p>
      </div>
    )
  }

  if (!user) {
    if (path === '/reset-password') return <ResetPasswordPage />
    if (path === '/forgot-password') return <ForgotPasswordPage />
    return <AuthPage />
  }

  return <PlannerPage />
}

export default App
