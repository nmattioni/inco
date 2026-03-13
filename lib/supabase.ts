import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Inco] Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas. ' +
    'Conecte o Supabase nas configurações do projeto.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key',
)

// ── Types ──────────────────────────────────────────────────────

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
  tenants?: Tenant
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
  author?: Pick<Profile, 'full_name' | 'avatar_url' | 'role'>
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

export interface Invite {
  id: string
  tenant_id: string
  email: string
  role: UserRole
  status: string
  expires_at: string
  created_at: string
}

export interface ObraFinancialSummary {
  obra_id: string
  total_receivable: number
  received: number
  total_payable: number
  paid_out: number
}

// ── Permissões ─────────────────────────────────────────────────

export interface Permissions {
  canManageUsers: boolean
  canManageSettings: boolean
  canCreateObra: boolean
  canEditObra: boolean
  canDeleteObra: boolean
  canViewFinancial: boolean
  canEditFinancial: boolean
  canAddUpdate: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
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
