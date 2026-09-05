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
  FileText,
  Gauge,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { EmptyState } from '@/components/empty-state'
import { DetalleObservacionAmplio } from '@/components/detalle-observacion'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import type { LucideIcon } from 'lucide-react'
import {
  useObservaciones,
  crearObservacion,
  actualizarObservacion,
  eliminarObservacion,
  RESPONSABLES,
  REGLAS,
  TIPOS_INCONSISTENCIA,
  type Observacion,
  type EstadoObs,
  type CriticidadObs as Criticidad,
} from '@/data/observaciones-store'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

const CRITICIDAD_LABEL: Record<Criticidad, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const CRITICIDAD_BADGE: Record<Criticidad, string> = {
  critica: ESTADO_CRITICO,
  alta: ESTADO_WARNING,
  media: ESTADO_INFO,
  baja: ESTADO_NEUTRO,
}

const CRITICIDAD_ICONO: Record<Criticidad, typeof AlertTriangle> = {
  critica: AlertTriangle,
  alta: AlertTriangle,
  media: Gauge,
  baja: Gauge,
}

const ESTADO_LABEL: Record<EstadoObs, string> = {
  nueva: 'Nueva',
  asignada: 'Asignada',
  en_revision: 'En revisión',
  justificada: 'Justificada',
  resuelta: 'Resuelta',
}

const ESTADO_BADGE: Record<EstadoObs, string> = {
  nueva: ESTADO_NEUTRO,
  asignada: ESTADO_INFO,
  en_revision: ESTADO_WARNING,
  justificada: ESTADO_INFO,
  resuelta: ESTADO_OK,
}

