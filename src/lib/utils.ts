import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatBRL(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatDate(date: string | null | undefined, pattern = "dd 'de' MMM, yyyy"): string {
  if (!date) return '—'
  try {
    const d = date.length <= 10 ? parseISO(date) : parseISO(date)
    return format(d, pattern, { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return ''
  return time.slice(0, 5)
}

export function adminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAILS ?? 'igoraguiarviana@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

export function appUrl(): string {
  return import.meta.env.VITE_APP_URL ?? window.location.origin
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
