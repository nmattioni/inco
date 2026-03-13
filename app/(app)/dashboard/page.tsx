'use client'

import Link from 'next/link'
import { Building2, Wallet, TrendingUp, Square, AlertCircle } from 'lucide-react'
import { useDashboard } from '@/hooks/useData'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard, Card, Badge, currency, formatDate, daysUntil } from '@/components/ui'

export default function DashboardPage() {
  const { stats, loading } = useDashboard()
  const { profile, can } = useAuth()

  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Saudação */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Bom dia, {profile?.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Aqui está o resumo da sua operação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Obras ativas"
          value={stats?.activeObras ?? 0}
          icon={Building2}
          accent="green"
        />
        <StatCard
          label="Área em andamento"
          value={`${(stats?.totalM2 ?? 0).toLocaleString('pt-BR')} m²`}
          icon={Square}
          accent="blue"
        />
        {can('canViewFinancial') && (
          <>
            <StatCard
              label="A receber (30d)"
              value={currency(stats?.totalReceivable)}
              icon={TrendingUp}
              accent="green"
            />
            <StatCard
              label="A pagar (30d)"
              value={currency(stats?.totalPayable)}
              icon={Wallet}
              accent="amber"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencimentos próximos */}
        {can('canViewFinancial') && (
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" aria-hidden="true" />
                Vencendo em 7 dias
              </h2>
              <Link href="/financeiro" className="text-xs text-[#2C5530] font-medium hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats?.upcomingTransactions?.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center text-gray-400">
                  Nenhum vencimento próximo
                </p>
              ) : (
                stats?.upcomingTransactions?.map(t => {
                  const days = daysUntil(t.due_date)
                  return (
                    <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.type === 'receivable' ? 'bg-[#4A9B5C]' : 'bg-red-400'}`}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{t.description}</p>
                        <p className="text-xs text-gray-400">
                          {(t.obra as { name?: string } | undefined)?.name ?? 'Sem obra'} · {formatDate(t.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${t.type === 'receivable' ? 'text-[#2C5530]' : 'text-red-600'}`}>
                          {t.type === 'receivable' ? '+' : '-'}{currency(t.amount)}
                        </p>
                        {days !== null && (
                          <Badge variant={days <= 3 ? 'red' : 'amber'} className="text-[10px]">
                            {days === 0 ? 'Hoje' : days < 0 ? `${Math.abs(days)}d atraso` : `${days}d`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        )}

        {/* Acesso rápido */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Acesso rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/obras" icon={Building2} label="Nova obra" desc="Cadastrar projeto" />
            {can('canViewFinancial') && (
              <QuickLink href="/financeiro" icon={Wallet} label="Lançamento" desc="Registrar transação" />
            )}
            <QuickLink href="/obras" icon={Building2} label="Ver obras" desc={`${stats?.activeObras ?? 0} em andamento`} />
            {can('canManageUsers') && (
              <QuickLink href="/equipe" icon={Wallet} label="Equipe" desc="Gerenciar usuários" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ href, icon: Icon, label, desc }: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="group block bg-white rounded-xl border border-[#2C5530]/10 p-4 hover:border-[#4A9B5C]/40 hover:shadow-sm transition-all"
    >
      <div className="w-8 h-8 bg-[#EAF5EC] rounded-lg flex items-center justify-center mb-2 group-hover:bg-[#4A9B5C]/20 transition-colors">
        <Icon size={15} className="text-[#2C5530]" />
      </div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </Link>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl animate-pulse" aria-label="Carregando...">
      <div className="h-7 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
