import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  CircleCheck,
  Database,
  ListChecks,
  Loader2,
  ScanSearch,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import {
  ESTADO_OK,
  ESTADO_INFO,
  ESTADO_WARNING,
  ESTADO_NEUTRO,
} from '@/utils/estados-clases'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { procesarDocumentosIa } from '@/data/documentos-store'
import { generarObservacionesSimuladas } from '@/data/observaciones-store'
import { registrarEjecucion } from '@/data/analisis-store'
import { agregarNotificacion } from '@/data/notificaciones-store'

export interface ProyectoEjecucion {
  id: string
  codigo: string
  nombre: string
}

export interface ResumenEjecucion {
  proyectos: number
  documentos: number
  observaciones: number
}

const T_PREPARAR = 900
const T_PROYECTO = 450
const T_DETECTAR = 1000
const T_OBS = 1100
const T_FINAL = 800

interface Etapa {
  id: string
  titulo: string
  descripcion: string
  icono: typeof Database
}

const ETAPAS: Etapa[] = [
  {
    id: 'preparar',
    titulo: 'Preparando expedientes',
    descripcion: 'Normalizando y validando archivos del expediente.',
    icono: Database,
  },
  {
    id: 'procesar',
    titulo: 'Procesando documentos con IA',
    descripcion: 'Extrayendo información, partidas y metrados.',
    icono: ScanSearch,
  },
  {
    id: 'detectar',
    titulo: 'Detectando inconsistencias',
    descripcion: 'Cruzando presupuesto, metrados, planos y cronograma.',
    icono: TriangleAlert,
  },
  {
    id: 'observaciones',
    titulo: 'Generando observaciones',
    descripcion: 'Creando hallazgos con criticidad y regla asociada.',
    icono: ListChecks,
  },
  {
    id: 'finalizar',
    titulo: 'Consolidando resultados',
    descripcion: 'Guardando resultados y actualizando KPIs.',
    icono: CircleCheck,
  },
]

function esperar(ms: number, timers: number[]) {
  return new Promise<void>((resolve) => {
    const t = window.setTimeout(resolve, ms)
    timers.push(t)
  })
}

