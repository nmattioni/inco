import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Input, Button } from '../components/ui/index.jsx'
import { CheckCircle, Mail } from 'lucide-react'

// ── Login ─────────────────────────────────────────────────────
export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(form)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <AuthShell title="Entrar na sua conta" subtitle="Gestão de obras e finanças">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="voce@empresa.com" required />
        <Input label="Senha" type="password" value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="••••••••" required />
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Button type="submit" className="w-full justify-center" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Novo no Inco?{' '}
        <Link to="/register" className="text-[#2C5530] font-medium hover:underline">Criar conta</Link>
      </p>
    </AuthShell>
  )
}

// ── Register ──────────────────────────────────────────────────
export function RegisterPage() {
  const { signUp, signUpWithInvite } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [form, setForm] = useState({ fullName: '', email: '', password: '', companyName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)

    const { data, error } = inviteToken
      ? await signUpWithInvite({ ...form, inviteToken })
      : await signUp(form)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data?.session) {
      // Confirmação de email desativada no Supabase → sessão imediata
      navigate('/dashboard')
    } else {
      // Email de confirmação enviado
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell title="" subtitle="Gestão de obras e finanças">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-[#EAF5EC] rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={26} className="text-[#4A9B5C]" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Verifique seu email</h2>
          <p className="text-sm text-gray-500 mb-1">
            Enviamos um link de confirmação para
          </p>
          <p className="text-sm font-medium text-[#2C5530] mb-5">{form.email}</p>
          <p className="text-xs text-gray-400 mb-6">
            Clique no link do email para ativar sua conta e acessar o Inco.
          </p>
          <Link to="/login" className="text-sm text-[#2C5530] font-medium hover:underline">
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={inviteToken ? 'Aceitar convite' : 'Criar sua conta'}
      subtitle={inviteToken ? 'Você foi convidado para uma empresa no Inco' : 'Comece agora, grátis por 14 dias'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome completo" value={form.fullName}
          onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
          placeholder="Ricardo Melo" required />
        {!inviteToken && (
          <Input label="Nome da empresa" value={form.companyName}
            onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
            placeholder="Construtora Melo" required />
        )}
        <Input label="Email" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="voce@empresa.com" required />
        <Input label="Senha" type="password" value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="Mínimo 6 caracteres" minLength={6} required />
        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Button type="submit" className="w-full justify-center" disabled={loading}>
          {loading ? 'Criando conta...' : inviteToken ? 'Entrar na equipe' : 'Criar conta'}
        </Button>
      </form>
      {!inviteToken && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-[#2C5530] font-medium hover:underline">Entrar</Link>
        </p>
      )}
    </AuthShell>
  )
}

// ── Shell ─────────────────────────────────────────────────────
function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl font-serif text-[#1C2B1E] mb-1" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Inco
          </div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#2C5530]/10 shadow-sm p-6">
          <h1 className="text-base font-medium text-gray-900 mb-5">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
