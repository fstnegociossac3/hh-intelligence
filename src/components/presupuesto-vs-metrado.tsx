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
  FileText,
  Search,
  Scale,
  CheckCircle2,
  TriangleAlert,
  EyeOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

type EstadoComparacion = 'coincide' | 'diferencia' | 'faltante'
type Criticidad = 'baja' | 'media' | 'alta' | 'critica'

interface FilaComparacion {
  id: string
  codigo: string
  partida: string
  unidadPresupuesto: string | null
  unidadMetrado: string | null
  cantidadPresupuesto: number | null
  cantidadMetrado: number | null
  estado: EstadoComparacion
  criticidad: Criticidad
}

const ESTADO_LABEL: Record<EstadoComparacion, string> = {
  coincide: 'Coincide',
  diferencia: 'Diferencia detectada',
  faltante: 'Información faltante',
}

const ESTADO_BADGE: Record<EstadoComparacion, string> = {
  coincide: ESTADO_OK,
  diferencia: ESTADO_WARNING,
  faltante: ESTADO_NEUTRO,
}

const ESTADO_ICONO: Record<EstadoComparacion, typeof CheckCircle2> = {
  coincide: CheckCircle2,
  diferencia: TriangleAlert,
  faltante: EyeOff,
}

const CRITICIDAD_LABEL: Record<Criticidad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
}

const CRITICIDAD_BADGE: Record<Criticidad, string> = {
  baja: ESTADO_NEUTRO,
  media: ESTADO_INFO,
  alta: ESTADO_WARNING,
  critica: ESTADO_CRITICO,
}

