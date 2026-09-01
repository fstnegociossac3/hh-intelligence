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
  Search,
  CheckCircle2,
  TriangleAlert,
  XCircle,
  EyeOff,
  BadgeCheck,
  Activity,
  FileText,
  ArrowRight,
  Scale,
  Layers,
  ScrollText,
  CalendarClock,
  ClipboardPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { KpiCard } from '@/components/kpi-card'
import { CoherenceScore } from '@/components/coherence-score'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export type TipoAnalisis = 'presupuesto_metrado' | 'metrado_plano' | 'partida_especificacion' | 'partida_cronograma'

type Resultado = 'correcto' | 'advertencia' | 'inconsistencia' | 'faltante'
type Criticidad = 'baja' | 'media' | 'alta' | 'critica'
type EstadoRegistro = 'revisado' | 'pendiente' | 'con_observacion'

interface RegistroResultado {
  id: string
  tipo: TipoAnalisis
  codigo: string
  partida: string
  especialidad: string
  documentoA: string
  documentoB: string
  resultado: Resultado
  criticidad: Criticidad
  estado: EstadoRegistro
  descripcion: string
  valorA: string
  valorB: string
  diferencia: string
}

const TIPO_LABEL: Record<TipoAnalisis, string> = {
  presupuesto_metrado: 'Presupuesto vs. Metrado',
  metrado_plano: 'Metrado vs. Plano',
  partida_especificacion: 'Partida vs. Especificación',
  partida_cronograma: 'Partida vs. Cronograma',
}

const TIPO_ICONO: Record<TipoAnalisis, typeof Scale> = {
  presupuesto_metrado: Scale,
  metrado_plano: Layers,
  partida_especificacion: ScrollText,
  partida_cronograma: CalendarClock,
}

const RESULTADO_LABEL: Record<Resultado, string> = {
  correcto: 'Correcto',
  advertencia: 'Advertencia',
  inconsistencia: 'Inconsistencia',
  faltante: 'Información faltante',
}

const RESULTADO_BADGE: Record<Resultado, string> = {
  correcto: ESTADO_OK,
  advertencia: ESTADO_WARNING,
  inconsistencia: ESTADO_CRITICO,
  faltante: ESTADO_NEUTRO,
}

