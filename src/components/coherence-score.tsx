import { motion } from 'framer-motion'
import { Gauge, Sparkles, TriangleAlert, CircleAlert, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, PROGRESO_OK, PROGRESO_WARNING, PROGRESO_CRITICO } from '@/utils/estados-clases'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FadeIn } from '@/components/ui/motion'

export interface RelacionCoherencia {
  label: string
  score: number
}

interface CoherenceScoreProps {
  puntaje: number
  relaciones?: RelacionCoherencia[]
  titulo?: string
  descripcion?: string
  className?: string
}

type Clasificacion = {
  label: string
  rango: string
  tono: 'success' | 'warning' | 'danger' | 'excellent'
  icono: LucideIcon
}

function clasificar(puntaje: number): Clasificacion {
  if (puntaje >= 90)
    return {
      label: 'Excelente',
      rango: '90 a 100',
      tono: 'excellent',
      icono: CheckCircle2,
    }
  if (puntaje >= 75)
    return { label: 'Bueno', rango: '75 a 89', tono: 'success', icono: CheckCircle2 }
  if (puntaje >= 60)
    return {
      label: 'Requiere revisión',
      rango: '60 a 74',
      tono: 'warning',
      icono: TriangleAlert,
    }
  return { label: 'Crítico', rango: '0 a 59', tono: 'danger', icono: CircleAlert }
}

const BARRA_CLASES: Record<Clasificacion['tono'], string> = {
  excellent: PROGRESO_OK,
  success: PROGRESO_OK,
  warning: PROGRESO_WARNING,
  danger: PROGRESO_CRITICO,
}

const BADGE_CLASES: Record<Clasificacion['tono'], string> = {
  excellent: ESTADO_OK,
  success: ESTADO_OK,
  warning: ESTADO_WARNING,
  danger: ESTADO_CRITICO,
}

const RING_CLASES: Record<Clasificacion['tono'], string> = {
  excellent: 'text-success',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
}

export function CoherenceScore({
  puntaje,
  relaciones = [],
  titulo = 'Coherencia del expediente',
  descripcion,
  className,
}: CoherenceScoreProps) {
  const clasif = clasificar(puntaje)
  const ClasIcono = clasif.icono

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-primary" />
          {titulo}
        </CardTitle>
        {descripcion && (
          <p className="hidden text-xs text-muted-foreground sm:block">{descripcion}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="4"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="100"
                initial={{ strokeDashoffset: 100 }}
                animate={{
                  strokeDashoffset: 100 - puntaje,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full w-full text-center', RING_CLASES[clasif.tono])}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tracking-tight tabular-nums">
                {puntaje}%
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={BADGE_CLASES[clasif.tono]}>
                <ClasIcono className="mr-1 h-3.5 w-3.5" />
                {clasif.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{clasif.rango}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Score general de consistencia entre los documentos del expediente.
            </p>
          </div>
        </div>

        {relaciones.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Coherencia por tipo de revisión
            </p>
            {relaciones.map((r, i) => {
              const c = clasificar(r.score)
              return (
                <FadeIn key={r.label} delay={i * 0.05}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          r.score >= 60 ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {r.score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={r.score}
                        className={cn('h-2', BARRA_CLASES[c.tono])}
                      />
                      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                        {c.label}
                      </span>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}