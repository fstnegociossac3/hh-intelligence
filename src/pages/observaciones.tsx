import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type Header,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Search,
  Gauge,
} from 'lucide-react'
import { toast } from 'sonner'

import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { EmptyState } from '@/components/empty-state'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import type { LucideIcon } from 'lucide-react'
import { DetalleObservacionAmplio } from '@/components/detalle-observacion'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

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

const CRITICIDAD_ICONO: Record<Criticidad, typeof AlertTriangle> = {
  critica: AlertTriangle,
  alta: AlertTriangle,
  media: Gauge,
  baja: Gauge,
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

const PROYECTOS = [
  'EXP-2025-0147',
  'EXP-2025-0158',
  'EXP-2025-0163',
  'EXP-2025-0171',
]

const RESPONSABLES = [
  'Carlos Mendoza',
  'Lucía Fernández',
  'Jorge Paredes',
  'Ana Quispe',
  'Pedro Rojas',
]

const MOCK_INICIAL: Observacion[] = [
  { id: 'o-01', codigo: 'OBS-001', proyecto: 'EXP-2025-0147', partida: 'Concreto simple en falsa zapata', tipoInconsistencia: 'Diferencia de cantidad', regla: 'Presupuesto vs. Metrado', criticidad: 'alta', responsable: 'Carlos Mendoza', estado: 'nueva', fecha: '2026-08-12' },
  { id: 'o-02', codigo: 'OBS-002', proyecto: 'EXP-2025-0147', partida: 'Acero de refuerzo', tipoInconsistencia: 'Diferencia de cantidad', regla: 'Presupuesto vs. Metrado', criticidad: 'critica', responsable: 'Carlos Mendoza', estado: 'asignada', fecha: '2026-08-13' },
  { id: 'o-03', codigo: 'OBS-003', proyecto: 'EXP-2025-0158', partida: 'Encofrado de cimientos', tipoInconsistencia: 'Coincidencia parcial con plano', regla: 'Metrado vs. Plano', criticidad: 'alta', responsable: 'Lucía Fernández', estado: 'en_revision', fecha: '2026-08-14' },
  { id: 'o-04', codigo: 'OBS-004', proyecto: 'EXP-2025-0158', partida: 'Estudio de mecánica de suelos', tipoInconsistencia: 'Información faltante', regla: 'Partida vs. Especificación', criticidad: 'critica', responsable: 'Jorge Paredes', estado: 'nueva', fecha: '2026-08-15' },
  { id: 'o-05', codigo: 'OBS-005', proyecto: 'EXP-2025-0163', partida: 'Red de desagüe PVC-SAL', tipoInconsistencia: 'Unidad inconsistente', regla: 'Presupuesto vs. Metrado', criticidad: 'media', responsable: 'Ana Quispe', estado: 'justificada', fecha: '2026-08-16' },
  { id: 'o-06', codigo: 'OBS-006', proyecto: 'EXP-2025-0163', partida: 'Tubería de ventilación', tipoInconsistencia: 'Especificación parcial', regla: 'Partida vs. Especificación', criticidad: 'media', responsable: 'Pedro Rojas', estado: 'resuelta', fecha: '2026-08-17' },
  { id: 'o-07', codigo: 'OBS-007', proyecto: 'EXP-2025-0171', partida: 'Vigas de concreto armado', tipoInconsistencia: 'Diferencia de unidad', regla: 'Metrado vs. Plano', criticidad: 'alta', responsable: 'Carlos Mendoza', estado: 'asignada', fecha: '2026-08-18' },
  { id: 'o-08', codigo: 'OBS-008', proyecto: 'EXP-2025-0147', partida: 'Movimiento de tierras', tipoInconsistencia: 'Cantidad sin respaldo', regla: 'Metrado vs. Plano', criticidad: 'media', responsable: 'Lucía Fernández', estado: 'resuelta', fecha: '2026-08-19' },
  { id: 'o-09', codigo: 'OBS-009', proyecto: 'EXP-2025-0158', partida: 'Salidas para artefactos empotrados', tipoInconsistencia: 'Información faltante', regla: 'Metrado vs. Plano', criticidad: 'alta', responsable: 'Jorge Paredes', estado: 'nueva', fecha: '2026-08-20' },
  { id: 'o-10', codigo: 'OBS-010', proyecto: 'EXP-2025-0163', partida: 'Tableros de distribución', tipoInconsistencia: 'Actividad no programada', regla: 'Partida vs. Cronograma', criticidad: 'critica', responsable: 'Ana Quispe', estado: 'en_revision', fecha: '2026-08-21' },
  { id: 'o-11', codigo: 'OBS-011', proyecto: 'EXP-2025-0171', partida: 'Compactación de terreno', tipoInconsistencia: 'Cantidad sin respaldo', regla: 'Metrado vs. Plano', criticidad: 'media', responsable: 'Pedro Rojas', estado: 'resuelta', fecha: '2026-08-22' },
  { id: 'o-12', codigo: 'OBS-012', proyecto: 'EXP-2025-0147', partida: 'Concreto armado en cimientos', tipoInconsistencia: 'Especificación parcial', regla: 'Partida vs. Especificación', criticidad: 'media', responsable: 'Carlos Mendoza', estado: 'asignada', fecha: '2026-08-23' },
  { id: 'o-13', codigo: 'OBS-013', proyecto: 'EXP-2025-0158', partida: 'Muros de contención', tipoInconsistencia: 'Diferencia de cantidad', regla: 'Presupuesto vs. Metrado', criticidad: 'alta', responsable: 'Lucía Fernández', estado: 'nueva', fecha: '2026-08-24' },
  { id: 'o-14', codigo: 'OBS-014', proyecto: 'EXP-2025-0163', partida: 'Tarrajeo en muros interiores', tipoInconsistencia: 'Coincidencia parcial con plano', regla: 'Metrado vs. Plano', criticidad: 'media', responsable: 'Jorge Paredes', estado: 'justificada', fecha: '2026-08-25' },
  { id: 'o-15', codigo: 'OBS-015', proyecto: 'EXP-2025-0171', partida: 'Aparatos sanitarios', tipoInconsistencia: 'Diferencia de cantidad', regla: 'Presupuesto vs. Metrado', criticidad: 'alta', responsable: 'Ana Quispe', estado: 'en_revision', fecha: '2026-08-26' },
]

function CeldaSortable({ header }: { header: Header<Observacion, unknown> }) {
  if (header.isPlaceholder) return null
  const column = header.column
  const puede = column.getCanSort()
  const orden = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        puede ? 'cursor-pointer hover:text-foreground' : 'cursor-default',
      )}
    >
      <span>{flexRender(column.columnDef.header, header.getContext())}</span>
      {puede &&
        (orden === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : orden === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        ))}
    </button>
  )
}

