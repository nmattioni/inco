'use client'

import { useState } from 'react'
import { Settings, Building2, User, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, Input } from '@/components/ui'
import { supabase } from '@/lib/supabase'

export default function ConfiguracoesPage() {
  const { profile, tenant, can } = useAuth()

  if (!can('canManageSettings')) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Você não tem permissão para acessar as configurações.
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Settings size={20} className="text-gray-400" />
          Configurações
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie sua conta e empresa</p>
      </div>

      <ProfileSection profile={profile} />
      {tenant && <CompanySection tenant={tenant} />}
    </div>
  )
}

function ProfileSection({ profile }: { profile: ReturnType<typeof useAuth>['profile'] }) {
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <User size={15} className="text-gray-400" />
        <h2 className="text-sm font-medium text-gray-900">Perfil</h2>
      </div>
      <form onSubmit={handleSave} className="p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EAF5EC] flex items-center justify-center text-base font-semibold text-[#2C5530]">
            {profile?.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
            <p className="text-xs text-gray-400">{profile?.email}</p>
          </div>
        </div>
        <Input
          label="Nome completo"
          value={form.full_name}
          onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
          placeholder="Seu nome"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Email não pode ser alterado aqui.</p>
          <Button type="submit" size="sm" disabled={saving}>
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CompanySection({ tenant }: { tenant: ReturnType<typeof useAuth>['tenant'] }) {
  const [form, setForm] = useState({ name: tenant?.name ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!tenant?.id) return
    setSaving(true)
    await supabase.from('tenants').update({ name: form.name }).eq('id', tenant.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Building2 size={15} className="text-gray-400" />
        <h2 className="text-sm font-medium text-gray-900">Empresa</h2>
      </div>
      <form onSubmit={handleSave} className="p-5 space-y-4">
        <Input
          label="Nome da empresa"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Nome da sua empresa"
        />
        <div className="grid grid-cols-2 gap-4 py-2 border-t border-gray-50 mt-2">
          <div>
            <p className="text-xs text-gray-400">Plano atual</p>
            <p className="text-sm font-medium text-gray-900 capitalize mt-0.5">{tenant?.plan ?? 'free'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Slug</p>
            <p className="text-sm font-mono text-gray-600 mt-0.5">{tenant?.slug}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving}>
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
