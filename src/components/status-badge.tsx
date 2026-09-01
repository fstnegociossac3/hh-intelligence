import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import {
  ESTADO_OK,
  ESTADO_WARNING,
  ESTADO_CRITICO,
  ESTADO_INFO,
  PUNTO_OK,
  PUNTO_WARNING,
  PUNTO_CRITICO,
  PUNTO_INFO,
} from '@/utils/estados-clases'
import { Badge } from '@/components/ui/badge'

export type EstadoVisual =
  | 'correcto'
  | 'advertencia'
  | 'critico'
  | 'pendiente'
  | 'procesando'
  | 'completado'

interface EstadoVisualConfig {
  label: string
  icon: LucideIcon
  className: string
  dot: string
  spin?: boolean
}

const CONFIG_ESTADOS: Record<EstadoVisual, EstadoVisualConfig> = {
  correcto: {
    label: 'Correcto',
    icon: CheckCircle2,
    className: ESTADO_OK,
    dot: PUNTO_OK,
  },
  advertencia: {
    label: 'Advertencia',
    icon: AlertTriangle,
    className: ESTADO_WARNING,
    dot: PUNTO_WARNING,
  },
  critico: {
    label: 'Crítico',
    icon: XCircle,
    className: ESTADO_CRITICO,
    dot: PUNTO_CRITICO,
  },
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: ESTADO_INFO,
    dot: PUNTO_INFO,
  },
  procesando: {
    label: 'Procesando',
    icon: Loader2,
    className: ESTADO_INFO,
    dot: PUNTO_INFO,
    spin: true,
  },
  completado: {
    label: 'Completado',
    icon: CheckCircle,
    className: ESTADO_OK,
    dot: PUNTO_OK,
  },
}

interface StatusBadgeProps {
  estado: EstadoVisual
  className?: string
  conIcono?: boolean
  conPunto?: boolean
}

export function StatusBadge({
  estado,
  className,
  conIcono = true,
  conPunto = false,
}: StatusBadgeProps) {
  const config = CONFIG_ESTADOS[estado]
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.className,
        className,
      )}
    >
      {conIcono && (
        <Icon
          className={cn(
            'h-3.5 w-3.5',
            config.spin && 'animate-spin',
          )}
        />
      )}
      {conPunto && !conIcono && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      )}
      {config.label}
    </Badge>
  )
}
