'use client'

import { usePathname } from 'next/navigation'
import { Bell, ChevronRight } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  obras: 'Obras',
  financeiro: 'Financeiro',
  equipe: 'Equipe',
  configuracoes: 'Configurações',
}

export default function Header() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <header className="h-14 bg-white border-b border-[#2C5530]/10 flex items-center px-6 gap-4 flex-shrink-0">
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        {segments.map((segment, i) => {
          const label = ROUTE_LABELS[segment] ?? (segment.length === 36 ? 'Detalhe' : segment.charAt(0).toUpperCase() + segment.slice(1))
          const isLast = i === segments.length - 1
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-gray-300" aria-hidden="true" />}
              <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {label}
              </span>
            </span>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          aria-label="Notificações"
        >
          <Bell size={15} />
        </button>
      </div>
    </header>
  )
}
