'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Obra, Etapa, ObraUpdate, ObraFinancialSummary, Transaction, Profile, Invite } from '@/lib/supabase'

// ── useObras ──────────────────────────────────────────────────
export function useObras() {
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchObras = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error as unknown as Error)
    else setObras(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchObras() }, [fetchObras])

  async function createObra(payload: Partial<Obra>) {
    const { data, error } = await supabase.from('obras').insert(payload).select().single()
    if (!error && data) setObras(prev => [data as Obra, ...prev])
    return { data: data as Obra | null, error }
  }

  async function updateObra(id: string, payload: Partial<Obra>) {
    const { data, error } = await supabase.from('obras').update(payload).eq('id', id).select().single()
    if (!error && data) setObras(prev => prev.map(o => o.id === id ? data as Obra : o))
    return { data: data as Obra | null, error }
  }

  async function deleteObra(id: string) {
    const { error } = await supabase.from('obras').delete().eq('id', id)
    if (!error) setObras(prev => prev.filter(o => o.id !== id))
    return { error }
  }

  return { obras, loading, error, refetch: fetchObras, createObra, updateObra, deleteObra }
}

// ── useObra (single) ──────────────────────────────────────────
export function useObra(id: string | undefined) {
  const [obra, setObra] = useState<Obra | null>(null)
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [updates, setUpdates] = useState<ObraUpdate[]>([])
  const [financialSummary, setFinancialSummary] = useState<ObraFinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const [obraRes, etapasRes, updatesRes, finRes] = await Promise.all([
        supabase.from('obras').select('*').eq('id', id).single(),
        supabase.from('etapas').select('*').eq('obra_id', id).order('order_index'),
        supabase
          .from('obra_updates')
          .select('*, author:profiles(full_name, avatar_url, role)')
          .eq('obra_id', id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('obra_financial_summary').select('*').eq('obra_id', id).single(),
      ])
      setObra(obraRes.data as Obra | null)
      setEtapas((etapasRes.data ?? []) as Etapa[])
      setUpdates((updatesRes.data ?? []) as ObraUpdate[])
      setFinancialSummary(finRes.data as ObraFinancialSummary | null)
      setLoading(false)
    }
    load()
  }, [id])

  async function updateEtapa(etapaId: string, payload: Partial<Etapa>) {
    const { data, error } = await supabase.from('etapas').update(payload).eq('id', etapaId).select().single()
    if (!error && data) setEtapas(prev => prev.map(e => e.id === etapaId ? data as Etapa : e))
    return { data: data as Etapa | null, error }
  }

  async function addUpdate(payload: Partial<ObraUpdate>) {
    const { data, error } = await supabase
      .from('obra_updates')
      .insert(payload)
      .select('*, author:profiles(full_name, avatar_url, role)')
      .single()
    if (!error && data) setUpdates(prev => [data as ObraUpdate, ...prev])
    return { data: data as ObraUpdate | null, error }
  }

  async function addEtapa(payload: Partial<Etapa>) {
    const { data, error } = await supabase
      .from('etapas')
      .insert({ ...payload, obra_id: id })
      .select()
      .single()
    if (!error && data) {
      setEtapas(prev => [...prev, data as Etapa].sort((a, b) => a.order_index - b.order_index))
    }
    return { data: data as Etapa | null, error }
  }

  return { obra, etapas, updates, financialSummary, loading, updateEtapa, addUpdate, addEtapa }
}

// ── useTransactions ───────────────────────────────────────────
interface TransactionFilters {
  obra_id?: string
  type?: string
  status?: string
  month?: string
}

