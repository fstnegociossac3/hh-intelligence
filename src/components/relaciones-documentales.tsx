import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  FolderKanban,
  Link2,
  Network,
  AlertCircle,
  CalendarClock,
  Ruler,
  PencilRuler,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_NEUTRO, PROGRESO_OK } from '@/utils/estados-clases'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type EstadoRelacion = 'encontrada' | 'parcial' | 'no_encontrada'

interface RelacionesPartida {
  presupuesto: EstadoRelacion
  metrado: EstadoRelacion
  plano: EstadoRelacion
  especificacion: EstadoRelacion
  cronograma: EstadoRelacion
}

type TipoDocumento = keyof RelacionesPartida

interface PartidaRelacion {
  id: string
  codigo: string
  descripcion: string
  especialidad: string
  relaciones: RelacionesPartida
}

const TIPOS_DOCUMENTO: { tipo: TipoDocumento; label: string }[] = [
  { tipo: 'presupuesto', label: 'Presupuesto' },
  { tipo: 'metrado', label: 'Metrado' },
  { tipo: 'plano', label: 'Plano' },
  { tipo: 'especificacion', label: 'Especificación' },
  { tipo: 'cronograma', label: 'Cronograma' },
]

const ICONO_DOCUMENTO: Record<
  TipoDocumento,
  { icono: typeof FileText; label: string }
> = {
  presupuesto: { icono: DollarSign, label: 'Presupuesto' },
  metrado: { icono: Ruler, label: 'Metrado' },
  plano: { icono: Layers, label: 'Plano' },
  especificacion: { icono: PencilRuler, label: 'Especificación' },
  cronograma: { icono: CalendarClock, label: 'Cronograma' },
}

const ESTADO_LABEL: Record<EstadoRelacion, string> = {
  encontrada: 'Encontrado',
  parcial: 'Parcial',
  no_encontrada: 'No encontrado',
}

const ESTADO_BADGE: Record<EstadoRelacion, string> = {
  encontrada: ESTADO_OK,
  parcial: ESTADO_WARNING,
  no_encontrada: ESTADO_NEUTRO,
}

const ESTADO_ICONO: Record<EstadoRelacion, typeof CheckCircle2> = {
  encontrada: CheckCircle2,
  parcial: AlertCircle,
  no_encontrada: FolderKanban,
}

const ESPECIALIDADES_REL = [
  'Estructuras',
  'Costos y Presupuestos',
  'Sanitaria',
  'Eléctricas',
  'Geotecnia',
  'Arquitectura',
]

const ENCONTRADAS: PartidaRelacion[] = [
  {
    id: 'p-01',
    codigo: '03.02.01',
    descripcion: "Concreto f'c=210 kg/cm²",
    especialidad: 'Estructuras',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'encontrada',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'no_encontrada',
    },
  },
  {
    id: 'p-02',
    codigo: '01.02',
    descripcion: 'Movimiento de tierras',
    especialidad: 'Estructuras',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'encontrada',
      plano: 'parcial',
      especificacion: 'encontrada',
      cronograma: 'encontrada',
    },
  },
  {
    id: 'p-03',
    codigo: '01.04',
    descripcion: "Concreto f'c=210 kg/cm² en cimientos",
    especialidad: 'Estructuras',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'encontrada',
      plano: 'encontrada',
      especificacion: 'no_encontrada',
      cronograma: 'parcial',
    },
  },
  {
    id: 'p-04',
    codigo: '02.01',
    descripcion: 'Redes de desagüe',
    especialidad: 'Sanitaria',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'parcial',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'no_encontrada',
    },
  },
  {
    id: 'p-05',
    codigo: '03.01',
    descripcion: 'Salidas para artefactos empotrados',
    especialidad: 'Eléctricas',
    relaciones: {
      presupuesto: 'parcial',
      metrado: 'no_encontrada',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'encontrada',
    },
  },
  {
    id: 'p-06',
    codigo: '05.02',
    descripcion: 'Compactación de terreno',
    especialidad: 'Geotecnia',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'encontrada',
      plano: 'no_encontrada',
      especificacion: 'parcial',
      cronograma: 'encontrada',
    },
  },
  {
    id: 'p-07',
    codigo: '06.01',
    descripcion: 'Vigas de concreto armado',
    especialidad: 'Estructuras',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'encontrada',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'encontrada',
    },
  },
]

function contarEncontradas(rel: RelacionesPartida) {
  return (Object.values(rel) as EstadoRelacion[]).filter(
    (e) => e === 'encontrada',
  ).length
}

function contarParciales(rel: RelacionesPartida) {
  return (Object.values(rel) as EstadoRelacion[]).filter(
    (e) => e === 'parcial',
  ).length
}

