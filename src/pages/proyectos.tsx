import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO, isAfter } from 'date-fns'
import { useNavigate, Link } from 'react-router-dom'
import { z } from 'zod'
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
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Proyecto, ProyectoEstado, TipoObra } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from '@/components/kpi-card'
import { ProyectoEstadoBadge, PROYECTO_ESTADO_LABEL } from '@/components/proyecto-estado-badge'
import { EmptyState } from '@/components/empty-state'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'

import { proyectos as datosProyectos } from '@/data/proyectos'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const ESTADOS_DISPONIBLES: ProyectoEstado[] = [
  'borrador',
  'documentacion',
  'en_analisis',
  'observado',
  'revisado',
]

const TIPOS_OBRA_DISPONIBLES = [
  'Infraestructura',
  'Transportes',
  'Saneamiento',
  'Salud',
  'Educación',
  'Energía',
] as const satisfies readonly TipoObra[]

const FILAS_POR_PAGINA = [8, 10, 15, 20]

const ESTADOS_INICIALES = [
  'borrador',
  'documentacion',
  'en_analisis',
] as const

const DEPARTAMENTOS = ['Junín', 'Lima', 'Cusco', 'Arequipa', 'Cajamarca']

const PROVINCIAS_POR_DEPARTAMENTO: Record<string, string[]> = {
  'Junín': ['Huancayo', 'Jauja', 'Concepción', 'Satipo', 'Chanchamayo'],
  'Lima': ['Lima', 'Huaral', 'Cañete', 'Huarochirí'],
  'Cusco': ['Cusco', 'Urubamba', 'La Convención', 'Anta'],
  'Arequipa': ['Arequipa', 'Camaná', 'Islay', 'Caylloma'],
  'Cajamarca': ['Cajamarca', 'Jaén', 'Chota', 'Celendín'],
}

const DISTRITOS_POR_PROVINCIA: Record<string, string[]> = {
  'Huancayo': ['Huancayo', 'Chilca', 'El Tambo', 'Huancán', 'Pilcomayo'],
  'Jauja': ['Jauja', 'Yauyos', 'Acolla', 'Ataura'],
  'Concepción': ['Concepción', 'Mito', 'Comas', 'Santa Rosa'],
  'Satipo': ['Satipo', 'Mazamari', 'Pangoa', 'Llaylla'],
  'Chanchamayo': ['La Merced', 'Perené', 'Pichanaqui', 'San Ramón'],
  'Lima': ['Lima', 'Miraflores', 'San Isidro', 'La Molina', 'Surco'],
  'Huaral': ['Huaral', 'Chancay', 'Aucallama'],
  'Cañete': ['San Vicente', 'Mala', 'Chilca', 'Asia'],
  'Huarochirí': ['Matucana', 'Chosica', 'San Bartolomé'],
  'Cusco': ['Cusco', 'San Sebastián', 'Wanchaq', 'San Jerónimo'],
  'Urubamba': ['Urubamba', 'Ollantaytambo', 'Yucay'],
  'La Convención': ['Quillabamba', 'Santa Ana', 'Machupicchu'],
  'Anta': ['Anta', 'Zurite', 'Chinchaypujio'],
  'Arequipa': ['Arequipa', 'Cayma', 'Cerro Colorado', 'Alto Selva Alegre'],
  'Camaná': ['Camaná', 'José María Quimper', 'Mariscal Cáceres'],
  'Islay': ['Mollendo', 'Mejía', 'Cocachacra'],
  'Caylloma': ['Cabanaconde', 'Chivay', 'Majes'],
  'Cajamarca': ['Cajamarca', 'Baños del Inca', 'Llacanora'],
  'Jaén': ['Jaén', 'Bellavista', 'Las Pirias'],
  'Chota': ['Chota', 'Choropampa', 'Lajas'],
  'Celendín': ['Celendín', 'Chumuch', 'Huasmin'],
}

