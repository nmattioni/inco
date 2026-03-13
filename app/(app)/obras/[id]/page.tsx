'use client'

import { useState } from 'react'
import { use } from 'react'
import { Plus, MapPin, Edit2, CheckCircle2, Circle, Clock } from 'lucide-react'
import { useObra } from '@/hooks/useData'
import { useAuth } from '@/contexts/AuthContext'
import {
  Button, Card, Badge, Modal, Input, Textarea,
  ProgressBar, StatCard, currency, formatDate,
} from '@/components/ui'
import type { Etapa } from '@/lib/supabase'

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  planning:  { label: 'Planejamento', variant: 'blue' },
  active:    { label: 'Em andamento', variant: 'green' },
  paused:    { label: 'Pausada',      variant: 'amber' },
  completed: { label: 'Concluída',    variant: 'gray' },
  cancelled: { label: 'Cancelada',    variant: 'red' },
}

export default function ObraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { can, profile } = useAuth()
  const { obra, etapas, updates, financialSummary, loading, updateEtapa, addUpdate, addEtapa } = useObra(id)
  const [showUpdate, setShowUpdate] = useState(false)
  const [showEtapa, setShowEtapa] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [savingUpdate, setSavingUpdate] = useState(false)

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" aria-label="Carregando...">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!obra) {
    return <div className="text-center py-20 text-gray-400">Obra não encontrada</div>
  }

  const s = STATUS_CONFIG[obra.status] ?? STATUS_CONFIG.active
  const avgProgress = etapas.length
    ? Math.round(etapas.reduce((sum, e) => sum + e.progress_pct, 0) / etapas.length)
    : 0

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!updateText.trim() || !profile) return
    setSavingUpdate(true)
    await addUpdate({
      obra_id: id,
      tenant_id: profile.tenant_id,
      author_id: profile.id,
      content: updateText,
    })
    setUpdateText('')
    setShowUpdate(false)
    setSavingUpdate(false)
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header da obra */}
      <div className="bg-[#1C2B1E] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_80%_50%,#4A9B5C,transparent_60%)]" aria-hidden="true" />
        <div className="relative">
          <Badge variant="green" className="mb-3">{s.label}</Badge>
          <h1 className="text-2xl font-semibold text-[#C8E8CD] mb-1">{obra.name}</h1>
          {obra.address && (
            <p className="text-sm text-[#6DB87B] flex items-center gap-1 mb-4">
              <MapPin size={12} aria-hidden="true" />
              {obra.address}{obra.city ? `, ${obra.city}` : ''}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden mt-4">
            {[
              { label: 'Conclusão', value: `${avgProgress}%` },
              { label: 'Área', value: obra.area_m2 ? `${obra.area_m2} m²` : '—' },
              { label: 'Orçamento', value: obra.budget ? currency(obra.budget) : '—' },
              { label: 'Realizado', value: financialSummary ? currency(financialSummary.paid_out) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 px-4 py-3">
                <p className="text-[10px] text-[#6DB87B] uppercase tracking-wide">{label}</p>
                <p className="text-lg font-semibold text-[#C8E8CD]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Etapas */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Etapas da obra</h2>
          {can('canEditObra') && (
            <Button variant="secondary" size="sm" onClick={() => setShowEtapa(true)}>
              <Plus size={12} /> Etapa
            </Button>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {etapas.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-gray-400">Nenhuma etapa cadastrada</p>
          ) : (
            etapas.map(etapa => (
              <EtapaRow
                key={etapa.id}
                etapa={etapa}
                canEdit={can('canEditObra')}
                onUpdate={updateEtapa}
              />
            ))
          )}
        </div>
      </Card>

      {/* Financeiro da obra */}
      {can('canViewFinancial') && financialSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="A receber" value={currency(financialSummary.total_receivable - financialSummary.received)} accent="green" />
          <StatCard label="Recebido" value={currency(financialSummary.received)} accent="green" />
          <StatCard label="A pagar" value={currency(financialSummary.total_payable - financialSummary.paid_out)} accent="amber" />
          <StatCard label="Pago" value={currency(financialSummary.paid_out)} accent="red" />
        </div>
      )}

      {/* Diário da obra */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Diário da obra</h2>
          {can('canAddUpdate') && (
            <Button variant="secondary" size="sm" onClick={() => setShowUpdate(true)}>
              <Plus size={12} /> Atualização
            </Button>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {updates.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-gray-400">Nenhuma atualização ainda</p>
          ) : (
            updates.map(u => (
              <div key={u.id} className="px-5 py-4 flex gap-3">
                <div
                  className="w-7 h-7 rounded-full bg-[#EAF5EC] flex items-center justify-center text-xs font-medium text-[#2C5530] flex-shrink-0"
                  aria-hidden="true"
                >
                  {u.author?.full_name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">{u.author?.full_name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{u.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Modais */}
      <Modal open={showUpdate} onClose={() => setShowUpdate(false)} title="Adicionar atualização">
        <form onSubmit={handleAddUpdate} className="space-y-4">
          <Textarea
            label="O que aconteceu?"
            value={updateText}
            onChange={e => setUpdateText(e.target.value)}
            rows={4}
            placeholder="Descreva o progresso, ocorrências ou observações..."
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setShowUpdate(false)}>Cancelar</Button>
            <Button type="submit" disabled={savingUpdate}>
              {savingUpdate ? 'Salvando...' : 'Publicar'}
            </Button>
          </div>
        </form>
      </Modal>

      <NewEtapaModal
        open={showEtapa}
        onClose={() => setShowEtapa(false)}
        onAdd={addEtapa}
        obraId={id}
        tenantId={profile?.tenant_id}
        nextIndex={etapas.length}
      />
    </div>
  )
}

function EtapaRow({ etapa, canEdit, onUpdate }: {
  etapa: Etapa
  canEdit: boolean
  onUpdate: (id: string, payload: Partial<Etapa>) => Promise<{ data: Etapa | null; error: unknown }>
}) {
  const [editing, setEditing] = useState(false)
  const [pct, setPct] = useState(etapa.progress_pct)
  const [saving, setSaving] = useState(false)

  const statusIcon =
    etapa.status === 'completed' ? <CheckCircle2 size={14} className="text-[#4A9B5C]" /> :
    etapa.status === 'active' ? <Clock size={14} className="text-amber-500" /> :
    <Circle size={14} className="text-gray-300" />

  async function save() {
    setSaving(true)
    const newStatus: Etapa['status'] = pct === 100 ? 'completed' : pct > 0 ? 'active' : 'pending'
    await onUpdate(etapa.id, {
      progress_pct: pct,
      status: newStatus,
      ...(pct === 100 && !etapa.actual_end ? { actual_end: new Date().toISOString().split('T')[0] } : {}),
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="px-5 py-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true">{statusIcon}</span>
        <span className="text-sm font-medium text-gray-900 flex-1">{etapa.name}</span>
        <span className="text-sm font-semibold text-gray-700 w-10 text-right">{etapa.progress_pct}%</span>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-gray-300 hover:text-[#4A9B5C] transition-colors"
            aria-label="Editar progresso"
          >
            <Edit2 size={12} />
          </button>
        )}
      </div>
      <ProgressBar
        value={etapa.progress_pct}
        className="mt-2 ml-5"
        color={etapa.status === 'completed' ? '#4A9B5C' : etapa.status === 'active' ? '#C8974A' : '#D1D5DB'}
      />
      {editing && (
        <div className="mt-3 ml-5 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={pct}
            onChange={e => setPct(Number(e.target.value))}
            className="flex-1"
            aria-label="Progresso da etapa"
          />
          <span className="text-sm font-medium w-10">{pct}%</span>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? '...' : 'Salvar'}</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setPct(etapa.progress_pct) }}>
            &times;
          </Button>
        </div>
      )}
    </div>
  )
}

function NewEtapaModal({ open, onClose, onAdd, obraId, tenantId, nextIndex }: {
  open: boolean
  onClose: () => void
  onAdd: (payload: Partial<Etapa>) => Promise<{ data: Etapa | null; error: unknown }>
  obraId: string
  tenantId?: string
  nextIndex: number
}) {
  const [form, setForm] = useState({ name: '', expected_end: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onAdd({
      ...form,
      obra_id: obraId,
      tenant_id: tenantId,
      order_index: nextIndex,
    })
    setSaving(false)
    onClose()
    setForm({ name: '', expected_end: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova etapa">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da etapa"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Ex: Revestimento"
          required
        />
        <Input
          label="Previsão de término"
          type="date"
          value={form.expected_end}
          onChange={e => setForm(p => ({ ...p, expected_end: e.target.value }))}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Adicionar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