const MOCK: FilaComparacion[] = [
  { id: 'c-01', codigo: '01.02', partida: 'Movimiento de tierras', unidadPresupuesto: 'M3', unidadMetrado: 'M3', cantidadPresupuesto: 1250, cantidadMetrado: 1250, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-02', codigo: '01.03', partida: 'Concreto simple en falsa zapata', unidadPresupuesto: 'M3', unidadMetrado: 'M3', cantidadPresupuesto: 420, cantidadMetrado: 380, estado: 'diferencia', criticidad: 'alta' },
  { id: 'c-03', codigo: '01.04', partida: 'Concreto armado en cimientos', unidadPresupuesto: 'M3', unidadMetrado: 'M3', cantidadPresupuesto: 680, cantidadMetrado: 680, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-04', codigo: '01.05', partida: 'Acero de refuerzo', unidadPresupuesto: 'KG', unidadMetrado: 'KG', cantidadPresupuesto: 12500, cantidadMetrado: 10850, estado: 'diferencia', criticidad: 'critica' },
  { id: 'c-05', codigo: '01.06', partida: 'Encofrado y desencofrado normal', unidadPresupuesto: 'M2', unidadMetrado: 'M2', cantidadPresupuesto: 1800, cantidadMetrado: 1800, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-06', codigo: '02.01', partida: 'Red de desagüe PVC-SAL', unidadPresupuesto: 'ML', unidadMetrado: 'ML', cantidadPresupuesto: 850, cantidadMetrado: 850, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-07', codigo: '02.02', partida: 'Aparatos sanitarios', unidadPresupuesto: 'PZA', unidadMetrado: 'PZA', cantidadPresupuesto: 45, cantidadMetrado: 52, estado: 'diferencia', criticidad: 'media' },
  { id: 'c-08', codigo: '03.01', partida: 'Salidas para artefactos empotrados', unidadPresupuesto: 'PTO', unidadMetrado: null, cantidadPresupuesto: 320, cantidadMetrado: null, estado: 'faltante', criticidad: 'media' },
  { id: 'c-09', codigo: '04.01', partida: 'Muros de contención', unidadPresupuesto: 'M3', unidadMetrado: 'M3', cantidadPresupuesto: 540, cantidadMetrado: 540, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-10', codigo: '04.02', partida: 'Zapatas conectadas', unidadPresupuesto: 'M3', unidadMetrado: 'M3', cantidadPresupuesto: 760, cantidadMetrado: 720, estado: 'diferencia', criticidad: 'alta' },
  { id: 'c-11', codigo: '05.01', partida: 'Estudio de mecánica de suelos', unidadPresupuesto: 'EST', unidadMetrado: 'EST', cantidadPresupuesto: 1, cantidadMetrado: 1, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-12', codigo: '05.02', partida: 'Compactación de terreno', unidadPresupuesto: 'M2', unidadMetrado: null, cantidadPresupuesto: 2400, cantidadMetrado: null, estado: 'faltante', criticidad: 'alta' },
  { id: 'c-13', codigo: '06.01', partida: 'Vigas de concreto armado', unidadPresupuesto: 'M3', unidadMetrado: 'M3', cantidadPresupuesto: 310, cantidadMetrado: 310, estado: 'coincide', criticidad: 'baja' },
  { id: 'c-14', codigo: '01.07', partida: 'Concreto para columnas', unidadPresupuesto: null, unidadMetrado: 'M3', cantidadPresupuesto: null, cantidadMetrado: 280, estado: 'faltante', criticidad: 'critica' },
]

const FILAS_POR_PAGINA = [6, 8, 10, 15]

function fmt(n: number | null) {
  if (n == null) return '—'
  return n.toLocaleString('es-PE')
}

function Cantidad({ valor }: { valor: number | null }) {
  if (valor == null)
    return <span className="text-muted-foreground">Sin dato</span>
  return (
    <span className="text-right text-xs tabular-nums font-medium">
      {fmt(valor)}
    </span>
  )
}

function Diferencia({ f }: { f: FilaComparacion }) {
  if (f.cantidadPresupuesto == null || f.cantidadMetrado == null) {
    return <span className="text-muted-foreground">—</span>
  }
  const dif = f.cantidadMetrado - f.cantidadPresupuesto
  return (
    <span
      className={cn(
        'text-xs tabular-nums font-semibold',
        dif === 0 ? 'text-muted-foreground' : dif < 0 ? 'text-destructive' : 'text-warning',
      )}
    >
      {dif > 0 ? '+' : ''}
      {fmt(dif)}
    </span>
  )
}

function CeldaSortable({ header }: { header: Header<FilaComparacion, unknown> }) {
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

export function PresupuestoVsMetrado() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 8 })
  const [seleccionId, setSeleccionId] = useState<string | null>(null)

  const datosFiltrados = useMemo(() => {
    return MOCK.filter((f) => {
      if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
      if (filtroCriticidad !== 'todas' && f.criticidad !== filtroCriticidad)
        return false
      return true
    })
  }, [filtroEstado, filtroCriticidad])

  const columnas = useMemo<ColumnDef<FilaComparacion>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.codigo}</span>
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
        accessorKey: 'unidadPresupuesto',
        header: 'Unidad presupuesto',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.unidadPresupuesto ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'unidadMetrado',
        header: 'Unidad metrado',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.unidadMetrado ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'cantidadPresupuesto',
        header: 'Cant. presupuesto',
        cell: ({ row }) => <Cantidad valor={row.original.cantidadPresupuesto} />,
      },
      {
        accessorKey: 'cantidadMetrado',
        header: 'Cant. metrado',
        cell: ({ row }) => <Cantidad valor={row.original.cantidadMetrado} />,
      },
      {
        accessorKey: 'diferencia',
        header: 'Diferencia',
        cell: ({ row }) => <Diferencia f={row.original} />,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => {
          const Icono = ESTADO_ICONO[row.original.estado]
          return (
            <Badge variant="outline" className={ESTADO_BADGE[row.original.estado]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {ESTADO_LABEL[row.original.estado]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'criticidad',
        header: 'Criticidad',
        cell: ({ row }) => (
          <Badge variant="outline" className={CRITICIDAD_BADGE[row.original.criticidad]}>
            {CRITICIDAD_LABEL[row.original.criticidad]}
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

  const kpis = useMemo(() => ({
    revisadas: MOCK.length,
    coincidencias: MOCK.filter((f) => f.estado === 'coincide').length,
    diferencias: MOCK.filter((f) => f.estado === 'diferencia').length,
    faltantes: MOCK.filter((f) => f.estado === 'faltante').length,
  }), [])

  const seleccionado = MOCK.find((f) => f.id === seleccionId) ?? null

  const kpiItems: { titulo: string; valor: number; detalle: string; icono: LucideIcon; tono: 'default' | 'success' | 'warning' | 'danger' | 'info' }[] = [
    { titulo: 'Partidas revisadas', valor: kpis.revisadas, detalle: 'Comparadas entre fuentes', icono: Scale, tono: 'default' },
    { titulo: 'Coincidencias', valor: kpis.coincidencias, detalle: 'Montos y unidades iguales', icono: CheckCircle2, tono: 'success' },
    { titulo: 'Diferencias', valor: kpis.diferencias, detalle: 'Requieren conciliación', icono: TriangleAlert, tono: 'warning' },
    { titulo: 'Información faltante', valor: kpis.faltantes, detalle: 'Sin dato en una fuente', icono: EyeOff, tono: kpis.faltantes > 0 ? 'danger' : 'success' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Scale className="h-4 w-4 text-primary" />
          Presupuesto vs. Metrado
        </h3>
        <p className="text-sm text-muted-foreground">
          Comparación de partidas entre Presupuesto General.xlsx y Metrados de Obra.xlsx.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((kpi) => (
          <KpiCard key={kpi.titulo} titulo={kpi.titulo} valor={kpi.valor} detalle={kpi.detalle} icono={kpi.icono} tono={kpi.tono} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar código o partida..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar comparaciones"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full lg:w-56">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="coincide">Coincide</SelectItem>
              <SelectItem value="diferencia">Diferencia detectada</SelectItem>
              <SelectItem value="faltante">Información faltante</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCriticidad} onValueChange={setFiltroCriticidad}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Criticidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda criticidad</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
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
                  <TableCell colSpan={columnas.length} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8" />
                      <span>No hay coincidencias con los filtros</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((fila) => (
                  <TableRow
                    key={fila.id}
                    onClick={() => setSeleccionId(fila.original.id)}
                    className="cursor-pointer"
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
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Search className="h-8 w-8" />
              <span className="text-sm">No hay coincidencias con los filtros</span>
            </div>
          ) : (
            filas.map((fila) => {
              const f = fila.original
              const EstadoIcono = ESTADO_ICONO[f.estado]
              return (
                <button
                  key={fila.id}
                  type="button"
                  onClick={() => setSeleccionId(f.id)}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{f.codigo}</p>
                      <p className="truncate text-sm font-medium">{f.partida}</p>
                    </div>
                    <Badge variant="outline" className={CRITICIDAD_BADGE[f.criticidad]}>
                      {CRITICIDAD_LABEL[f.criticidad]}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>
                      Presupuesto:{' '}
                      <span className="font-medium">{fmt(f.cantidadPresupuesto)} {f.unidadPresupuesto ?? ''}</span>
                    </span>
                    <span>
                      Metrado:{' '}
                      <span className="font-medium">{fmt(f.cantidadMetrado)} {f.unidadMetrado ?? ''}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className={ESTADO_BADGE[f.estado]}>
                      <EstadoIcono className="mr-1 h-3.5 w-3.5" />
                      {ESTADO_LABEL[f.estado]}
                    </Badge>
                    <Diferencia f={f} />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">{filas.length === 0 ? 0 : primera}–{ultima}</span> de{' '}
          <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> partidas
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(paginacion.pageSize)}
            onValueChange={(v) => setPaginacion((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }))}
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
          <span className="min-w-16 text-center text-sm">{paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}</span>
          <Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Sheet open={!!seleccionado} onOpenChange={(o) => !o && setSeleccionId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {seleccionado && <DetalleComparacion f={seleccionado} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetalleComparacion({ f }: { f: FilaComparacion }) {
  const EstadoIcono = ESTADO_ICONO[f.estado]
  const dif =
    f.cantidadPresupuesto != null && f.cantidadMetrado != null
      ? f.cantidadMetrado - f.cantidadPresupuesto
      : null
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="h-4 w-4" />
          </span>
          {f.codigo}
        </SheetTitle>
        <SheetDescription>{f.partida}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Presupuesto</p>
            <p className="mt-1 text-2xl font-bold">{fmt(f.cantidadPresupuesto)}</p>
            <p className="text-xs text-muted-foreground">{f.unidadPresupuesto ?? 'Sin unidad'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Metrado</p>
            <p className="mt-1 text-2xl font-bold">{fmt(f.cantidadMetrado)}</p>
            <p className="text-xs text-muted-foreground">{f.unidadMetrado ?? 'Sin unidad'}</p>
          </div>
        </div>

        {f.cantidadPresupuesto != null && f.cantidadMetrado != null && dif !== null && (
          <div className="rounded-lg border p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Diferencia</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Metrado − Presupuesto
              </span>
              <span className={cn('text-lg font-bold tabular-nums', dif === 0 ? 'text-muted-foreground' : dif < 0 ? 'text-destructive' : 'text-warning')}>
                {dif > 0 ? '+' : ''}
                {fmt(dif)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-muted-foreground">Estado</span>
          <Badge variant="outline" className={ESTADO_BADGE[f.estado]}>
            <EstadoIcono className="mr-1 h-3.5 w-3.5" />
            {ESTADO_LABEL[f.estado]}
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-muted-foreground">Criticidad</span>
          <Badge variant="outline" className={CRITICIDAD_BADGE[f.criticidad]}>
            {CRITICIDAD_LABEL[f.criticidad]}
          </Badge>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fuentes</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Presupuesto General.xlsx
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Metrados de Obra.xlsx
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}