export function EjecucionAnalisis({
  proyectos,
  activo,
  onFinalizado,
}: {
  proyectos: ProyectoEjecucion[]
  activo: boolean
  onFinalizado?: (resumen: ResumenEjecucion) => void
}) {
  const [etapa, setEtapa] = useState(0)
  const [progreso, setProgreso] = useState(0)
  const [proyectoActual, setProyectoActual] = useState<string | null>(null)
  const [finalizado, setFinalizado] = useState(false)
  const [resumen, setResumen] = useState<ResumenEjecucion | null>(null)
  const cancelado = useRef(false)
  const timers = useRef<number[]>([])
  const onFinalizadoRef = useRef(onFinalizado)
  onFinalizadoRef.current = onFinalizado

  const duracionTotal = useMemo(
    () =>
      T_PREPARAR + proyectos.length * T_PROYECTO + T_DETECTAR + T_OBS + T_FINAL,
    [proyectos.length],
  )

  useEffect(() => {
    const t = timers.current
    return () => t.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!activo || proyectos.length === 0) return
    cancelado.current = false
    setEtapa(0)
    setProgreso(0)
    setProyectoActual(null)
    setFinalizado(false)
    setResumen(null)

    const inicio = Date.now()
    const ticker = window.setInterval(() => {
      const transcurrido = Math.min(Date.now() - inicio, duracionTotal)
      setProgreso((transcurrido / duracionTotal) * 100)
    }, 120)
    timers.current.push(ticker)

    const ejecutar = async () => {
      let documentosProcesados = 0
      let observacionesGeneradas = 0

      await esperar(T_PREPARAR, timers.current)
      if (cancelado.current) return

      setEtapa(1)
      for (const p of proyectos) {
        if (cancelado.current) return
        setProyectoActual(p.codigo)
        documentosProcesados += procesarDocumentosIa(p.id)
        await esperar(T_PROYECTO, timers.current)
      }
      setProyectoActual(null)

      if (cancelado.current) return
      setEtapa(2)
      await esperar(T_DETECTAR, timers.current)
      if (cancelado.current) return

      setEtapa(3)
      for (const p of proyectos) {
        observacionesGeneradas += generarObservacionesSimuladas(
          p.codigo,
          'Sistema IA',
        )
      }
      await esperar(T_OBS, timers.current)
      if (cancelado.current) return

      setEtapa(4)
      for (const p of proyectos) {
        registrarEjecucion(p.id)
      }
      await esperar(T_FINAL, timers.current)
      if (cancelado.current) return

      window.clearInterval(ticker)
      setProgreso(100)
      setFinalizado(true)
      const r = {
        proyectos: proyectos.length,
        documentos: documentosProcesados,
        observaciones: observacionesGeneradas,
      }
      if (documentosProcesados > 0) {
        agregarNotificacion({
          tipo: 'documento',
          titulo: 'Documento procesado',
          descripcion:
            documentosProcesados === 1
              ? `1 documento procesado por IA durante el análisis.`
              : `${documentosProcesados} documentos procesados por IA durante el análisis.`,
          ruta: '/analisis',
        })
      }
      setResumen(r)
      onFinalizadoRef.current?.(r)
    }

    ejecutar()

    return () => {
      cancelado.current = true
      window.clearInterval(ticker)
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [activo, proyectos.length])

  if (!activo || proyectos.length === 0) return null

  const etapaActual = ETAPAS[Math.min(etapa, ETAPAS.length - 1)]

  return (
    <Card className="overflow-hidden border-primary/30 bg-card">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Análisis inteligente en curso
            </h3>
            <p className="text-sm text-muted-foreground">
              {finalizado
                ? 'Ejecución completada. Resultados guardados en el sistema.'
                : `Etapa ${etapa + 1} de ${ETAPAS.length} · ${etapaActual.titulo}`}
            </p>
          </div>
          {finalizado ? (
            <Badge variant="outline" className={cn('gap-1.5', ESTADO_OK)}>
              <CircleCheck className="h-3.5 w-3.5" />
              Completado
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-transparent bg-info/10 text-info"
            >
              En ejecución…
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium">Progreso general</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round(progreso)}%
            </span>
          </div>
          <Progress
            value={progreso}
            className={cn('h-2.5', finalizado && '[&>div]:bg-success')}
          />
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-5">
          {ETAPAS.map((e, i) => {
            const estado =
              finalizado || i < etapa
                ? 'completado'
                : i === etapa
                  ? 'procesando'
                  : 'pendiente'
            const Icono = e.icono
            return (
              <div
                key={e.id}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border p-3 transition-colors',
                  estado === 'procesando' && 'border-primary/40 bg-primary/[0.03]',
                )}
              >
                {estado === 'procesando' ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info"
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.span>
                ) : estado === 'completado' ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Check className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icono className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      estado === 'pendiente' && 'text-muted-foreground',
                    )}
                  >
                    {e.titulo}
                  </p>
                  <p className="mt-0.5 hidden text-[11px] leading-tight text-muted-foreground lg:block">
                    {e.descripcion}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {proyectoActual && !finalizado && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 font-medium text-info">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Procesando {proyectoActual}…
            </span>
          )}
          {resumen && (
            <>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
                  ESTADO_OK,
                )}
              >
                <Database className="h-3.5 w-3.5" />
                {resumen.proyectos} expedientes
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
                  ESTADO_INFO,
                )}
              >
                <ScanSearch className="h-3.5 w-3.5" />
                {resumen.documentos} documentos procesados
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
                  resumen.observaciones > 0 ? ESTADO_WARNING : ESTADO_NEUTRO,
                )}
              >
                <ListChecks className="h-3.5 w-3.5" />
                {resumen.observaciones} observaciones generadas
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}