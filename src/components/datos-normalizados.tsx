import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  ListChecks,
  Search,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO } from '@/utils/estados-clases'
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

type EstadoNormalizado = 'normalizado' | 'pendiente' | 'con_observaciones'

interface RegistroNormalizado {
  id: string
  codigo: string
  partida: string
  descripcion: string
  unidad: string
  cantidad: string
  especialidad: string
  documentoOrigen: string
  confianza: number
  estado: EstadoNormalizado
}

const ESTADO_LABEL: Record<EstadoNormalizado, string> = {
  normalizado: 'Normalizado',
  pendiente: 'Pendiente',
  con_observaciones: 'Con observaciones',
}

const ESTADO_CLASE: Record<EstadoNormalizado, string> = {
  normalizado: ESTADO_OK,
  pendiente: ESTADO_WARNING,
  con_observaciones: ESTADO_CRITICO,
}

const DOCUMENTOS_ORIGEN = [
  'Expediente Técnico - Tomo I.pdf',
  'Metrados de Obra.xlsx',
  'Presupuesto General.xlsx',
  'Especificaciones Técnicas - Concreto.docx',
  'Planos Estructurales - Cimentación.pdf',
  'Cronograma de Ejecución.xlsx',
]

const ESPECIALIDADES_NORM = [
  'Estructuras',
  'Costos y Presupuestos',
  'Sanitaria',
  'Eléctricas',
  'Geotecnia',
  'Arquitectura',
]

const MOCK: RegistroNormalizado[] = [
  { id: 'n-01', codigo: '01.01', partida: 'Obras provisionales', descripcion: 'Construcciones provisionales para obra', unidad: 'GLB', cantidad: '1.00', especialidad: 'Costos y Presupuestos', documentoOrigen: 'Metrados de Obra.xlsx', confianza: 98, estado: 'normalizado' },
  { id: 'n-02', codigo: '01.02', partida: 'Movimiento de tierras', descripcion: 'Corte y relleno de terreno natural', unidad: 'M3', cantidad: '1,250.00', especialidad: 'Estructuras', documentoOrigen: 'Metrados de Obra.xlsx', confianza: 96, estado: 'normalizado' },
  { id: 'n-03', codigo: '01.03', partida: 'Concreto simple', descripcion: 'Concreto f\'c=140 kg/cm² para falsa zapata', unidad: 'M3', cantidad: '420.00', especialidad: 'Estructuras', documentoOrigen: 'Metrados de Obra.xlsx', confianza: 93, estado: 'normalizado' },
  { id: 'n-04', codigo: '01.04', partida: 'Concreto armado', descripcion: 'Concreto f\'c=210 kg/cm² en cimientos', unidad: 'M3', cantidad: '680.00', especialidad: 'Estructuras', documentoOrigen: 'Presupuesto General.xlsx', confianza: 91, estado: 'normalizado' },
  { id: 'n-05', codigo: '01.05', partida: 'Acero de refuerzo', descripcion: 'Acero corrugado grado 60', unidad: 'KG', cantidad: '12,500.00', especialidad: 'Estructuras', documentoOrigen: 'Presupuesto General.xlsx', confianza: 88, estado: 'pendiente' },
  { id: 'n-06', codigo: '01.06', partida: 'Encofrado', descripcion: 'Encofrado y desencofrado normal', unidad: 'M2', cantidad: '1,800.00', especialidad: 'Estructuras', documentoOrigen: 'Metrados de Obra.xlsx', confianza: 90, estado: 'normalizado' },
  { id: 'n-07', codigo: '02.01', partida: 'Redes de desagüe', descripcion: 'Red de desagüe PVC-SAL Ø 4"', unidad: 'ML', cantidad: '850.00', especialidad: 'Sanitaria', documentoOrigen: 'Expediente Técnico - Tomo I.pdf', confianza: 85, estado: 'con_observaciones' },
  { id: 'n-08', codigo: '02.02', partida: 'Aparatos sanitarios', descripcion: 'Inodoros, lavatorios y accesorios', unidad: 'PZA', cantidad: '45.00', especialidad: 'Sanitaria', documentoOrigen: 'Expediente Técnico - Tomo I.pdf', confianza: 82, estado: 'con_observaciones' },
  { id: 'n-09', codigo: '03.01', partida: 'Instalaciones eléctricas', descripcion: 'Salidas para artefactos empotrados', unidad: 'PTO', cantidad: '320.00', especialidad: 'Eléctricas', documentoOrigen: 'Especificaciones Técnicas - Concreto.docx', confianza: 79, estado: 'pendiente' },
  { id: 'n-10', codigo: '03.02', partida: 'Tableros eléctricos', descripcion: 'Tablero de distribución tipo C-12s', unidad: 'UN', cantidad: '6.00', especialidad: 'Eléctricas', documentoOrigen: 'Especificaciones Técnicas - Concreto.docx', confianza: 76, estado: 'pendiente' },
  { id: 'n-11', codigo: '04.01', partida: 'Muros de contención', descripcion: 'Muro de concreto armado H=3.20 m', unidad: 'M3', cantidad: '540.00', especialidad: 'Estructuras', documentoOrigen: 'Planos Estructurales - Cimentación.pdf', confianza: 94, estado: 'normalizado' },
  { id: 'n-12', codigo: '04.02', partida: 'Cimentaciones', descripcion: 'Zapatas conectadas', unidad: 'M3', cantidad: '760.00', especialidad: 'Estructuras', documentoOrigen: 'Planos Estructurales - Cimentación.pdf', confianza: 92, estado: 'normalizado' },
  { id: 'n-13', codigo: '05.01', partida: 'Estudio de suelos', descripcion: 'Análisis de mecánica de suelos', unidad: 'EST', cantidad: '1.00', especialidad: 'Geotecnia', documentoOrigen: 'Expediente Técnico - Tomo I.pdf', confianza: 89, estado: 'normalizado' },
  { id: 'n-14', codigo: '05.02', partida: 'Compactación', descripcion: 'Compactación de terreno e=0.30 m', unidad: 'M2', cantidad: '2,400.00', especialidad: 'Geotecnia', documentoOrigen: 'Expediente Técnico - Tomo I.pdf', confianza: 84, estado: 'con_observaciones' },
  { id: 'n-15', codigo: '06.01', partida: 'Vigas', descripcion: 'Vigas de concreto armado 0.30x0.50', unidad: 'M3', cantidad: '310.00', especialidad: 'Estructuras', documentoOrigen: 'Presupuesto General.xlsx', confianza: 95, estado: 'normalizado' },
  { id: 'n-16', codigo: '06.02', partida: 'Columnas', descripcion: 'Columnas de concreto armado', unidad: 'M3', cantidad: '280.00', especialidad: 'Estructuras', documentoOrigen: 'Presupuesto General.xlsx', confianza: 93, estado: 'pendiente' },
  { id: 'n-17', codigo: '07.01', partida: 'Losas', descripcion: 'Losas aligeradas e=0.25 m', unidad: 'M3', cantidad: '390.00', especialidad: 'Arquitectura', documentoOrigen: 'Cronograma de Ejecución.xlsx', confianza: 80, estado: 'con_observaciones' },
  { id: 'n-18', codigo: '07.02', partida: 'Tarrajeos', descripcion: 'Tarrajeo en muros interiores', unidad: 'M2', cantidad: '5,600.00', especialidad: 'Arquitectura', documentoOrigen: 'Cronograma de Ejecución.xlsx', confianza: 77, estado: 'pendiente' },
]

