'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Input, Button } from '@/components/ui'

export default function LoginPage() {
  const { signIn, user, loading } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(form)
    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      router.replace('/dashboard')
    }
  }

  if (loading) return null

  return (
    <AuthShell title="Entrar na sua conta" subtitle="Gestão de obras e finanças">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="voce@empresa.com"
          required
        />
        <Input
          label="Senha"
          type="password"
          value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          placeholder="••••••••"
          required
        />
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Button type="submit" className="w-full justify-center" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Novo no Inco?{' '}
        <Link href="/register" className="text-[#2C5530] font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children }: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl font-serif text-[#1C2B1E] mb-1">Inco</div>
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