function CeldaSortable({ header }: { header: Header<Observacion, unknown> }) {
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

export function ObservacionesTab({
  proyectoId: _proyectoId,
  proyectoCodigo,
}: {
  proyectoId: string
  proyectoCodigo: string
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })
  const [seleccionId, setSeleccionId] = useState<string | null>(null)
  const observaciones = useObservaciones()
  const [dialogNueva, setDialogNueva] = useState(false)

  const observacionesProyecto = useMemo(
    () => observaciones.filter((o) => o.proyecto === proyectoCodigo),
    [observaciones, proyectoCodigo],
  )

  const datosFiltrados = useMemo(() => {
    return observacionesProyecto.filter((o) => {
      if (filtroCriticidad !== 'todas' && o.criticidad !== filtroCriticidad) return false
      if (filtroEstado !== 'todos' && o.estado !== filtroEstado) return false
      return true
    })
  }, [observacionesProyecto, filtroCriticidad, filtroEstado])

  const columnas = useMemo<ColumnDef<Observacion>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-primary">
            {row.original.codigo}
          </span>
        ),
      },
      {
        accessorKey: 'partida',
        header: 'Partida',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-sm font-medium">
            {row.original.partida}
          </span>
        ),
      },
      {
        accessorKey: 'tipoInconsistencia',
        header: 'Tipo',
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-xs text-muted-foreground">
            {row.original.tipoInconsistencia}
          </span>
        ),
      },
      {
        accessorKey: 'regla',
        header: 'Regla',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.regla}</Badge>
        ),
      },
      {
        accessorKey: 'criticidad',
        header: 'Criticidad',
        cell: ({ row }) => {
          const Icono = CRITICIDAD_ICONO[row.original.criticidad]
          return (
            <Badge variant="outline" className={CRITICIDAD_BADGE[row.original.criticidad]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {CRITICIDAD_LABEL[row.original.criticidad]}
            </Badge>
          )
        },
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
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatFecha(row.original.fecha)}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Acciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{row.original.codigo}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSeleccionId(row.original.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  eliminarObservacion(row.original.id)
                  toast.success('Observación eliminada', {
                    description: `${row.original.codigo} fue eliminada.`,
                  })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      total: observacionesProyecto.length,
      criticas: observacionesProyecto.filter((o) => o.criticidad === 'critica').length,
      altas: observacionesProyecto.filter((o) => o.criticidad === 'alta').length,
      resueltas: observacionesProyecto.filter((o) => o.estado === 'resuelta').length,
    }),
    [observacionesProyecto],
  )

  const seleccionado = observaciones.find((o) => o.id === seleccionId) ?? null

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Total', valor: kpis.total, detalle: 'Observaciones del proyecto', icono: FileText, tono: 'default' },
    { titulo: 'Críticas', valor: kpis.criticas, detalle: 'Requieren atención', icono: AlertTriangle, tono: 'danger' },
    { titulo: 'Altas', valor: kpis.altas, detalle: 'Prioridad alta', icono: Gauge, tono: 'warning' },
    { titulo: 'Resueltas', valor: kpis.resueltas, detalle: 'Cerradas', icono: CheckCircle2, tono: 'success' },
  ]

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

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar partida o regla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar observaciones"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filtroCriticidad} onValueChange={setFiltroCriticidad}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Criticidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Toda criticidad</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="nueva">Nueva</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>
                <SelectItem value="en_revision">En revisión</SelectItem>
                <SelectItem value="justificada">Justificada</SelectItem>
                <SelectItem value="resuelta">Resuelta</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={dialogNueva} onOpenChange={setDialogNueva}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus />
                  Nueva observación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <NuevaObservacionForm
                  proyectoCodigo={proyectoCodigo}
                  onGuardar={(obs) => {
                    crearObservacion(obs)
                    setDialogNueva(false)
                    toast.success('Observación creada', {
                      description: `${obs.codigo} registrada correctamente.`,
                    })
                  }}
                  onCerrar={() => setDialogNueva(false)}
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
                    <TableCell colSpan={columnas.length} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <span>No se encontraron observaciones para este proyecto</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((fila) => (
                    <TableRow
                      key={fila.id}
                      className="cursor-pointer"
                      onClick={() => setSeleccionId(fila.original.id)}
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
        </div>

        <div className="grid gap-3 lg:hidden">
          {filas.length === 0 ? (
            <EmptyState
              icono={FileText}
              titulo="Sin observaciones"
              descripcion="No hay observaciones para este proyecto."
            />
          ) : (
            filas.map((fila) => {
              const o = fila.original
              const Icono = CRITICIDAD_ICONO[o.criticidad]
              return (
                <button
                  key={fila.id}
                  type="button"
                  onClick={() => setSeleccionId(o.id)}
                  className="rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-primary">{o.codigo}</p>
                      <p className="truncate text-sm font-medium">{o.partida}</p>
                    </div>
                    <Badge variant="outline" className={CRITICIDAD_BADGE[o.criticidad]}>
                      <Icono className="mr-1 h-3 w-3" />
                      {CRITICIDAD_LABEL[o.criticidad]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className={ESTADO_BADGE[o.estado]}>
                      {ESTADO_LABEL[o.estado]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{o.responsable}</span>
                  </div>
                </button>
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
            observaciones
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

      {seleccionado && (
        <DetalleObservacionAmplio
          key={seleccionId}
          open
          onOpenChange={(o) => !o && setSeleccionId(null)}
          o={seleccionado}
          onActualizar={(campos) => {
            if (seleccionId) actualizarObservacion(seleccionId, campos)
          }}
        />
      )}
    </div>
  )
}

function NuevaObservacionForm({
  proyectoCodigo,
  onGuardar,
  onCerrar,
}: {
  proyectoCodigo: string
  onGuardar: (obs: Observacion) => void
  onCerrar: () => void
}) {
  const [partida, setPartida] = useState('')
  const [tipoInconsistencia, setTipoInconsistencia] = useState(TIPOS_INCONSISTENCIA[0])
  const [regla, setRegla] = useState(REGLAS[0])
  const [criticidad, setCriticidad] = useState<Criticidad>('media')
  const [responsable, setResponsable] = useState(RESPONSABLES[0])

  const handleSubmit = () => {
    if (!partida.trim()) {
      toast.error('Ingrese la partida')
      return
    }
    const id = `o-${Date.now()}`
    const codigo = `OBS-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`
    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

    onGuardar({
      id,
      codigo,
      proyecto: proyectoCodigo,
      partida: partida.trim(),
      tipoInconsistencia,
      regla,
      criticidad,
      responsable,
      estado: 'nueva',
      fecha,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nueva observación</DialogTitle>
        <DialogDescription>
          Registre una nueva observación para el proyecto {proyectoCodigo}.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label htmlFor="obs-partida">Partida</Label>
          <Input
            id="obs-partida"
            placeholder="Nombre de la partida"
            value={partida}
            onChange={(e) => setPartida(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo de inconsistencia</Label>
          <Select value={tipoInconsistencia} onValueChange={setTipoInconsistencia}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_INCONSISTENCIA.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Regla de revisión</Label>
          <Select value={regla} onValueChange={setRegla}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGLAS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Criticidad</Label>
            <Select value={criticidad} onValueChange={(v) => setCriticidad(v as Criticidad)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CRITICIDAD_LABEL) as Criticidad[]).map((c) => (
                  <SelectItem key={c} value={c}>{CRITICIDAD_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Responsable</Label>
            <Select value={responsable} onValueChange={setResponsable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSABLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCerrar}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!partida.trim()}>Crear observación</Button>
      </DialogFooter>
    </>
  )
}
