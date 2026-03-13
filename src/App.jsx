import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import { LoginPage, RegisterPage } from './pages/Auth'
import DashboardPage from './pages/Dashboard'
import { ObrasPage, ObraDetailPage } from './pages/Obras'
import FinanceiroPage from './pages/Financeiro'
import EquipePage from './pages/Equipe'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F1]">
      <div className="w-6 h-6 border-2 border-[#4A9B5C] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="obras" element={<ObrasPage />} />
            <Route path="obras/:id" element={<ObraDetailPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
            <Route path="equipe" element={<EquipePage />} />
            <Route path="configuracoes" element={<ConfigPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

// Placeholder para configurações
function ConfigPage() {
  const { tenant, profile } = useAuth()
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
      <div className="bg-white rounded-xl border border-[#2C5530]/10 p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Empresa</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p><span className="font-medium text-gray-700">Nome:</span> {tenant?.name}</p>
          <p><span className="font-medium text-gray-700">Plano:</span> {tenant?.plan}</p>
          <p><span className="font-medium text-gray-700">Slug:</span> {tenant?.slug}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#2C5530]/10 p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Meu perfil</h2>
        <div className="text-sm text-gray-500 space-y-1">
          <p><span className="font-medium text-gray-700">Nome:</span> {profile?.full_name}</p>
          <p><span className="font-medium text-gray-700">Email:</span> {profile?.email}</p>
          <p><span className="font-medium text-gray-700">Cargo:</span> {profile?.role}</p>
        </div>
      </div>
    </div>
  )
}
