import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  AlertTriangle,
  FileStack,
  Tag,
  FileScan,
  ListOrdered,
  Shapes,
  Link2,
  CircleCheck,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_INFO, ESTADO_NEUTRO, ESTADO_CRITICO, PROGRESO_OK, PROGRESO_CRITICO } from '@/utils/estados-clases'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type EstadoEtapa = 'pendiente' | 'procesando' | 'completado' | 'error'

interface Etapa {
  id: string
  titulo: string
  descripcion: string
  icono: typeof FileStack
  duracion: number
  mensaje: string
}

const ETAPAS: Etapa[] = [
  {
    id: 'preparar',
    titulo: 'Preparando archivos',
    descripcion: 'Normalizando y validando el expediente.',
    icono: FileStack,
    duracion: 1800,
    mensaje: '6 documentos preparados',
  },
  {
    id: 'clasificar',
    titulo: 'Clasificando documentos',
    descripcion: 'Asignando categorías y especialidades.',
    icono: Tag,
    duracion: 2200,
    mensaje: '6 documentos clasificados',
  },
  {
    id: 'extraer',
    titulo: 'Extrayendo información',
    descripcion: 'Extrayendo texto y datos estructurados.',
    icono: FileScan,
    duracion: 2600,
    mensaje: '6 documentos procesados',
  },
  {
    id: 'identificar-partidas',
    titulo: 'Identificando partidas',
    descripcion: 'Detección de partidas y metrados.',
    icono: ListOrdered,
    duracion: 2400,
    mensaje: '183 partidas identificadas',
  },
  {
    id: 'detectar-elementos',
    titulo: 'Detectando elementos',
    descripcion: 'Reconociendo elementos constructivos en planos.',
    icono: Shapes,
    duracion: 2800,
    mensaje: '42 elementos detectados',
  },
  {
    id: 'relacionar',
    titulo: 'Relacionando documentos',
    descripcion: 'Construyendo relaciones entre documentos.',
    icono: Link2,
    duracion: 2500,
    mensaje: '162 relaciones encontradas',
  },
  {
    id: 'finalizar',
    titulo: 'Finalizando análisis',
    descripcion: 'Consolidando resultados y coherencia.',
    icono: CircleCheck,
    duracion: 1500,
    mensaje: 'Análisis completado',
  },
]

const ESTADO_LABEL: Record<EstadoEtapa, string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  completado: 'Completado',
  error: 'Error',
}

const ESTADO_CLASE: Record<EstadoEtapa, string> = {
  pendiente: ESTADO_NEUTRO,
  procesando: ESTADO_INFO,
  completado: ESTADO_OK,
  error: ESTADO_CRITICO,
}

function EtapaIcono({
  estado,
  Icono,
}: {
  estado: EstadoEtapa
  Icono: typeof FileStack
}) {
  if (estado === 'procesando') {
    return (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info"
      >
        <Loader2 className="h-4.5 w-4.5" />
      </motion.span>
    )
  }
  if (estado === 'completado') {
    return (
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success"
      >
        <Check className="h-4.5 w-4.5" />
      </motion.span>
    )
  }
  if (estado === 'error') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <AlertTriangle className="h-4.5 w-4.5" />
      </span>
    )
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icono className="h-4.5 w-4.5" />
    </span>
  )
}

