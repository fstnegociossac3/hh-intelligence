import { useMemo } from 'react'
import {
  Files,
  LibraryBig,
  ClipboardList,
  AlertTriangle,
  Gauge,
  Activity,
  FolderKanban,
  CheckCircle2,
  Clock3,
  FolderPlus,
  Upload,
  FileCheck2,
  ScanSearch,
  UserCheck,
  RefreshCw,
  FileX2,
  CircleAlert,
  FileClock,
  Siren,
  ArrowUpRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { KpiCard } from '@/components/kpi-card'
import { ProyectoEstadoBadge } from '@/components/proyecto-estado-badge'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { proyectos } from '@/data/proyectos'
import { CoherenceScore } from '@/components/coherence-score'

type Criticidad = 'critica' | 'alta' | 'media' | 'baja'
type EstadoObs = 'nueva' | 'asignada' | 'en_revision' | 'justificada' | 'resuelta'

interface Observacion {
  id: string
  codigo: string
  proyecto: string
  partida: string
  tipoInconsistencia: string
  regla: string
  criticidad: Criticidad
  responsable: string
  estado: EstadoObs
  fecha: string
}

interface ActividadReciente {
  id: string
  accion: string
  proyecto: string
  usuario: string
  fecha: string
}

const OBSERVACIONES_MOCK: Observacion[] = [
  { id: 'o-01', codigo: 'OBS-001', proyecto: 'EXP-2025-0147', partida: 'Excavación para cimentaciones', tipoInconsistencia: 'Diferencia de cantidad', regla: 'Presupuesto vs. Metrado', criticidad: 'media', responsable: 'Carlos Mendoza', estado: 'en_revision', fecha: '2026-08-15' },
  { id: 'o-02', codigo: 'OBS-002', proyecto: 'EXP-2025-0163', partida: 'Concreto en estructuras', tipoInconsistencia: 'Información faltante', regla: 'Partida vs. Especificación', criticidad: 'critica', responsable: 'Lucía Fernández', estado: 'asignada', fecha: '2026-08-16' },
  { id: 'o-03', codigo: 'OBS-003', proyecto: 'EXP-2025-0158', partida: 'Puente – estribos', tipoInconsistencia: 'Diferencia de cantidad', regla: 'Presupuesto vs. Metrado', criticidad: 'alta', responsable: 'Jorge Paredes', estado: 'nueva', fecha: '2026-08-30' },
  { id: 'o-04', codigo: 'OBS-004', proyecto: 'EXP-2025-0171', partida: 'Base granular', tipoInconsistencia: 'Cantidad sin respaldo', regla: 'Metrado vs. Plano', criticidad: 'alta', responsable: 'Ana Quispe', estado: 'en_revision', fecha: '2026-08-29' },
  { id: 'o-05', codigo: 'OBS-005', proyecto: 'EXP-2025-0163', partida: 'Red de agua potable', tipoInconsistencia: 'Actividad no programada', regla: 'Partida vs. Cronograma', criticidad: 'critica', responsable: 'Pedro Rojas', estado: 'nueva', fecha: '2026-08-31' },
  { id: 'o-06', codigo: 'OBS-006', proyecto: 'EXP-2025-0147', partida: 'Veredas y sardinel', tipoInconsistencia: 'Unidad inconsistente', regla: 'Presupuesto vs. Metrado', criticidad: 'media', responsable: 'Lucía Fernández', estado: 'justificada', fecha: '2026-08-27' },
  { id: 'o-07', codigo: 'OBS-007', proyecto: 'EXP-2025-0171', partida: 'Vigas de concreto armado', tipoInconsistencia: 'Diferencia de unidad', regla: 'Metrado vs. Plano', criticidad: 'alta', responsable: 'Carlos Mendoza', estado: 'asignada', fecha: '2026-08-26' },
  { id: 'o-08', codigo: 'OBS-008', proyecto: 'EXP-2025-0147', partida: 'Movimiento de tierras', tipoInconsistencia: 'Cantidad sin respaldo', regla: 'Metrado vs. Plano', criticidad: 'media', responsable: 'Lucía Fernández', estado: 'resuelta', fecha: '2026-08-25' },
  { id: 'o-09', codigo: 'OBS-009', proyecto: 'EXP-2025-0158', partida: 'Salidas para artefactos', tipoInconsistencia: 'Información faltante', regla: 'Metrado vs. Plano', criticidad: 'alta', responsable: 'Jorge Paredes', estado: 'nueva', fecha: '2026-08-24' },
  { id: 'o-10', codigo: 'OBS-010', proyecto: 'EXP-2025-0163', partida: 'Tableros de distribución', tipoInconsistencia: 'Actividad no programada', regla: 'Partida vs. Cronograma', criticidad: 'critica', responsable: 'Ana Quispe', estado: 'en_revision', fecha: '2026-08-23' },
]

const ACTIVIDAD_MOCK: ActividadReciente[] = [
  { id: 'a-01', accion: 'Proyecto creado', proyecto: 'EXP-2025-0182', usuario: 'Andrea Quispe', fecha: '2026-08-31T11:05:00' },
  { id: 'a-02', accion: 'Observación detectada', proyecto: 'EXP-2025-0163', usuario: 'IA · HH Intelligence', fecha: '2026-08-31T10:20:00' },
  { id: 'a-03', accion: 'Análisis ejecutado', proyecto: 'EXP-2025-0171', usuario: 'IA · HH Intelligence', fecha: '2026-08-31T09:40:00' },
  { id: 'a-04', accion: 'Documento cargado', proyecto: 'EXP-2025-0147', usuario: 'Carlos Mendoza', fecha: '2026-08-30T14:05:00' },
  { id: 'a-05', accion: 'Observación asignada', proyecto: 'EXP-2025-0158', usuario: 'Andrea Quispe', fecha: '2026-08-30T11:30:00' },
  { id: 'a-06', accion: 'Documento procesado', proyecto: 'EXP-2025-0163', usuario: 'IA · HH Intelligence', fecha: '2026-08-30T09:15:00' },
  { id: 'a-07', accion: 'Reanálisis ejecutado', proyecto: 'EXP-2025-0147', usuario: 'Lucía Fernández', fecha: '2026-08-29T16:45:00' },
  { id: 'a-08', accion: 'Observación resuelta', proyecto: 'EXP-2025-0147', usuario: 'Lucía Fernández', fecha: '2026-08-29T12:15:00' },
]

const ACTIVIDAD_ICONO: Record<string, LucideIcon> = {
  'Proyecto creado': FolderPlus,
  'Documento cargado': Upload,
  'Documento procesado': FileCheck2,
  'Análisis ejecutado': ScanSearch,
  'Observación detectada': AlertTriangle,
  'Observación asignada': UserCheck,
  'Observación resuelta': CheckCircle2,
  'Reanálisis ejecutado': RefreshCw,
}

interface Alerta {
  id: string
  tipo: string
  proyecto: string
  descripcion: string
  prioridad: 'critica' | 'alta' | 'media'
  accion: 'ver_proyecto' | 'ver_observacion' | 'revisar_documento'
  icono: LucideIcon
  variante: 'destructive' | 'warning' | 'info'
}

const ALERTAS_MOCK: Alerta[] = [
  {
    id: 'al-01',
    tipo: 'Inconsistencia crítica',
    proyecto: 'EXP-2025-0163',
    descripcion: 'OBS-005 · Actividad del cronograma sin soporte en el presupuesto.',
    prioridad: 'critica',
    accion: 'ver_observacion',
    icono: CircleAlert,
    variante: 'destructive',
  },
  {
    id: 'al-02',
    tipo: 'Documento con error',
    proyecto: 'EXP-2025-0171',
    descripcion: 'No se pudo procesar Planeo Estructurales.pdf (formato inválido).',
    prioridad: 'alta',
    accion: 'revisar_documento',
    icono: FileX2,
    variante: 'warning',
  },
  {
    id: 'al-03',
    tipo: 'Observación vencida',
    proyecto: 'EXP-2025-0147',
    descripcion: 'OBS-001 superó 5 días sin actualización de estado.',
    prioridad: 'alta',
    accion: 'ver_observacion',
    icono: Clock3,
    variante: 'warning',
  },
  {
    id: 'al-04',
    tipo: 'Expediente pendiente de revisión',
    proyecto: 'EXP-2025-0158',
    descripcion: 'El expediente lleva 7 días esperando revisión técnica.',
    prioridad: 'media',
    accion: 'ver_proyecto',
    icono: FileClock,
    variante: 'info',
  },
]

const PRIORIDAD_LABEL: Record<Alerta['prioridad'], string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
}

