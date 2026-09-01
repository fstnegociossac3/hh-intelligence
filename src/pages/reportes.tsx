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
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileBarChart,
  FileCheck2,
  FileText,
  GitBranch,
  MoreHorizontal,
  PieChart,
  Play,
  Printer,
  Scale,
  Search,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
import { proyectos } from '@/data/proyectos'
import { ReportePreview } from '@/components/reporte-preview'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

type TipoReporte =
  | 'general'
  | 'inconsistencias'
  | 'observaciones'
  | 'coherencia'
  | 'trazabilidad'

type EstadoReporte = 'pendiente' | 'generado'

interface Reporte {
  id: string
  nombre: string
  proyecto: string
  tipo: TipoReporte
  fecha: string
  responsable: string
  estado: EstadoReporte
}

const PROYECTOS = proyectos.map((p) => p.codigo)

const TIPO_LABEL: Record<TipoReporte, string> = {
  general: 'Reporte general del expediente',
  inconsistencias: 'Reporte de inconsistencias',
  observaciones: 'Reporte de observaciones',
  coherencia: 'Reporte de coherencia',
  trazabilidad: 'Reporte de trazabilidad',
}

const TIPO_ICONO: Record<TipoReporte, LucideIcon> = {
  general: FileBarChart,
  inconsistencias: Scale,
  observaciones: ClipboardList,
  coherencia: PieChart,
  trazabilidad: GitBranch,
}

const TIPO_BADGE: Record<TipoReporte, string> = {
  general: ESTADO_NEUTRO,
  inconsistencias: ESTADO_CRITICO,
  observaciones: ESTADO_WARNING,
  coherencia: ESTADO_OK,
  trazabilidad: ESTADO_INFO,
}

const ESTADO_LABEL: Record<EstadoReporte, string> = {
  pendiente: 'Pendiente',
  generado: 'Generado',
}

const ESTADO_BADGE: Record<EstadoReporte, string> = {
  pendiente: ESTADO_NEUTRO,
  generado: ESTADO_OK,
}

const MOCK_INICIAL: Reporte[] = [
  { id: 'r-01', nombre: 'Informe ejecutivo general', proyecto: 'EXP-2025-0147', tipo: 'general', fecha: '2026-08-25T10:15:00', responsable: 'Andrea Quispe', estado: 'generado' },
  { id: 'r-02', nombre: 'Matriz de inconsistencias detectadas', proyecto: 'EXP-2025-0163', tipo: 'inconsistencias', fecha: '2026-08-27T09:40:00', responsable: 'Lucía Fernández', estado: 'generado' },
  { id: 'r-03', nombre: 'Consolidado de observaciones', proyecto: 'EXP-2025-0158', tipo: 'observaciones', fecha: '2026-08-28T14:05:00', responsable: 'Jorge Paredes', estado: 'pendiente' },
  { id: 'r-04', nombre: 'Reporte de coherencia documental', proyecto: 'EXP-2025-0147', tipo: 'coherencia', fecha: '2026-08-29T11:30:00', responsable: 'Andrea Quispe', estado: 'generado' },
  { id: 'r-05', nombre: 'Trazabilidad de cambios por versión', proyecto: 'EXP-2025-0171', tipo: 'trazabilidad', fecha: '2026-08-29T16:00:00', responsable: 'Carlos Mendoza', estado: 'generado' },
  { id: 'r-06', nombre: 'Resumen general del expediente', proyecto: 'EXP-2025-0171', tipo: 'general', fecha: '2026-08-30T08:20:00', responsable: 'Carlos Mendoza', estado: 'pendiente' },
  { id: 'r-07', nombre: 'Detalle de inconsistencias críticas', proyecto: 'EXP-2025-0163', tipo: 'inconsistencias', fecha: '2026-08-30T10:45:00', responsable: 'Ana Quispe', estado: 'generado' },
  { id: 'r-08', nombre: 'Seguimiento de observaciones abiertas', proyecto: 'EXP-2025-0158', tipo: 'observaciones', fecha: '2026-08-28T12:10:00', responsable: 'Jorge Paredes', estado: 'generado' },
  { id: 'r-09', nombre: 'Índice de coherencia por relación', proyecto: 'EXP-2025-0147', tipo: 'coherencia', fecha: '2026-08-27T15:25:00', responsable: 'Lucía Fernández', estado: 'pendiente' },
  { id: 'r-10', nombre: 'Historial de versiones y auditoría', proyecto: 'EXP-2025-0171', tipo: 'trazabilidad', fecha: '2026-08-26T09:15:00', responsable: 'Carlos Mendoza', estado: 'generado' },
  { id: 'r-11', nombre: 'Informe general de cumplimiento normativo', proyecto: 'EXP-2025-0163', tipo: 'general', fecha: '2026-08-31T09:05:00', responsable: 'Ana Quispe', estado: 'generado' },
  { id: 'r-12', nombre: 'Matriz de inconsistencias por regla', proyecto: 'EXP-2025-0147', tipo: 'inconsistencias', fecha: '2026-08-25T17:50:00', responsable: 'Andrea Quispe', estado: 'generado' },
  { id: 'r-13', nombre: 'Reporte de coherencia del metrado', proyecto: 'EXP-2025-0158', tipo: 'coherencia', fecha: '2026-08-24T11:40:00', responsable: 'Jorge Paredes', estado: 'generado' },
  { id: 'r-14', nombre: 'Auditoría de trazabilidad documental', proyecto: 'EXP-2025-0163', tipo: 'trazabilidad', fecha: '2026-08-29T13:30:00', responsable: 'Lucía Fernández', estado: 'pendiente' },
  { id: 'r-15', nombre: 'Resumen de observaciones por partida', proyecto: 'EXP-2025-0171', tipo: 'observaciones', fecha: '2026-08-23T10:20:00', responsable: 'Ana Quispe', estado: 'generado' },
]