function FilasRelacion({ relacion }: { relacion: RelacionesPartida }) {
  return (
    <div className="grid gap-2">
      {TIPOS_DOCUMENTO.map(({ tipo, label }) => {
        const estado = relacion[tipo]
        const Icono = ICONO_DOCUMENTO[tipo].icono
        const EstadoIcono = ESTADO_ICONO[estado]
        return (
          <div
            key={tipo}
            className={cn(
              'flex items-center justify-between gap-3 rounded-md border p-3',
              estado === 'encontrada'
                ? 'bg-emerald-50/40'
                : estado === 'parcial'
                  ? 'bg-amber-50/40'
                  : 'bg-muted/30',
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <Icono className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {estado === 'encontrada' && 'Registro vinculado en estructura común'}
                  {estado === 'parcial' && 'Coincidencia parcial por revisar'}
                  {estado === 'no_encontrada' && 'Sin vínculo detectado'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={ESTADO_BADGE[estado]}>
              <EstadoIcono className="mr-1 h-3.5 w-3.5" />
              {ESTADO_LABEL[estado]}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

export function RelacionesDocumentales() {
  const [seleccionId, setSeleccionId] = useState(ENCONTRADAS[0].id)
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroDocumento, setFiltroDocumento] = useState('todos')

  const partidasFiltradas = useMemo(
    () =>
      ENCONTRADAS.filter((p) => {
        if (filtroEspecialidad !== 'todas' && p.especialidad !== filtroEspecialidad)
          return false
        if (filtroEstado === 'todas_encontradas') {
          const total = contarEncontradas(p.relaciones)
          if (total !== 5) return false
        }
        if (filtroEstado === 'incompletas') {
          if (contarEncontradas(p.relaciones) === 5) return false
        }
        if (filtroEstado === 'sin_cronograma') {
          if (p.relaciones.cronograma !== 'no_encontrada') return false
        }
        if (filtroDocumento === 'todos') return true
        return p.relaciones[filtroDocumento as TipoDocumento] !== 'no_encontrada'
      }),
    [filtroEspecialidad, filtroEstado, filtroDocumento],
  )

  const seleccion =
    partidasFiltradas.find((p) => p.id === seleccionId) ??
    partidasFiltradas[0]

  const encontradas =
    seleccion && contarEncontradas(seleccion.relaciones)
  const parciales = (seleccion && contarParciales(seleccion.relaciones)) || 0
  const pct = seleccion
    ? Math.round(
        ((encontradas + parciales * 0.5) / TIPOS_DOCUMENTO.length) * 100,
      )
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Network className="h-4 w-4 text-primary" />
          Relaciones documentales
        </h3>
        <p className="text-sm text-muted-foreground">
          Vinculación de cada partida técnica con los documentos del proyecto.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
        <Select
          value={filtroEspecialidad}
          onValueChange={setFiltroEspecialidad}
        >
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Especialidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las especialidades</SelectItem>
            {ESPECIALIDADES_REL.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Estado de relación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las partidas</SelectItem>
            <SelectItem value="todas_encontradas">Completas</SelectItem>
            <SelectItem value="incompletas">Incompletas</SelectItem>
            <SelectItem value="sin_cronograma">Sin cronograma</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroDocumento} onValueChange={setFiltroDocumento}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los documentos</SelectItem>
            {TIPOS_DOCUMENTO.map(({ tipo, label }) => (
              <SelectItem key={tipo} value={tipo}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {seleccion && (
        <PartidaDetalle
          partida={seleccion}
          encontradas={encontradas}
          parciales={parciales}
          pct={pct}
        />
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Partidas técnicas
        </p>
        <div className="grid gap-2">
          {partidasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border py-10 text-muted-foreground">
              <FolderKanban className="h-8 w-8" />
              <span className="text-sm">
                No hay partidas que coincidan con los filtros
              </span>
            </div>
          ) : (
            partidasFiltradas.map((p) => {
              const total = contarEncontradas(p.relaciones)
              const activa = seleccion && seleccion.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSeleccionId(p.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    activa
                      ? 'border-primary/40 bg-primary/5'
                      : 'bg-card hover:bg-muted/40',
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.codigo}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {p.descripcion}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {p.especialidad}
                  </span>
                  <Badge variant="outline" className="shrink-0">
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    {total}/5
                  </Badge>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function PartidaDetalle({
  partida,
  encontradas,
  parciales,
  pct,
}: {
  partida: PartidaRelacion
  encontradas: number
  parciales: number
  pct: number
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            Partida {partida.codigo}
          </p>
          <p className="text-base font-semibold">{partida.descripcion}</p>
        </div>
        <Badge variant="secondary">{partida.especialidad}</Badge>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Relaciones encontradas</span>
          <span className="font-medium">
            {encontradas} de {TIPOS_DOCUMENTO.length} relaciones
          </span>
        </div>
        <Progress value={pct} className={cn('h-2', PROGRESO_OK)} />
        <div className="inline-flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            {encontradas}{' '}
            {encontradas === 1 ? 'encontrada' : 'encontradas'}
          </span>
          <span className="inline-flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 text-warning" />
            {parciales} parciales
          </span>
          <span className="inline-flex items-center gap-1">
            <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
            {TIPOS_DOCUMENTO.length - encontradas - parciales} no encontradas
          </span>
        </div>
      </div>

      <div className="mt-4">
        <FilasRelacion relacion={partida.relaciones} />
      </div>
    </div>
  )
}