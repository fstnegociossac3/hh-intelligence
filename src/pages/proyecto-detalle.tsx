import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarClock,
  Calculator,
  ClipboardList,
  FileText,
  FileUp,
  Folder,
  FolderOpen,
  GitBranch,
  Info,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Play,
  Ruler,
  ScrollText,
  Sparkles,
  Trash2,
  Users,
  UserCog,
  UserPlus,
  Wallet,
  Copy,
  Download,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { Proyecto } from '@/types'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO, PROGRESO_OK, PROGRESO_INFO } from '@/utils/estados-clases'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KpiCard } from '@/components/kpi-card'
import { ProyectoEstadoBadge } from '@/components/proyecto-estado-badge'
import { EmptyState } from '@/components/empty-state'
import { ExpedienteWorkflow } from '@/components/expediente-workflow'
import { CargarDocumentosDialog } from '@/components/cargar-documentos'
import { CoherenceScore } from '@/components/coherence-score'
import { DatosNormalizados } from '@/components/datos-normalizados'
import { DocumentosTable } from '@/components/documentos-tab'
import { GrafoRelaciones } from '@/components/grafo-relaciones'
import { HistorialProyecto } from '@/components/historial-proyecto'
import { MetradoVsPlano } from '@/components/metrado-vs-plano'
import { PartidaVsCronograma } from '@/components/partida-vs-cronograma'
import { PartidaVsEspecificacion } from '@/components/partida-vs-especificacion'
import { ProcesamientoDocumental } from '@/components/procesamiento-documental'
import { PresupuestoVsMetrado } from '@/components/presupuesto-vs-metrado'
import { RelacionesDocumentales } from '@/components/relaciones-documentales'
import { ResultadosAnalisis } from '@/components/resultados-analisis'

import { proyectos } from '@/data/proyectos'
import {
  DOCUMENTOS_MOCK,
  ESPECIALIDADES,
  INTEGRANTES_HN_HI,
  ROLES_DISPONIBLES,
  obtenerDetalleProyecto,
} from '@/data/proyecto-detalle'
import type {
  CategoriaDocumento,
  DocumentoLista,
  EstadoCategoriaDoc,
  EstadoIntegrante,
  MiembroEquipo,
  RolEquipo,
} from '@/data/proyecto-detalle'
import { formatFecha, iniciales } from '@/utils/formatters'
import { PagePlaceholder } from '@/components/page-placeholder'

function Etiqueta({ texto }: { texto: string }) {
  return (
    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {texto}
    </dt>
  )
}

