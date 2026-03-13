import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'placeholder' || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
  console.warn('[Inco] Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. Verifique a integração Supabase no Vercel.')
}

export const supabase = createClient(
  supabaseUrl && supabaseUrl !== 'placeholder' ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey && supabaseAnonKey !== 'placeholder' ? supabaseAnonKey : 'placeholder-anon-key',
)

// ── Types ─────────────────────────────────────────────────────

export type UserRole = 'owner' | 'manager' | 'financial' | 'operational' | 'viewer'
export type ObraStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
export type EtapaStatus = 'pending' | 'active' | 'completed'
export type TransactionType = 'receivable' | 'payable'
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  plan: string
  created_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  active: boolean
  created_at: string
}

export interface Obra {
  id: string
  tenant_id: string
  name: string
  address?: string
  city?: string
  state?: string
  area_m2?: number
  budget?: number
  status: ObraStatus
  start_date?: string
  expected_end?: string
  actual_end?: string
  notes?: string
  cover_url?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Etapa {
  id: string
  tenant_id: string
  obra_id: string
  name: string
  description?: string
  order_index: number
  status: EtapaStatus
  progress_pct: number
  start_date?: string
  expected_end?: string
  actual_end?: string
  created_at: string
}

export interface ObraUpdate {
  id: string
  tenant_id: string
  obra_id: string
  etapa_id?: string
  author_id: string
  content: string
  photos: string[]
  created_at: string
  author?: Profile
}

export interface Transaction {
  id: string
  tenant_id: string
  obra_id?: string
  contact_id?: string
  type: TransactionType
  status: TransactionStatus
  description: string
  amount: number
  due_date: string
  paid_date?: string
  category?: string
  notes?: string
  attachment_url?: string
  created_by?: string
  created_at: string
  obra?: Pick<Obra, 'id' | 'name'>
}

export interface Contact {
  id: string
  tenant_id: string
  name: string
  type: string
  email?: string
  phone?: string
  document?: string
  notes?: string
}

// Permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, {
  canManageUsers: boolean
  canManageSettings: boolean
  canCreateObra: boolean
  canEditObra: boolean
  canDeleteObra: boolean
  canViewFinancial: boolean
  canEditFinancial: boolean
  canAddUpdate: boolean
}> = {
  owner: {
    canManageUsers: true,
    canManageSettings: true,
    canCreateObra: true,
    canEditObra: true,
    canDeleteObra: true,
    canViewFinancial: true,
    canEditFinancial: true,
    canAddUpdate: true,
  },
  manager: {
    canManageUsers: true,
    canManageSettings: false,
    canCreateObra: true,
    canEditObra: true,
    canDeleteObra: false,
    canViewFinancial: true,
    canEditFinancial: true,
    canAddUpdate: true,
  },
  financial: {
    canManageUsers: false,
    canManageSettings: false,
    canCreateObra: false,
    canEditObra: false,
    canDeleteObra: false,
    canViewFinancial: true,
    canEditFinancial: true,
    canAddUpdate: false,
  },
  operational: {
    canManageUsers: false,
    canManageSettings: false,
    canCreateObra: true,
    canEditObra: true,
    canDeleteObra: false,
    canViewFinancial: false,
    canEditFinancial: false,
    canAddUpdate: true,
  },
  viewer: {
    canManageUsers: false,
    canManageSettings: false,
    canCreateObra: false,
    canEditObra: false,
    canDeleteObra: false,
    canViewFinancial: false,
    canEditFinancial: false,
    canAddUpdate: false,
  },
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  financial: 'Financeiro',
  operational: 'Operacional',
  viewer: 'Visualizador',
}
