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
import { useNavigate } from 'react-router-dom'

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
import { CoherenceScore } from '@/components/coherence-score'
import { useProyectos } from '@/data/proyectos-store'
import {
  useObservaciones,
  type CriticidadObs,
  type EstadoObs,
} from '@/data/observaciones-store'
import {
  useAnalisis,
  calcularTotales,
  coherenciaPorRegla,
  coherenciaPromedio,
} from '@/data/analisis-store'
import { obtenerEstadoDocumentos } from '@/data/documentos-store'

type Criticidad = CriticidadObs

interface ActividadReciente {
  id: string
  accion: string
  proyecto: string
  usuario: string
  fecha: string
}

interface Alerta {
  id: string
  tipo: string
  proyecto: string
  proyectoId: string
  observacionId?: string
  descripcion: string
  prioridad: 'critica' | 'alta' | 'media'
  accion: 'ver_proyecto' | 'ver_observacion' | 'revisar_documento'
  icono: LucideIcon
  variante: 'destructive' | 'warning' | 'info'
}

const ACTIVIDAD_ICONO: Record<string, LucideIcon> = {
  'Proyecto creado': FolderPlus,
  'Proyecto actualizado': FolderKanban,
  'Documento cargado': Upload,
  'Documento procesado': FileCheck2,
  'Análisis ejecutado': ScanSearch,
  'Observación detectada': AlertTriangle,
  'Observación asignada': UserCheck,
  'Observación resuelta': CheckCircle2,
  'Reanálisis ejecutado': RefreshCw,
}

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

const ESTADOS_ABIERTOS: Set<string> = new Set([
  'nueva',
  'asignada',
  'en_revision',
])

