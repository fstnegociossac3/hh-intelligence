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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileBarChart,
  FileCheck2,
  FileClock,
  FolderPlus,
  GitCompare,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  ListTree,
  Table2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'

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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { EmptyState } from '@/components/empty-state'
import { KpiCard } from '@/components/kpi-card'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

type TipoAccion =
  | 'proyecto_creado'
  | 'documento_cargado'
  | 'documento_actualizado'
  | 'documento_procesado'
  | 'analisis_ejecutado'
  | 'observacion_detectada'
  | 'observacion_asignada'
  | 'observacion_resuelta'
  | 'reanalisis_ejecutado'
  | 'reporte_generado'

type EstadoEvento = 'completado' | 'en_proceso' | 'pendiente' | 'resuelta' | 'detectada' | 'generado'

interface EventoHistorial {
  id: string
  accion: TipoAccion
  usuario: string
  rol: string
  elemento: string
  estado: EstadoEvento
  fecha: string
}

const TIPO_LABEL: Record<TipoAccion, string> = {
  proyecto_creado: 'Proyecto creado',
  documento_cargado: 'Documento cargado',
  documento_actualizado: 'Documento actualizado',
  documento_procesado: 'Documento procesado',
  analisis_ejecutado: 'Análisis ejecutado',
  observacion_detectada: 'Observación detectada',
  observacion_asignada: 'Observación asignada',
  observacion_resuelta: 'Observación resuelta',
  reanalisis_ejecutado: 'Reanálisis ejecutado',
  reporte_generado: 'Reporte generado',
}

const TIPO_ICONO: Record<TipoAccion, LucideIcon> = {
  proyecto_creado: FolderPlus,
  documento_cargado: Upload,
  documento_actualizado: FileClock,
  documento_procesado: FileCheck2,
  analisis_ejecutado: TrendingUp,
  observacion_detectada: ShieldAlert,
  observacion_asignada: UserCheck,
  observacion_resuelta: ClipboardCheck,
  reanalisis_ejecutado: RefreshCw,
  reporte_generado: FileBarChart,
}

const ESTADO_LABEL: Record<EstadoEvento, string> = {
  completado: 'Completado',
  en_proceso: 'En proceso',
  pendiente: 'Pendiente',
  resuelta: 'Resuelta',
  detectada: 'Detectada',
  generado: 'Generado',
}

const ESTADO_BADGE: Record<EstadoEvento, string> = {
  completado: ESTADO_OK,
  en_proceso: ESTADO_INFO,
  pendiente: ESTADO_NEUTRO,
  resuelta: ESTADO_OK,
  detectada: ESTADO_WARNING,
  generado: ESTADO_INFO,
}

const USUARIOS = [
  'Andrea Quispe',
  'Carlos Mendoza',
  'Lucía Fernández',
  'Jorge Paredes',
  'Ana Quispe',
  'IA · HH Intelligence',
]