function CeldaSortable({ header }: { header: Header<Reporte, unknown> }) {
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

export function ReportesPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })
  const [reportes, setReportes] = useState<Reporte[]>(MOCK_INICIAL)
  const [seleccionId, setSeleccionId] = useState<string | null>(null)

  const datosFiltrados = useMemo(() => {
    return reportes.filter((r) => {
      if (filtroProyecto !== 'todos' && r.proyecto !== filtroProyecto) return false
      if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false
      if (filtroFecha !== 'todas') {
        const dia = r.fecha.slice(0, 10)
        if (filtroFecha === 'hoy' && dia !== '2026-08-31') return false
        if (filtroFecha === 'semana') {
          const fecha = new Date(dia)
          const limite = new Date('2026-08-24')
          if (fecha < limite) return false
        }
        if (filtroFecha === 'mes' && !dia.startsWith('2026-08')) return false
      }
      return true
    })
  }, [filtroProyecto, filtroTipo, filtroFecha, reportes])

  const nombreProyecto = (codigo: string) =>
    proyectos.find((p) => p.codigo === codigo)?.nombre ?? codigo

  const columnas = useMemo<ColumnDef<Reporte>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-sm font-medium">
            {row.original.nombre}
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
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => {
          const Icono = TIPO_ICONO[row.original.tipo]
          return (
            <Badge variant="outline" className={TIPO_BADGE[row.original.tipo]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {TIPO_LABEL[row.original.tipo]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatFecha(row.original.fecha.slice(0, 10))}
          </span>
        ),
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
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const r = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Acciones">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{r.nombre}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => verReporte(r)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generarReporte(r.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Generar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => descargarReporte(r)}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar simulado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => imprimirReporte(r)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir simulado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

  const kpis = useMemo(
    () => ({
      total: reportes.length,
      generados: reportes.filter((r) => r.estado === 'generado').length,
      pendientes: reportes.filter((r) => r.estado === 'pendiente').length,
      tipos: new Set(reportes.map((r) => r.tipo)).size,
    }),
    [reportes],
  )

  const pctGenerado = Math.round((kpis.generados / Math.max(kpis.total, 1)) * 100)

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Total de reportes', valor: kpis.total, detalle: 'En el sistema', icono: FileText, tono: 'default' },
    { titulo: 'Generados', valor: kpis.generados, detalle: `${pctGenerado}% del total`, icono: FileCheck2, tono: 'success' },
    { titulo: 'Pendientes', valor: kpis.pendientes, detalle: 'Por generar', icono: CalendarClock, tono: 'warning' },
    { titulo: 'Tipos disponibles', valor: kpis.tipos, detalle: 'Token de reporte', icono: BarChart3, tono: 'info' },
  ]

  const resultado = reportes.find((r) => r.id === seleccionId) ?? null

  const verReporte = (r: Reporte) => {
    setSeleccionId(r.id)
  }

  const generarReporte = (id: string) => {
    setReportes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: 'generado' } : r)),
    )
    toast.success('Reporte generado', {
      description: 'El reporte se generó correctamente y quedó listo para descargar.',
    })
  }

  const descargarReporte = (r: Reporte) => {
    toast.info('Descarga simulada', {
      description: `Se descargó "${r.nombre}.pdf" (simulado) de ${r.proyecto}.`,
    })
  }

  const imprimirReporte = (r: Reporte) => {
    toast.info('Impresión simulada', {
      description: `Enviando "${r.nombre}" a la impresora (simulado).`,
    })
  }

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

      <FadeIn className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Listado de reportes
        </h2>
      </FadeIn>

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar nombre o responsable..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar reportes"
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

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {(
                  Object.keys(TIPO_LABEL) as TipoReporte[]
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
                        titulo="Sin reportes"
                        descripcion="No hay reportes que coincidan con los filtros aplicados."
                        icono={FileText}
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
                titulo="Sin reportes"
                descripcion="No hay reportes que coincidan con los filtros aplicados."
                icono={FileText}
              />
            ) : (
              filas.map((fila) => {
                const r = fila.original
                const Icono = TIPO_ICONO[r.tipo]
                return (
                  <div key={fila.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.nombre}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {r.proyecto}
                        </p>
                      </div>
                      <Badge variant="outline" className={ESTADO_BADGE[r.estado]}>
                        {ESTADO_LABEL[r.estado]}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={TIPO_BADGE[r.tipo]}>
                        <Icono className="mr-1 h-3.5 w-3.5" />
                        {TIPO_LABEL[r.tipo]}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{nombreProyecto(r.proyecto)}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {r.responsable} · {formatFecha(r.fecha.slice(0, 10))}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="Ver" onClick={() => verReporte(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Generar" onClick={() => generarReporte(r.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Descargar" onClick={() => descargarReporte(r)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Imprimir" onClick={() => imprimirReporte(r)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
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
            reportes
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

      {resultado && (
        <ReportePreview
          key={seleccionId ?? 'cerrado'}
          open={!!resultado}
          onOpenChange={(o) => !o && setSeleccionId(null)}
          reporte={resultado}
        />
      )}
    </div>
  )
}