const PRIORIDAD_ORDEN: Record<Alerta['prioridad'], number> = {
  critica: 0,
  alta: 1,
  media: 2,
}

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
  const navigate = useNavigate()
  const proyectos = useProyectos()
  const observaciones = useObservaciones()
  const analisis = useAnalisis()

  const totales = useMemo(() => calcularTotales(analisis), [analisis])

  const observacionesAbiertas = useMemo(
    () => observaciones.filter((o) => ESTADOS_ABIERTOS.has(o.estado)),
    [observaciones],
  )

  const criticas = useMemo(
    () => observacionesAbiertas.filter((o) => o.criticidad === 'critica').length,
    [observacionesAbiertas],
  )

  const coherenciaProm = useMemo(
    () => coherenciaPromedio(observaciones),
    [observaciones],
  )

  const relacionesCoherencia = useMemo(
    () => coherenciaPorRegla(observaciones),
    [observaciones],
  )

  const proyectosConObs = useMemo(() => {
    const porCodigo = new Map(proyectos.map((p) => [p.codigo, p]))
    const conteo = new Map<string, number>()
    for (const o of observaciones) {
      conteo.set(o.proyecto, (conteo.get(o.proyecto) ?? 0) + 1)
    }
    return [...conteo.entries()]
      .map(([codigo, cantidad]) => {
        const proyecto = porCodigo.get(codigo)
        if (!proyecto) return null
        const obss = observaciones.filter((o) => o.proyecto === codigo)
        const maxCriticidad: Criticidad = obss.some((o) => o.criticidad === 'critica')
          ? 'critica'
          : obss.some((o) => o.criticidad === 'alta')
            ? 'alta'
            : obss.some((o) => o.criticidad === 'media')
              ? 'media'
              : 'baja'
        return { proyecto, criticidad: maxCriticidad, observaciones: cantidad }
      })
      .filter((x): x is { proyecto: (typeof proyectos)[number]; criticidad: Criticidad; observaciones: number } => x !== null)
      .sort((a, b) => b.observaciones - a.observaciones)
  }, [proyectos, observaciones])

  const observacionesRecientes = useMemo(() => {
    return [...observaciones]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5)
  }, [observaciones])

  const actividad = useMemo(() => {
    const eventos: ActividadReciente[] = []
    for (const p of proyectos) {
      eventos.push({
        id: `act-p-${p.id}`,
        accion: p.estado === 'borrador' ? 'Proyecto creado' : 'Proyecto actualizado',
        proyecto: p.codigo,
        usuario: p.responsable,
        fecha: p.actualizadoEl,
      })
    }
    for (const o of observaciones) {
      eventos.push({
        id: `act-o-${o.id}`,
        accion:
          o.estado === 'resuelta'
            ? 'Observación resuelta'
            : 'Observación detectada',
        proyecto: o.proyecto,
        usuario: o.responsable,
        fecha: o.fecha,
      })
    }
    for (const p of proyectos) {
      const docs = obtenerEstadoDocumentos(p.id).documentos
      for (const d of docs.slice(0, 3)) {
        eventos.push({
          id: `act-d-${d.id}`,
          accion: 'Documento cargado',
          proyecto: p.codigo,
          usuario: d.responsable,
          fecha: d.fecha,
        })
      }
    }
    return eventos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8)
  }, [proyectos, observaciones])

  const alertas = useMemo<Alerta[]>(() => {
    const porCodigo = new Map(proyectos.map((p) => [p.codigo, p.id]))
    const lista: Alerta[] = []
    const abiertas = observaciones.filter((o) => ESTADOS_ABIERTOS.has(o.estado))

    for (const o of abiertas.filter((x) => x.criticidad === 'critica').slice(0, 2)) {
      lista.push({
        id: `al-obs-${o.id}`,
        tipo: 'Inconsistencia crítica',
        proyecto: o.proyecto,
        proyectoId: porCodigo.get(o.proyecto) ?? '',
        observacionId: o.id,
        descripcion: `${o.codigo} · ${o.tipoInconsistencia}.`,
        prioridad: 'critica',
        accion: 'ver_observacion',
        icono: CircleAlert,
        variante: 'destructive',
      })
    }

    const limiteVencimiento = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    for (const o of abiertas
      .filter((x) => x.fecha < limiteVencimiento)
      .slice(0, 2)) {
      lista.push({
        id: `al-ven-${o.id}`,
        tipo: 'Observación vencida',
        proyecto: o.proyecto,
        proyectoId: porCodigo.get(o.proyecto) ?? '',
        observacionId: o.id,
        descripcion: `${o.codigo} superó 5 días sin actualización de estado.`,
        prioridad: 'alta',
        accion: 'ver_observacion',
        icono: Clock3,
        variante: 'warning',
      })
    }

    for (const a of analisis.filter((x) => x.documentosConError > 0).slice(0, 2)) {
      lista.push({
        id: `al-doc-${a.proyectoId}`,
        tipo: 'Documento con error',
        proyecto: a.codigo,
        proyectoId: a.proyectoId,
        descripcion: `${a.documentosConError} documento(s) no se pudieron procesar en el expediente.`,
        prioridad: 'alta',
        accion: 'revisar_documento',
        icono: FileX2,
        variante: 'warning',
      })
    }

    for (const p of proyectos
      .filter((x) => x.estado === 'observado')
      .slice(0, 2)) {
      lista.push({
        id: `al-rev-${p.id}`,
        tipo: 'Expediente pendiente de revisión',
        proyecto: p.codigo,
        proyectoId: p.id,
        descripcion: 'El expediente tiene observaciones que requieren revisión técnica.',
        prioridad: 'media',
        accion: 'ver_proyecto',
        icono: FileClock,
        variante: 'info',
      })
    }

    return lista
      .sort((a, b) => PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad])
      .slice(0, 6)
  }, [proyectos, observaciones, analisis])

  const ejecutarAlerta = (alerta: Alerta) => {
    switch (alerta.accion) {
      case 'ver_proyecto':
        navigate(`/proyectos/${alerta.proyectoId}`)
        break
      case 'ver_observacion':
        navigate(
          alerta.observacionId
            ? `/observaciones?obs=${alerta.observacionId}`
            : '/observaciones',
        )
        break
      case 'revisar_documento':
        navigate(`/proyectos/${alerta.proyectoId}?tab=documentos`)
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
      valor: String(totales.documentosAnalizados),
      detalle: 'procesados por la IA',
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
          relaciones={relacionesCoherencia}
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
              {actividad.map((a) => {
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
            {alertas.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay alertas activas. Todos los expedientes se encuentran al día.
              </p>
            ) : (
              <div className="space-y-4">
                {alertas.map((alerta) => (
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
            )}
          </SeccionCard>
        </FadeIn>
      </div>
    </div>
  )
}