const PRIORIDAD_BADGE: Record<Alerta['prioridad'], string> = {
  critica: ESTADO_CRITICO,
  alta: ESTADO_WARNING,
  media: ESTADO_INFO,
}

const ACCION_BUTTON: Record<Alerta['accion'], string> = {
  ver_proyecto: 'Ver proyecto',
  ver_observacion: 'Ver observación',
  revisar_documento: 'Revisar documento',
}

const CRITICIDAD_LABEL: Record<Criticidad, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const CRITICIDAD_BADGE: Record<Criticidad, string> = {
  critica: ESTADO_CRITICO,
  alta: ESTADO_WARNING,
  media: ESTADO_INFO,
  baja: ESTADO_NEUTRO,
}

const ESTADO_LABEL: Record<EstadoObs, string> = {
  nueva: 'Nueva',
  asignada: 'Asignada',
  en_revision: 'En revisión',
  justificada: 'Justificada',
  resuelta: 'Resuelta',
}

const ESTADO_BADGE: Record<EstadoObs, string> = {
  nueva: ESTADO_NEUTRO,
  asignada: ESTADO_INFO,
  en_revision: ESTADO_WARNING,
  justificada: ESTADO_INFO,
  resuelta: ESTADO_OK,
}

const TIPO_ABIERTA: Set<EstadoObs> = new Set([
  'nueva',
  'asignada',
  'en_revision',
])

