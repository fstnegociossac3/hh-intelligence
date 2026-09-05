import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileBarChart,
  FileCheck2,
  FileText,
  GitBranch,
  MoreHorizontal,
  PieChart,
  Play,
  Printer,
  Scale,
  Search,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { EmptyState } from '@/components/empty-state'
import { usePermisos } from '@/utils/permisos'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { ReportePreview } from '@/components/reporte-preview'
import type { Proyecto } from '@/types'
import { useProyectos } from '@/data/proyectos-store'
import { useAnalisis, type RegistroAnalisis } from '@/data/analisis-store'
import { useObservaciones } from '@/data/observaciones-store'
import { agregarNotificacion } from '@/data/notificaciones-store'
import { obtenerEstadoDocumentos } from '@/data/documentos-store'
import {
  exportarReportePDF,
  imprimirReporteHTML,
  type DatosReportePDF,
} from '@/utils/export-import'
import { recomendacionesPara } from '@/utils/recomendaciones'
import {
  registrarEvento,
  USUARIO_ACTUAL,
} from '@/data/historial-store'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

type TipoReporte =
  | 'general'
  | 'inconsistencias'
  | 'observaciones'
  | 'coherencia'
  | 'trazabilidad'

type EstadoReporte = 'pendiente' | 'generado'

interface Reporte {
  id: string
  nombre: string
  proyecto: string
  tipo: TipoReporte
  fecha: string
  responsable: string
  estado: EstadoReporte
}

const PROYECTOS_KEY = 'hh-intelligence:reportes-generados'

const TIPO_LABEL: Record<TipoReporte, string> = {
  general: 'Reporte general del expediente',
  inconsistencias: 'Reporte de inconsistencias',
  observaciones: 'Reporte de observaciones',
  coherencia: 'Reporte de coherencia',
  trazabilidad: 'Reporte de trazabilidad',
}

const TIPO_ICONO: Record<TipoReporte, LucideIcon> = {
  general: FileBarChart,
  inconsistencias: Scale,
  observaciones: ClipboardList,
  coherencia: PieChart,
  trazabilidad: GitBranch,
}

const TIPO_BADGE: Record<TipoReporte, string> = {
  general: ESTADO_NEUTRO,
  inconsistencias: ESTADO_CRITICO,
  observaciones: ESTADO_WARNING,
  coherencia: ESTADO_OK,
  trazabilidad: ESTADO_INFO,
}

const ESTADO_LABEL: Record<EstadoReporte, string> = {
  pendiente: 'Pendiente',
  generado: 'Generado',
}

const ESTADO_BADGE: Record<EstadoReporte, string> = {
  pendiente: ESTADO_NEUTRO,
  generado: ESTADO_OK,
}

const TIPO_NOMBRE: Record<TipoReporte, (codigo: string) => string> = {
  general: (c) => `Informe ejecutivo del expediente ${c}`,
  inconsistencias: (c) => `Matriz de inconsistencias de ${c}`,
  observaciones: (c) => `Consolidado de observaciones de ${c}`,
  coherencia: (c) => `Reporte de coherencia documental de ${c}`,
  trazabilidad: (c) => `Trazabilidad de versiones de ${c}`,
}

function generarReportes(
  proyectos: Proyecto[],
  analisis: RegistroAnalisis[],
): Reporte[] {
  const porCodigo = new Map(analisis.map((a) => [a.codigo, a]))
  const lista: Reporte[] = []

  for (const p of proyectos) {
    const a = porCodigo.get(p.codigo)
    const tipos: TipoReporte[] = ['general', 'coherencia']
    if (a && a.observaciones > 0) tipos.push('observaciones')
    if (a && a.inconsistencias > 0) tipos.push('inconsistencias')
    if (a && (a.documentosConError > 0 || a.documentosAnalizados >= 8)) {
      tipos.push('trazabilidad')
    }

    for (const tipo of tipos) {
      const estado: EstadoReporte =
        a && a.resultado !== 'pendiente' ? 'generado' : 'pendiente'
      lista.push({
        id: `${p.id}-${tipo}`,
        nombre: TIPO_NOMBRE[tipo](p.codigo),
        proyecto: p.codigo,
        tipo,
        fecha: p.actualizadoEl,
        responsable: p.responsable,
        estado,
      })
    }
  }

  return lista
}

