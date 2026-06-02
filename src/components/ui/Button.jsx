import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-400 shadow-[0_10px_28px_-12px_rgba(255,107,44,0.9)]',
  secondary:
    'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] hover:border-white/20',
  outline:
    'border border-white/15 text-zinc-200 hover:bg-white/[0.05] hover:border-white/30 hover:text-white',
  ghost: 'text-zinc-300 hover:bg-white/[0.06] hover:text-white',
  danger:
    'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  success:
    'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
}

const sizes = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-lg',
}

export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  const cls = cn(
    'inline-flex select-none items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:scale-[0.98]',
    variants[variant],
    sizes[size],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}
