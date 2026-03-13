'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Building2, MapPin, Calendar, ChevronRight } from 'lucide-react'
import { useObras } from '@/hooks/useData'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, Badge, Modal, Input, Select, EmptyState, currency, formatDate } from '@/components/ui'
import type { Obra } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  planning:  { label: 'Planejamento', variant: 'blue' },
  active:    { label: 'Em andamento', variant: 'green' },
  paused:    { label: 'Pausada',      variant: 'amber' },
  completed: { label: 'Concluída',    variant: 'gray' },
  cancelled: { label: 'Cancelada',    variant: 'red' },
}

export default function ObrasPage() {
  const { obras, loading, createObra } = useObras()
  const { can, profile } = useAuth()
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = obras.filter(o => {
    const matchSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.city?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Obras</h1>
          <p className="text-sm text-gray-500">{obras.length} projetos cadastrados</p>
        </div>
        {can('canCreateObra') && (
          <Button onClick={() => setShowNew(true)}>
            <Plus size={14} /> Nova obra
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <input
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#4A9B5C] focus:ring-2 focus:ring-[#4A9B5C]/10"
          placeholder="Buscar por nome ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#4A9B5C] bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma obra encontrada"
          description={can('canCreateObra') ? 'Cadastre sua primeira obra para começar.' : 'Nenhuma obra disponível no momento.'}
          action={
            can('canCreateObra') ? (
              <Button onClick={() => setShowNew(true)}>
                <Plus size={14} /> Criar obra
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(obra => <ObraCard key={obra.id} obra={obra} />)}
        </div>
      )}

      <NewObraModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createObra}
        tenantId={profile?.tenant_id}
        userId={profile?.id}
      />
    </div>
  )
}

function ObraCard({ obra }: { obra: Obra }) {
  const s = STATUS_CONFIG[obra.status] ?? STATUS_CONFIG.active
  return (
    <Link href={`/obras/${obra.id}`}>
      <Card className="p-5 hover:border-[#4A9B5C]/40 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={s.variant}>{s.label}</Badge>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-[#4A9B5C] transition-colors" aria-hidden="true" />
        </div>
        <h3 className="font-medium text-gray-900 mb-1 group-hover:text-[#2C5530] transition-colors">{obra.name}</h3>
        {obra.city && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
            <MapPin size={11} aria-hidden="true" />
            {obra.city}{obra.state && `, ${obra.state}`}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
          {obra.area_m2 && <span>{obra.area_m2.toLocaleString('pt-BR')} m²</span>}
          {obra.expected_end && (
            <span className="flex items-center gap-1">
              <Calendar size={10} aria-hidden="true" />{formatDate(obra.expected_end)}
            </span>
          )}
          {obra.budget && <span>{currency(obra.budget)}</span>}
        </div>
      </Card>
    </Link>
  )
}

function NewObraModal({ open, onClose, onCreate, tenantId, userId }: {
  open: boolean
  onClose: () => void
  onCreate: (payload: Partial<Obra>) => Promise<{ data: Obra | null; error: unknown }>
  tenantId?: string
  userId?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '',
    area_m2: '', budget: '', start_date: '', expected_end: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await onCreate({
      ...form,
      tenant_id: tenantId,
      created_by: userId,
      area_m2: form.area_m2 ? Number(form.area_m2) : undefined,
      budget: form.budget ? Number(form.budget) : undefined,
    })
    setSaving(false)
    if (!error && data) {
      onClose()
      router.push(`/obras/${data.id}`)
    }
  }

  const f = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value })),
  })

  return (
    <Modal open={open} onClose={onClose} title="Nova obra" className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome da obra" {...f('name')} placeholder="Res. Alameda das Flores" required />
        <Input label="Endereço" {...f('address')} placeholder="Rua, número" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Cidade" {...f('city')} placeholder="São Paulo" />
          <Input label="Estado" {...f('state')} placeholder="SP" maxLength={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Área (m²)" type="number" {...f('area_m2')} placeholder="320" />
          <Input label="Orçamento (R$)" type="number" {...f('budget')} placeholder="150000" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Início" type="date" {...f('start_date')} />
          <Input label="Previsão de entrega" type="date" {...f('expected_end')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar obra'}</Button>
        </div>
      </form>
    </Modal>
  )
}