export function ObservacionesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('todos')
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [filtroResponsable, setFiltroResponsable] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })
  const [seleccionId, setSeleccionId] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState<Observacion[]>(MOCK_INICIAL)

  const datosFiltrados = useMemo(() => {
    return observaciones.filter((o) => {
      if (filtroProyecto !== 'todos' && o.proyecto !== filtroProyecto) return false
      if (filtroCriticidad !== 'todas' && o.criticidad !== filtroCriticidad)
        return false
      if (filtroResponsable !== 'todos' && o.responsable !== filtroResponsable)
        return false
      if (filtroEstado !== 'todos' && o.estado !== filtroEstado) return false
      return true
    })
  }, [filtroProyecto, filtroCriticidad, filtroResponsable, filtroEstado, observaciones])

  const columnas = useMemo<ColumnDef<Observacion>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-primary">
            {row.original.codigo}
          </span>
        ),
      },
      {
        accessorKey: 'proyecto',
        header: 'Proyecto',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.proyecto}</span>
        ),
      },
      {
        accessorKey: 'partida',
        header: 'Partida',
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-sm font-medium">
            {row.original.partida}
          </span>
        ),
      },
      {
        accessorKey: 'tipoInconsistencia',
        header: 'Tipo de inconsistencia',
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-xs text-muted-foreground">
            {row.original.tipoInconsistencia}
          </span>
        ),
      },
      {
        accessorKey: 'regla',
        header: 'Regla',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.regla}</Badge>
        ),
      },
      {
        accessorKey: 'criticidad',
        header: 'Criticidad',
        cell: ({ row }) => {
          const Icono = CRITICIDAD_ICONO[row.original.criticidad]
          return (
            <Badge variant="outline" className={CRITICIDAD_BADGE[row.original.criticidad]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {CRITICIDAD_LABEL[row.original.criticidad]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'responsable',
        header: 'Responsable',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.responsable}</span>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant="outline" className={ESTADO_BADGE[row.original.estado]}>
            {ESTADO_LABEL[row.original.estado]}
          </Badge>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatFecha(row.original.fecha)}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Acciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{row.original.codigo}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSeleccionId(row.original.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast.info(`Asignar ${row.original.codigo}`, {
                    description: 'Selecciona un responsable para la observación.',
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Asignar responsable
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: datosFiltrados,
    columns: columnas,
    state: { sorting, globalFilter: busqueda, pagination: paginacion },
    onSortingChange: setSorting,
    onGlobalFilterChange: setBusqueda,
    onPaginationChange: setPaginacion,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const filas = table.getRowModel().rows
  const totalPaginas = table.getPageCount()
  const primera = paginacion.pageIndex * paginacion.pageSize + 1
  const ultima = Math.min(
    (paginacion.pageIndex + 1) * paginacion.pageSize,
    table.getFilteredRowModel().rows.length,
  )

  const kpis = useMemo(
    () => ({
      total: observaciones.length,
      criticas: observaciones.filter((o) => o.criticidad === 'critica').length,
      altas: observaciones.filter((o) => o.criticidad === 'alta').length,
      medias: observaciones.filter((o) => o.criticidad === 'media').length,
      resueltas: observaciones.filter((o) => o.estado === 'resuelta').length,
    }),
    [observaciones],
  )

  const pctResuelto = Math.round((kpis.resueltas / Math.max(kpis.total, 1)) * 100)

  const seleccionado = observaciones.find((o) => o.id === seleccionId) ?? null

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Total observaciones', valor: kpis.total, detalle: 'Registradas en sistema', icono: FileText, tono: 'default' },
    { titulo: 'Críticas', valor: kpis.criticas, detalle: 'Requieren atención inmediata', icono: AlertTriangle, tono: 'danger' },
    { titulo: 'Altas', valor: kpis.altas, detalle: 'Prioridad de resolución', icono: Gauge, tono: 'warning' },
    { titulo: 'Medias', valor: kpis.medias, detalle: 'Control y seguimiento', icono: Gauge, tono: 'info' },
    { titulo: 'Resueltas', valor: kpis.resueltas, detalle: `${pctResuelto}% de avance`, icono: CheckCircle2, tono: 'success' },
  ]

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {kpiItems.map((kpi) => (
          <StaggerItem key={kpi.titulo}>
            <KpiCard
              titulo={kpi.titulo}
              valor={kpi.valor}
              detalle={kpi.detalle}
              icono={kpi.icono}
              tono={kpi.tono}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Registro de observaciones
        </h2>
      </FadeIn>

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar código, partida o regla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar observaciones"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
            <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los proyectos</SelectItem>
                {PROYECTOS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroCriticidad} onValueChange={setFiltroCriticidad}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Criticidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Toda criticidad</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los responsables</SelectItem>
                {RESPONSABLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="nueva">Nueva</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>
                <SelectItem value="en_revision">En revisión</SelectItem>
                <SelectItem value="justificada">Justificada</SelectItem>
                <SelectItem value="resuelta">Resuelta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((grupo) => (
                  <TableRow key={grupo.id}>
                    {grupo.headers.map((header) => (
                      <TableHead key={header.id}>
                        <CeldaSortable header={header} />
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnas.length} className="h-48 p-0">
                      <EmptyState
                        titulo="Sin observaciones"
                        descripcion="No hay observaciones que coincidan con los filtros aplicados."
                        icono={FileText}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((fila) => (
                    <TableRow
                      key={fila.id}
                      className="cursor-pointer"
                      onClick={() => setSeleccionId(fila.original.id)}
                    >
                      {fila.getVisibleCells().map((celda) => (
                        <TableCell key={celda.id}>
                          {flexRender(celda.column.columnDef.cell, celda.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {filas.length === 0 ? (
              <EmptyState
                titulo="Sin observaciones"
                descripcion="No hay observaciones que coincidan con los filtros aplicados."
                icono={FileText}
              />
            ) : (
              filas.map((fila) => {
                const o = fila.original
                const Icono = CRITICIDAD_ICONO[o.criticidad]
                return (
                  <button
                    key={fila.id}
                    type="button"
                    onClick={() => setSeleccionId(o.id)}
                    className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-primary">
                          {o.codigo}
                        </p>
                        <p className="truncate text-sm font-medium">{o.partida}</p>
                      </div>
                      <Badge variant="outline" className={CRITICIDAD_BADGE[o.criticidad]}>
                        <Icono className="mr-1 h-3 w-3" />
                        {CRITICIDAD_LABEL[o.criticidad]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-mono">{o.proyecto}</span>
                      <span>·</span>
                      <span className="truncate">{o.tipoInconsistencia}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline" className={ESTADO_BADGE[o.estado]}>
                        {ESTADO_LABEL[o.estado]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{o.responsable}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Mostrando{' '}
            <span className="font-medium">
              {filas.length === 0 ? 0 : primera}–{ultima}
            </span>{' '}
            de{' '}
            <span className="font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{' '}
            observaciones
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(paginacion.pageSize)}
              onValueChange={(v) =>
                setPaginacion((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }))
              }
            >
              <SelectTrigger className="w-28" aria-label="Filas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILAS_POR_PAGINA.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / pág.</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Página anterior">
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center text-sm">
              {paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}
            </span>
            <Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Página siguiente">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </FadeIn>

      <DetalleObservacionAmplio
        key={seleccionId ?? 'cerrado'}
        open={!!seleccionado}
        onOpenChange={(o) => !o && setSeleccionId(null)}
        o={seleccionado!}
        onActualizar={(campos) => {
          setObservaciones((prev) =>
            prev.map((x) => (x.id === seleccionId ? { ...x, ...campos } : x)),
          )
        }}
      />
    </div>
  )
}