function leerGenerados(): Set<string> {
  try {
    const crudo = localStorage.getItem(PROYECTOS_KEY)
    if (!crudo) return new Set()
    const arr = JSON.parse(crudo) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function persistirGenerados(set: Set<string>) {
  try {
    localStorage.setItem(PROYECTOS_KEY, JSON.stringify([...set]))
  } catch {
    // almacenamiento no disponible
  }
}

function CeldaSortable({ header }: { header: Header<Reporte, unknown> }) {
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

export function ReportesPage() {
  const { puedeEditar } = usePermisos()
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })
  const [searchParams, setSearchParams] = useSearchParams()
  const [seleccionId, setSeleccionId] = useState<string | null>(() =>
    searchParams.get('reporte'),
  )
  const [generados, setGenerados] = useState<Set<string>>(() => leerGenerados())

  const proyectos = useProyectos()
  const analisis = useAnalisis()
  const observaciones = useObservaciones()

  const construirDatos = (r: Reporte): DatosReportePDF => {
    const p = proyectos.find((x) => x.codigo === r.proyecto) ?? null
    const a = analisis.find((x) => x.codigo === r.proyecto) ?? null
    const docs = p ? obtenerEstadoDocumentos(p.id).documentos : []
    const obs = observaciones.filter((o) => o.proyecto === r.proyecto)
    const puntaje = a && a.puntaje > 0 ? a.puntaje : 0
    return {
      reporte: {
        nombre: r.nombre,
        tipo: r.tipo,
        proyecto: r.proyecto,
        fecha: r.fecha,
        responsable: r.responsable,
        estado: r.estado,
      },
      proyecto: p,
      resumen: a
        ? {
            puntaje: a.puntaje,
            documentosAnalizados: a.documentosAnalizados,
            observaciones: a.observaciones,
            inconsistencias: a.inconsistencias,
            documentosConError: a.documentosConError,
          }
        : null,
      documentos: docs.map((d) => ({
        nombre: d.nombre,
        categoria: d.categoria,
        estado: d.estadoIa,
      })),
      coherencia: {
        indice: puntaje,
        verificaciones: docs.length * 6 + 12,
        coincidencias:
          docs.length > 0 ? Math.round(docs.length * (puntaje / 100)) : 0,
      },
      observaciones: obs.slice(0, 12).map((o) => ({
        codigo: o.codigo,
        partida: o.partida,
        tipo: o.tipoInconsistencia,
        criticidad: o.criticidad,
        estado: o.estado,
      })),
      resumenContenido: [
        `Se analizaron ${docs.length} documento(s) del expediente técnico ${r.proyecto}.`,
        a
          ? `El motor de análisis registró ${a.observaciones} observación(es) y ${a.inconsistencias} inconsistencia(s) de criticidad crítica.`
          : 'No se ha ejecutado aún el análisis inteligente del expediente.',
        `El índice de coherencia documental es de ${puntaje > 0 ? `${puntaje}%` : '—'}.`,
      ],
      recomendaciones: recomendacionesPara(r.tipo),
      nombreArchivo: r.nombre,
    }
  }

  const opcionesProyecto = useMemo(
    () => proyectos.map((p) => p.codigo),
    [proyectos],
  )

  const reportes = useMemo(() => {
    const base = generarReportes(proyectos, analisis)
    if (generados.size === 0) return base
    return base.map(
      (r): Reporte =>
        generados.has(r.id) ? { ...r, estado: 'generado' } : r,
    )
  }, [proyectos, analisis, generados])

  const datosFiltrados = useMemo(() => {
    const hoy = new Date()
    const inicioSemana = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    return reportes.filter((r) => {
      if (filtroProyecto !== 'todos' && r.proyecto !== filtroProyecto) return false
      if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false
      if (filtroFecha !== 'todas') {
        const fecha = new Date(r.fecha.slice(0, 10))
        if (filtroFecha === 'hoy' && fecha.toDateString() !== hoy.toDateString()) return false
        if (filtroFecha === 'semana' && fecha < inicioSemana) return false
        if (filtroFecha === 'mes' && fecha.getTime() < hoy.getTime() - 30 * 24 * 60 * 60 * 1000) return false
      }
      return true
    })
  }, [filtroProyecto, filtroTipo, filtroFecha, reportes])

  const nombreProyecto = (codigo: string) =>
    proyectos.find((p) => p.codigo === codigo)?.nombre ?? codigo

  const columnas = useMemo<ColumnDef<Reporte>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-sm font-medium">
            {row.original.nombre}
          </span>
        ),
      },
      {
        accessorKey: 'proyecto',
        header: 'Proyecto',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.proyecto}</span>
        ),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => {
          const Icono = TIPO_ICONO[row.original.tipo]
          return (
            <Badge variant="outline" className={TIPO_BADGE[row.original.tipo]}>
              <Icono className="mr-1 h-3.5 w-3.5" />
              {TIPO_LABEL[row.original.tipo]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatFecha(row.original.fecha.slice(0, 10))}
          </span>
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
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant="outline" className={ESTADO_BADGE[row.original.estado]}>
            {ESTADO_LABEL[row.original.estado]}
          </Badge>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => {
          const r = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Acciones">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{r.nombre}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => verReporte(r)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver
                </DropdownMenuItem>
                {puedeEditar && (
                  <DropdownMenuItem onClick={() => generarReporte(r.id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Generar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => descargarReporte(r)}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => imprimirReporte(r)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [puedeEditar],
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
      total: reportes.length,
      generados: reportes.filter((r) => r.estado === 'generado').length,
      pendientes: reportes.filter((r) => r.estado === 'pendiente').length,
      tipos: new Set(reportes.map((r) => r.tipo)).size,
    }),
    [reportes],
  )

  const pctGenerado = Math.round((kpis.generados / Math.max(kpis.total, 1)) * 100)

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Total de reportes', valor: kpis.total, detalle: 'En el sistema', icono: FileText, tono: 'default' },
    { titulo: 'Generados', valor: kpis.generados, detalle: `${pctGenerado}% del total`, icono: FileCheck2, tono: 'success' },
    { titulo: 'Pendientes', valor: kpis.pendientes, detalle: 'Por generar', icono: CalendarClock, tono: 'warning' },
    { titulo: 'Tipos disponibles', valor: kpis.tipos, detalle: 'Token de reporte', icono: BarChart3, tono: 'info' },
  ]

  useEffect(() => {
    const r = searchParams.get('reporte')
    if (r) setSeleccionId(r)
  }, [searchParams])

  const resultado = reportes.find((r) => r.id === seleccionId) ?? null

  const verReporte = (r: Reporte) => {
    setSeleccionId(r.id)
  }

  const generarReporte = (id: string) => {
    setGenerados((prev) => {
      const siguiente = new Set(prev)
      siguiente.add(id)
      persistirGenerados(siguiente)
      return siguiente
    })
    const reporte = reportes.find((r) => r.id === id)
    if (!reporte) return
    try {
      exportarReportePDF(construirDatos(reporte))
    } catch {
      toast.error('No se pudo generar el archivo PDF', {
        description: 'El reporte fue registrado correctamente.',
      })
    }
    registrarEvento({
      proyectoCodigo: reporte.proyecto,
      accion: 'reporte_generado',
      usuario: USUARIO_ACTUAL,
      descripcion: `${reporte.nombre} generado`,
    })
    agregarNotificacion({
      tipo: 'reporte',
      titulo: 'Reporte generado',
      descripcion: `${reporte.nombre} del expediente ${reporte.proyecto} fue generado y descargado.`,
      ruta: `/reportes?reporte=${reporte.id}`,
    })
    toast.success('Reporte generado', {
      description: 'El reporte se generó correctamente y se descargó el PDF.',
    })
  }

  const descargarReporte = (r: Reporte) => {
    exportarReportePDF(construirDatos(r))
    toast.success('Reporte exportado', {
      description: `Se descargó "${r.nombre}.pdf".`,
    })
  }

  const imprimirReporte = (r: Reporte) => {
    imprimirReporteHTML(construirDatos(r))
  }

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

      <FadeIn className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          Listado de reportes
        </h2>
      </FadeIn>

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar nombre o responsable..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar reportes"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-2">
            <Select value={filtroProyecto} onValueChange={setFiltroProyecto}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los proyectos</SelectItem>
                {opcionesProyecto.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {(
                  Object.keys(TIPO_LABEL) as TipoReporte[]
                ).map((t) => (
                  <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroFecha} onValueChange={setFiltroFecha}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fechas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Última semana</SelectItem>
                <SelectItem value="mes">Último mes</SelectItem>
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
                    <TableCell colSpan={columnas.length} className="h-48 p-0">
                      <EmptyState
                        titulo="Sin reportes"
                        descripcion="No hay reportes que coincidan con los filtros aplicados."
                        icono={FileText}
                      />
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

          <div className="grid gap-3 p-4 lg:hidden">
            {filas.length === 0 ? (
              <EmptyState
                titulo="Sin reportes"
                descripcion="No hay reportes que coincidan con los filtros aplicados."
                icono={FileText}
              />
            ) : (
              filas.map((fila) => {
                const r = fila.original
                const Icono = TIPO_ICONO[r.tipo]
                return (
                  <div key={fila.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.nombre}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {r.proyecto}
                        </p>
                      </div>
                      <Badge variant="outline" className={ESTADO_BADGE[r.estado]}>
                        {ESTADO_LABEL[r.estado]}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={TIPO_BADGE[r.tipo]}>
                        <Icono className="mr-1 h-3.5 w-3.5" />
                        {TIPO_LABEL[r.tipo]}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{nombreProyecto(r.proyecto)}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {r.responsable} · {formatFecha(r.fecha.slice(0, 10))}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label="Ver" onClick={() => verReporte(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {puedeEditar && (
                          <Button variant="ghost" size="icon" aria-label="Generar" onClick={() => generarReporte(r.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label="Descargar" onClick={() => descargarReporte(r)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Imprimir" onClick={() => imprimirReporte(r)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
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
            reportes
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
            <Button variant="outline" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Página anterior">
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center text-sm">
              {paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}
            </span>
            <Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Página siguiente">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </FadeIn>

      {resultado && (
        <ReportePreview
          key={seleccionId ?? 'cerrado'}
          open={!!resultado}
          onOpenChange={(o) => {
            if (!o) {
              setSeleccionId(null)
              if (searchParams.get('reporte')) {
                setSearchParams({}, { replace: true })
              }
            }
          }}
          reporte={resultado}
        />
      )}
    </div>
  )
}