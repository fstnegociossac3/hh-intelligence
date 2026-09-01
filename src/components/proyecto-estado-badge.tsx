import type { ProyectoEstado } from '@/types'

import { cn } from '@/utils/cn'
import {
  ESTADO_OK,
  ESTADO_WARNING,
  ESTADO_INFO,
  ESTADO_NEUTRO,
  PUNTO_OK,
  PUNTO_WARNING,
  PUNTO_INFO,
  PUNTO_NEUTRO,
} from '@/utils/estados-clases'
import { Badge } from '@/components/ui/badge'

export const PROYECTO_ESTADO_LABEL: Record<ProyectoEstado, string> = {
  borrador: 'Borrador',
  documentacion: 'Documentación cargada',
  en_analisis: 'En análisis',
  observado: 'Observado',
  revisado: 'Revisado',
}

const PROYECTO_ESTADO_CLASES: Record<ProyectoEstado, string> = {
  borrador: ESTADO_NEUTRO,
  documentacion: ESTADO_INFO,
  en_analisis: ESTADO_INFO,
  observado: ESTADO_WARNING,
  revisado: ESTADO_OK,
}

const PROYECTO_ESTADO_PUNTO: Record<ProyectoEstado, string> = {
  borrador: PUNTO_NEUTRO,
  documentacion: PUNTO_INFO,
  en_analisis: PUNTO_INFO,
  observado: PUNTO_WARNING,
  revisado: PUNTO_OK,
}

export function ProyectoEstadoBadge({
  estado,
  className,
}: {
  estado: ProyectoEstado
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        PROYECTO_ESTADO_CLASES[estado],
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          PROYECTO_ESTADO_PUNTO[estado],
        )}
      />
      {PROYECTO_ESTADO_LABEL[estado]}
    </Badge>
  )
}
