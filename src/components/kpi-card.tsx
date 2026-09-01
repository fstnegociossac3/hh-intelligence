import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface KpiCardProps {
  titulo: string
  valor: string | number
  detalle?: string
  icono: LucideIcon
  tono?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  tendencia?: {
    valor: string
    positiva?: boolean
  }
  className?: string
}

const TONOS_ICONO: Record<
  NonNullable<KpiCardProps['tono']>,
  string
> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
}

export function KpiCard({
  titulo,
  valor,
  detalle,
  icono: Icono,
  tono = 'default',
  tendencia,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            TONOS_ICONO[tono],
          )}
        >
          <Icono className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">{valor}</div>
          {tendencia && (
            <span
              className={cn(
                'text-xs font-medium',
                tendencia.positiva
                  ? 'text-success'
                  : 'text-destructive',
              )}
            >
              {tendencia.valor}
            </span>
          )}
        </div>
        {detalle && (
          <CardDescription className="mt-1 text-xs">
            {detalle}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
