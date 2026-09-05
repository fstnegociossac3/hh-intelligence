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
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingUp,
  Upload,
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
import { ESTADO_OK, ESTADO_WARNING, ESTADO_INFO } from '@/utils/estados-clases'
import {
  useHistorial,
  type AccionHistorial,
  type EventoHistorial,
} from '@/data/historial-store'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

type EstadoEvento = 'completado' | 'resuelta' | 'detectada' | 'generado'

const TIPO_LABEL: Record<AccionHistorial, string> = {
  proyecto_creado: 'Proyecto creado',
  proyecto_editado: 'Proyecto editado',
  documento_cargado: 'Documento cargado',
  documento_procesado: 'Documento procesado',
  analisis_ejecutado: 'Análisis ejecutado',
  observacion_creada: 'Observación creada',
  observacion_resuelta: 'Observación resuelta',
  reanalisis_ejecutado: 'Reanálisis ejecutado',
  reporte_generado: 'Reporte generado',
}

const TIPO_ICONO: Record<AccionHistorial, LucideIcon> = {
  proyecto_creado: FolderPlus,
  proyecto_editado: Pencil,
  documento_cargado: Upload,
  documento_procesado: FileCheck2,
  analisis_ejecutado: TrendingUp,
  observacion_creada: ShieldAlert,
  observacion_resuelta: ClipboardCheck,
  reanalisis_ejecutado: RefreshCw,
  reporte_generado: FileBarChart,
}

const ESTADO_POR_ACCION: Record<AccionHistorial, EstadoEvento> = {
  proyecto_creado: 'completado',
  proyecto_editado: 'completado',
  documento_cargado: 'completado',
  documento_procesado: 'completado',
  analisis_ejecutado: 'completado',
  observacion_creada: 'detectada',
  observacion_resuelta: 'resuelta',
  reanalisis_ejecutado: 'completado',
  reporte_generado: 'generado',
}

const ESTADO_LABEL: Record<EstadoEvento, string> = {
  completado: 'Completado',
  resuelta: 'Resuelta',
  detectada: 'Detectada',
  generado: 'Generado',
}

const ESTADO_BADGE: Record<EstadoEvento, string> = {
  completado: ESTADO_OK,
  resuelta: ESTADO_OK,
  detectada: ESTADO_WARNING,
  generado: ESTADO_INFO,
}

function dividirUsuario(usuario: string) {
  const partes = usuario.split(' · ')
  if (partes.length >= 3) {
    return {
      nombre: `${partes[0]} · ${partes[1]}`,
      rol: partes.slice(2).join(' · '),
    }
  }
  if (partes.length === 2) {
    return { nombre: partes[0], rol: partes[1] }
  }
  return { nombre: usuario, rol: '' }
}

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

export function HistorialProyecto({ proyectoId }: { proyectoId: string }) {
  const [vista, setVista] = useState<'timeline' | 'tabla'>('timeline')
  const [busqueda, setBusqueda] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('todos')
  const [filtroAccion, setFiltroAccion] = useState('todas')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [sorting, setSorting] = useState<SortingState>([])
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })

  const eventos = useHistorial()
  const eventosProyecto = useMemo(
    () => eventos.filter((e) => e.proyectoId === proyectoId),
    [eventos, proyectoId],
  )

  const usuariosDisponibles = useMemo(
    () => Array.from(new Set(eventosProyecto.map((e) => e.usuario))),
    [eventosProyecto],
  )

  const datosFiltrados = useMemo(() => {
    const ahora = new Date()
    return eventosProyecto.filter((e) => {
      if (filtroUsuario !== 'todos' && e.usuario !== filtroUsuario) return false
      if (filtroAccion !== 'todas' && e.accion !== filtroAccion) return false
      if (filtroFecha !== 'todas') {
        const fecha = new Date(e.fecha)
        if (filtroFecha === 'hoy' && fecha.toDateString() !== ahora.toDateString()) return false
        if (
          filtroFecha === 'semana' &&
          fecha.getTime() < ahora.getTime() - 7 * 24 * 60 * 60 * 1000
        )
          return false
        if (
          filtroFecha === 'mes' &&
          fecha.getTime() < ahora.getTime() - 30 * 24 * 60 * 60 * 1000
        )
          return false
      }
      return true
    })
  }, [eventosProyecto, filtroUsuario, filtroAccion, filtroFecha])

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
        cell: ({ row }) => {
          const { nombre, rol } = dividirUsuario(row.original.usuario)
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium">{nombre}</span>
              {rol && (
                <span className="text-xs text-muted-foreground">{rol}</span>
              )}
            </div>
          )
        },
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
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => (
          <span className="max-w-[260px] truncate text-xs">
            {row.original.descripcion}
          </span>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          const estado = ESTADO_POR_ACCION[row.original.accion]
          return (
            <Badge variant="outline" className={ESTADO_BADGE[estado]}>
              {ESTADO_LABEL[estado]}
            </Badge>
          )
        },
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
      total: eventosProyecto.length,
      acciones: new Set(eventosProyecto.map((e) => e.accion)).size,
      usuarios: new Set(eventosProyecto.map((e) => e.usuario)).size,
      reanalisis: eventosProyecto.filter(
        (e) => e.accion === 'reanalisis_ejecutado',
      ).length,
    }),
    [eventosProyecto],
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
    { titulo: 'Reanálisis ejecutados', valor: kpis.reanalisis, detalle: 'Sobre observaciones', icono: RefreshCw, tono: 'warning' },
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
              placeholder="Buscar usuario, acción o descripción..."
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
                {usuariosDisponibles.map((u) => (
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
                  Object.keys(TIPO_LABEL) as AccionHistorial[]
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
                  const estado = ESTADO_POR_ACCION[e.accion]
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
                              className={ESTADO_BADGE[estado]}
                            >
                              {ESTADO_LABEL[estado]}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="text-foreground">{e.descripcion}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {e.usuario}
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
                  const e = fila.original
                  const Icono = TIPO_ICONO[e.accion]
                  const estado = ESTADO_POR_ACCION[e.accion]
                  const fecha = parseISO(e.fecha)
                  const { nombre, rol } = dividirUsuario(e.usuario)
                  return (
                    <div
                      key={e.id}
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
                                {TIPO_LABEL[e.accion]}
                              </span>
                              <Badge
                                variant="outline"
                                className={ESTADO_BADGE[estado]}
                              >
                                {ESTADO_LABEL[estado]}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-foreground">
                              {e.descripcion}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {nombre}
                              {rol && (
                                <>
                                  {' · '}
                                  <span className="capitalize">{rol}</span>
                                </>
                              )}
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