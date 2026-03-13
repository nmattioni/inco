'use client'

import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  const variants = {
    primary: 'bg-[#2C5530] text-white hover:bg-[#1C2B1E]',
    secondary: 'bg-white border border-[#2C5530]/20 text-[#2C5530] hover:bg-[#EAF5EC]',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  [key: string]: unknown
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#2C5530]/10 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────
const BADGE_VARIANTS: Record<string, string> = {
  green: 'bg-[#EAF5EC] text-[#2C5530]',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-50 text-blue-700',
}

export function Badge({ children, variant = 'gray', className = '' }: {
  children: React.ReactNode
  variant?: string
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.gray} ${className}`}>
      {children}
    </span>
  )
}

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all
          ${error
            ? 'border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-[#4A9B5C] focus:ring-2 focus:ring-[#4A9B5C]/10'
          }
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, children, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <select
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all appearance-none
          ${error ? 'border-red-400' : 'border-gray-200 focus:border-[#4A9B5C] focus:ring-2 focus:ring-[#4A9B5C]/10'}
          ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none resize-none transition-all
          ${error ? 'border-red-400' : 'border-gray-200 focus:border-[#4A9B5C] focus:ring-2 focus:ring-[#4A9B5C]/10'}
          ${className}`}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, className = '' }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full max-w-md ${className}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, delta, icon: Icon, accent = 'green' }: {
  label: string
  value: string | number
  delta?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  accent?: 'green' | 'amber' | 'red' | 'blue'
}) {
  const accents = {
    green: { bg: 'bg-[#EAF5EC]', icon: 'text-[#4A9B5C]' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500' },
    red:   { bg: 'bg-red-50',   icon: 'text-red-500' },
    blue:  { bg: 'bg-blue-50',  icon: 'text-blue-500' },
  }
  const a = accents[accent]
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {delta && (
            <p className={`text-xs mt-1 ${delta.startsWith('+') ? 'text-[#4A9B5C]' : 'text-red-500'}`}>{delta}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg ${a.bg}`}>
            <Icon size={18} className={a.icon} />
          </div>
        )}
      </div>
    </Card>
  )
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value, className = '', color = '#4A9B5C' }: {
  value: number
  className?: string
  color?: string
}) {
  return (
    <div className={`h-1.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
          <Icon size={22} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`w-6 h-6 border-2 border-[#4A9B5C] border-t-transparent rounded-full animate-spin ${className}`} />
  )
}

// ── Helpers ───────────────────────────────────────────────────
export function currency(val?: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val ?? 0)
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function daysUntil(dateStr?: string | null) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