const HISTORIAL_MOCK: EventoHistorial[] = [
  { id: 'h-01', accion: 'proyecto_creado', usuario: 'Andrea Quispe', rol: 'Administradora', elemento: 'Expediente EXP-2025-0147', estado: 'completado', fecha: '2025-06-12T09:00:00' },
  { id: 'h-02', accion: 'documento_cargado', usuario: 'Carlos Mendoza', rol: 'Analista', elemento: 'Planos Arquitectónicos.pdf', estado: 'completado', fecha: '2026-08-12T11:20:00' },
  { id: 'h-03', accion: 'documento_cargado', usuario: 'Carlos Mendoza', rol: 'Analista', elemento: 'Metrados.xlsx', estado: 'completado', fecha: '2026-08-12T11:24:00' },
  { id: 'h-04', accion: 'documento_actualizado', usuario: 'Lucía Fernández', rol: 'Revisora', elemento: 'Presupuesto.xlsx (v2)', estado: 'completado', fecha: '2026-08-14T09:45:00' },
  { id: 'h-05', accion: 'documento_procesado', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'Planos Arquitectónicos.pdf', estado: 'completado', fecha: '2026-08-12T11:30:00' },
  { id: 'h-06', accion: 'documento_procesado', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'Metrados.xlsx', estado: 'completado', fecha: '2026-08-12T11:35:00' },
  { id: 'h-07', accion: 'analisis_ejecutado', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'Comparación Presupuesto vs. Metrado', estado: 'completado', fecha: '2026-08-14T10:10:00' },
  { id: 'h-08', accion: 'observacion_detectada', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'OBS-001 · Excavación para cimentaciones', estado: 'detectada', fecha: '2026-08-14T10:12:00' },
  { id: 'h-09', accion: 'observacion_detectada', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'OBS-002 · Acero de refuerzo', estado: 'detectada', fecha: '2026-08-14T10:13:00' },
  { id: 'h-10', accion: 'observacion_asignada', usuario: 'Ana Quispe', rol: 'Revisora', elemento: 'OBS-002 · Acero de refuerzo', estado: 'completado', fecha: '2026-08-15T08:30:00' },
  { id: 'h-11', accion: 'documento_actualizado', usuario: 'Jorge Paredes', rol: 'Analista', elemento: 'Metrados.xlsx (v2)', estado: 'completado', fecha: '2026-08-18T14:05:00' },
  { id: 'h-12', accion: 'reanalisis_ejecutado', usuario: 'Lucía Fernández', rol: 'Revisora', elemento: 'Reanálisis Metrado vs. Plano', estado: 'completado', fecha: '2026-08-18T15:20:00' },
  { id: 'h-13', accion: 'observacion_resuelta', usuario: 'Lucía Fernández', rol: 'Revisora', elemento: 'OBS-001 · Excavación para cimentaciones', estado: 'resuelta', fecha: '2026-08-19T11:00:00' },
  { id: 'h-14', accion: 'observacion_asignada', usuario: 'Carlos Mendoza', rol: 'Analista', elemento: 'OBS-003 · Muros de contención', estado: 'completado', fecha: '2026-08-21T09:40:00' },
  { id: 'h-15', accion: 'analisis_ejecutado', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'Comparación Metrado vs. Plano', estado: 'en_proceso', fecha: '2026-08-24T10:05:00' },
  { id: 'h-16', accion: 'reporte_generado', usuario: 'Andrea Quispe', rol: 'Administradora', elemento: 'Reporte de coherencia documental', estado: 'generado', fecha: '2026-08-25T12:30:00' },
  { id: 'h-17', accion: 'documento_cargado', usuario: 'Jorge Paredes', rol: 'Analista', elemento: 'Especificaciones técnicas.pdf', estado: 'completado', fecha: '2026-08-26T16:15:00' },
  { id: 'h-18', accion: 'observacion_detectada', usuario: 'IA · HH Intelligence', rol: 'Motor de análisis', elemento: 'OBS-004 · Estudio de mecánica de suelos', estado: 'detectada', fecha: '2026-08-27T09:50:00' },
  { id: 'h-19', accion: 'documento_actualizado', usuario: 'Ana Quispe', rol: 'Revisora', elemento: 'Presupuesto.xlsx (v3)', estado: 'completado', fecha: '2026-08-28T10:40:00' },
  { id: 'h-20', accion: 'reporte_generado', usuario: 'Carlos Mendoza', rol: 'Analista', elemento: 'Informe ejecutivo general', estado: 'generado', fecha: '2026-08-29T13:10:00' },
]