export function ProcesamientoDocumental({
  documentos = 6,
}: {
  documentos?: number
}) {
  const [activa, setActiva] = useState(0)
  const [etapas, setEtapas] = useState<Record<string, EstadoEtapa>>({})
  const [progresoEtapa, setProgresoEtapa] = useState(0)
  const [finalizado, setFinalizado] = useState(false)
  const timers = useRef<number[]>([])

  const totalDuracion = useMemo(
    () => ETAPAS.reduce((acc, e) => acc + e.duracion, 0),
    [],
  )
  const progresoGlobal = useMemo(() => {
    if (finalizado) return 100
    let acumulado = 0
    for (let i = 0; i < activa; i++) acumulado += ETAPAS[i].duracion
    if (activa < ETAPAS.length) {
      acumulado += (ETAPAS[activa].duracion * progresoEtapa) / 100
    }
    return Math.round((acumulado / totalDuracion) * 100)
  }, [activa, progresoEtapa, totalDuracion, finalizado])

  const tiempoSimulado = Math.round(
    (totalDuracion * progresoGlobal) / 100 / 1000,
  )

  useEffect(() => {
    const limpiar = () => timers.current.forEach(clearTimeout)
    limpiar()

    if (activa >= ETAPAS.length) {
      setFinalizado(true)
      return
    }

    const etapa = ETAPAS[activa]
    setProgresoEtapa(0)
    setEtapas((prev) => ({
      ...prev,
      [etapa.id]: 'procesando',
    }))

    const inicio = Date.now()
    const interval = window.setInterval(() => {
      const transcurrido = Date.now() - inicio
      const pct = Math.min(100, (transcurrido / etapa.duracion) * 100)
      setProgresoEtapa(pct)
      if (pct >= 100) {
        window.clearInterval(interval)
        setEtapas((prev) => ({
          ...prev,
          [etapa.id]: 'completado',
        }))
        const t = window.setTimeout(() => setActiva((a) => a + 1), 250)
        timers.current.push(t)
      }
    }, 80)
    timers.current.push(interval)

    return () => {
      window.clearInterval(interval)
    }
  }, [activa])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  const comenzar = () => {
    setActiva(0)
    setEtapas({})
    setProgresoEtapa(0)
    setFinalizado(false)
  }

  const etapaActual = activa < ETAPAS.length ? ETAPAS[activa] : null

  return (
    <div className="space-y-6">
      <FadeInContainer>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Procesamiento documental
            </h3>
            <p className="text-sm text-muted-foreground">
              Análisis inteligente del expediente con IA.
            </p>
          </div>
          {finalizado && (
            <Badge
              variant="outline"
              className={cn('gap-1.5', ESTADO_OK)}
            >
              <CircleCheck className="h-3.5 w-3.5" />
              Análisis completado
            </Badge>
          )}
        </div>
      </FadeInContainer>

      <FadeInContainer delay={0.05}>
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Progreso general</span>
            <span className="text-muted-foreground">
              {tiempoSimulado}s simulados
            </span>
          </div>
          <Progress
            value={progresoGlobal}
            className={cn('h-2.5', progresoGlobal >= 100 && '[&>div]:bg-emerald-500')}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {finalizado
                ? 'Completado'
                : etapaActual
                  ? `Etapa ${activa + 1} de ${ETAPAS.length} · ${etapaActual.titulo}`
                  : 'Preparando'}
            </span>
            <span className="tabular-nums">{progresoGlobal}%</span>
          </div>
        </div>
      </FadeInContainer>

      <div className="grid gap-3 lg:grid-cols-2">
        {ETAPAS.map((etapa, i) => {
          const estado = etapas[etapa.id] ?? 'pendiente'
          const esActiva = i === activa
          const Icono = etapa.icono
          return (
            <motion.div
              key={etapa.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 * i, ease: 'easeOut' }}
              className={cn(
                'rounded-lg border bg-card p-4 transition-colors',
                estado === 'procesando' && 'border-primary/40 bg-primary/[0.03]',
                estado === 'error' && 'border-red-200 bg-red-50/40',
              )}
            >
              <div className="flex items-start gap-3">
                <EtapaIcono estado={estado} Icono={Icono} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{etapa.titulo}</p>
                    <Badge variant="outline" className={ESTADO_CLASE[estado]}>
                      {ESTADO_LABEL[estado]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {etapa.descripcion}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {Math.round(etapa.duracion / 1000)}s
                  </span>
                </div>
              </div>

              {esActiva || (estado !== 'pendiente' && !finalizado) ? (
                <div className="mt-3">
                  {esActiva ? (
                    <Progress
                      value={progresoEtapa}
                      className="h-1.5"
                    />
                  ) : estado === 'completado' ? (
                    <Progress value={100} className={cn('h-1.5', PROGRESO_OK)} />
                  ) : estado === 'error' ? (
                    <Progress value={100} className={cn('h-1.5', PROGRESO_CRITICO)} />
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 h-1.5 rounded-full bg-muted/50" />
              )}
            </motion.div>
          )
        })}
      </div>

      <MessageLog finalizado={finalizado} activa={activa} />

      <FadeInContainer>
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-card p-4 sm:flex-row">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {etapaActual && (
              <motion.span
                key={etapaActual.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
                {etapaActual.titulo}…
              </motion.span>
            )}
            {finalizado && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-success"
              >
                <Check className="h-3.5 w-3.5" />
                Procesamiento terminado · {documentos} documentos procesados
              </motion.span>
            )}
          </div>
          {finalizado ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={comenzar}>
                <Loader2 className="h-4 w-4" />
                Reprocesar
              </Button>
              <Button
                onClick={() =>
                  alert(
                    'Relaciones documentales: próximamente. Se mostrará el grafo de vínculos entre documentos.',
                  )
                }
              >
                Ver relaciones documentales
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="border-transparent bg-info/10 text-info"
            >
              En ejecución…
            </Badge>
          )}
        </div>
      </FadeInContainer>
    </div>
  )
}

function MessageLog({
  finalizado,
  activa,
}: {
  finalizado: boolean
  activa: number
}) {
  const completadas = ETAPAS.filter((_, i) => i < activa).map((e) => e.mensaje)
  const mensajes = finalizado ? ETAPAS.map((e) => e.mensaje) : completadas

  if (mensajes.length === 0) return null

  return (
    <FadeInContainer>
      <div className="rounded-lg border bg-card p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Mensajes de procesamiento
        </p>
        <div className="flex flex-wrap gap-2">
          {mensajes.map((m, i) => (
            <motion.div
              key={`${m}-${i}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
            >
              <Check className="h-3.5 w-3.5 text-success" />
              {m}
            </motion.div>
          ))}
        </div>
      </div>
    </FadeInContainer>
  )
}

function FadeInContainer({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}