const FILAS_POR_PAGINA = [6, 8, 10, 15]

function CiConfianza({ confianza }: { confianza: number }) {
  const color = confianza >= 90 ? 'emerald' : confianza >= 80 ? 'amber' : 'orange'
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'relative h-1.5 w-14 overflow-hidden rounded-full bg-muted',
        )}
      >
        <div
          className={cn(
            'h-full',
            color === 'emerald'
              ? 'bg-success'
              : color === 'amber'
                ? 'bg-warning'
                : 'bg-destructive',
          )}
          style={{ width: `${confianza}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums font-medium">
        {confianza}%
      </span>
    </div>
  )
}

function CeldaSortable({ header }: { header: Header<RegistroNormalizado, unknown> }) {
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

export function DatosNormalizados() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroDocumento, setFiltroDocumento] = useState('todos')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroConfianza, setFiltroConfianza] = useState('todos')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 8 })

  const kpis = useMemo(() => {
    const detectados = MOCK.length
    const normalizados = MOCK.filter((r) => r.estado === 'normalizado').length
    const pendientes = MOCK.filter((r) => r.estado === 'pendiente').length
    const observaciones = MOCK.filter(
      (r) => r.estado === 'con_observaciones',
    ).length
    return { detectados, normalizados, pendientes, observaciones }
  }, [])

  const datosFiltrados = useMemo(() => {
    return MOCK.filter((r) => {
      if (filtroDocumento !== 'todos' && r.documentoOrigen !== filtroDocumento)
        return false
      if (
        filtroEspecialidad !== 'todas' &&
        r.especialidad !== filtroEspecialidad
      )
        return false
      if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false
      if (filtroConfianza === 'alto' && r.confianza < 90) return false
      if (
        filtroConfianza === 'medio' &&
        (r.confianza < 80 || r.confianza >= 90)
      )
        return false
      if (filtroConfianza === 'bajo' && r.confianza >= 80) return false
      return true
    })
  }, [filtroDocumento, filtroEspecialidad, filtroEstado, filtroConfianza])

  const columnas = useMemo<ColumnDef<RegistroNormalizado>[]>(
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
        accessorKey: 'partida',
        header: 'Partida',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.partida}</span>
        ),
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ row }) => (
          <span className="max-w-[240px] truncate text-xs text-muted-foreground">
            {row.original.descripcion}
          </span>
        ),
      },
      {
        accessorKey: 'unidad',
        header: 'Unidad',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.unidad}</span>
        ),
      },
      {
        accessorKey: 'cantidad',
        header: 'Cantidad',
        cell: ({ row }) => (
          <span className="text-right text-xs tabular-nums">
            {row.original.cantidad}
          </span>
        ),
      },
      {
        accessorKey: 'especialidad',
        header: 'Especialidad',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.especialidad}</Badge>
        ),
      },
      {
        accessorKey: 'documentoOrigen',
        header: 'Documento origen',
        cell: ({ row }) => (
          <span className="flex max-w-[200px] items-center gap-1.5 truncate text-xs">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.original.documentoOrigen}</span>
          </span>
        ),
      },
      {
        accessorKey: 'confianza',
        header: 'Confianza IA',
        enableSorting: true,
        cell: ({ row }) => <CiConfianza confianza={row.original.confianza} />,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant="outline" className={ESTADO_CLASE[row.original.estado]}>
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

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    {
      titulo: 'Registros detectados',
      valor: kpis.detectados,
      detalle: 'Filas extraídas de los documentos',
      icono: Database,
      tono: 'default' as const,
    },
    {
      titulo: 'Registros normalizados',
      valor: kpis.normalizados,
      detalle: 'En estructura común',
      icono: ShieldCheck,
      tono: 'success' as const,
    },
    {
      titulo: 'Pendientes',
      valor: kpis.pendientes,
      detalle: 'Requieren revisión',
      icono: ListChecks,
      tono: 'warning' as const,
    },
    {
      titulo: 'Con observaciones',
      valor: kpis.observaciones,
      detalle: 'Posibles inconsistencias',
      icono: AlertTriangle,
      tono: kpis.observaciones > 0 ? 'danger' : 'success',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Database className="h-4 w-4 text-primary" />
          Datos normalizados
        </h3>
        <p className="text-sm text-muted-foreground">
          Información extraída de distintos documentos, organizada en una
          estructura común.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((kpi) => (
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

      <div className="flex flex-col gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar partida, código, descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar registros normalizados"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          <Select value={filtroDocumento} onValueChange={setFiltroDocumento}>
            <SelectTrigger className="w-full lg:w-56">
              <SelectValue placeholder="Documento origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los documentos</SelectItem>
              {DOCUMENTOS_ORIGEN.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtroEspecialidad}
            onValueChange={setFiltroEspecialidad}
          >
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las especialidades</SelectItem>
              {ESPECIALIDADES_NORM.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {(
                [
                  ['normalizado', 'Normalizado'],
                  ['pendiente', 'Pendiente'],
                  ['con_observaciones', 'Con observaciones'],
                ] as [EstadoNormalizado, string][]
              ).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroConfianza} onValueChange={setFiltroConfianza}>
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Nivel de confianza" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Toda confianza</SelectItem>
              <SelectItem value="alto">Alta (≥ 90%)</SelectItem>
              <SelectItem value="medio">Media (80-89%)</SelectItem>
              <SelectItem value="bajo">Baja (&lt; 80%)</SelectItem>
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
                  <TableCell
                    colSpan={columnas.length}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8" />
                      <span>No se encontraron registros normalizados</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((fila) => (
                  <TableRow key={fila.id}>
                    {fila.getVisibleCells().map((celda) => (
                      <TableCell key={celda.id}>
                        {flexRender(
                          celda.column.columnDef.cell,
                          celda.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-3 lg:hidden">
          {filas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8" />
              <span className="text-sm">
                No se encontraron registros normalizados
              </span>
            </div>
          ) : (
            filas.map((fila) => {
              const r = fila.original
              return (
                <div
                  key={fila.id}
                  className="flex flex-col gap-2 border-b p-4 last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {r.codigo}
                      </span>
                      <p className="truncate text-sm font-medium">
                        {r.partida}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={ESTADO_CLASE[r.estado]}
                    >
                      {ESTADO_LABEL[r.estado]}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.descripcion}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>
                      Unidad: <span className="font-medium">{r.unidad}</span>
                    </span>
                    <span>
                      Cantidad:{' '}
                      <span className="font-medium">{r.cantidad}</span>
                    </span>
                    <span>Especialidad: {r.especialidad}</span>
                    <span className="truncate">
                      Doc: {r.documentoOrigen}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Confianza IA
                    </span>
                    <CiConfianza confianza={r.confianza} />
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
          registros
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(paginacion.pageSize)}
            onValueChange={(v) =>
              setPaginacion((prev) => ({
                ...prev,
                pageSize: Number(v),
                pageIndex: 0,
              }))
            }
          >
            <SelectTrigger className="w-28" aria-label="Filas por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILAS_POR_PAGINA.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / pág.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-16 text-center text-sm">
            {paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label="Página siguiente"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}