const RESULTADO_ICONO: Record<Resultado, typeof CheckCircle2> = {
  correcto: CheckCircle2,
  advertencia: TriangleAlert,
  inconsistencia: XCircle,
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

const ESTADO_LABEL: Record<EstadoRegistro, string> = {
  revisado: 'Revisado',
  pendiente: 'Pendiente',
  con_observacion: 'Con observación',
}

const ESTADO_BADGE: Record<EstadoRegistro, string> = {
  revisado: ESTADO_OK,
  pendiente: ESTADO_INFO,
  con_observacion: ESTADO_WARNING,
}

const ESPECIALIDADES = ['Estructuras', 'Sanitaria', 'Eléctricas', 'Geotecnia', 'Arquitectura']

const MOCK: RegistroResultado[] = [
  { id: 'r-01', tipo: 'presupuesto_metrado', codigo: '01.02', partida: 'Movimiento de tierras', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Metrados de Obra.xlsx', resultado: 'correcto', criticidad: 'baja', estado: 'revisado', descripcion: 'La cantidad y unidad coinciden entre el presupuesto y el metrado.', valorA: '1,250 M3', valorB: '1,250 M3', diferencia: '0' },
  { id: 'r-02', tipo: 'presupuesto_metrado', codigo: '01.03', partida: 'Concreto simple en falsa zapata', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Metrados de Obra.xlsx', resultado: 'inconsistencia', criticidad: 'alta', estado: 'pendiente', descripcion: 'La cantidad del metrado difiere de la consignada en el presupuesto.', valorA: '420 M3', valorB: '380 M3', diferencia: '-40 M3' },
  { id: 'r-03', tipo: 'presupuesto_metrado', codigo: '01.05', partida: 'Acero de refuerzo', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Metrados de Obra.xlsx', resultado: 'inconsistencia', criticidad: 'critica', estado: 'pendiente', descripcion: 'Diferencia significativa en la cantidad de acero entre ambas fuentes.', valorA: '12,500 KG', valorB: '10,850 KG', diferencia: '-1,650 KG' },
  { id: 'r-04', tipo: 'presupuesto_metrado', codigo: '03.01', partida: 'Salidas para artefactos empotrados', especialidad: 'Eléctricas', documentoA: 'Presupuesto General.xlsx', documentoB: 'Metrados de Obra.xlsx', resultado: 'faltante', criticidad: 'media', estado: 'con_observacion', descripcion: 'El metrado no registra esta partida; falta información de origen.', valorA: '320 PTO', valorB: '—', diferencia: '—' },
  { id: 'r-05', tipo: 'metrado_plano', codigo: '01.06', partida: 'Encofrado de cimientos', especialidad: 'Estructuras', documentoA: 'Metrados de Obra.xlsx', documentoB: 'Planos Estructurales - Cimentación.pdf', resultado: 'advertencia', criticidad: 'alta', estado: 'pendiente', descripcion: 'La cantidad del metrado no coincide con el área graficada en el plano.', valorA: '1,800 M2', valorB: '1,650 M2', diferencia: '-150 M2' },
  { id: 'r-06', tipo: 'metrado_plano', codigo: '02.03', partida: 'Tubería de ventilación', especialidad: 'Sanitaria', documentoA: 'Metrados de Obra.xlsx', documentoB: 'Planos de Instalaciones Sanitarias.pdf', resultado: 'advertencia', criticidad: 'media', estado: 'revisado', descripcion: 'La referencia en el plano es parcial respecto al metrado.', valorA: '240 ML', valorB: '220 ML', diferencia: '-20 ML' },
  { id: 'r-07', tipo: 'metrado_plano', codigo: '03.01', partida: 'Salidas para artefactos empotrados', especialidad: 'Eléctricas', documentoA: 'Metrados de Obra.xlsx', documentoB: 'Planos de Instalaciones Eléctricas.pdf', resultado: 'inconsistencia', criticidad: 'critica', estado: 'con_observacion', descripcion: 'No se localiza el elemento en los planos disponibles.', valorA: '320 PTO', valorB: 'Sin plano', diferencia: '—' },
  { id: 'r-08', tipo: 'metrado_plano', codigo: '05.03', partida: 'Corte y relleno', especialidad: 'Geotecnia', documentoA: 'Metrados de Obra.xlsx', documentoB: 'Planos de Topografía.pdf', resultado: 'faltante', criticidad: 'critica', estado: 'pendiente', descripcion: 'No se identifica el elemento en los planos del proyecto.', valorA: '1,560 M3', valorB: 'Sin plano', diferencia: '—' },
  { id: 'r-09', tipo: 'partida_especificacion', codigo: '01.05', partida: 'Acero de refuerzo', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Especificaciones Técnicas - Concreto.docx', resultado: 'advertencia', criticidad: 'alta', estado: 'pendiente', descripcion: 'La especificación cubre parcialmente el alcance de la partida.', valorA: 'Acero grado 60', valorB: 'ASTM A615 (parcial)', diferencia: 'Norma parcial' },
  { id: 'r-10', tipo: 'partida_especificacion', codigo: '05.01', partida: 'Estudio de mecánica de suelos', especialidad: 'Geotecnia', documentoA: 'Presupuesto General.xlsx', documentoB: 'Especificaciones Técnicas - Concreto.docx', resultado: 'faltante', criticidad: 'critica', estado: 'con_observacion', descripcion: 'No se detectó especificación técnica relacionada para la partida.', valorA: '1 EST', valorB: 'Sin especificación', diferencia: '—' },
  { id: 'r-11', tipo: 'partida_especificacion', codigo: '01.04', partida: 'Concreto armado en cimientos', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Especificaciones Técnicas - Concreto.docx', resultado: 'correcto', criticidad: 'baja', estado: 'revisado', descripcion: 'La partida cuenta con especificación vinculada y coincidente.', valorA: "Concreto f'c=210 kg/cm²", valorB: 'E.060', diferencia: '—' },
  { id: 'r-12', tipo: 'partida_cronograma', codigo: '01.05', partida: 'Acero de refuerzo', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Cronograma de Ejecución.xlsx', resultado: 'faltante', criticidad: 'critica', estado: 'pendiente', descripcion: 'No se encontró una actividad programada para la partida.', valorA: '—', valorB: 'Sin actividad', diferencia: '—' },
  { id: 'r-13', tipo: 'partida_cronograma', codigo: '01.06', partida: 'Encofrado y desencofrado', especialidad: 'Estructuras', documentoA: 'Presupuesto General.xlsx', documentoB: 'Cronograma de Ejecución.xlsx', resultado: 'advertencia', criticidad: 'alta', estado: 'pendiente', descripcion: 'La actividad del cronograma solo cubre una parte del alcance.', valorA: '19 días', valorB: '14 días', diferencia: '-5 días' },
  { id: 'r-14', tipo: 'partida_cronograma', codigo: '03.02', partida: 'Tableros de distribución', especialidad: 'Eléctricas', documentoA: 'Presupuesto General.xlsx', documentoB: 'Cronograma de Ejecución.xlsx', resultado: 'inconsistencia', criticidad: 'media', estado: 'con_observacion', descripcion: 'Partida sin actividad asignada en el cronograma.', valorA: '—', valorB: 'Sin actividad', diferencia: '—' },
]

const FILAS_POR_PAGINA = [6, 8, 10, 15]

interface FilaResultado extends RegistroResultado {}

function CeldaSortable({ header }: { header: Header<FilaResultado, unknown> }) {
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

export function ResultadosAnalisis() {
  const [tab, setTab] = useState<'todos' | TipoAnalisis>('todos')
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoAnalisis>('todos')
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 8 })
  const [seleccionId, setSeleccionId] = useState<string | null>(null)

  const datosFiltrados = useMemo(() => {
    const activos = tab === 'todos' ? MOCK : MOCK.filter((r) => r.tipo === tab)
    return activos.filter((r) => {
      if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false
      if (filtroCriticidad !== 'todas' && r.criticidad !== filtroCriticidad)
        return false
      if (filtroEstado !== 'todos' && r.estado !== filtroEstado) return false
      if (filtroEspecialidad !== 'todas' && r.especialidad !== filtroEspecialidad)
        return false
      return true
    })
  }, [tab, filtroTipo, filtroCriticidad, filtroEstado, filtroEspecialidad])

  const columnas = useMemo<ColumnDef<FilaResultado>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.codigo}</span>
        ),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo de análisis',
        cell: ({ row }) => {
          const Icono = TIPO_ICONO[row.original.tipo]
          return (
            <span className="flex max-w-[200px] items-center gap-1.5 text-xs">
              <Icono className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{TIPO_LABEL[row.original.tipo]}</span>
            </span>
          )
        },
      },
      {
        accessorKey: 'partida',
        header: 'Partida',
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-sm font-medium">{row.original.partida}</span>
        ),
      },
      {
        accessorKey: 'documentoA',
        header: 'Documento A',
        cell: ({ row }) => (
          <span className="flex max-w-[160px] items-center gap-1.5 truncate text-xs">
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.original.documentoA}</span>
          </span>
        ),
      },
      {
        accessorKey: 'documentoB',
        header: 'Documento B',
        cell: ({ row }) => (
          <span className="flex max-w-[160px] items-center gap-1.5 truncate text-xs">
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{row.original.documentoB}</span>
          </span>
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
        accessorKey: 'criticidad',
        header: 'Criticidad',
        cell: ({ row }) => (
          <Badge variant="outline" className={CRITICIDAD_BADGE[row.original.criticidad]}>
            {CRITICIDAD_LABEL[row.original.criticidad]}
          </Badge>
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
        id: 'accion',
        header: 'Acción',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-primary"
            onClick={(e) => {
              e.stopPropagation()
              generarObservacion(row.original)
            }}
          >
            <ClipboardPlus className="h-4 w-4" />
            Generar observación
          </Button>
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
      ejecutadas: MOCK.length,
      correctas: MOCK.filter((r) => r.resultado === 'correcto').length,
      advertencias: MOCK.filter((r) => r.resultado === 'advertencia').length,
      inconsistencias: MOCK.filter((r) => r.resultado === 'inconsistencia').length,
      faltantes: MOCK.filter((r) => r.resultado === 'faltante').length,
    }),
    [],
  )

  const seleccionado = MOCK.find((r) => r.id === seleccionId) ?? null

  const puntajeCoherencia = Math.round(
    (kpis.correctas / Math.max(kpis.ejecutadas, 1)) * 100,
  )

  const COHERENCIA_RELACIONES = [
    { label: 'Presupuesto vs. Metrado', score: Math.min(100, puntajeCoherencia + 3) },
    { label: 'Metrado vs. Plano', score: Math.min(100, puntajeCoherencia - 1) },
    { label: 'Partida vs. Especificación', score: Math.min(100, puntajeCoherencia + 1) },
    { label: 'Partida vs. Cronograma', score: Math.min(100, puntajeCoherencia - 4) },
  ]

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Verificaciones ejecutadas', valor: kpis.ejecutadas, detalle: 'Cruzadas entre documentos', icono: Activity, tono: 'default' },
    { titulo: 'Correctas', valor: kpis.correctas, detalle: 'Sin hallazgos', icono: BadgeCheck, tono: 'success' },
    { titulo: 'Advertencias', valor: kpis.advertencias, detalle: 'Requieren revisión', icono: TriangleAlert, tono: 'warning' },
    { titulo: 'Inconsistencias', valor: kpis.inconsistencias, detalle: 'Coincidencia alterada', icono: XCircle, tono: 'danger' },
    { titulo: 'Información faltante', valor: kpis.faltantes, detalle: 'Sin dato en una fuente', icono: EyeOff, tono: kpis.faltantes > 0 ? 'info' : 'success' },
  ]

  const generarObservacion = (r: RegistroResultado) => {
    const observacion = {
      id: r.id,
      tipo: TIPO_LABEL[r.tipo],
      codigo: r.codigo,
      partida: r.partida,
      resultado: RESULTADO_LABEL[r.resultado],
      criticidad: CRITICIDAD_LABEL[r.criticidad],
      descripcion: r.descripcion,
      documentos: [r.documentoA, r.documentoB],
    } as const
    toast.success('Observación generada', {
      description: `Preparada para la fase de observaciones: ${observacion.codigo} · ${observacion.partida}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          Resultados del análisis
        </h3>
        <p className="text-sm text-muted-foreground">
          Vista consolidada de todas las verificaciones entre documentos.
        </p>
      </div>

      <CoherenceScore
        puntaje={puntajeCoherencia}
        titulo="Coherencia del análisis"
        descripcion="Score simulado de esta ejecución"
        relaciones={COHERENCIA_RELACIONES}
        className="lg:max-w-xl"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
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

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'todos' | TipoAnalisis)}
      >
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="todos">Todas</TabsTrigger>
          <TabsTrigger value="presupuesto_metrado">Presupuesto vs. Metrado</TabsTrigger>
          <TabsTrigger value="metrado_plano">Metrado vs. Plano</TabsTrigger>
          <TabsTrigger value="partida_especificacion">Partida vs. Especificación</TabsTrigger>
          <TabsTrigger value="partida_cronograma">Partida vs. Cronograma</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar código o partida..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
            aria-label="Buscar resultados de análisis"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as 'todos' | TipoAnalisis)}>
            <SelectTrigger className="w-full lg:w-60">
              <SelectValue placeholder="Tipo de análisis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los análisis</SelectItem>
              <SelectItem value="presupuesto_metrado">Presupuesto vs. Metrado</SelectItem>
              <SelectItem value="metrado_plano">Metrado vs. Plano</SelectItem>
              <SelectItem value="partida_especificacion">Partida vs. Especificación</SelectItem>
              <SelectItem value="partida_cronograma">Partida vs. Cronograma</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCriticidad} onValueChange={setFiltroCriticidad}>
            <SelectTrigger className="w-full lg:w-44">
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
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="revisado">Revisado</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="con_observacion">Con observación</SelectItem>
            </SelectContent>
          </Select>
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
                      <span>No hay resultados que coincidan con los filtros</span>
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
              <span className="text-sm">No hay resultados que coincidan con los filtros</span>
            </div>
          ) : (
            filas.map((fila) => {
              const f = fila.original
              const Icono = RESULTADO_ICONO[f.resultado]
              const TipoIcono = TIPO_ICONO[f.tipo]
              return (
                <div key={fila.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{f.codigo}</p>
                      <p className="truncate text-sm font-medium">{f.partida}</p>
                    </div>
                    <Badge variant="outline" className={CRITICIDAD_BADGE[f.criticidad]}>
                      {CRITICIDAD_LABEL[f.criticidad]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TipoIcono className="h-3.5 w-3.5 shrink-0" />
                    {TIPO_LABEL[f.tipo]}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className={RESULTADO_BADGE[f.resultado]}>
                      <Icono className="mr-1 h-3.5 w-3.5" />
                      {RESULTADO_LABEL[f.resultado]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-primary"
                      onClick={() => generarObservacion(f)}
                    >
                      <ClipboardPlus className="h-4 w-4" />
                      Observación
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">{filas.length === 0 ? 0 : primera}–{ultima}</span> de{' '}
          <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> resultados
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
          {seleccionado && <DetalleResultado r={seleccionado} onGenerar={generarObservacion} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetalleResultado({
  r,
  onGenerar,
}: {
  r: RegistroResultado
  onGenerar: (r: RegistroResultado) => void
}) {
  const Icono = RESULTADO_ICONO[r.resultado]
  const TipoIcono = TIPO_ICONO[r.tipo]
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TipoIcono className="h-4 w-4" />
          </span>
          {r.codigo}
        </SheetTitle>
        <SheetDescription>{r.partida}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Descripción del hallazgo
          </p>
          <p className="text-sm">{r.descripcion}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documento A</p>
            <p className="mt-1 text-sm font-medium">{r.valorA}</p>
            <p className="truncate text-xs text-muted-foreground">{r.documentoA}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documento B</p>
            <p className="mt-1 text-sm font-medium">{r.valorB}</p>
            <p className="truncate text-xs text-muted-foreground">{r.documentoB}</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm text-muted-foreground">Diferencia</span>
          <span className="font-mono text-sm font-semibold">{r.diferencia}</span>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resultado</p>
            <Badge variant="outline" className={RESULTADO_BADGE[r.resultado]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {RESULTADO_LABEL[r.resultado]}
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Criticidad</p>
            <Badge variant="outline" className={CRITICIDAD_BADGE[r.criticidad]}>
              {CRITICIDAD_LABEL[r.criticidad]}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Documentos relacionados
          </p>
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              {r.documentoA}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              {r.documentoB}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5" />
            Recomendación
          </p>
          <p className="text-sm text-muted-foreground">
            {r.resultado === 'correcto'
              ? 'No se requiere acción. La información se considera consistente.'
              : r.resultado === 'faltante'
                ? 'Completar la información faltante en la fuente correspondiente antes de continuar.'
                : 'Conciliar los valores entre ambos documentos y actualizar el registro en la estructura común.'}
          </p>
        </div>

        <Button
          className="w-full gap-2"
          onClick={() => onGenerar(r)}
        >
          <ClipboardPlus className="h-4 w-4" />
          Generar observación
        </Button>
      </div>
    </>
  )
}