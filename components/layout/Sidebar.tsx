'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Building2, Wallet, Users,
  Settings, LogOut,
} from 'lucide-react'
import type { Permissions } from '@/lib/supabase'

const NAV_ITEMS: Array<{
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  permission: keyof Permissions | null
}> = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { href: '/obras',     icon: Building2,       label: 'Obras',     permission: null },
  { href: '/financeiro', icon: Wallet,          label: 'Financeiro', permission: 'canViewFinancial' },
  { href: '/equipe',    icon: Users,            label: 'Equipe',    permission: 'canManageUsers' },
  { href: '/configuracoes', icon: Settings,     label: 'Configurações', permission: 'canManageSettings' },
]

const ROLE_COLORS: Record<string, string> = {
  owner:       'bg-emerald-900/40 text-emerald-300',
  manager:     'bg-blue-900/40 text-blue-300',
  financial:   'bg-amber-900/40 text-amber-300',
  operational: 'bg-purple-900/40 text-purple-300',
  viewer:      'bg-gray-800 text-gray-400',
}

const ROLE_LABELS: Record<string, string> = {
  owner:       'Proprietário',
  manager:     'Gerente',
  financial:   'Financeiro',
  operational: 'Operacional',
  viewer:      'Visualizador',
}

export default function Sidebar() {
  const { profile, tenant, can, signOut } = useAuth()
  const pathname = usePathname()

  if (!profile) return null

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="w-56 flex-shrink-0 bg-[#1C2B1E] flex flex-col">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.08]">
        <div className="font-serif text-2xl text-[#C8E8CD] tracking-tight">
          Inco
        </div>
        <div className="text-[10px] text-[#6DB87B] tracking-widest mt-0.5 uppercase">
          {tenant?.name}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ href, icon: Icon, label, permission }) => {
          if (permission && !can(permission)) return null
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
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
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full bg-[#2C5530] flex items-center justify-center text-xs font-medium text-[#C8E8CD] flex-shrink-0"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-[#C8E8CD] truncate">{profile.full_name}</div>
            <div className={`text-[10px] px-1.5 py-0.5 rounded inline-block mt-0.5 ${ROLE_COLORS[profile.role] ?? 'bg-gray-800 text-gray-400'}`}>
              {ROLE_LABELS[profile.role] ?? profile.role}
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
  )
}