function SeccionCard({
  titulo,
  descripcion,
  icono: Icono,
  children,
}: {
  titulo: string
  descripcion?: string
  icono: LucideIcon
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icono className="h-4 w-4 text-primary" />
            {titulo}
          </CardTitle>
          {descripcion && (
            <CardDescription className="mt-0.5">{descripcion}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const observacionesAbiertas = useMemo(
    () => OBSERVACIONES_MOCK.filter((o) => TIPO_ABIERTA.has(o.estado)),
    [],
  )

  const criticas = useMemo(
    () => observacionesAbiertas.filter((o) => o.criticidad === 'critica').length,
    [observacionesAbiertas],
  )

  const proyectosConObs = useMemo(() => {
    return proyectos
      .filter((p) => p.observaciones > 0)
      .map((p) => {
        const obss = OBSERVACIONES_MOCK.filter((o) => o.proyecto === p.codigo)
        const maxCriticidad: Criticidad = obss.some((o) => o.criticidad === 'critica')
          ? 'critica'
          : obss.some((o) => o.criticidad === 'alta')
            ? 'alta'
            : obss.some((o) => o.criticidad === 'media')
              ? 'media'
              : 'baja'
        return { proyecto: p, criticidad: maxCriticidad, observaciones: p.observaciones }
      })
      .sort((a, b) => b.observaciones - a.observaciones)
  }, [])

  const observacionesRecientes = useMemo(() => {
    return [...OBSERVACIONES_MOCK]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5)
  }, [])

  const coherenciaProm = 87

  const ejecutarAlerta = (alerta: Alerta) => {
    switch (alerta.accion) {
      case 'ver_proyecto':
        toast.info('Ver proyecto', {
          description: `Abriendo el proyecto ${alerta.proyecto}.`,
        })
        break
      case 'ver_observacion':
        toast.info('Ver observación', {
          description: `Abriendo la observación relacionada en ${alerta.proyecto}.`,
        })
        break
      case 'revisar_documento':
        toast.info('Revisar documento', {
          description: `Abriendo la revisión del documento de ${alerta.proyecto}.`,
        })
        break
    }
  }

  const kpis = [
    {
      titulo: 'Proyectos activos',
      valor: String(proyectos.filter((p) => p.estado !== 'revisado').length),
      detalle: 'en seguimiento',
      icono: FolderKanban,
      tono: 'info' as const,
    },
    {
      titulo: 'Expedientes analizados',
      valor: String(proyectos.filter((p) => p.estado !== 'borrador').length),
      detalle: 'procesados por la IA',
      icono: LibraryBig,
      tono: 'success' as const,
    },
    {
      titulo: 'Documentos procesados',
      valor: '152',
      detalle: 'en esta semana',
      icono: Files,
      tono: 'default' as const,
    },
    {
      titulo: 'Observaciones abiertas',
      valor: String(observacionesAbiertas.length),
      detalle: 'pendientes de resolución',
      icono: ClipboardList,
      tono: 'warning' as const,
    },
    {
      titulo: 'Inconsistencias críticas',
      valor: String(criticas),
      detalle: 'requieren atención inmediata',
      icono: AlertTriangle,
      tono: 'danger' as const,
    },
    {
      titulo: 'Coherencia promedio',
      valor: `${coherenciaProm}%`,
      detalle: 'entre documentos',
      icono: Gauge,
      tono: 'success' as const,
    },
  ]

  return (
    <div className="space-y-6">
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <StaggerItem key={k.titulo}>
            <KpiCard
              titulo={k.titulo}
              valor={k.valor}
              detalle={k.detalle}
              icono={k.icono}
              tono={k.tono}
              className="h-full"
            />
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn>
        <CoherenceScore
          puntaje={coherenciaProm}
          relaciones={[
            { label: 'Presupuesto vs. Metrado', score: 90 },
            { label: 'Metrado vs. Plano', score: 84 },
            { label: 'Partida vs. Especificación', score: 78 },
            { label: 'Partida vs. Cronograma', score: 95 },
          ]}
          className="lg:max-w-xl"
        />
      </FadeIn>

      <FadeIn>
        <SeccionCard
          titulo="Proyectos que requieren atención"
          descripcion="Expedientes con observaciones pendientes de revisión."
          icono={AlertTriangle}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Proyecto</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium">Observaciones</th>
                  <th className="py-2 pr-4 font-medium">Criticidad</th>
                  <th className="py-2 font-medium">Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {proyectosConObs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No hay proyectos que requieran atención.
                    </td>
                  </tr>
                ) : (
                  proyectosConObs.map((fila) => {
                    const p = fila.proyecto
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pr-4">
                          <p className="max-w-[200px] truncate font-medium">
                            {p.nombre}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {p.codigo}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <ProyectoEstadoBadge estado={p.estado} />
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{fila.observaciones}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant="outline"
                            className={CRITICIDAD_BADGE[fila.criticidad]}
                          >
                            {CRITICIDAD_LABEL[fila.criticidad]}
                          </Badge>
                        </td>
                        <td className="py-3 whitespace-nowrap text-muted-foreground">
                          {format(parseISO(p.actualizadoEl), 'dd MMM yyyy')}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </SeccionCard>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn>
          <SeccionCard
            titulo="Observaciones recientes"
            descripcion="Últimas inconsistencia detectadas en los expedientes."
            icono={ClipboardList}
          >
            <ul className="divide-y divide-white/5">
              {observacionesRecientes.map((o) => (
                <li key={o.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-primary">
                        {o.codigo}
                      </span>
                      <Badge
                        variant="outline"
                        className={CRITICIDAD_BADGE[o.criticidad]}
                      >
                        {CRITICIDAD_LABEL[o.criticidad]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm">
                      {o.tipoInconsistencia}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {o.proyecto}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <Badge
                      variant="outline"
                      className={ESTADO_BADGE[o.estado]}
                    >
                      {ESTADO_LABEL[o.estado]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(o.fecha), 'dd MMM yyyy')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </SeccionCard>
        </FadeIn>

        <FadeIn>
          <SeccionCard
            titulo="Actividad reciente"
            descripcion="Eventos recientes de los expedientes."
            icono={Activity}
          >
            <ol className="relative ml-2 space-y-4 border-l-2 border-white/10 pl-5">
              {ACTIVIDAD_MOCK.map((a) => {
                const Icono = ACTIVIDAD_ICONO[a.accion] ?? Activity
                const fecha = parseISO(a.fecha)
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-sidebar text-primary">
                      <Icono className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          {a.accion}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          Proyecto {a.proyecto}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.usuario}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5 sm:pl-3">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(fecha, 'dd MMM yyyy')}
                        </span>
                        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {format(fecha, 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </SeccionCard>
        </FadeIn>

        <FadeIn>
          <SeccionCard
            titulo="Alertas"
            descripcion="Situaciones que requieren atención inmediata."
            icono={Siren}
          >
            <div className="space-y-4">
              {ALERTAS_MOCK.map((alerta) => (
                <Alert
                  key={alerta.id}
                  variant={alerta.variante}
                  className="p-4"
                >
                  <alerta.icono className="h-4 w-4" />
                  <AlertTitle className="flex flex-wrap items-center gap-2">
                    {alerta.tipo}
                    <Badge
                      variant="outline"
                      className={PRIORIDAD_BADGE[alerta.prioridad]}
                    >
                      {PRIORIDAD_LABEL[alerta.prioridad]}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-1">
                    <p className="font-mono text-xs text-muted-foreground">
                      {alerta.proyecto}
                    </p>
                    <p className="mt-0.5 text-sm">{alerta.descripcion}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 gap-1 px-2 text-primary"
                      onClick={() => ejecutarAlerta(alerta)}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      {ACCION_BUTTON[alerta.accion]}
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </SeccionCard>
        </FadeIn>
      </div>
    </div>
  )
}