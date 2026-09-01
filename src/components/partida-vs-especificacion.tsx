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
  BookOpen,
  CheckCircle2,
  TriangleAlert,
  EyeOff,
  ShieldCheck,
  ScrollText,
  Boxes,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO, PROGRESO_OK } from '@/utils/estados-clases'
import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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

type EstadoEspecificacion = 'encontrada' | 'parcial' | 'no_encontrada'
type Criticidad = 'baja' | 'media' | 'alta' | 'critica'

interface FilaEspecificacion {
  id: string
  codigo: string
  partida: string
  especialidad: string
  especificacion: string
  norma: string
  material: string
  estado: EstadoEspecificacion
  criticidad: Criticidad
}

const ESPECIALIDADES = ['Estructuras', 'Sanitaria', 'Eléctricas', 'Geotecnia', 'Arquitectura']

const ESTADO_LABEL: Record<EstadoEspecificacion, string> = {
  encontrada: 'Encontrada',
  parcial: 'Parcial',
  no_encontrada: 'No encontrada',
}

const ESTADO_BADGE: Record<EstadoEspecificacion, string> = {
  encontrada: ESTADO_OK,
  parcial: ESTADO_WARNING,
  no_encontrada: ESTADO_NEUTRO,
}

const ESTADO_ICONO: Record<EstadoEspecificacion, typeof CheckCircle2> = {
  encontrada: CheckCircle2,
  parcial: TriangleAlert,
  no_encontrada: EyeOff,
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

const MOCK: FilaEspecificacion[] = [
  { id: 'e-01', codigo: '01.03', partida: 'Concreto simple en falsa zapata', especialidad: 'Estructuras', especificacion: 'Especificación de concreto simple', norma: 'E.060', material: "Concreto f'c=140 kg/cm²", estado: 'encontrada', criticidad: 'baja' },
  { id: 'e-02', codigo: '01.04', partida: 'Concreto armado en cimientos', especialidad: 'Estructuras', especificacion: 'Especificación de concreto armado', norma: 'E.060', material: "Concreto f'c=210 kg/cm²", estado: 'encontrada', criticidad: 'baja' },
  { id: 'e-03', codigo: '01.05', partida: 'Acero de refuerzo', especialidad: 'Estructuras', especificacion: 'Especificación de acero de refuerzo', norma: 'E.060 / ASTM A615', material: 'Acero corrugado grado 60', estado: 'parcial', criticidad: 'alta' },
  { id: 'e-04', codigo: '01.06', partida: 'Encofrado y desencofrado', especialidad: 'Estructuras', especificacion: 'Especificación de encofrado', norma: 'E.060', material: 'Madera y tableros', estado: 'encontrada', criticidad: 'media' },
  { id: 'e-05', codigo: '02.01', partida: 'Red de desagüe PVC-SAL', especialidad: 'Sanitaria', especificacion: 'Especificación de redes sanitarias', norma: 'IS.010 / NTP 399.002', material: 'PVC-SAL Ø 4"', estado: 'parcial', criticidad: 'media' },
  { id: 'e-06', codigo: '02.02', partida: 'Aparatos sanitarios', especialidad: 'Sanitaria', especificacion: 'Especificación de aparatos sanitarios', norma: 'IS.010', material: 'Vajilla cerámica', estado: 'encontrada', criticidad: 'baja' },
  { id: 'e-07', codigo: '03.01', partida: 'Salidas para artefactos empotrados', especialidad: 'Eléctricas', especificacion: 'Especificación de instalaciones eléctricas', norma: 'EM.010 / Código Nacional', material: 'Conductor THW 12 AWG', estado: 'parcial', criticidad: 'alta' },
  { id: 'e-08', codigo: '03.02', partida: 'Tableros de distribución', especialidad: 'Eléctricas', especificacion: 'Especificación de tableros', norma: 'EM.010', material: 'Tablero tipo C-12s', estado: 'encontrada', criticidad: 'baja' },
  { id: 'e-09', codigo: '04.01', partida: 'Muros de contención', especialidad: 'Estructuras', especificacion: 'Especificación de muros de contención', norma: 'E.060 / E.050', material: "Concreto f'c=210 kg/cm²", estado: 'encontrada', criticidad: 'baja' },
  { id: 'e-10', codigo: '05.01', partida: 'Estudio de mecánica de suelos', especialidad: 'Geotecnia', especificacion: 'Especificación de estudio de suelos', norma: 'E.050', material: '—', estado: 'no_encontrada', criticidad: 'critica' },
  { id: 'e-11', codigo: '06.01', partida: 'Vigas de concreto armado', especialidad: 'Estructuras', especificacion: 'Especificación de concreto armado', norma: 'E.060', material: "Concreto f'c=210 kg/cm²", estado: 'encontrada', criticidad: 'baja' },
  { id: 'e-12', codigo: '07.01', partida: 'Tarrajeo en muros interiores', especialidad: 'Arquitectura', especificacion: 'Especificación de tarrajeo', norma: 'G.040', material: 'Mortero 1:5', estado: 'parcial', criticidad: 'media' },
  { id: 'e-13', codigo: '07.03', partida: 'Cielorrasos', especialidad: 'Arquitectura', especificacion: 'Sin especificación asignada', norma: '—', material: '—', estado: 'no_encontrada', criticidad: 'alta' },
]

const FILAS_POR_PAGINA = [6, 8, 10, 15]

const OBSERVACIONES: Record<string, string[]> = {
  encontrada: [
    'La partida cuenta con una especificación técnica vinculada y coincidente.',
  ],
  parcial: [
    'La especificación cubre parcialmente el alcance de la partida.',
    'Se recomienda verificar la normativa aplicada y los materiales indicados.',
  ],
  no_encontrada: [
    'No se detectó una especificación técnica relacionada para esta partida.',
    'Se requiere completar el documento o asignar una especificación de referencia.',
  ],
}

const CONFIANZA: Record<EstadoEspecificacion, number> = {
  encontrada: 94,
  parcial: 72,
  no_encontrada: 38,
}

function CeldaSortable({ header }: { header: Header<FilaEspecificacion, unknown> }) {
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

export function PartidaVsEspecificacion() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 8 })
  const [seleccionId, setSeleccionId] = useState<string | null>(null)

  const datosFiltrados = useMemo(() => {
    return MOCK.filter((f) => {
      if (filtroEspecialidad !== 'todas' && f.especialidad !== filtroEspecialidad)
        return false
      if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
      if (filtroCriticidad !== 'todas' && f.criticidad !== filtroCriticidad)
        return false
      return true
    })
  }, [filtroEspecialidad, filtroEstado, filtroCriticidad])

  const columnas = useMemo<ColumnDef<FilaEspecificacion>[]>(
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
        accessorKey: 'especialidad',
        header: 'Especialidad',
        cell: ({ row }) => <Badge variant="secondary">{row.original.especialidad}</Badge>,
      },
      {
        accessorKey: 'especificacion',
        header: 'Especificación relacionada',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-xs">
            {row.original.especificacion}
          </span>
        ),
      },
      {
        accessorKey: 'norma',
        header: 'Norma',
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[11px]">
            {row.original.norma}
          </Badge>
        ),
      },
      {
        accessorKey: 'material',
        header: 'Material',
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-xs text-muted-foreground">
            {row.original.material}
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
      conEspecificacion: MOCK.filter((f) => f.estado === 'encontrada').length,
      parciales: MOCK.filter((f) => f.estado === 'parcial').length,
      sinEspecificacion: MOCK.filter((f) => f.estado === 'no_encontrada').length,
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
    { titulo: 'Partidas revisadas', valor: kpis.revisadas, detalle: 'Comparadas con especificaciones', icono: BookOpen, tono: 'default' },
    { titulo: 'Con especificación', valor: kpis.conEspecificacion, detalle: 'Vínculo completo', icono: ShieldCheck, tono: 'success' },
    { titulo: 'Especificación parcial', valor: kpis.parciales, detalle: 'Cobertura incompleta', icono: TriangleAlert, tono: 'warning' },
    { titulo: 'Sin especificación', valor: kpis.sinEspecificacion, detalle: 'Sin vínculo detectado', icono: EyeOff, tono: kpis.sinEspecificacion > 0 ? 'danger' : 'success' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <ScrollText className="h-4 w-4 text-primary" />
          Partida vs. Especificación Técnica
        </h3>
        <p className="text-sm text-muted-foreground">
          Comparación de las partidas detectadas con sus especificaciones técnicas.
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
            placeholder="Buscar código o partida..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar partidas y especificaciones"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          <Select value={filtroEspecialidad} onValueChange={setFiltroEspecialidad}>
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las especialidades</SelectItem>
              {ESPECIALIDADES.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full lg:w-52">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="encontrada">Encontrada</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="no_encontrada">No encontrada</SelectItem>
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
                      <ScrollText className="h-3.5 w-3.5" />
                      <span className="max-w-[200px] truncate">{f.especificacion}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className={ESTADO_BADGE[f.estado]}>
                      <EstadoIcono className="mr-1 h-3.5 w-3.5" />
                      {ESTADO_LABEL[f.estado]}
                    </Badge>
                    <Badge variant="secondary">{f.especialidad}</Badge>
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
          {seleccionado && <DetalleEspecificacion f={seleccionado} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetalleEspecificacion({ f }: { f: FilaEspecificacion }) {
  const EstadoIcono = ESTADO_ICONO[f.estado]
  const observaciones = OBSERVACIONES[f.estado]
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          {f.codigo}
        </SheetTitle>
        <SheetDescription>{f.partida}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</p>
          <p className="mt-1 text-sm">{f.partida}</p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Especificación encontrada
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <ScrollText className="h-4 w-4 shrink-0 text-muted-foreground" />
            {f.especificacion}
          </p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documento origen</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              Especificaciones Técnicas - Concreto.docx
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Boxes className="h-4 w-4 shrink-0" />
              Enlace con la partida {f.codigo}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Norma</p>
            <Badge variant="outline" className="font-mono text-[11px]">{f.norma}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Material</p>
            <span className="text-sm">{f.material}</span>
          </div>
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
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confianza IA</p>
            <span className="text-sm font-semibold tabular-nums">{CONFIANZA[f.estado]}%</span>
          </div>
          <Progress
            value={CONFIANZA[f.estado]}
            className={cn('h-2', PROGRESO_OK)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Nivel de confianza de la vinculación de la partida con su especificación.
          </p>
        </div>

        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-warning">
            <TriangleAlert className="h-3.5 w-3.5" />
            Observación
          </p>
          <ul className="space-y-1 text-sm text-warning">
            {observaciones.map((o) => (
              <li key={o}>· {o}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}