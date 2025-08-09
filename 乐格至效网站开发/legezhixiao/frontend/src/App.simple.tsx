import React from 'react'
import { Layout } from 'antd'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import AuthorizedRoutes from './pages/AuthorizedRoutes'

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Layout style={{ minHeight: '100vh' }}>
          <AuthorizedRoutes />
        </Layout>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
