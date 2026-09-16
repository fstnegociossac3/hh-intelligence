import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  ClipboardCheck,
  Copy,
  Download,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Eye,
  FileJson,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Proyecto, ProyectoEstado, TipoObra } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogFooter,
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
import { usePermisos } from '@/utils/permisos'
import { EmptyState } from '@/components/empty-state'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { ProyectoForm } from '@/components/proyecto-form'

import {
  useProyectos,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto as eliminarProyectoStore,
  duplicarProyecto as duplicarProyectoStore,
  guardarProyectos,
  obtenerProyectos,
} from '@/data/proyectos-store'
import {
  obtenerObservaciones,
  guardarObservaciones,
} from '@/data/observaciones-store'
import type { Observacion } from '@/data/observaciones-store'
import {
  leerArchivoJSON,
  validarProyectoDetallado,
  validarObservacionDetallada,
  descargarPlantillaImportacion,
  exportarProyectosPDF,
} from '@/utils/export-import'
import type { ErrorCampoImport } from '@/utils/export-import'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import {
  registrarEvento,
  USUARIO_ACTUAL,
} from '@/data/historial-store'
import { useFilasPorPagina, combinarFilasPorPagina, usePaginacionConfig } from '@/data/configuracion-store'

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

function AccionesProyecto({
  proyecto,
  onEditar,
  onEliminar,
  onDuplicar,
}: {
  proyecto: Proyecto
  onEditar: (p: Proyecto) => void
  onEliminar: (id: string) => void
  onDuplicar: (p: Proyecto) => void
}) {
  const navigate = useNavigate()
  const { puedeEditar } = usePermisos()
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
        {puedeEditar && (
          <>
            <DropdownMenuItem onClick={() => onEditar(proyecto)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicar(proyecto)}>
              <Copy />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onEliminar(proyecto.id)}
            >
              <Trash2 />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
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
  const listaProyectos = useProyectos()
  const inputImportarRef = useRef<HTMLInputElement>(null)
  const { puedeEditar } = usePermisos()
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [dialogEditarAbierto, setDialogEditarAbierto] = useState(false)
  const [dialogEliminarAbierto, setDialogEliminarAbierto] = useState(false)
  const [erroresImportacion, setErroresImportacion] = useState<
    { tipo: string; etiqueta: string; errores: ErrorCampoImport[] }[]
  >([])
  const [dialogErroresImportAbierto, setDialogErroresImportAbierto] = useState(false)
  const [proyectoEditando, setProyectoEditando] = useState<Proyecto | null>(null)
  const [proyectoEliminarId, setProyectoEliminarId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstadoRaw] = useState<string>('todos')
  const [filtroTipo, setFiltroTipoRaw] = useState<string>('todos')
  const filasConfig = useFilasPorPagina()
  const [paginacion, setPaginacion] = usePaginacionConfig()

  const colocarProyecto = (proyecto: Proyecto) => {
    crearProyecto(proyecto)
    registrarEvento({
      proyectoId: proyecto.id,
      proyectoCodigo: proyecto.codigo,
      accion: 'proyecto_creado',
      usuario: USUARIO_ACTUAL,
      descripcion: `Expediente ${proyecto.codigo} · ${proyecto.nombre} creado`,
    })
    setDialogAbierto(false)
    toast.success('Proyecto creado correctamente')
    navigate('/proyectos')
  }

  const editarProyecto = useCallback((proyecto: Proyecto) => {
    setProyectoEditando(proyecto)
    setDialogEditarAbierto(true)
  }, [])

  const guardarEdicion = useCallback((guardado: Proyecto) => {
    if (!proyectoEditando) return
    actualizarProyecto(proyectoEditando.id, { ...guardado })
    registrarEvento({
      proyectoId: proyectoEditando.id,
      proyectoCodigo: proyectoEditando.codigo,
      accion: 'proyecto_editado',
      usuario: USUARIO_ACTUAL,
      descripcion: `Datos del expediente ${guardado.codigo} actualizados`,
    })
    setDialogEditarAbierto(false)
    setProyectoEditando(null)
    toast.success('Proyecto actualizado correctamente')
  }, [proyectoEditando])

  const confirmarEliminar = useCallback((id: string) => {
    setProyectoEliminarId(id)
    setDialogEliminarAbierto(true)
  }, [])

  const eliminarProyecto = useCallback(() => {
    if (!proyectoEliminarId) return
    const proyecto = listaProyectos.find((p) => p.id === proyectoEliminarId)
    eliminarProyectoStore(proyectoEliminarId)
    setDialogEliminarAbierto(false)
    setProyectoEliminarId(null)
    toast.success('Proyecto eliminado', {
      description: `${proyecto?.codigo} fue eliminado del sistema.`,
    })
  }, [proyectoEliminarId, listaProyectos])

  const duplicarProyecto = useCallback((proyecto: Proyecto) => {
    const nuevo = duplicarProyectoStore(proyecto)
    registrarEvento({
      proyectoId: nuevo.id,
      proyectoCodigo: nuevo.codigo,
      accion: 'proyecto_creado',
      usuario: USUARIO_ACTUAL,
      descripcion: `Copia del expediente ${proyecto.codigo} creada como ${nuevo.codigo}`,
    })
    toast.success('Proyecto duplicado', {
      description: `Se creó una copia de ${nuevo.codigo}.`,
    })
  }, [])

  const exportarProyectos = () => {
    const observaciones = obtenerObservaciones()
    exportarProyectosPDF(listaProyectos, observaciones, 'expedientes-hh-intelligence')
    toast.success('Proyectos exportados', {
      description: `${listaProyectos.length} expediente(s) descargados en formato PDF.`,
    })
  }

  const manejarImportar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const datos = await leerArchivoJSON<{
        proyectos?: unknown[]
        observaciones?: unknown[]
      }>(file)

      const erroresPorRegistro: { tipo: string; etiqueta: string; errores: ErrorCampoImport[] }[] = []

      const proyectosValidos: Proyecto[] = []
      const rawProyectos = Array.isArray(datos?.proyectos) ? datos.proyectos : []
      rawProyectos.forEach((item, i) => {
        const resultado = validarProyectoDetallado(item)
        if (resultado.ok) {
          proyectosValidos.push(item as Proyecto)
        } else {
          erroresPorRegistro.push({
            tipo: 'Proyecto',
            etiqueta: `Proyecto #${i + 1}`,
            errores: resultado.errores,
          })
        }
      })

      const observacionesValidas: Observacion[] = []
      const rawObs = Array.isArray(datos?.observaciones) ? datos.observaciones : []
      rawObs.forEach((item, i) => {
        const resultado = validarObservacionDetallada(item)
        if (resultado.ok) {
          observacionesValidas.push(item as Observacion)
        } else {
          erroresPorRegistro.push({
            tipo: 'Observación',
            etiqueta: `Observación #${i + 1}`,
            errores: resultado.errores,
          })
        }
      })

      if (proyectosValidos.length === 0) {
        toast.error('No se importó ningún proyecto', {
          description:
            erroresPorRegistro.length > 0
              ? `Se encontraron ${erroresPorRegistro.length} registro(s) con errores. Revisa la plantilla de descarga.`
              : 'El archivo no contiene una estructura de proyectos reconocida.',
        })
        return
      }

      const actuales = obtenerProyectos()
      const mapaProyectos = new Map(actuales.map((p) => [p.id, p]))
      proyectosValidos.forEach((p) => mapaProyectos.set(p.id, p))
      guardarProyectos(Array.from(mapaProyectos.values()))

      const observacionesActuales = obtenerObservaciones()
      const mapaObs = new Map(observacionesActuales.map((o) => [o.id, o]))
      observacionesValidas.forEach((o) => mapaObs.set(o.id, o))
      guardarObservaciones(Array.from(mapaObs.values()))

      setErroresImportacion(erroresPorRegistro)
      if (erroresPorRegistro.length > 0) {
        setDialogErroresImportAbierto(true)
      }
      toast.success('Importación completada', {
        description:
          erroresPorRegistro.length === 0
            ? `${proyectosValidos.length} expediente(s) y ${observacionesValidas.length} observación(es) importados.`
            : `${proyectosValidos.length} expediente(s) y ${observacionesValidas.length} observación(es) importados. ${erroresPorRegistro.length} registro(s) rechazados por errores.`,
      })
    } catch {
      toast.error('No se pudo importar', {
        description: 'El archivo no es un JSON válido.',
      })
    }
  }

  const descargarPlantilla = () => {
    descargarPlantillaImportacion()
    toast.success('Plantilla descargada', {
      description: 'Archivo JSON de ejemplo con la estructura esperada.',
    })
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
        cell: ({ row }) => (
          <AccionesProyecto
            proyecto={row.original}
            onEditar={editarProyecto}
            onEliminar={confirmarEliminar}
            onDuplicar={duplicarProyecto}
          />
        ),
      },
    ]
  }, [editarProyecto, confirmarEliminar, duplicarProyecto])

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

  useEffect(() => {
    if (paginacion.pageIndex >= totalPaginas && totalPaginas > 0) {
      setPaginacion((prev) => ({ ...prev, pageIndex: totalPaginas - 1 }))
    }
  }, [paginacion.pageIndex, totalPaginas])

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

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={exportarProyectos}
            >
              <Download />
              Exportar
            </Button>

            {puedeEditar && (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={descargarPlantilla}
                >
                  <FileJson />
                  Plantilla
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => inputImportarRef.current?.click()}
                >
                  <Upload />
                  Importar
                </Button>
              </>
            )}

            <input
              ref={inputImportarRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              aria-label="Importar proyectos"
              onChange={manejarImportar}
            />

            <Dialog
              open={dialogErroresImportAbierto}
              onOpenChange={setDialogErroresImportAbierto}
            >
              <DialogContent className="max-h-[80dvh] max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Rechazados en la importación</DialogTitle>
                  <DialogDescription>
                    {erroresImportacion.length} registro(s) no se importaron por
                    errores de validación campo por campo. Los registros válidos
                    sí se guardaron.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[50dvh] space-y-3 overflow-y-auto pr-1">
                  {erroresImportacion.map((registro, i) => (
                    <div
                      key={`${registro.tipo}-${i}`}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                        <AlertTriangle className="h-4 w-4" />
                        {registro.tipo}: {registro.etiqueta}
                      </div>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
                        {registro.errores.map((err, j) => (
                          <li key={`${err.campo}-${j}`}>
                            <span className="font-medium">{err.campo}:</span>{' '}
                            {err.detalle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button onClick={descargarPlantilla}>
                    <FileJson />
                    Descargar plantilla de ejemplo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
              {puedeEditar && (
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus />
                    Nuevo proyecto
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo proyecto</DialogTitle>
                  <DialogDescription>
                    Complete el registro del expediente técnico por pasos.
                  </DialogDescription>
                </DialogHeader>
                <ProyectoForm
                  modo="crear"
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
                    <AccionesProyecto
                      proyecto={p}
                      onEditar={editarProyecto}
                      onEliminar={confirmarEliminar}
                      onDuplicar={duplicarProyecto}
                    />
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
                {combinarFilasPorPagina(FILAS_POR_PAGINA, filasConfig).map((n) => (
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

      <Dialog open={dialogEditarAbierto} onOpenChange={setDialogEditarAbierto}>
        <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>
              Actualice los datos del expediente técnico por pasos.
            </DialogDescription>
          </DialogHeader>
          {proyectoEditando && (
            <ProyectoForm
              key={proyectoEditando.id}
              modo="editar"
              proyecto={proyectoEditando}
              onGuardar={guardarEdicion}
              onCerrar={() => setDialogEditarAbierto(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogEliminarAbierto} onOpenChange={setDialogEliminarAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              expediente y todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>
          {proyectoEliminarId && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                ¿Está seguro que desea eliminar el proyecto{' '}
                <strong>
                  {listaProyectos.find((p) => p.id === proyectoEliminarId)?.codigo}
                </strong>
                ?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogEliminarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarProyecto}
            >
              <Trash2 />
              Eliminar permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
