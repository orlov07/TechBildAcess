import { cn } from '@/lib/utils'

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent shadow-glow">
        <span className="text-lg font-black text-white">A</span>
      </div>
      {showText && (
        <span className="text-[17px] font-extrabold tracking-tight text-slate-100">
          TechBild<span className="text-brand-400">Acess</span>
        </span>
      )}
    </div>
  )
}
