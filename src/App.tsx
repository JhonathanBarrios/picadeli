import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { usePWAUpdate } from './hooks/usePWAUpdate'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import PWAUpdateBanner from './components/PWAUpdateBanner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { initialize } = useAuthStore()
  const { updateAvailable, updateApp } = usePWAUpdate()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (updateAvailable) {
      setShowBanner(true)
    }
  }, [updateAvailable])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#f1f5f9',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#f1f5f9',
          },
        },
      }} />
      {showBanner && (
        <PWAUpdateBanner
          onReload={updateApp}
          onClose={() => setShowBanner(false)}
        />
      )}
    </BrowserRouter>
  )
}
