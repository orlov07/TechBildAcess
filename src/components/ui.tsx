import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------- Button -------------------------------- */
type Variant = 'primary' | 'ghost' | 'danger'
export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-ghost'
  return (
    <button className={cn(base, className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

/* -------------------------------- Card --------------------------------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card p-5', className)}>{children}</div>
}

/* ------------------------------- Inputs -------------------------------- */
export function Field({ label, hint, children }: { label?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('input', props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('input min-h-[92px] resize-y', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn('input appearance-none pr-9', props.className)}>
      {props.children}
    </select>
  )
}

/* ------------------------------- Badge --------------------------------- */
const badgeTones: Record<string, string> = {
  brand: 'bg-brand-500/15 text-brand-200',
  green: 'bg-success/15 text-success',
  red: 'bg-danger/15 text-danger',
  yellow: 'bg-warn/15 text-warn',
  slate: 'bg-slate-500/15 text-slate-300',
  cyan: 'bg-accent/15 text-accent',
}
export function Badge({ tone = 'slate', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={cn('chip', badgeTones[tone])}>{children}</span>
}

/* ------------------------------ Spinner -------------------------------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-400', className)} />
}

export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400">
      <Spinner className="h-7 w-7" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

/* ----------------------------- EmptyState ------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-bg-soft/50 px-6 py-14 text-center">
      {icon && <div className="text-brand-400">{icon}</div>}
      <div>
        <p className="font-semibold text-slate-200">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------ StatCard ------------------------------- */
export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  tone?: keyof typeof badgeTones
}) {
  return (
    <div className="card flex items-center justify-between gap-4 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-100">{value}</p>
      </div>
      {icon && (
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', badgeTones[tone])}>
          {icon}
        </div>
      )}
    </div>
  )
}

/* ------------------------------- Modal --------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={cn(
          'card max-h-[92vh] w-full overflow-y-auto rounded-b-none rounded-t-2xl p-5 sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-bg-elevated hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
