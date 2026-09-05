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
  Eye,
  FolderOpen,
  Gauge,
  Play,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePermisos } from '@/utils/permisos'
import { agregarNotificacion } from '@/data/notificaciones-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { EmptyState } from '@/components/empty-state'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { useAnalisis, calcularTotales } from '@/data/analisis-store'
import type { ResultadoAnalisis, RegistroAnalisis } from '@/data/analisis-store'
import { useProyectos } from '@/data/proyectos-store'
import { EjecucionAnalisis, type ResumenEjecucion } from '@/components/ejecucion-analisis'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

const RESULTADO_LABEL: Record<ResultadoAnalisis, string> = {
  conforme: 'Conforme',
  observado: 'Observado',
  critico: 'Crítico',
  pendiente: 'Pendiente',
}

const RESULTADO_BADGE: Record<ResultadoAnalisis, string> = {
  conforme: ESTADO_OK,
  observado: ESTADO_WARNING,
  critico: ESTADO_CRITICO,
  pendiente: ESTADO_NEUTRO,
}

const RESULTADO_ICONO: Record<ResultadoAnalisis, typeof CheckCircle2> = {
  conforme: CheckCircle2,
  observado: AlertTriangle,
  critico: AlertTriangle,
  pendiente: Gauge,
}

