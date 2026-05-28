import { Navigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

function ProtectedRoute({ children }: Props) {
  const isLoggedIn = localStorage.getItem('biblioteca_auth') === 'true'

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute