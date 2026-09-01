import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icono: LucideIcon
  titulo: string
  descripcion?: string
  children?: ReactNode
  className?: string
}

export function EmptyState({
  icono: Icono,
  titulo,
  descripcion,
  children,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icono className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold">{titulo}</h3>
        {descripcion && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {descripcion}
          </p>
        )}
      </div>
      {children && <div className="mt-1">{children}</div>}
    </motion.div>
  )
}