function CeldaSortable({
  header,
}: {
  header: Header<EventoHistorial, unknown>
}) {
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

export function HistorialProyecto() {
  const [vista, setVista] = useState<'timeline' | 'tabla'>('timeline')
  const [busqueda, setBusqueda] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('todos')
  const [filtroAccion, setFiltroAccion] = useState('todas')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [sorting, setSorting] = useState<SortingState>([])
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })

  const datosFiltrados = useMemo(() => {
    return HISTORIAL_MOCK.filter((e) => {
      if (filtroUsuario !== 'todos' && e.usuario !== filtroUsuario) return false
      if (filtroAccion !== 'todas' && e.accion !== filtroAccion) return false
      if (filtroFecha !== 'todas') {
        const dia = e.fecha.slice(0, 10)
        if (filtroFecha === 'hoy' && dia !== '2026-08-29') return false
        if (filtroFecha === 'semana') {
          const fecha = new Date(dia)
          const limite = new Date('2026-08-23')
          if (fecha < limite) return false
        }
        if (filtroFecha === 'mes' && !dia.startsWith('2026-08')) return false
      }
      return true
    })
  }, [filtroUsuario, filtroAccion, filtroFecha])

  const columnas = useMemo<ColumnDef<EventoHistorial>[]>(
    () => [
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-xs">
              {format(parseISO(row.original.fecha), 'dd MMM yyyy')}
            </span>
            <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
              {format(parseISO(row.original.fecha), 'HH:mm')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'usuario',
        header: 'Usuario',
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.usuario}</span>
        ),
      },
      {
        accessorKey: 'rol',
        header: 'Rol',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.rol}</span>
        ),
      },
      {
        accessorKey: 'accion',
        header: 'Acción',
        cell: ({ row }) => {
          const Icono = TIPO_ICONO[row.original.accion]
          return (
            <span className="flex items-center gap-2 text-xs font-medium">
              <Icono className="h-3.5 w-3.5 shrink-0 text-primary" />
              {TIPO_LABEL[row.original.accion]}
            </span>
          )
        },
      },
      {
        accessorKey: 'elemento',
        header: 'Elemento afectado',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-xs">
            {row.original.elemento}
          </span>
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

  const eventosVista = vista === 'tabla' ? filas.map((f) => f.original) : datosFiltrados

  const kpis = useMemo(
    () => ({
      total: HISTORIAL_MOCK.length,
      acciones: new Set(HISTORIAL_MOCK.map((e) => e.accion)).size,
      usuarios: new Set(HISTORIAL_MOCK.map((e) => e.usuario)).size,
      pendientes: HISTORIAL_MOCK.filter(
        (e) => e.estado === 'en_proceso' || e.estado === 'pendiente',
      ).length,
    }),
    [],
  )

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Eventos registrados', valor: kpis.total, detalle: 'En el historial', icono: FileClock, tono: 'default' },
    { titulo: 'Tipos de acción', valor: kpis.acciones, detalle: 'Acciones distintas', icono: GitCompare, tono: 'info' },
    { titulo: 'Usuarios con actividad', valor: kpis.usuarios, detalle: 'Participantes', icono: Users, tono: 'success' },
    { titulo: 'En proceso', valor: kpis.pendientes, detalle: 'Pendientes', icono: RefreshCw, tono: 'warning' },
  ]

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={vista}
            onValueChange={(v) => setVista(v as 'timeline' | 'tabla')}
          >
            <TabsList className="grid w-full grid-cols-2 sm:w-auto">
              <TabsTrigger value="timeline" className="gap-1.5">
                <ListTree className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="tabla" className="gap-1.5">
                <Table2 className="h-4 w-4" />
                Tabla
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuario, acción o elemento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar en el historial"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
            <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
              <SelectTrigger className="w-full lg:w-52">
                <SelectValue placeholder="Usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los usuarios</SelectItem>
                {USUARIOS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroAccion} onValueChange={setFiltroAccion}>
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Tipo de acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las acciones</SelectItem>
                {(
                  Object.keys(TIPO_LABEL) as TipoAccion[]
                ).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroFecha} onValueChange={setFiltroFecha}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fechas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Última semana</SelectItem>
                <SelectItem value="mes">Último mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {vista === 'timeline' ? (
          <div className="rounded-lg border bg-card p-4 sm:p-6">
            {eventosVista.length === 0 ? (
              <EmptyState
                titulo="Sin eventos"
                descripcion="No hay eventos que coincidan con los filtros aplicados."
                icono={FileClock}
              />
            ) : (
              <ol className="relative ml-2 space-y-5 border-l-2 border-white/10 pl-5">
                {eventosVista.map((e) => {
                  const Icono = TIPO_ICONO[e.accion]
                  const fecha = parseISO(e.fecha)
                  return (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-sidebar text-primary">
                        <Icono className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {TIPO_LABEL[e.accion]}
                            </span>
                            <Badge
                              variant="outline"
                              className={ESTADO_BADGE[e.estado]}
                            >
                              {ESTADO_LABEL[e.estado]}
                            </Badge>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            <span className="text-foreground">{e.elemento}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {e.usuario} · <span className="capitalize">{e.rol}</span>
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
            )}
          </div>
        ) : (
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
                          titulo="Sin eventos"
                          descripcion="No hay eventos que coincidan con los filtros aplicados."
                          icono={FileClock}
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filas.map((fila) => (
                      <TableRow key={fila.id}>
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
                  titulo="Sin eventos"
                  descripcion="No hay eventos que coincidan con los filtros aplicados."
                  icono={FileClock}
                />
              ) : (
                filas.map((fila) => {
                  const filaOrig = fila.original
                  const Icono = TIPO_ICONO[filaOrig.accion]
                  const fecha = parseISO(filaOrig.fecha)
                  return (
                    <div
                      key={filaOrig.id}
                      className="rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icono className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-medium">
                                {TIPO_LABEL[filaOrig.accion]}
                              </span>
                              <Badge
                                variant="outline"
                                className={ESTADO_BADGE[filaOrig.estado]}
                              >
                                {ESTADO_LABEL[filaOrig.estado]}
                              </Badge>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-foreground">
                              {filaOrig.elemento}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {filaOrig.usuario} ·{' '}
                              <span className="capitalize">{filaOrig.rol}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {format(fecha, 'dd MMM yyyy')}
                          </span>
                          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {format(fecha, 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium">
                  {filas.length === 0 ? 0 : primera}–{ultima}
                </span>{' '}
                de{' '}
                <span className="font-medium">
                  {table.getFilteredRowModel().rows.length}
                </span>{' '}
                eventos
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
          </div>
        )}
      </FadeIn>
    </div>
  )
}