const ESPECIALISTAS_SUGERIDOS = [
  'Ing. Estructuras',
  'Ing. Hidráulica',
  'Ing. Vial',
  'Ing. Sanitaria',
  'Arquitecto',
  'Ing. Electromecánica',
]

const nuevoProyectoSchema = z.object({
  nombre: z
    .string()
    .min(5, 'Ingrese el nombre del proyecto (mín. 5 caracteres)'),
  codigo: z.string().min(3, 'Ingrese el código del expediente'),
  entidad: z.string().min(3, 'Ingrese la entidad pública'),
  tipoObra: z.enum(TIPOS_OBRA_DISPONIBLES, {
    message: 'Seleccione el tipo de obra',
  }),
  departamento: z.string().min(1, 'Seleccione el departamento'),
  provincia: z.string().min(1, 'Seleccione la provincia'),
  distrito: z.string().min(1, 'Seleccione el distrito'),
  descripcion: z
    .string()
    .min(10, 'Ingrese una descripción (mín. 10 caracteres)'),
  jefeProyecto: z.string().min(3, 'Ingrese el jefe de proyecto'),
  especialistas: z.string().min(3, 'Ingrese al menos un especialista'),
  revisor: z.string().min(3, 'Ingrese el revisor'),
  fechaInicio: z.string().min(1, 'Seleccione la fecha de inicio'),
  fechaEntrega: z.string().min(1, 'Seleccione la fecha de entrega'),
  estadoInicial: z.enum(ESTADOS_INICIALES, {
    message: 'Seleccione el estado inicial',
  }),
})

type NuevoProyectoValues = z.infer<typeof nuevoProyectoSchema>

interface NuevoProyectoFormProps {
  onGuardar: (proyecto: Proyecto) => void
  onCerrar: () => void
}

