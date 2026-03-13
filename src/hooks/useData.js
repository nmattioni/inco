import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ── useObras ──────────────────────────────────────────────────
export function useObras() {
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error)
    else setObras(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function createObra(payload) {
    const { data, error } = await supabase.from('obras').insert(payload).select().single()
    if (!error) setObras(prev => [data, ...prev])
    return { data, error }
  }

  async function updateObra(id, payload) {
    const { data, error } = await supabase.from('obras').update(payload).eq('id', id).select().single()
    if (!error) setObras(prev => prev.map(o => o.id === id ? data : o))
    return { data, error }
  }

  async function deleteObra(id) {
    const { error } = await supabase.from('obras').delete().eq('id', id)
    if (!error) setObras(prev => prev.filter(o => o.id !== id))
    return { error }
  }

  return { obras, loading, error, refetch: fetch, createObra, updateObra, deleteObra }
}

// ── useObra (single) ──────────────────────────────────────────
export function useObra(id) {
  const [obra, setObra] = useState(null)
  const [etapas, setEtapas] = useState([])
  const [updates, setUpdates] = useState([])
  const [financialSummary, setFinancialSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const [obraRes, etapasRes, updatesRes, finRes] = await Promise.all([
        supabase.from('obras').select('*').eq('id', id).single(),
        supabase.from('etapas').select('*').eq('obra_id', id).order('order_index'),
        supabase.from('obra_updates').select('*, author:profiles(full_name, avatar_url, role)')
          .eq('obra_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('obra_financial_summary').select('*').eq('obra_id', id).single(),
      ])
      setObra(obraRes.data)
      setEtapas(etapasRes.data || [])
      setUpdates(updatesRes.data || [])
      setFinancialSummary(finRes.data)
      setLoading(false)
    }
    load()
  }, [id])

  async function updateEtapa(etapaId, payload) {
    const { data, error } = await supabase.from('etapas').update(payload).eq('id', etapaId).select().single()
    if (!error) setEtapas(prev => prev.map(e => e.id === etapaId ? data : e))
    return { data, error }
  }

  async function addUpdate(payload) {
    const { data, error } = await supabase.from('obra_updates').insert(payload).select('*, author:profiles(full_name, avatar_url, role)').single()
    if (!error) setUpdates(prev => [data, ...prev])
    return { data, error }
  }

  async function addEtapa(payload) {
    const { data, error } = await supabase.from('etapas').insert({ ...payload, obra_id: id }).select().single()
    if (!error) setEtapas(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index))
    return { data, error }
  }

  return { obra, etapas, updates, financialSummary, loading, updateEtapa, addUpdate, addEtapa }
}

// ── useTransactions ───────────────────────────────────────────
export function useTransactions(filters = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalReceivable: 0, totalPayable: 0, balance: 0 })

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
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
      setTransactions(data)
      const totalReceivable = data.filter(t => t.type === 'receivable' && t.status !== 'cancelled').reduce((s, t) => s + t.amount, 0)
      const totalPayable = data.filter(t => t.type === 'payable' && t.status !== 'cancelled').reduce((s, t) => s + t.amount, 0)
      setSummary({ totalReceivable, totalPayable, balance: totalReceivable - totalPayable })
    }
    setLoading(false)
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  async function createTransaction(payload) {
    const { data, error } = await supabase.from('transactions').insert(payload).select('*, obra:obras(id,name)').single()
    if (!error) { setTransactions(prev => [...prev, data].sort((a,b)=>new Date(a.due_date)-new Date(b.due_date))) }
    return { data, error }
  }

  async function updateTransaction(id, payload) {
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select('*, obra:obras(id,name)').single()
    if (!error) setTransactions(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }

  async function markAsPaid(id) {
    return updateTransaction(id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
  }

  return { transactions, loading, summary, refetch: fetch, createTransaction, updateTransaction, markAsPaid }
}

// ── useTeam ───────────────────────────────────────────────────
export function useTeam() {
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [membersRes, invitesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('active', true).order('created_at'),
        supabase.from('invites').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      ])
      setMembers(membersRes.data || [])
      setInvites(invitesRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function inviteMember({ email, role }) {
    const { data, error } = await supabase.from('invites').insert({ email, role }).select().single()
    if (!error) setInvites(prev => [data, ...prev])
    return { data, error }
  }

  async function updateMemberRole(profileId, role) {
    const { data, error } = await supabase.from('profiles').update({ role }).eq('id', profileId).select().single()
    if (!error) setMembers(prev => prev.map(m => m.id === profileId ? data : m))
    return { data, error }
  }

  async function deactivateMember(profileId) {
    const { error } = await supabase.from('profiles').update({ active: false }).eq('id', profileId)
    if (!error) setMembers(prev => prev.filter(m => m.id !== profileId))
    return { error }
  }

  return { members, invites, loading, inviteMember, updateMemberRole, deactivateMember }
}

// ── useDashboard ──────────────────────────────────────────────
export function useDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [obrasRes, finSummaryRes, upcomingRes] = await Promise.all([
        supabase.from('obras').select('id, status, area_m2'),
        supabase.from('obra_financial_summary').select('*'),
        supabase.from('transactions')
          .select('*, obra:obras(name)')
          .eq('status', 'pending')
          .lte('due_date', new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0])
          .order('due_date'),
        ])

      const obras = obrasRes.data || []
      const finData = finSummaryRes.data || []
      const upcoming = upcomingRes.data || []

      setStats({
        activeObras: obras.filter(o => o.status === 'active').length,
        totalM2: obras.filter(o => o.status === 'active').reduce((s, o) => s + (o.area_m2 || 0), 0),
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