export function useTransactions(filters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalReceivable: 0, totalPayable: 0, balance: 0 })

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('transactions')
      .select('*, obra:obras(id,name)')
      .order('due_date', { ascending: true })

    if (filters.obra_id) query = query.eq('obra_id', filters.obra_id)
    if (filters.type) query = query.eq('type', filters.type)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.month) {
      const [y, m] = filters.month.split('-')
      query = query.gte('due_date', `${y}-${m}-01`).lte('due_date', `${y}-${m}-31`)
    }

    const { data, error } = await query
    if (!error && data) {
      setTransactions(data as Transaction[])
      const totalReceivable = (data as Transaction[])
        .filter(t => t.type === 'receivable' && t.status !== 'cancelled')
        .reduce((s, t) => s + t.amount, 0)
      const totalPayable = (data as Transaction[])
        .filter(t => t.type === 'payable' && t.status !== 'cancelled')
        .reduce((s, t) => s + t.amount, 0)
      setSummary({ totalReceivable, totalPayable, balance: totalReceivable - totalPayable })
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function createTransaction(payload: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select('*, obra:obras(id,name)')
      .single()
    if (!error && data) {
      setTransactions(prev =>
        [...prev, data as Transaction].sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
        ),
      )
    }
    return { data: data as Transaction | null, error }
  }

  async function updateTransaction(id: string, payload: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select('*, obra:obras(id,name)')
      .single()
    if (!error && data) setTransactions(prev => prev.map(t => t.id === id ? data as Transaction : t))
    return { data: data as Transaction | null, error }
  }

  async function markAsPaid(id: string) {
    return updateTransaction(id, {
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    })
  }

  return { transactions, loading, summary, refetch: fetchTransactions, createTransaction, updateTransaction, markAsPaid }
}

// ── useTeam ───────────────────────────────────────────────────
export function useTeam() {
  const [members, setMembers] = useState<Profile[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('active', true).order('created_at'),
        supabase.from('invites').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      ])
      setMembers((membersRes.data ?? []) as Profile[])
      setInvites((invitesRes.data ?? []) as Invite[])
      setLoading(false)
    }
    load()
  }, [])

  async function inviteMember({ email, role }: { email: string; role: string }) {
    const { data, error } = await supabase.from('invites').insert({ email, role }).select().single()
    if (!error && data) setInvites(prev => [data as Invite, ...prev])
    return { data, error }
  }

  async function updateMemberRole(profileId: string, role: string) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select()
      .single()
    if (!error && data) setMembers(prev => prev.map(m => m.id === profileId ? data as Profile : m))
    return { data, error }
  }

  async function deactivateMember(profileId: string) {
    const { error } = await supabase.from('profiles').update({ active: false }).eq('id', profileId)
    if (!error) setMembers(prev => prev.filter(m => m.id !== profileId))
    return { error }
  }

  return { members, invites, loading, inviteMember, updateMemberRole, deactivateMember }
}

// ── useDashboard ──────────────────────────────────────────────
interface DashboardStats {
  activeObras: number
  totalM2: number
  totalReceivable: number
  totalPayable: number
  upcomingTransactions: Transaction[]
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const [obrasRes, finSummaryRes, upcomingRes] = await Promise.all([
        supabase.from('obras').select('id, status, area_m2'),
        supabase.from('obra_financial_summary').select('*'),
        supabase
          .from('transactions')
          .select('*, obra:obras(name)')
          .eq('status', 'pending')
          .lte('due_date', in7days)
          .order('due_date'),
      ])

      const obras = (obrasRes.data ?? []) as Array<{ id: string; status: string; area_m2?: number }>
      const finData = (finSummaryRes.data ?? []) as ObraFinancialSummary[]
      const upcoming = (upcomingRes.data ?? []) as Transaction[]

      setStats({
        activeObras: obras.filter(o => o.status === 'active').length,
        totalM2: obras.filter(o => o.status === 'active').reduce((s, o) => s + (o.area_m2 ?? 0), 0),
        totalReceivable: finData.reduce((s, f) => s + (f.total_receivable - f.received), 0),
        totalPayable: finData.reduce((s, f) => s + (f.total_payable - f.paid_out), 0),
        upcomingTransactions: upcoming,
      })
      setLoading(false)
    }
    load()
  }, [])

  return { stats, loading }
}