function AccionesProyecto({ proyecto }: { proyecto: Proyecto }) {
  const navigate = useNavigate()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Acciones">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate(`/proyectos/${proyecto.id}`)}
        >
          <Eye />
          Ver detalle
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.info(`Editar ${proyecto.codigo}`)}
        >
          <Pencil />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => toast.error(`Eliminar ${proyecto.codigo}`)}
        >
          <Trash2 />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CeldaSortable({
  header,
}: {
  header: Header<Proyecto, unknown>
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
      <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
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

export function ProyectosPage() {
  const navigate = useNavigate()
  const [listaProyectos, setListaProyectos] =
    useState<Proyecto[]>(datosProyectos)
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstadoRaw] = useState<string>('todos')
  const [filtroTipo, setFiltroTipoRaw] = useState<string>('todos')
  const [paginacion, setPaginacion] = useState({
    pageIndex: 0,
    pageSize: 8,
  })

  const colocarProyecto = (proyecto: Proyecto) => {
    setListaProyectos((prev) => [proyecto, ...prev])
    setDialogAbierto(false)
    toast.success('Proyecto creado correctamente')
    navigate('/proyectos')
  }

  const cambiarFiltroEstado = (valor: string) => {
    setFiltroEstadoRaw(valor)
    setPaginacion((prev) => ({ ...prev, pageIndex: 0 }))
  }
  const cambiarFiltroTipo = (valor: string) => {
    setFiltroTipoRaw(valor)
    setPaginacion((prev) => ({ ...prev, pageIndex: 0 }))
  }
  const cambiarBusqueda = (valor: string) => {
    setBusqueda(valor)
    setPaginacion((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const datosFiltrados = useMemo(() => {
    return listaProyectos.filter(
      (p) =>
        (filtroEstado === 'todos' || p.estado === filtroEstado) &&
        (filtroTipo === 'todos' || p.tipoObra === filtroTipo),
    )
  }, [listaProyectos, filtroEstado, filtroTipo])

  const columnas = useMemo<ColumnDef<Proyecto>[]>(() => {
    return [
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
        accessorKey: 'nombre',
        header: 'Proyecto',
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <Link
              to={`/proyectos/${row.original.id}`}
              className="truncate font-medium underline-offset-4 hover:underline"
            >
              {row.original.nombre}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.entidad}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'entidad',
        header: 'Entidad pública',
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-xs">
            {row.original.entidad}
          </span>
        ),
      },
      {
        accessorKey: 'tipoObra',
        header: 'Tipo de obra',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.tipoObra}</Badge>
        ),
      },
      {
        accessorKey: 'ubicacion',
        header: 'Ubicación',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.ubicacion}</span>
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
        accessorKey: 'avance',
        header: 'Avance',
        cell: ({ row }) => {
          const avance = row.original.avance
          return (
            <div className="flex w-24 items-center gap-2">
              <Progress
                value={avance}
                className={cn(
                  'h-1.5',
                  avance >= 80
                    ? '[&>div]:bg-success'
                    : avance >= 40
                      ? '[&>div]:bg-primary'
                      : '[&>div]:bg-warning',
                )}
              />
              <span className="w-8 text-right text-xs text-muted-foreground">
                {avance}%
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'observaciones',
        header: 'Observaciones',
        cell: ({ row }) => {
          const cantidad = row.original.observaciones
          return (
            <Badge
              variant="outline"
              className={cn(
                cantidad > 0
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'text-muted-foreground',
              )}
            >
              {cantidad}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => (
          <ProyectoEstadoBadge estado={row.original.estado} />
        ),
      },
      {
        accessorKey: 'actualizadoEl',
        header: 'Última actualización',
        cell: ({ row }) => (
          <span className="text-xs">{formatFecha(row.original.actualizadoEl)}</span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => <AccionesProyecto proyecto={row.original} />,
      },
    ]
  }, [])

  const table = useReactTable({
    data: datosFiltrados,
    columns: columnas,
    state: {
      sorting,
      globalFilter: busqueda,
      pagination: paginacion,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: cambiarBusqueda,
    onPaginationChange: setPaginacion,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const total = listaProyectos.length
  const enAnalisis = listaProyectos.filter((p) => p.estado === 'en_analisis').length
  const conObservaciones = listaProyectos.filter((p) => p.estado === 'observado').length
  const revisados = listaProyectos.filter((p) => p.estado === 'revisado').length

  const filas = table.getRowModel().rows
  const totalPaginas = table.getPageCount()
  const primera = paginacion.pageIndex * paginacion.pageSize + 1
  const ultima = Math.min(
    (paginacion.pageIndex + 1) * paginacion.pageSize,
    table.getFilteredRowModel().rows.length,
  )

  return (
    <div className="space-y-6">
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <KpiCard
            titulo="Total de proyectos"
            valor={total}
            detalle="Expedientes en sistema"
            icono={FolderKanban}
            tono="default"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            titulo="En análisis"
            valor={enAnalisis}
            detalle="Revisión en curso"
            icono={ClipboardCheck}
            tono="info"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            titulo="Con observaciones"
            valor={conObservaciones}
            detalle="Requieren correcciones"
            icono={AlertTriangle}
            tono="warning"
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            titulo="Revisados"
            valor={revisados}
            detalle="Expedientes conformes"
            icono={CheckCircle2}
            tono="success"
          />
        </StaggerItem>
      </Stagger>

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por código, proyecto o entidad..."
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar proyectos"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filtroEstado} onValueChange={cambiarFiltroEstado}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS_DISPONIBLES.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {PROYECTO_ESTADO_LABEL[estado]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroTipo} onValueChange={cambiarFiltroTipo}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo de obra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_OBRA_DISPONIBLES.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus />
                  Nuevo proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo proyecto</DialogTitle>
                  <DialogDescription>
                    Complete el registro del expediente técnico por pasos.
                  </DialogDescription>
                </DialogHeader>
                <NuevoProyectoForm
                  onGuardar={colocarProyecto}
                  onCerrar={() => setDialogAbierto(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
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
                    <TableCell
                      colSpan={columnas.length}
                      className="h-40 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <span>No se encontraron proyectos</span>
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
        </div>

        <div className="grid gap-3 lg:hidden">
          {filas.length === 0 ? (
            <EmptyState
              icono={Search}
              titulo="Sin resultados"
              descripcion="No se encontraron proyectos con los filtros aplicados."
            />
          ) : (
            filas.map((fila) => {
              const p = fila.original
              return (
                <div
                  key={fila.id}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">
                        {p.codigo}
                      </p>
                      <p className="mt-1 truncate font-medium">
                        <Link
                          to={`/proyectos/${p.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {p.nombre}
                        </Link>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.entidad}
                      </p>
                    </div>
                    <AccionesProyecto proyecto={p} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ProyectoEstadoBadge estado={p.estado} />
                    <Badge variant="secondary">{p.tipoObra}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        p.observaciones > 0
                          ? 'border-warning/40 bg-warning/10 text-warning'
                          : 'text-muted-foreground',
                      )}
                    >
                      {p.observaciones} obs.
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={p.avance} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">
                      {p.avance}%
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="min-w-0 truncate">{p.ubicacion}</span>
                    <span className="shrink-0">Resp: {p.responsable}</span>
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
            proyectos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
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
      </FadeIn>
    </div>
  )
}

const PASOS = [
  { titulo: 'Información general', icono: Building2 },
  { titulo: 'Equipo', icono: Users },
  { titulo: 'Programación', icono: ClipboardCheck },
  { titulo: 'Confirmación', icono: Check },
]

const CAMPOS_PASO: (keyof NuevoProyectoValues)[][] = [
  [
    'nombre',
    'codigo',
    'entidad',
    'tipoObra',
    'departamento',
    'provincia',
    'distrito',
    'descripcion',
  ],
  ['jefeProyecto', 'especialistas', 'revisor'],
  ['fechaInicio', 'fechaEntrega', 'estadoInicial'],
]

function NuevoProyectoForm({
  onGuardar,
  onCerrar,
}: NuevoProyectoFormProps) {
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<NuevoProyectoValues>({
    resolver: zodResolver(nuevoProyectoSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      entidad: '',
      tipoObra: 'Infraestructura',
      departamento: '',
      provincia: '',
      distrito: '',
      descripcion: '',
      jefeProyecto: '',
      especialistas: '',
      revisor: '',
      fechaInicio: '',
      fechaEntrega: '',
      estadoInicial: 'borrador',
    },
  })

  const valores = watch()

  const provincias = DEPARTAMENTOS.includes(valores.departamento)
    ? PROVINCIAS_POR_DEPARTAMENTO[valores.departamento]
    : []
  const distritos = provincias.includes(valores.provincia)
    ? DISTRITOS_POR_PROVINCIA[valores.provincia]
    : []

  const esUltimoPaso = paso === PASOS.length - 1

  const siguiente = async () => {
    const valido = await trigger(CAMPOS_PASO[paso])
    if (!valido) return
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  const anterior = () => setPaso((p) => Math.max(p - 1, 0))

  const onSubmit = async (data: NuevoProyectoValues) => {
    if (guardando) return

    const inicio = parseISO(data.fechaInicio)
    const entrega = parseISO(data.fechaEntrega)
    if (isAfter(inicio, entrega)) {
      toast.error(
        'La fecha de entrega debe ser posterior a la fecha de inicio',
      )
      return
    }

    setGuardando(true)
    await new Promise((resolve) => setTimeout(resolve, 700))

    const hoy = new Date()
    const nuevo: Proyecto = {
      id: `proy-${Date.now()}`,
      codigo: data.codigo.trim(),
      nombre: data.nombre.trim(),
      entidad: data.entidad.trim(),
      sector: data.tipoObra,
      tipoObra: data.tipoObra,
      responsable: data.jefeProyecto.trim(),
      avance: 0,
      observaciones: 0,
      monto: 0,
      fechaCreacion: format(hoy, 'yyyy-MM-dd'),
      fechaInicio: data.fechaInicio,
      actualizadoEl: format(hoy, 'yyyy-MM-dd'),
      estado: data.estadoInicial,
      ubicacion: `${data.departamento}, ${data.provincia}, ${data.distrito}`,
    }

    onGuardar(nuevo)
  }

  const textoError = (campo: keyof NuevoProyectoValues) => {
    const mensaje = errors[campo]?.message
    return mensaje ? <p className="text-xs text-destructive">{mensaje}</p> : null
  }

  const agregarEspecialista = (valor: string) => {
    const actual = getValues('especialistas')
    const lista = actual
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (lista.includes(valor)) return
    setValue(
      'especialistas',
      lista.length ? `${lista.join(', ')}, ${valor}` : valor,
      { shouldValidate: true },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PASOS.map((p, i) => {
          const Icono = p.icono
          const activo = i === paso
          const completado = i < paso
          return (
            <li key={p.titulo}>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                  activo
                    ? 'border-primary bg-primary/10 text-foreground'
                    : completado
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-muted text-muted-foreground',
                )}
              >
                <Icono className="h-4 w-4 shrink-0" />
                <span className="truncate">{p.titulo}</span>
              </div>
            </li>
          )
        })}
      </ol>

      <Separator />

      {paso === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-nombre">Nombre del proyecto</Label>
            <Input
              id="np-nombre"
              placeholder="Ej: Mejoramiento del puente vehicular..."
              {...register('nombre')}
            />
            {textoError('nombre')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-codigo">Código</Label>
            <Input
              id="np-codigo"
              placeholder="EXP-2026-0001"
              {...register('codigo')}
            />
            {textoError('codigo')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-entidad">Entidad pública</Label>
            <Input
              id="np-entidad"
              placeholder="Ej: Municipalidad Provincial de..."
              {...register('entidad')}
            />
            {textoError('entidad')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-tipo">Tipo de obra</Label>
            <Select
              value={valores.tipoObra}
              onValueChange={(v) =>
                setValue('tipoObra', v as TipoObra, { shouldValidate: true })
              }
            >
              <SelectTrigger id="np-tipo">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OBRA_DISPONIBLES.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('tipoObra')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-depto">Departamento</Label>
            <Select
              value={valores.departamento}
              onValueChange={(v) => {
                setValue('departamento', v, { shouldValidate: true })
                setValue('provincia', '')
                setValue('distrito', '')
              }}
            >
              <SelectTrigger id="np-depto">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTAMENTOS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('departamento')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-prov">Provincia</Label>
            <Select
              value={valores.provincia}
              onValueChange={(v) => {
                setValue('provincia', v, { shouldValidate: true })
                setValue('distrito', '')
              }}
              disabled={!provincias.length}
            >
              <SelectTrigger id="np-prov">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {provincias.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('provincia')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-distrito">Distrito</Label>
            <Select
              value={valores.distrito}
              onValueChange={(v) =>
                setValue('distrito', v, { shouldValidate: true })
              }
              disabled={!distritos.length}
            >
              <SelectTrigger id="np-distrito">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {distritos.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('distrito')}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-desc">Descripción</Label>
            <Textarea
              id="np-desc"
              placeholder="Describa el alcance del expediente técnico..."
              rows={3}
              {...register('descripcion')}
            />
            {textoError('descripcion')}
          </div>
        </div>
      )}

      {paso === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-jefe">Jefe de proyecto</Label>
            <Input
              id="np-jefe"
              placeholder="Nombre del responsable del proyecto"
              {...register('jefeProyecto')}
            />
            {textoError('jefeProyecto')}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-espec">Especialistas</Label>
            <Input
              id="np-espec"
              placeholder="Ej: Ing. Estructuras, Ing. Hidráulica"
              {...register('especialistas')}
            />
            <div className="flex flex-wrap gap-1.5">
              {ESPECIALISTAS_SUGERIDOS.map((esp) => (
                <button
                  key={esp}
                  type="button"
                  onClick={() => agregarEspecialista(esp)}
                  className="rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  + {esp.replace('Ing. ', '')}
                </button>
              ))}
            </div>
            {textoError('especialistas')}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-revisor">Revisor</Label>
            <Input
              id="np-revisor"
              placeholder="Nombre del revisor del expediente"
              {...register('revisor')}
            />
            {textoError('revisor')}
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="np-inicio">Fecha de inicio</Label>
            <Input
              id="np-inicio"
              type="date"
              {...register('fechaInicio')}
            />
            {textoError('fechaInicio')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-entrega">Fecha estimada de entrega</Label>
            <Input
              id="np-entrega"
              type="date"
              {...register('fechaEntrega')}
            />
            {textoError('fechaEntrega')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-estado">Estado inicial</Label>
            <Select
              value={valores.estadoInicial}
              onValueChange={(v) =>
                setValue(
                  'estadoInicial',
                  v as (typeof ESTADOS_INICIALES)[number],
                  { shouldValidate: true },
                )
              }
            >
              <SelectTrigger id="np-estado">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_INICIALES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {PROYECTO_ESTADO_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('estadoInicial')}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Información general
            </h4>
            <dl className="space-y-1.5 text-sm">
              <FilaResumen etiqueta="Nombre" valor={valores.nombre} />
              <FilaResumen etiqueta="Código" valor={valores.codigo} />
              <FilaResumen etiqueta="Entidad" valor={valores.entidad} />
              <FilaResumen etiqueta="Tipo de obra" valor={valores.tipoObra} />
              <FilaResumen
                etiqueta="Ubicación"
                valor={`${valores.departamento}, ${valores.provincia}, ${valores.distrito}`}
              />
              <FilaResumen etiqueta="Descripción" valor={valores.descripcion} />
            </dl>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                Equipo
              </h4>
              <dl className="space-y-1.5 text-sm">
                <FilaResumen
                  etiqueta="Jefe de proyecto"
                  valor={valores.jefeProyecto}
                />
                <FilaResumen
                  etiqueta="Especialistas"
                  valor={valores.especialistas}
                />
                <FilaResumen etiqueta="Revisor" valor={valores.revisor} />
              </dl>
            </div>

            <div className="space-y-1">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                Programación
              </h4>
              <dl className="space-y-1.5 text-sm">
                <FilaResumen
                  etiqueta="Inicio"
                  valor={
                    valores.fechaInicio
                      ? format(parseISO(valores.fechaInicio), 'dd/MM/yyyy')
                      : ''
                  }
                />
                <FilaResumen
                  etiqueta="Entrega"
                  valor={
                    valores.fechaEntrega
                      ? format(parseISO(valores.fechaEntrega), 'dd/MM/yyyy')
                      : ''
                  }
                />
                <FilaResumen
                  etiqueta="Estado inicial"
                  valor={PROYECTO_ESTADO_LABEL[valores.estadoInicial]}
                />
              </dl>
            </div>
          </div>
        </div>
      )}

      <Separator />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onCerrar}
          disabled={guardando}
        >
          Cancelar
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {paso > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={anterior}
              disabled={guardando}
            >
              <ArrowLeft />
              Anterior
            </Button>
          )}

          {esUltimoPaso ? (
            <Button type="submit" disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 />
                  Guardar proyecto
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={siguiente}>
              Siguiente
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function FilaResumen({
  etiqueta,
  valor,
}: {
  etiqueta: string
  valor: string
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium">{valor}</dd>
    </div>
  )
}
