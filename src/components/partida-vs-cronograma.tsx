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
  CalendarClock,
  Search,
  CheckCircle2,
  TriangleAlert,
  CalendarOff,
  GitBranch,
  Clock,
  FileText,
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

type EstadoCronograma = 'programada' | 'parcial' | 'no_programada'
type Criticidad = 'baja' | 'media' | 'alta' | 'critica'

interface FilaCronograma {
  id: string
  codigo: string
  partida: string
  actividad: string
  inicio: string | null
  fin: string | null
  duracion: string | null
  estado: EstadoCronograma
  criticidad: Criticidad
}

const ESTADO_LABEL: Record<EstadoCronograma, string> = {
  programada: 'Programada',
  parcial: 'Parcialmente relacionada',
  no_programada: 'No programada',
}

const ESTADO_BADGE: Record<EstadoCronograma, string> = {
  programada: ESTADO_OK,
  parcial: ESTADO_WARNING,
  no_programada: ESTADO_NEUTRO,
}

const ESTADO_ICONO: Record<EstadoCronograma, typeof CheckCircle2> = {
  programada: CheckCircle2,
  parcial: TriangleAlert,
  no_programada: CalendarOff,
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

const MOCK: FilaCronograma[] = [
  { id: 's-01', codigo: '01.01', partida: 'Obras provisionales', actividad: 'Instalación de cerco provisional', inicio: '02/01/2026', fin: '10/01/2026', duracion: '9 días', estado: 'programada', criticidad: 'baja' },
  { id: 's-02', codigo: '01.02', partida: 'Movimiento de tierras', actividad: 'Movimiento de tierras general', inicio: '12/01/2026', fin: '06/02/2026', duracion: '26 días', estado: 'programada', criticidad: 'baja' },
  { id: 's-03', codigo: '01.03', partida: 'Concreto simple en falsa zapata', actividad: 'Vaciado de concreto simple', inicio: '09/02/2026', fin: '20/02/2026', duracion: '12 días', estado: 'programada', criticidad: 'media' },
  { id: 's-04', codigo: '01.04', partida: 'Concreto armado en cimientos', actividad: 'Estructuras de cimentación', inicio: '20/02/2026', fin: '18/03/2026', duracion: '27 días', estado: 'programada', criticidad: 'baja' },
  { id: 's-05', codigo: '01.05', partida: 'Acero de refuerzo', actividad: 'Habilitación y colocación de acero', inicio: null, fin: null, duracion: null, estado: 'no_programada', criticidad: 'critica' },
  { id: 's-06', codigo: '01.06', partida: 'Encofrado y desencofrado', actividad: 'Encofrados', inicio: '20/02/2026', fin: '10/03/2026', duracion: '19 días', estado: 'parcial', criticidad: 'alta' },
  { id: 's-07', codigo: '02.01', partida: 'Red de desagüe PVC-SAL', actividad: 'Redes sanitarias', inicio: '25/03/2026', fin: '22/04/2026', duracion: '29 días', estado: 'programada', criticidad: 'media' },
  { id: 's-08', codigo: '02.02', partida: 'Aparatos sanitarios', actividad: 'Instalación de aparatos sanitarios', inicio: '02/05/2026', fin: '20/05/2026', duracion: '19 días', estado: 'parcial', criticidad: 'alta' },
  { id: 's-09', codigo: '03.01', partida: 'Salidas para artefactos empotrados', actividad: 'Instalaciones eléctricas', inicio: '01/04/2026', fin: '30/04/2026', duracion: '30 días', estado: 'programada', criticidad: 'baja' },
  { id: 's-10', codigo: '03.02', partida: 'Tableros de distribución', actividad: 'Montaje de tableros', inicio: null, fin: null, duracion: null, estado: 'no_programada', criticidad: 'critica' },
  { id: 's-11', codigo: '04.01', partida: 'Muros de contención', actividad: 'Muros de contención', inicio: '10/03/2026', fin: '02/04/2026', duracion: '24 días', estado: 'programada', criticidad: 'media' },
  { id: 's-12', codigo: '05.02', partida: 'Compactación de terreno', actividad: 'Compactación de terreno', inicio: '06/02/2026', fin: '09/02/2026', duracion: '4 días', estado: 'parcial', criticidad: 'alta' },
  { id: 's-13', codigo: '06.01', partida: 'Vigas de concreto armado', actividad: 'Estructuras de vigas', inicio: '18/03/2026', fin: '15/04/2026', duracion: '29 días', estado: 'programada', criticidad: 'baja' },
  { id: 's-14', codigo: '07.01', partida: 'Tarrajeo en muros interiores', actividad: 'Acabados de muros', inicio: '20/05/2026', fin: '30/06/2026', duracion: '42 días', estado: 'no_programada', criticidad: 'alta' },
]

const FILAS_POR_PAGINA = [6, 8, 10, 15]

const OBSERVACION: Record<EstadoCronograma, string> = {
  programada: 'La partida tiene una actividad asignada con fechas y duración registradas.',
  parcial: 'La actividad del cronograma solo cubre una parte del alcance de la partida.',
  no_programada: 'No se encontró una actividad relacionada para esta partida en el cronograma.',
}

function CeldaSortable({ header }: { header: Header<FilaCronograma, unknown> }) {
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

export function PartidaVsCronograma() {
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

  const columnas = useMemo<ColumnDef<FilaCronograma>[]>(
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
          <span className="max-w-[200px] truncate text-sm font-medium">{row.original.partida}</span>
        ),
      },
      {
        accessorKey: 'actividad',
        header: 'Actividad relacionada',
        cell: ({ row }) => (
          <span className="flex max-w-[220px] items-center gap-1.5 truncate text-xs">
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {row.original.actividad ?? 'Sin actividad'}
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'inicio',
        header: 'Fecha inicio',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.inicio ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'fin',
        header: 'Fecha fin',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.fin ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'duracion',
        header: 'Duración',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.duracion ?? '—'}
          </span>
        ),
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

  const kpis = useMemo(
    () => ({
      revisadas: MOCK.length,
      programadas: MOCK.filter((f) => f.estado === 'programada').length,
      parciales: MOCK.filter((f) => f.estado === 'parcial').length,
      noProgramadas: MOCK.filter((f) => f.estado === 'no_programada').length,
    }),
    [],
  )

  const seleccionado = MOCK.find((f) => f.id === seleccionId) ?? null

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Partidas revisadas', valor: kpis.revisadas, detalle: 'Cruzadas con el cronograma', icono: CalendarClock, tono: 'default' },
    { titulo: 'Programadas', valor: kpis.programadas, detalle: 'Con actividad asignada', icono: CheckCircle2, tono: 'success' },
    { titulo: 'Parciales', valor: kpis.parciales, detalle: 'Cobertura parcial', icono: TriangleAlert, tono: 'warning' },
    { titulo: 'No programadas', valor: kpis.noProgramadas, detalle: 'Sin actividad relacionada', icono: CalendarOff, tono: kpis.noProgramadas > 0 ? 'danger' : 'success' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="h-4 w-4 text-primary" />
          Partida vs. Cronograma
        </h3>
        <p className="text-sm text-muted-foreground">
          Verificación de la relación entre cada partida y sus actividades en el cronograma.
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
            placeholder="Buscar código, partida o actividad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar partidas del cronograma"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full lg:w-60">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="parcial">Parcialmente relacionada</SelectItem>
              <SelectItem value="no_programada">No programada</SelectItem>
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
                      <span>No hay partidas que coincidan con los filtros</span>
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
              <span className="text-sm">No hay partidas que coincidan con los filtros</span>
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
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <GitBranch className="h-3.5 w-3.5" />
                      <span className="max-w-[200px] truncate">
                        {f.actividad ?? 'Sin actividad'}
                      </span>
                    </span>
                    <span className="shrink-0">{f.duracion ?? '—'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className={ESTADO_BADGE[f.estado]}>
                      <EstadoIcono className="mr-1 h-3.5 w-3.5" />
                      {ESTADO_LABEL[f.estado]}
                    </Badge>
                    {f.inicio && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {f.inicio}
                      </span>
                    )}
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
          {seleccionado && <DetalleCronograma f={seleccionado} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetalleCronograma({ f }: { f: FilaCronograma }) {
  const EstadoIcono = ESTADO_ICONO[f.estado]
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="h-4 w-4" />
          </span>
          {f.codigo}
        </SheetTitle>
        <SheetDescription>{f.partida}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actividad relacionada
          </p>
          <p className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
            {f.actividad ?? 'Sin actividad'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha inicio</p>
            <p className="mt-1 font-mono text-sm">{f.inicio ?? '—'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha fin</p>
            <p className="mt-1 font-mono text-sm">{f.fin ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Duración
          </span>
          <span className="text-sm font-medium">{f.duracion ?? '—'}</span>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
            <Badge variant="outline" className={ESTADO_BADGE[f.estado]}>
              <EstadoIcono className="mr-1 h-3.5 w-3.5" />
              {ESTADO_LABEL[f.estado]}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Criticidad</p>
            <Badge variant="outline" className={CRITICIDAD_BADGE[f.criticidad]}>
              {CRITICIDAD_LABEL[f.criticidad]}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Fuente
          </p>
          <p className="text-sm">Cronograma de Ejecución.xlsx</p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Observación
          </p>
          <p className="text-sm text-muted-foreground">{OBSERVACION[f.estado]}</p>
        </div>
      </div>
    </>
  )
}