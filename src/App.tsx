import { useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { PlannerPage } from './pages/PlannerPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <p className="auth-brand-tagline">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <PlannerPage />
}

export default App
