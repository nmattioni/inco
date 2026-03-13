import { Link, useLocation, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Building2, Wallet, Users,
  Settings, LogOut, ChevronRight, Bell
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { to: '/obras', icon: Building2, label: 'Obras', permission: null },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro', permission: 'canViewFinancial' },
  { to: '/equipe', icon: Users, label: 'Equipe', permission: 'canManageUsers' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações', permission: 'canManageSettings' },
]

const ROLE_COLORS = {
  owner: 'bg-emerald-900/40 text-emerald-300',
  manager: 'bg-blue-900/40 text-blue-300',
  financial: 'bg-amber-900/40 text-amber-300',
  operational: 'bg-purple-900/40 text-purple-300',
  viewer: 'bg-gray-800 text-gray-400',
}

const ROLE_LABELS = {
  owner: 'Proprietário', manager: 'Gerente',
  financial: 'Financeiro', operational: 'Operacional', viewer: 'Visualizador',
}

export default function Layout() {
  const { profile, tenant, can, signOut, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F1]">
      <div className="w-6 h-6 border-2 border-[#4A9B5C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return <Navigate to="/login" replace />

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-[#F7F5F1] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#1C2B1E] flex flex-col">
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/8">
          <div className="font-serif text-2xl text-[#C8E8CD] tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Inco
          </div>
          <div className="text-[10px] text-[#6DB87B] tracking-widest mt-0.5 uppercase">
            {tenant?.name}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label, permission }) => {
            if (permission && !can(permission)) return null
            const active = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
                  active
                    ? 'bg-[#4A9B5C]/20 text-[#C8E8CD]'
                    : 'text-[#C8E8CD]/50 hover:text-[#C8E8CD]/80 hover:bg-white/5'
                }`}
              >
                <Icon size={15} className={active ? 'opacity-100' : 'opacity-60'} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2C5530] flex items-center justify-center text-xs font-medium text-[#C8E8CD] flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#C8E8CD] truncate">{profile.full_name}</div>
              <div className={`text-[10px] px-1.5 py-0.5 rounded inline-block mt-0.5 ${ROLE_COLORS[profile.role]}`}>
                {ROLE_LABELS[profile.role]}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-3 w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#C8E8CD]/40 hover:text-[#C8E8CD]/70 hover:bg-white/5 transition-all"
          >
            <LogOut size={12} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-[#2C5530]/10 flex items-center px-6 gap-4 flex-shrink-0">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            {location.pathname.split('/').filter(Boolean).map((segment, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
                <span className={i === arr.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-400 capitalize'}>
                  {segment.charAt(0).toUpperCase() + segment.slice(1)}
                </span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
              <Bell size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
