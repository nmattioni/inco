'use client'

import { useState } from 'react'
import { Users, Mail, Plus, Trash2, Edit2 } from 'lucide-react'
import { useTeam } from '@/hooks/useData'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Card, Badge, Modal, Input, Select, EmptyState } from '@/components/ui'
import { ROLE_LABELS } from '@/lib/supabase'
import type { Profile, Invite } from '@/lib/supabase'

const ROLE_COLORS: Record<string, string> = {
  owner:       'green',
  manager:     'blue',
  financial:   'amber',
  operational: 'gray',
  viewer:      'gray',
}

export default function EquipePage() {
  const { can, profile } = useAuth()
  const { members, invites, loading, inviteMember, updateMemberRole, deactivateMember } = useTeam()
  const [showInvite, setShowInvite] = useState(false)
  const [editMember, setEditMember] = useState<Profile | null>(null)

  if (!can('canManageUsers')) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Você não tem permissão para gerenciar a equipe.
    </div>
  )

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Equipe</h1>
          <p className="text-sm text-gray-500">{members.length} membros ativos</p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <Plus size={14} /> Convidar membro
        </Button>
      </div>

      {/* Members */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-900">Membros ativos</h2>
        </div>
        {loading ? (
          <div className="divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse m-3 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum membro" description="Convide colaboradores para começar." />
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map(member => (
              <div key={member.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EAF5EC] flex items-center justify-center text-xs font-medium text-[#2C5530] flex-shrink-0">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                    {member.id === profile?.id && <span className="text-xs text-gray-400">(você)</span>}
                  </div>
                  <p className="text-xs text-gray-400">{member.email}</p>
                </div>
                <Badge variant={ROLE_COLORS[member.role] ?? 'gray'}>{ROLE_LABELS[member.role]}</Badge>
                {member.id !== profile?.id && profile?.role === 'owner' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditMember(member)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Editar cargo"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => deactivateMember(member.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remover membro"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              Convites pendentes
              <Badge variant="amber">{invites.length}</Badge>
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {invites.map((inv: Invite) => (
              <div key={inv.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{inv.email}</p>
                  <p className="text-xs text-gray-400">
                    Expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="amber">{ROLE_LABELS[inv.role]}</Badge>
                <Badge variant="amber">Pendente</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Permissions table */}
      <Card className="p-5">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Permissões por cargo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="pb-2 text-gray-400 font-medium">Permissão</th>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <th key={k} className="pb-2 text-gray-600 font-medium text-center px-2">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {([
                ['Ver obras',          [true, true, false, true, true]],
                ['Criar/editar obras', [true, true, false, true, false]],
                ['Atualizar etapas',   [true, true, false, true, false]],
                ['Ver financeiro',     [true, true, true,  false, false]],
                ['Criar lançamentos',  [true, true, true,  false, false]],
                ['Gerenciar equipe',   [true, true, false, false, false]],
                ['Configurações',      [true, false, false, false, false]],
              ] as [string, boolean[]][]).map(([perm, vals]) => (
                <tr key={perm}>
                  <td className="py-2 text-gray-600">{perm}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="py-2 text-center px-2">
                      <span className={v ? 'text-[#4A9B5C]' : 'text-gray-300'}>{v ? '✓' : '—'}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} onInvite={inviteMember} />
      {editMember && (
        <EditRoleModal
          open={!!editMember}
          member={editMember}
          onClose={() => setEditMember(null)}
          onSave={updateMemberRole}
        />
      )}
    </div>
  )
}

function InviteModal({
  open,
  onClose,
  onInvite,
}: {
  open: boolean
  onClose: () => void
  onInvite: (args: { email: string; role: string }) => Promise<{ error: unknown }>
}) {
  const [form, setForm] = useState({ email: '', role: 'operational' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await onInvite(form)
    setSaving(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        setForm({ email: '', role: 'operational' })
      }, 2000)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Convidar membro">
      {success ? (
        <div className="text-center py-6">
          <Mail size={32} className="text-[#4A9B5C] mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Convite criado!</p>
          <p className="text-xs text-gray-500 mt-1">Compartilhe o link de cadastro com o colaborador.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email do colaborador"
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="colaborador@empresa.com"
            required
          />
          <Select
            label="Cargo"
            value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
          >
            {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            O colaborador receberá um link para criar a conta e entrar na sua empresa.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Enviar convite'}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function EditRoleModal({
  open,
  member,
  onClose,
  onSave,
}: {
  open: boolean
  member: Profile
  onClose: () => void
  onSave: (id: string, role: string) => Promise<unknown>
}) {
  const [role, setRole] = useState(member.role)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(member.id, role)
    setSaving(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Alterar cargo — ${member.full_name}`}>
      <div className="space-y-4">
        <Select label="Novo cargo" value={role} onChange={e => setRole(e.target.value)}>
          {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </div>
    </Modal>
  )
}