export function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState('resumen')
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(
    () => obtenerDetalleProyecto(id ?? '').equipo,
  )
  const [categorias, setCategorias] = useState<CategoriaDocumento[]>(
    () => obtenerDetalleProyecto(id ?? '').categorias,
  )
  const [documentos, setDocumentos] = useState<DocumentoLista[]>(
    DOCUMENTOS_MOCK,
  )

  const proyecto = proyectos.find((p) => p.id === id)

  if (!proyecto) {
    return (
      <div className="space-y-6">
        <EmptyState
          icono={FolderOpen}
          titulo="Proyecto no encontrado"
          descripcion="El expediente solicitado no existe o fue eliminado."
        >
          <Button onClick={() => navigate('/proyectos')}>
            <ArrowLeft />
            Volver a proyectos
          </Button>
        </EmptyState>
      </div>
    )
  }

  const detalle = obtenerDetalleProyecto(proyecto.id)

  const kpis: {
    titulo: string
    valor: string | number
    detalle: string
    icono: typeof BarChart3
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    {
      titulo: 'Documentos cargados',
      valor: detalle.documentosCargados,
      detalle: 'Archivos en el expediente',
      icono: FileUp,
      tono: 'default' as const,
    },
    {
      titulo: 'Documentos procesados',
      valor: detalle.documentosProcesados,
      detalle: 'Analizados por IA',
      icono: Sparkles,
      tono: 'info' as const,
    },
    {
      titulo: 'Observaciones',
      valor: detalle.observaciones,
      detalle: 'Hallazgos detectados',
      icono: ListChecks,
      tono: 'warning' as const,
    },
    {
      titulo: 'Inconsistencias críticas',
      valor: detalle.inconsistenciasCriticas,
      detalle: 'Requieren atención',
      icono: AlertTriangle,
      tono: detalle.inconsistenciasCriticas > 0 ? 'danger' : 'success',
    },
    {
      titulo: 'Índice de coherencia',
      valor: `${detalle.indiceCoherencia}%`,
      detalle: 'Consistencia general',
      icono: BarChart3,
      tono:
        detalle.indiceCoherencia >= 80
          ? 'success'
          : detalle.indiceCoherencia >= 60
            ? 'warning'
            : 'danger',
    },
  ]

  const ejecutarAnalisis = () => {
    setTab('analisis')
    toast.success('Iniciando análisis inteligente', {
      description: `Procesamiento documental de ${proyecto.codigo}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground"
          onClick={() => navigate('/proyectos')}
        >
          <ArrowLeft />
          Volver a proyectos
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {proyecto.nombre}
              </h2>
              <ProyectoEstadoBadge estado={proyecto.estado} />
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <Etiqueta texto="Código" />
                <dd className="mt-0.5 font-mono text-sm font-medium">
                  {proyecto.codigo}
                </dd>
              </div>
              <div>
                <Etiqueta texto="Entidad" />
                <dd className="mt-0.5 truncate text-sm">{proyecto.entidad}</dd>
              </div>
              <div>
                <Etiqueta texto="Tipo de obra" />
                <dd className="mt-0.5 max-w-full truncate text-sm">
                  <Badge variant="secondary" className="max-w-full truncate">{proyecto.tipoObra}</Badge>
                </dd>
              </div>
              <div>
                <Etiqueta texto="Ubicación" />
                <dd className="mt-0.5 truncate text-sm">{proyecto.ubicacion}</dd>
              </div>
              <div>
                <Etiqueta texto="Responsable" />
                <dd className="mt-0.5 truncate text-sm">{proyecto.responsable}</dd>
              </div>
              <div>
                <Etiqueta texto="Avance" />
                <dd className="mt-1.5 flex items-center gap-2">
                  <Progress value={proyecto.avance} className="h-1.5 w-24" />
                  <span className="text-sm text-muted-foreground">
                    {proyecto.avance}%
                  </span>
                </dd>
              </div>
              <div>
                <Etiqueta texto="Creado" />
                <dd className="mt-0.5 text-sm">
                  {formatFecha(proyecto.fechaCreacion)}
                </dd>
              </div>
              <div>
                <Etiqueta texto="Actualizado" />
                <dd className="mt-0.5 text-sm">
                  {formatFecha(proyecto.actualizadoEl)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pencil />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <EditarProyectoDialog proyecto={proyecto} />
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <FileUp />
                  Cargar documentos
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-x-hidden overflow-y-auto bg-background text-foreground sm:max-w-2xl">
                <CargarDocumentosDialog
                  setCategorias={setCategorias}
                  setDocumentos={setDocumentos}
                />
              </SheetContent>
            </Sheet>
            <Button onClick={ejecutarAnalisis}>
              <Play />
              Ejecutar análisis
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <MoreHorizontal />
                  Más opciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Duplicar proyecto')}>
                  <Copy />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Exportar expediente')}>
                  <Download />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => toast.error('Eliminar proyecto')}
                >
                  <Trash2 />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="sm:w-auto">
            <TabsTrigger value="resumen">
              <ClipboardList />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileText />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="analisis">
              <Sparkles />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="observaciones">
              <AlertTriangle />
              Observaciones
            </TabsTrigger>
            <TabsTrigger value="historial">
              <Activity />
              Historial
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.titulo}
                titulo={kpi.titulo}
                valor={kpi.valor}
                detalle={kpi.detalle}
                icono={kpi.icono}
                tono={kpi.tono}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                Etapa del expediente
              </CardTitle>
              <CardDescription>
                Progreso del proyecto a través de sus etapas de revisión.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpedienteWorkflow estado={proyecto.estado} />
            </CardContent>
          </Card>

          <CoherenceScore
            puntaje={detalle.indiceCoherencia}
            titulo="Coherencia del expediente"
            descripcion={`Índice de consistencia de ${proyecto.codigo}`}
            relaciones={[
              { label: 'Presupuesto vs. Metrado', score: Math.max(20, Math.min(100, detalle.indiceCoherencia + 4)) },
              { label: 'Metrado vs. Plano', score: Math.max(20, Math.min(100, detalle.indiceCoherencia - 2)) },
              { label: 'Partida vs. Especificación', score: Math.max(20, Math.min(100, detalle.indiceCoherencia + 1)) },
              { label: 'Partida vs. Cronograma', score: Math.max(20, Math.min(100, detalle.indiceCoherencia - 5)) },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información general</CardTitle>
                <CardDescription>
                  Datos principales del expediente.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="space-y-3 text-sm">
                  <div>
                    <Etiqueta texto="Nombre del proyecto" />
                    <p className="mt-0.5">{proyecto.nombre}</p>
                  </div>
                  <div>
                    <Etiqueta texto="Entidad pública" />
                    <p className="mt-0.5">{proyecto.entidad}</p>
                  </div>
                  <div>
                    <Etiqueta texto="Tipo de obra" />
                    <p className="mt-0.5">
                      <Badge variant="secondary">{proyecto.tipoObra}</Badge>
                    </p>
                  </div>
                  <div>
                    <Etiqueta texto="Sector" />
                    <p className="mt-0.5">{proyecto.sector}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <Etiqueta texto="Ubicación" />
                    <p className="mt-0.5">{proyecto.ubicacion}</p>
                  </div>
                  <div>
                    <Etiqueta texto="Responsable" />
                    <p className="mt-0.5">{proyecto.responsable}</p>
                  </div>
                  <div>
                    <Etiqueta texto="Código" />
                    <p className="mt-0.5 font-mono">{proyecto.codigo}</p>
                  </div>
                  <div>
                    <Etiqueta texto="Estado" />
                    <p className="mt-1">
                      <ProyectoEstadoBadge estado={proyecto.estado} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Equipo asignado
                </CardTitle>
                <GestionarEquipoSheet
                  proyecto={proyecto}
                  equipo={equipo}
                  setEquipo={setEquipo}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {equipo.map((miembro) => (
                  <div
                    key={miembro.id}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-sidebar text-white text-xs">
                        {iniciales(miembro.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {miembro.nombre}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {miembro.especialidad}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {miembro.proyectosAsignados} proyectos
                      </span>
                      <TipoRolBadge rol={miembro.rol} />
                      <EstadoIntegranteBadge estado={miembro.estado} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Actividad reciente
                </CardTitle>
                <CardDescription>
                  Últimas acciones registradas en el expediente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detalle.actividad.map((actividad) => (
                  <div key={actividad.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-sm">{actividad.descripcion}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {actividad.usuario} ·{' '}
                        {format(parseISO(actividad.fecha), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Progreso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avance general</span>
                    <span className="font-medium">{proyecto.avance}%</span>
                  </div>
                  <Progress value={proyecto.avance} className="h-2" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Documentos procesados
                    </span>
                    <span className="font-medium">
                      {detalle.documentosProcesados}/
                      {detalle.documentosCargados}
                    </span>
                  </div>
                  <Progress
                    value={
                      (detalle.documentosProcesados /
                        Math.max(detalle.documentosCargados, 1)) *
                      100
                    }
                    className={`h-2 ${PROGRESO_OK}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Índice de coherencia
                    </span>
                    <span className="font-medium">
                      {detalle.indiceCoherencia}%
                    </span>
                  </div>
                  <Progress
                    value={detalle.indiceCoherencia}
                    className={`h-2 ${PROGRESO_INFO}`}
                  />
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {proyecto.fechaInicio
                    ? `Inicio: ${formatFecha(proyecto.fechaInicio)}`
                    : 'Sin fecha de inicio definida'}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Creado el {format(parseISO(proyecto.fechaCreacion), 'dd/MM/yyyy')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentosTab
            categorias={categorias}
            documentos={documentos}
            setDocumentos={setDocumentos}
          />
        </TabsContent>

        <TabsContent value="analisis">
          <ProcesamientoDocumental documentos={documentos.length} />
          <div className="mt-8">
            <DatosNormalizados />
          </div>
          <div className="mt-8">
            <RelacionesDocumentales />
          </div>
          <div className="mt-8">
            <GrafoRelaciones />
          </div>
          <div className="mt-8">
            <PresupuestoVsMetrado />
          </div>
          <div className="mt-8">
            <MetradoVsPlano />
          </div>
          <div className="mt-8">
            <PartidaVsEspecificacion />
          </div>
          <div className="mt-8">
            <PartidaVsCronograma />
          </div>
          <div className="mt-8">
            <ResultadosAnalisis />
          </div>
        </TabsContent>

        <TabsContent value="historial">
          <HistorialProyecto />
        </TabsContent>

        <TabsContent value="observaciones">
          <PagePlaceholder
            titulo="Módulo Observaciones"
            descripcion="La gestión de observaciones se implementará en fases posteriores."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EditarProyectoDialog({ proyecto }: { proyecto: Proyecto }) {
  const [nombre, setNombre] = useState(proyecto.nombre)
  const [responsable, setResponsable] = useState(proyecto.responsable)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar proyecto</DialogTitle>
        <DialogDescription>
          Actualice los datos principales del expediente.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="ed-nombre">Nombre del proyecto</Label>
          <Input
            id="ed-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ed-responsable">Responsable</Label>
          <Input
            id="ed-responsable"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={nombre.trim().length < 3}
          onClick={() => {
            toast.success('Cambios guardados (demo)')
          }}
        >
          Guardar cambios
        </Button>
      </DialogFooter>
    </>
  )
}

function TipoRolBadge({ rol }: { rol: RolEquipo }) {
  const clase =
    rol === 'Jefe de Proyecto'
      ? ESTADO_INFO
      : rol === 'Especialista Técnico'
        ? ESTADO_NEUTRO
        : ESTADO_WARNING
  return <Badge variant="outline" className={clase}>{rol}</Badge>
}

function EstadoIntegranteBadge({ estado }: { estado: EstadoIntegrante }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={
          estado === 'activo'
            ? 'h-1.5 w-1.5 rounded-full bg-success'
            : 'h-1.5 w-1.5 rounded-full bg-muted-foreground'
        }
      />
      <span
        className={
          estado === 'activo' ? 'text-success' : 'text-muted-foreground'
        }
      >
        {estado === 'activo' ? 'Activo' : 'Inactivo'}
      </span>
    </span>
  )
}

function GestionarEquipoSheet({
  proyecto,
  equipo,
  setEquipo,
}: {
  proyecto: Proyecto
  equipo: MiembroEquipo[]
  setEquipo: Dispatch<SetStateAction<MiembroEquipo[]>>
}) {
  const [nombreSeleccionado, setNombreSeleccionado] = useState('')
  const [rolNuevo, setRolNuevo] = useState<RolEquipo>('Especialista Técnico')
  const [especialidadNueva, setEspecialidadNueva] = useState('')

  const disponibles = INTEGRANTES_HN_HI.filter(
    (c) => !equipo.some((m) => m.nombre === c.nombre),
  )

  const cambiarRol = (id: string, rol: RolEquipo) =>
    setEquipo((prev) =>
      prev.map((m) => (m.id === id ? { ...m, rol } : m)),
    )

  const cambiarEspecialidad = (id: string, especialidad: string) =>
    setEquipo((prev) =>
      prev.map((m) => (m.id === id ? { ...m, especialidad } : m)),
    )

  const agregar = () => {
    const candidato = INTEGRANTES_HN_HI.find(
      (c) => c.nombre === nombreSeleccionado,
    )
    if (!candidato || !especialidadNueva) {
      toast.error('Completa el nombre y la especialidad')
      return
    }
    const nuevo: MiembroEquipo = {
      id: `eq-${Date.now()}`,
      nombre: candidato.nombre,
      rol: rolNuevo,
      especialidad: especialidadNueva,
      estado: 'activo',
      proyectosAsignados: 1,
    }
    setEquipo((prev) => [...prev, nuevo])
    toast.success('Integrante agregado', {
      description: `${candidato.nombre} fue asignado como ${rolNuevo}.`,
    })
    setNombreSeleccionado('')
    setEspecialidadNueva('')
    setRolNuevo('Especialista Técnico')
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog />
          Gestionar equipo
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-x-hidden overflow-y-auto bg-background text-foreground sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-black">Gestionar equipo</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Administre los integrantes del proyecto {proyecto.codigo}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-3">
          {equipo.map((miembro) => (
            <div
              key={miembro.id}
              className="rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-sidebar text-white text-xs">
                      {iniciales(miembro.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {miembro.nombre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {miembro.proyectosAsignados} proyectos asignados
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => {
                    setEquipo((prev) => prev.filter((m) => m.id !== miembro.id))
                    toast.success('Integrante retirado', {
                      description: `${miembro.nombre} fue retirado del proyecto.`,
                    })
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Rol</Label>
                  <Select
                    value={miembro.rol}
                    onValueChange={(v) => {
                      cambiarRol(miembro.id, v as RolEquipo)
                      toast.success('Rol actualizado', {
                        description: `${miembro.nombre} ahora es ${v}.`,
                      })
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES_DISPONIBLES.map((rol) => (
                        <SelectItem key={rol} value={rol}>
                          {rol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Especialidad
                  </Label>
                  <Select
                    value={miembro.especialidad}
                    onValueChange={(v) => {
                      cambiarEspecialidad(miembro.id, v)
                      toast.success('Especialidad actualizada', {
                        description: `${miembro.nombre} especializado en ${v}.`,
                      })
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESPECIALIDADES.map((esp) => (
                        <SelectItem key={esp} value={esp}>
                          {esp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-5" />

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            Agregar integrante
          </p>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Integrante</Label>
            <Select
              value={nombreSeleccionado}
              onValueChange={setNombreSeleccionado}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar integrante" />
              </SelectTrigger>
              <SelectContent>
                {disponibles.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Todos los integrantes ya están en el equipo.
                  </div>
                ) : (
                  disponibles.map((c) => (
                    <SelectItem key={c.nombre} value={c.nombre}>
                      {c.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Rol</Label>
            <Select value={rolNuevo} onValueChange={(v) => setRolNuevo(v as RolEquipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_DISPONIBLES.map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {rol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Especialidad</Label>
            <Select value={especialidadNueva} onValueChange={setEspecialidadNueva}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar especialidad" />
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((esp) => (
                  <SelectItem key={esp} value={esp}>
                    {esp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={agregar}
            disabled={!nombreSeleccionado || !especialidadNueva}
          >
            <UserPlus />
            Agregar al equipo
          </Button>
        </div>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button variant="outline">Cerrar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

const ICONOS_CATEGORIA: Record<string, LucideIcon> = {
  Planos: Ruler,
  Metrados: Calculator,
  Presupuesto: Wallet,
  'Especificaciones técnicas': FileText,
  Cronograma: CalendarClock,
  'Términos de referencia': ScrollText,
  Otros: Folder,
}

const ESTADO_DOC_LABEL: Record<EstadoCategoriaDoc, string> = {
  completo: 'Completo',
  en_proceso: 'En proceso',
  con_error: 'Con error',
  pendiente: 'Pendiente',
}

const ESTADO_DOC_CLASES: Record<EstadoCategoriaDoc, string> = {
  completo: ESTADO_OK,
  en_proceso: ESTADO_INFO,
  con_error: ESTADO_CRITICO,
  pendiente: ESTADO_WARNING,
}

function EstadoDocBadge({ estado }: { estado: EstadoCategoriaDoc }) {
  return (
    <Badge variant="outline" className={ESTADO_DOC_CLASES[estado]}>
      {ESTADO_DOC_LABEL[estado]}
    </Badge>
  )
}

function DocumentosTab({
  categorias,
  documentos,
  setDocumentos,
}: {
  categorias: CategoriaDocumento[]
  documentos: DocumentoLista[]
  setDocumentos: Dispatch<SetStateAction<DocumentoLista[]>>
}) {
  const total = categorias.reduce((acc, c) => acc + c.cantidad, 0)
  const procesados = categorias.reduce((acc, c) => acc + c.procesados, 0)
  const pendientes = categorias.reduce(
    (acc, c) =>
      acc +
      (c.estado === 'en_proceso' || c.estado === 'pendiente'
        ? c.cantidad - c.procesados
        : 0),
    0,
  )
  const conError = categorias.reduce(
    (acc, c) =>
      acc + (c.estado === 'con_error' ? c.cantidad - c.procesados : 0),
    0,
  )

  const kpis: {
    titulo: string
    valor: string | number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    {
      titulo: 'Total documentos',
      valor: total,
      detalle: 'Archivos en el expediente',
      icono: FolderOpen,
      tono: 'default' as const,
    },
    {
      titulo: 'Procesados',
      valor: procesados,
      detalle: 'Analizados por IA',
      icono: Sparkles,
      tono: 'success' as const,
    },
    {
      titulo: 'Pendientes',
      valor: pendientes,
      detalle: 'En cola de revisión',
      icono: ListChecks,
      tono: 'warning' as const,
    },
    {
      titulo: 'Con error',
      valor: conError,
      detalle: 'Requieren revisión',
      icono: AlertTriangle,
      tono: conError > 0 ? 'danger' : 'success',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.titulo}
            titulo={kpi.titulo}
            valor={kpi.valor}
            detalle={kpi.detalle}
            icono={kpi.icono}
            tono={kpi.tono}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria) => {
          const Icono = ICONOS_CATEGORIA[categoria.categoria] ?? Folder
          const pct =
            categoria.cantidad > 0
              ? Math.round((categoria.procesados / categoria.cantidad) * 100)
              : 0
          return (
            <Card key={categoria.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600">
                    <Icono className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{categoria.categoria}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Actualizado:{' '}
                      {format(
                        parseISO(categoria.ultimaActualizacion),
                        'dd/MM/yyyy',
                      )}
                    </p>
                  </div>
                  <EstadoDocBadge estado={categoria.estado} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Archivos totales
                    </p>
                    <p className="text-lg font-bold">{categoria.cantidad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Procesados
                    </p>
                    <p className="text-lg font-bold">
                      {categoria.procesados}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Documentos del expediente</h3>
          <p className="text-sm text-muted-foreground">
            Lista de archivos cargados y su estado de procesamiento IA.
          </p>
        </div>
      </div>

      <DocumentosTable
        documentos={documentos}
        setDocumentos={setDocumentos}
      />
    </div>
  )
}

