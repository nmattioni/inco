import { useState } from 'react'
import { Plus, ArrowUpCircle, ArrowDownCircle, CheckCircle } from 'lucide-react'
import { useTransactions } from '../hooks/useData'
import { useAuth } from '../contexts/AuthContext'
import {
  Button, Card, Badge, Modal, Input, Select, Textarea,
  StatCard, EmptyState, currency, formatDate, daysUntil
} from '../components/ui/index.jsx'

const STATUS_CONFIG = {
  pending:   { label: 'Pendente',   variant: 'amber' },
  paid:      { label: 'Pago',       variant: 'green' },
  overdue:   { label: 'Vencido',    variant: 'red' },
  cancelled: { label: 'Cancelado',  variant: 'gray' },
}

const CATEGORIES = ['Mão de obra', 'Material', 'Equipamentos', 'Serviços', 'Parcela cliente', 'Sinal', 'Reembolso', 'Outros']

export default function FinanceiroPage() {
  const { profile, can } = useAuth()
  const [filters, setFilters] = useState({ type: '', status: '', month: '' })
  const { transactions, loading, summary, createTransaction, markAsPaid } = useTransactions(filters)
  const [showNew, setShowNew] = useState(false)
  const [typeNew, setTypeNew] = useState('payable')

  if (!can('canViewFinancial')) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Você não tem acesso ao módulo financeiro.
    </div>
  )

  function openNew(type) { setTypeNew(type); setShowNew(true) }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500">Contas a pagar e a receber</p>
        </div>
        {can('canEditFinancial') && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => openNew('payable')}>
              <ArrowDownCircle size={14} className="text-red-500" /> A pagar
            </Button>
            <Button onClick={() => openNew('receivable')}>
              <ArrowUpCircle size={14} /> A receber
            </Button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="A receber" value={currency(summary.totalReceivable)} accent="green" icon={ArrowUpCircle} />
        <StatCard label="A pagar" value={currency(summary.totalPayable)} accent="amber" icon={ArrowDownCircle} />
        <StatCard
          label="Saldo previsto"
          value={currency(summary.balance)}
          accent={summary.balance >= 0 ? 'green' : 'red'}
          icon={summary.balance >= 0 ? ArrowUpCircle : ArrowDownCircle}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#4A9B5C] bg-white"
          value={filters.type} onChange={e => setFilters(p => ({...p, type: e.target.value}))}>
          <option value="">Tipo: todos</option>
          <option value="receivable">A receber</option>
          <option value="payable">A pagar</option>
        </select>
        <select className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#4A9B5C] bg-white"
          value={filters.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))}>
          <option value="">Status: todos</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="month" className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#4A9B5C] bg-white"
          value={filters.month} onChange={e => setFilters(p => ({...p, month: e.target.value}))} />
        {(filters.type || filters.status || filters.month) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({type:'',status:'',month:''})}>Limpar filtros</Button>
        )}
      </div>

      {/* Transactions list */}
      <Card>
        {loading ? (
          <div className="divide-y">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-gray-100 m-2 rounded-lg" />)}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ArrowUpCircle}
            title="Nenhum lançamento encontrado"
            description="Registre suas entradas e saídas para acompanhar o fluxo de caixa."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(t => <TransactionRow key={t.id} t={t} canEdit={can('canEditFinancial')} onMarkPaid={markAsPaid} />)}
          </div>
        )}
      </Card>

      <NewTransactionModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createTransaction}
        defaultType={typeNew}
        tenantId={profile?.tenant_id}
        userId={profile?.id}
      />
    </div>
  )
}

function TransactionRow({ t, canEdit, onMarkPaid }) {
  const [paying, setPaying] = useState(false)
  const isReceivable = t.type === 'receivable'
  const s = STATUS_CONFIG[t.status]
  const days = daysUntil(t.due_date)

  async function handlePay() {
    setPaying(true)
    await onMarkPaid(t.id)
    setPaying(false)
  }

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isReceivable ? 'bg-[#EAF5EC]' : 'bg-red-50'}`}>
        {isReceivable
          ? <ArrowUpCircle size={14} className="text-[#4A9B5C]" />
          : <ArrowDownCircle size={14} className="text-red-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
        <p className="text-xs text-gray-400">
          {t.obra?.name ?? 'Sem obra'} · {t.category ?? 'Sem categoria'} · Vence {formatDate(t.due_date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={s.variant}>{s.label}</Badge>
        {t.status === 'pending' && days !== null && days <= 7 && (
          <Badge variant={days < 0 ? 'red' : 'amber'}>
            {days < 0 ? `${Math.abs(days)}d atraso` : days === 0 ? 'Hoje' : `${days}d`}
          </Badge>
        )}
        <span className={`text-sm font-semibold min-w-[80px] text-right ${isReceivable ? 'text-[#2C5530]' : 'text-red-600'}`}>
          {isReceivable ? '+' : '-'}{currency(t.amount)}
        </span>
        {canEdit && t.status === 'pending' && (
          <button onClick={handlePay} disabled={paying}
            className="flex items-center gap-1 text-xs text-[#4A9B5C] hover:text-[#2C5530] disabled:opacity-50 transition-colors">
            <CheckCircle size={13} />
            {paying ? '...' : 'Marcar pago'}
          </button>
        )}
      </div>
    </div>
  )
}

function NewTransactionModal({ open, onClose, onCreate, defaultType, tenantId, userId }) {
  const [form, setForm] = useState({
    description: '', amount: '', type: defaultType,
    due_date: '', category: '', notes: '', obra_id: ''
  })
  const [saving, setSaving] = useState(false)

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onCreate({
      ...form,
      amount: +form.amount,
      tenant_id: tenantId,
      created_by: userId,
      obra_id: form.obra_id || null,
    })
    setSaving(false); onClose()
    setForm({ description: '', amount: '', type: defaultType, due_date: '', category: '', notes: '', obra_id: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo lançamento" className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Tipo" {...f('type')}>
          <option value="payable">A pagar (saída)</option>
          <option value="receivable">A receber (entrada)</option>
        </Select>
        <Input label="Descrição" {...f('description')} placeholder="Ex: Parcela 2 — cliente Silva" required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Valor (R$)" type="number" min="0.01" step="0.01" {...f('amount')} placeholder="0,00" required />
          <Input label="Vencimento" type="date" {...f('due_date')} required />
        </div>
        <Select label="Categoria" {...f('category')}>
          <option value="">Selecionar...</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Textarea label="Observações" {...f('notes')} placeholder="Notas opcionais..." rows={2} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar lançamento'}</Button>
        </div>
      </form>
    </Modal>
  )
}