function CeldaSortable({ header }: { header: Header<RegistroAnalisis, unknown> }) {
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

export function AnalisisPage() {
  const navigate = useNavigate()
  const { puedeEditar } = usePermisos()
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroResultado, setFiltroResultado] = useState('todos')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })
  const [ejecutando, setEjecutando] = useState(false)

  const registros = useAnalisis()
  const proyectos = useProyectos()

  const datosFiltrados = useMemo(() => {
    return registros.filter((a) => {
      if (filtroResultado !== 'todos' && a.resultado !== filtroResultado) return false
      return true
    })
  }, [filtroResultado, registros])

  const columnas = useMemo<ColumnDef<RegistroAnalisis>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">
            {row.original.codigo}
          </span>
        ),
      },
      {
        accessorKey: 'proyecto',
        header: 'Proyecto',
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <p className="truncate text-sm font-medium">{row.original.proyecto}</p>
          </div>
        ),
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha de análisis',
        cell: ({ row }) => (
          <span className="text-xs">{formatFecha(row.original.fecha)}</span>
        ),
      },
      {
        accessorKey: 'resultado',
        header: 'Resultado',
        cell: ({ row }) => {
          const Icono = RESULTADO_ICONO[row.original.resultado]
          return (
            <Badge variant="outline" className={RESULTADO_BADGE[row.original.resultado]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {RESULTADO_LABEL[row.original.resultado]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'puntaje',
        header: 'Puntaje',
        cell: ({ row }) => {
          const puntaje = row.original.puntaje
          if (puntaje === 0) return <span className="text-xs text-muted-foreground">—</span>
          return (
            <div className="flex w-24 items-center gap-2">
              <Progress
                value={puntaje}
                className={cn(
                  'h-1.5',
                  puntaje >= 80
                    ? '[&>div]:bg-success'
                    : puntaje >= 60
                      ? '[&>div]:bg-primary'
                      : '[&>div]:bg-destructive',
                )}
              />
              <span className="w-8 text-right text-xs text-muted-foreground">
                {puntaje}%
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'documentosAnalizados',
        header: 'Docs analizados',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.documentosAnalizados}</span>
        ),
      },
      {
        accessorKey: 'observaciones',
        header: 'Observaciones',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              row.original.observaciones > 0
                ? 'border-warning/40 bg-warning/10 text-warning'
                : 'text-muted-foreground',
            )}
          >
            {row.original.observaciones}
          </Badge>
        ),
      },
      {
        accessorKey: 'inconsistencias',
        header: 'Inconsistencias',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              row.original.inconsistencias > 0
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'text-muted-foreground',
            )}
          >
            {row.original.inconsistencias}
          </Badge>
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
        id: 'acciones',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/proyectos/${row.original.proyectoId}`)}
          >
            <Eye className="mr-1 h-4 w-4" />
            Ver
          </Button>
        ),
      },
    ],
    [navigate],
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

  const totales = useMemo(() => calcularTotales(registros), [registros])

  const ejecutarAnalisisGeneral = () => {
    setEjecutando(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análisis Inteligente</h2>
          <p className="text-sm text-muted-foreground">
            Revisión automática de documentos contra normativa vigente.
          </p>
        </div>
        {puedeEditar && (
          <Button onClick={ejecutarAnalisisGeneral} disabled={ejecutando}>
            <Play />
            Ejecutar análisis general
          </Button>
        )}
      </div>

      {ejecutando && (
        <EjecucionAnalisis
          proyectos={proyectos.map((p) => ({
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
          }))}
          activo={ejecutando}
          onFinalizado={(resumen: ResumenEjecucion) => {
            toast.success('Análisis general completado', {
              description: `${resumen.proyectos} expedientes · ${resumen.documentos} documentos · ${resumen.observaciones} observaciones.`,
            })
            agregarNotificacion({
              tipo: 'analisis',
              titulo: 'Análisis terminado',
              descripcion: `${resumen.proyectos} expedientes analizados · ${resumen.documentos} documentos · ${resumen.observaciones} observaciones.`,
              ruta: '/analisis',
            })
            window.setTimeout(() => setEjecutando(false), 1800)
          }}
        />
      )}

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <KpiCard
            titulo="Total analizados"
            valor={totales.total}
            detalle="Expedientes procesados"
            icono={FolderOpen}
            tono="default"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            titulo="Conformes"
            valor={totales.conformes}
            detalle="Sin observaciones"
            icono={CheckCircle2}
            tono="success"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            titulo="Observados"
            valor={totales.observados}
            detalle="Requieren revisión"
            icono={AlertTriangle}
            tono="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            titulo="Críticos"
            valor={totales.criticos}
            detalle="Atención inmediata"
            icono={AlertTriangle}
            tono="danger"
          />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes de análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totales.pendientes}</p>
            <p className="text-xs text-muted-foreground">expedientes sin procesar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{totales.observaciones}</p>
            <p className="text-xs text-muted-foreground">hallazgos detectados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inconsistencias críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{totales.inconsistencias}</p>
            <p className="text-xs text-muted-foreground">requieren atención urgente</p>
          </CardContent>
        </Card>
      </div>

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por código o proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar análisis"
            />
          </div>

          <Select value={filtroResultado} onValueChange={setFiltroResultado}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los resultados</SelectItem>
              <SelectItem value="conforme">Conforme</SelectItem>
              <SelectItem value="observado">Observado</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <div className="rounded-lg border bg-card">
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
                    <TableCell colSpan={columnas.length} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <span>No se encontraron análisis</span>
                      </div>
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
        </div>

        <div className="grid gap-3 lg:hidden">
          {filas.length === 0 ? (
            <EmptyState
              icono={Search}
              titulo="Sin resultados"
              descripcion="No se encontraron análisis con los filtros aplicados."
            />
          ) : (
            filas.map((fila) => {
              const a = fila.original
              const Icono = RESULTADO_ICONO[a.resultado]
              return (
                <div key={fila.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{a.codigo}</p>
                      <p className="mt-1 truncate text-sm font-medium">{a.proyecto}</p>
                    </div>
                    <Badge variant="outline" className={RESULTADO_BADGE[a.resultado]}>
                      <Icono className="mr-1 h-3 w-3" />
                      {RESULTADO_LABEL[a.resultado]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Puntaje</p>
                      <p className="font-medium">{a.puntaje > 0 ? `${a.puntaje}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Observaciones</p>
                      <p className="font-medium">{a.observaciones}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inconsistencias</p>
                      <p className="font-medium">{a.inconsistencias}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatFecha(a.fecha)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/proyectos/${a.proyectoId}`)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Ver proyecto
                    </Button>
                  </div>
                </div>
              )
            })
          )}
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
            análisis
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
            <Button variant="outline" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center text-sm">
              {paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}
            </span>
            <Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
