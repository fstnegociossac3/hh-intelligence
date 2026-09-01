import { Fragment } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  FileText,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { ProyectoEstado } from '@/types'

import { cn } from '@/utils/cn'
import { PROYECTO_ESTADO_LABEL } from '@/components/proyecto-estado-badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PasoWorkflow {
  estado: ProyectoEstado
  icono: LucideIcon
  descripcion: string
}

const ORDEN: ProyectoEstado[] = [
  'borrador',
  'documentacion',
  'en_analisis',
  'observado',
  'revisado',
]

const PASOS: PasoWorkflow[] = [
  {
    estado: 'borrador',
    icono: FileText,
    descripcion: 'Expediente en elaboración inicial.',
  },
  {
    estado: 'documentacion',
    icono: FolderOpen,
    descripcion: 'Documentos cargados en el expediente.',
  },
  {
    estado: 'en_analisis',
    icono: Sparkles,
    descripcion: 'Revisión inteligente en curso.',
  },
  {
    estado: 'observado',
    icono: AlertTriangle,
    descripcion: 'Observaciones detectadas.',
  },
  {
    estado: 'revisado',
    icono: BadgeCheck,
    descripcion: 'Expediente revisado y conformado.',
  },
]

function estadoDelPaso(
  indice: number,
  indiceActual: number,
): 'completado' | 'actual' | 'siguiente' | 'pendiente' {
  if (indice < indiceActual) return 'completado'
  if (indice === indiceActual) return 'actual'
  if (indice === indiceActual + 1) return 'siguiente'
  return 'pendiente'
}

interface NodoProps {
  paso: PasoWorkflow
  estadoNodo: 'completado' | 'actual' | 'siguiente' | 'pendiente'
  etiqueta: string
}

function Nodo({ paso, estadoNodo, etiqueta }: NodoProps) {
  const Icono = paso.icono

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <motion.div
          layout
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className={cn(
            'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            estadoNodo === 'completado' &&
              'border-success bg-success text-white',
            estadoNodo === 'actual' &&
              'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-500/30',
            estadoNodo === 'siguiente' &&
              'border-info/50 bg-info/10 text-info',
            estadoNodo === 'pendiente' && 'border-muted bg-muted text-muted-foreground',
          )}
        >
          {estadoNodo === 'actual' && (
            <span className="absolute -inset-1.5 -z-10 rounded-full bg-violet-500/30" />
          )}
          {estadoNodo === 'actual' && (
            <motion.span
              className="absolute inset-0 rounded-full bg-violet-400/40"
              animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            className="relative z-10"
          >
            {estadoNodo === 'completado' || estadoNodo === 'actual' ? (
              <Check className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <Icono className="h-5 w-5" />
            )}
          </motion.div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" align="center">
        <span className="font-medium">{etiqueta}</span>
        <span className="block max-w-[200px] font-normal opacity-90">
          {paso.descripcion}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function EtiquetaNodo({
  etiqueta,
  estadoNodo,
  oculto,
}: {
  etiqueta: string
  estadoNodo: 'completado' | 'actual' | 'siguiente' | 'pendiente'
  oculto?: boolean
}) {
  return (
    <div
      className={cn(
        'text-center text-xs font-medium',
        estadoNodo === 'actual' && 'text-violet-600',
        estadoNodo === 'siguiente' && 'text-info',
        !oculto && (estadoNodo === 'pendiente' || estadoNodo === 'completado') &&
          'text-muted-foreground',
      )}
    >
      {etiqueta}
    </div>
  )
}

interface ExpedienteWorkflowProps {
  estado: ProyectoEstado
  className?: string
}

export function ExpedienteWorkflow({ estado, className }: ExpedienteWorkflowProps) {
  const indiceActual = Math.max(0, ORDEN.indexOf(estado))
  const progreso = Math.round(((indiceActual + 1) / ORDEN.length) * 100)

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Flujo del expediente</span>
          <span className="text-sm font-semibold text-violet-600">
            {progreso}%
          </span>
        </div>

        <motion.div
          initial={false}
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <Progress value={progreso} className="h-1.5" />
        </motion.div>

        <div className="mt-2 hidden items-center md:flex">
          {PASOS.map((paso, indice) => {
            const estadoNodo = estadoDelPaso(indice, indiceActual)
            return (
              <Fragment key={paso.estado}>
                <div className="flex flex-col items-center gap-2">
                  <Nodo paso={paso} estadoNodo={estadoNodo} etiqueta={PROYECTO_ESTADO_LABEL[paso.estado]} />
                  <EtiquetaNodo
                    etiqueta={PROYECTO_ESTADO_LABEL[paso.estado]}
                    estadoNodo={estadoNodo}
                  />
                </div>
                {indice < PASOS.length - 1 && (
                  <div className="relative mx-1 mb-6 h-0.5 flex-1 overflow-hidden rounded bg-muted">
                    <motion.div
                      className="absolute inset-0 origin-left bg-gradient-to-r from-violet-500 to-success"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: indice < indiceActual ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>

        <ol className="space-y-0 md:hidden">
          {PASOS.map((paso, indice) => {
            const estadoNodo = estadoDelPaso(indice, indiceActual)
            return (
              <li key={paso.estado} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Nodo paso={paso} estadoNodo={estadoNodo} etiqueta={PROYECTO_ESTADO_LABEL[paso.estado]} />
                  {indice < PASOS.length - 1 && (
                    <div className="relative my-1 w-0.5 flex-1 overflow-hidden rounded bg-muted">
                      <motion.div
                        className="absolute inset-0 origin-top bg-gradient-to-b from-violet-500 to-success"
                        initial={{ scaleY: 0 }}
                        animate={{
                          scaleY: indice < indiceActual ? 1 : 0,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 items-center pb-5">
                  <div
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2',
                      estadoNodo === 'actual' &&
                        'border-violet-200 bg-violet-50/60',
                      estadoNodo === 'siguiente' &&
                        'border-info/40 bg-info/10',
                      estadoNodo !== 'actual' &&
                        estadoNodo !== 'siguiente' && 'border-transparent',
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-medium',
                        estadoNodo === 'actual' && 'text-violet-700',
                        estadoNodo === 'siguiente' && 'text-info',
                        (estadoNodo === 'completado' || estadoNodo === 'pendiente') &&
                          'text-muted-foreground',
                      )}
                    >
                      {PROYECTO_ESTADO_LABEL[paso.estado]}
                      {estadoNodo === 'actual' && (
                        <span className="ml-2 text-xs font-normal text-violet-500">
                          · Actual
                        </span>
                      )}
                      {estadoNodo === 'siguiente' && (
                        <span className="ml-2 text-xs font-normal text-info">
                          · Siguiente
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paso.descripcion}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </TooltipProvider>
  )
}
