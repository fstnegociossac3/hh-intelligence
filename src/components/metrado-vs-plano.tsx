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
  Layers,
  Search,
  Ruler,
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

type EstadoCorrespondencia = 'encontrado' | 'parcial' | 'no_encontrado'
type Criticidad = 'baja' | 'media' | 'alta' | 'critica'

interface FilaMetradoPlano {
  id: string
  codigo: string
  elemento: string
  especialidad: string
  cantidadMetrado: number
  planoRelacionado: string
  ubicacion: string
  estado: EstadoCorrespondencia
  criticidad: Criticidad
}

const ESPECIALIDADES = ['Estructuras', 'Sanitaria', 'Eléctricas', 'Geotecnia', 'Arquitectura']

const ESTADO_LABEL: Record<EstadoCorrespondencia, string> = {
  encontrado: 'Encontrado',
  parcial: 'Parcial',
  no_encontrado: 'No encontrado',
}

const ESTADO_BADGE: Record<EstadoCorrespondencia, string> = {
  encontrado: ESTADO_OK,
  parcial: ESTADO_WARNING,
  no_encontrado: ESTADO_NEUTRO,
}

const ESTADO_ICONO: Record<EstadoCorrespondencia, typeof CheckCircle2> = {
  encontrado: CheckCircle2,
  parcial: TriangleAlert,
  no_encontrado: EyeOff,
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

const MOCK: FilaMetradoPlano[] = [
  { id: 'm-01', codigo: '01.02', elemento: 'Movimiento de tierras', especialidad: 'Estructuras', cantidadMetrado: 1250, planoRelacionado: 'Planos Estructurales - Cimentación.pdf', ubicacion: 'Hoja E-01, Cuadro de volúmenes', estado: 'encontrado', criticidad: 'baja' },
  { id: 'm-02', codigo: '01.03', elemento: 'Concreto simple en falsa zapata', especialidad: 'Estructuras', cantidadMetrado: 380, planoRelacionado: 'Planos Estructurales - Cimentación.pdf', ubicacion: 'Hoja E-02, Detalle 3/C-1', estado: 'encontrado', criticidad: 'media' },
  { id: 'm-03', codigo: '01.04', elemento: 'Concreto armado en cimientos', especialidad: 'Estructuras', cantidadMetrado: 680, planoRelacionado: 'Planos Estructurales - Cimentación.pdf', ubicacion: 'Hoja E-02, Planta de cimentación', estado: 'encontrado', criticidad: 'baja' },
  { id: 'm-04', codigo: '01.06', elemento: 'Encofrado de cimientos', especialidad: 'Estructuras', cantidadMetrado: 1800, planoRelacionado: 'Planos Estructurales - Cimentación.pdf', ubicacion: 'Hoja E-03, Corte A-A', estado: 'parcial', criticidad: 'alta' },
  { id: 'm-05', codigo: '06.01', elemento: 'Vigas de concreto armado', especialidad: 'Estructuras', cantidadMetrado: 310, planoRelacionado: 'Planos Estructurales - Vigas y Losas.pdf', ubicacion: 'Hoja V-01, Detalle 1/V-1', estado: 'encontrado', criticidad: 'baja' },
  { id: 'm-06', codigo: '02.01', elemento: 'Red de desagüe PVC-SAL', especialidad: 'Sanitaria', cantidadMetrado: 850, planoRelacionado: 'Planos de Instalaciones Sanitarias.pdf', ubicacion: 'Hoja I-01, Planta del primer nivel', estado: 'encontrado', criticidad: 'baja' },
  { id: 'm-07', codigo: '02.03', elemento: 'Tubería de ventilación', especialidad: 'Sanitaria', cantidadMetrado: 240, planoRelacionado: 'Planos de Instalaciones Sanitarias.pdf', ubicacion: 'Hoja I-02, Isométrico de montantes', estado: 'parcial', criticidad: 'media' },
  { id: 'm-08', codigo: '03.01', elemento: 'Salidas para artefactos empotrados', especialidad: 'Eléctricas', cantidadMetrado: 320, planoRelacionado: 'Planos de Instalaciones Eléctricas.pdf', ubicacion: 'Hoja A-01, Planta de distribución', estado: 'no_encontrado', criticidad: 'critica' },
  { id: 'm-09', codigo: '03.02', elemento: 'Tableros de distribución', especialidad: 'Eléctricas', cantidadMetrado: 6, planoRelacionado: 'Planos de Instalaciones Eléctricas.pdf', ubicacion: 'Hoja A-04, Diagrama unifilar', estado: 'encontrado', criticidad: 'media' },
  { id: 'm-10', codigo: '04.01', elemento: 'Muros de contención', especialidad: 'Estructuras', cantidadMetrado: 540, planoRelacionado: 'Planos Estructurales - Cimentación.pdf', ubicacion: 'Hoja E-04, Planta de muros', estado: 'encontrado', criticidad: 'baja' },
  { id: 'm-11', codigo: '05.02', elemento: 'Compactación de terreno', especialidad: 'Geotecnia', cantidadMetrado: 2400, planoRelacionado: 'Planos de Topografía.pdf', ubicacion: 'Hoja T-01, Planta de nivelaciones', estado: 'parcial', criticidad: 'alta' },
  { id: 'm-12', codigo: '05.03', elemento: 'Corte y relleno', especialidad: 'Geotecnia', cantidadMetrado: 1560, planoRelacionado: 'Ninguno', ubicacion: 'No indicada', estado: 'no_encontrado', criticidad: 'critica' },
  { id: 'm-13', codigo: '07.01', elemento: 'Aligerados', especialidad: 'Arquitectura', cantidadMetrado: 390, planoRelacionado: 'Planos Arquitectónicos - Planta modelos.pdf', ubicacion: 'Hoja ARQ-03, Corte por fachada', estado: 'encontrado', criticidad: 'baja' },
  { id: 'm-14', codigo: '07.02', elemento: 'Tarrajeo en muros interiores', especialidad: 'Arquitectura', cantidadMetrado: 5600, planoRelacionado: 'Planos Arquitectónicos - Planta modelos.pdf', ubicacion: 'Hoja ARQ-04, Detalle de acabados', estado: 'no_encontrado', criticidad: 'alta' },
]

const FILAS_POR_PAGINA = [6, 8, 10, 15]

const OBSERVACIONES: Record<string, string[]> = {
  encontrado: ['El elemento figura en el plano indicado con el mismo código de partida.'],
  parcial: [
    'La cantidad del metrado no coincide exactamente con el área señalada en el plano.',
    'La referencia en el plano es parcial; se recomienda verificar el cuadro de volúmenes.',
  ],
  no_encontrado: [
    'No se localizó el elemento en los planos del proyecto.',
    'Se requiere confirmación del proyectista o revisión de láminas adicionales.',
  ],
}

function fmt(n: number) {
  return n.toLocaleString('es-PE')
}

function CeldaSortable({ header }: { header: Header<FilaMetradoPlano, unknown> }) {
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

export function MetradoVsPlano() {
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

  const columnas = useMemo<ColumnDef<FilaMetradoPlano>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.codigo}</span>
        ),
      },
      {
        accessorKey: 'elemento',
        header: 'Elemento',
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.elemento}</span>,
      },
      {
        accessorKey: 'especialidad',
        header: 'Especialidad',
        cell: ({ row }) => <Badge variant="secondary">{row.original.especialidad}</Badge>,
      },
      {
        accessorKey: 'cantidadMetrado',
        header: 'Cantidad metrado',
        cell: ({ row }) => (
          <span className="text-right text-xs tabular-nums">{fmt(row.original.cantidadMetrado)}</span>
        ),
      },
      {
        accessorKey: 'planoRelacionado',
        header: 'Plano relacionado',
        cell: ({ row }) => (
          <span className="flex max-w-[220px] items-center gap-1.5 truncate text-xs">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {row.original.planoRelacionado === 'Ninguno'
                ? 'Sin plano'
                : row.original.planoRelacionado}
            </span>
          </span>
        ),
      },
      {
        accessorKey: 'ubicacion',
        header: 'Ubicación en plano',
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-xs text-muted-foreground">
            {row.original.ubicacion}
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
      revisados: MOCK.length,
      encontrados: MOCK.filter((f) => f.estado === 'encontrado').length,
      parciales: MOCK.filter((f) => f.estado === 'parcial').length,
      noEncontrados: MOCK.filter((f) => f.estado === 'no_encontrado').length,
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
    { titulo: 'Elementos revisados', valor: kpis.revisados, detalle: 'Cruzados con planos', icono: Ruler, tono: 'default' },
    { titulo: 'Encontrados', valor: kpis.encontrados, detalle: 'Con plano localizado', icono: CheckCircle2, tono: 'success' },
    { titulo: 'Parciales', valor: kpis.parciales, detalle: 'Coincidencia parcial', icono: TriangleAlert, tono: 'warning' },
    { titulo: 'No encontrados', valor: kpis.noEncontrados, detalle: 'Sin plano vinculado', icono: EyeOff, tono: kpis.noEncontrados > 0 ? 'danger' : 'success' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Layers className="h-4 w-4 text-primary" />
          Metrado vs. Plano
        </h3>
        <p className="text-sm text-muted-foreground">
          Correspondencia de los elementos del metrado con los planos del proyecto.
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
            placeholder="Buscar código o elemento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar elementos del metrado"
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
              <SelectItem value="encontrado">Encontrado</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="no_encontrado">No encontrado</SelectItem>
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
                      <span>No hay elementos que coincidan con los filtros</span>
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
              <span className="text-sm">No hay elementos que coincidan con los filtros</span>
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
                      <p className="truncate text-sm font-medium">{f.elemento}</p>
                    </div>
                    <Badge variant="outline" className={CRITICIDAD_BADGE[f.criticidad]}>
                      {CRITICIDAD_LABEL[f.criticidad]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="max-w-[180px] truncate">
                        {f.planoRelacionado === 'Ninguno' ? 'Sin plano' : f.planoRelacionado}
                      </span>
                    </span>
                    <span>Cant: {fmt(f.cantidadMetrado)}</span>
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
          <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> elementos
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
          {seleccionado && <DetalleMetradoPlano f={seleccionado} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetalleMetradoPlano({ f }: { f: FilaMetradoPlano }) {
  const EstadoIcono = ESTADO_ICONO[f.estado]
  const observaciones = OBSERVACIONES[f.estado]
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </span>
          {f.codigo}
        </SheetTitle>
        <SheetDescription>{f.elemento}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información del metrado</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Código:</span>
            <span className="font-mono">{f.codigo}</span>
            <span className="text-muted-foreground">Especialidad:</span>
            <span>{f.especialidad}</span>
            <span className="text-muted-foreground">Cantidad:</span>
            <span>{fmt(f.cantidadMetrado)}</span>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plano relacionado</p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{f.planoRelacionado === 'Ninguno' ? 'Sin plano' : f.planoRelacionado}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Ubicación: {f.ubicacion}</p>
        </div>

        <div className="rounded-lg border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Referencia</p>
          <p className="mt-1 text-sm">
            {f.estado === 'encontrado'
              ? `El elemento ${f.elemento} figura en ${f.planoRelacionado}, ${f.ubicacion}.`
              : f.estado === 'parcial'
                ? `La cantidad ${fmt(f.cantidadMetrado)} difiere del área graficada; revisar el cuadro de volúmenes.`
                : `No se identifica el elemento ${f.elemento} en los planos disponibles.`}
          </p>
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