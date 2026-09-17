import { useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FilePlus2,
  FolderKanban,
  GitCompare,
  HandCoins,
  Layers3,
  PanelLeft,
  PanelRight,
  Ruler,
  Search,
  Table2,
  TriangleAlert,
  EyeOff,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import { ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { useProyectos } from '@/data/proyectos-store'
import { useObservaciones } from '@/data/observaciones-store'
import { obtenerEstadoDocumentos } from '@/data/documentos-store'
import { useFilasPorPagina, combinarFilasPorPagina, usePaginacionConfig } from '@/data/configuracion-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import { EmptyState } from '@/components/empty-state'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'

type EstadoCampo = 'coincide' | 'diferencia' | 'faltante'
type Criticidad = 'baja' | 'media' | 'alta' | 'critica'
type IdDoc = 'presupuesto' | 'metrado' | 'plano' | 'especificacion' | 'cronograma'
type IdTipo =
  | 'presupuesto_metrado'
  | 'metrado_plano'
  | 'partida_especificacion'
  | 'partida_cronograma'

interface DocumentoTipo {
  id: IdDoc
  nombre: string
  icono: LucideIcon
}

interface CampoComparado {
  id: string
  campo: string
  valorA: string
  valorB: string
  diferencia: string
  estado: EstadoCampo
  criticidad: Criticidad
}

interface FilaComparada {
  codigo: string
  partida: string
  especialidad: string
  campos: CampoComparado[]
}

interface ConfigTipo {
  id: IdTipo
  nombre: string
  docA: IdDoc
  docB: IdDoc
  filas: FilaComparada[]
}

const DOCUMENTOS: DocumentoTipo[] = [
  { id: 'presupuesto', nombre: 'Presupuesto General', icono: HandCoins },
  { id: 'metrado', nombre: 'Planilla de Metrados', icono: Ruler },
  { id: 'plano', nombre: 'Planos del Proyecto', icono: Layers3 },
  { id: 'especificacion', nombre: 'Especificaciones Técnicas', icono: FilePlus2 },
  { id: 'cronograma', nombre: 'Cronograma de Ejecución', icono: Table2 },
]

const FILAS_POR_PAGINA = [6, 10, 15, 20]

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

const ESTADO_CLASE_CAMPO: Record<EstadoCampo, string> = {
  coincide: 'border-success/40 bg-success/5',
  diferencia: 'border-warning/50 bg-warning/10',
  faltante: 'border-slate-500/40 bg-muted/40',
}

const ESTADO_ICONO: Record<EstadoCampo, LucideIcon> = {
  coincide: CheckCircle2,
  diferencia: TriangleAlert,
  faltante: EyeOff,
}

const CATEGORIA_AL_ID: Record<string, IdDoc> = {
  Presupuesto: 'presupuesto',
  Metrados: 'metrado',
  Planos: 'plano',
  'Especificaciones técnicas': 'especificacion',
  Cronograma: 'cronograma',
}

const REGLA_AL_TIPO: Record<string, IdTipo> = {
  'Presupuesto vs. Metrado': 'presupuesto_metrado',
  'Metrado vs. Plano': 'metrado_plano',
  'Partida vs. Especificación': 'partida_especificacion',
  'Partida vs. Cronograma': 'partida_cronograma',
}

const CONFIG_POR_TIPO: Record<IdTipo, { nombre: string; docA: IdDoc; docB: IdDoc }> = {
  presupuesto_metrado: { nombre: 'Presupuesto vs. Metrado', docA: 'presupuesto', docB: 'metrado' },
  metrado_plano: { nombre: 'Metrado vs. Plano', docA: 'metrado', docB: 'plano' },
  partida_especificacion: { nombre: 'Partida vs. Especificación', docA: 'presupuesto', docB: 'especificacion' },
  partida_cronograma: { nombre: 'Partida vs. Cronograma', docA: 'presupuesto', docB: 'cronograma' },
}

interface PlantillaCampo {
  campo: string
  valorA: string
  valorB: string
  diferencia: string
  estado: EstadoCampo
}

const CAMPO_POR_INCONSISTENCIA: Record<string, string> = {
  'Diferencia de cantidad': 'Cantidad',
  'Coincidencia parcial con plano': 'Geometría',
  'Información faltante': 'Información',
  'Unidad inconsistente': 'Unidad',
  'Especificación parcial': 'Especificación',
  'Diferencia de unidad': 'Unidad',
  'Cantidad sin respaldo': 'Cantidad',
  'Actividad no programada': 'Programación',
}

const TIPO_FALTANTE = new Set([
  'Información faltante',
  'Cantidad sin respaldo',
  'Actividad no programada',
])

function campoParaObservacion(
  o: { id: string; partida: string; tipoInconsistencia: string },
): PlantillaCampo {
  let semilla = 0
  for (let i = 0; i < o.id.length; i++) {
    semilla = (semilla * 31 + o.id.charCodeAt(i)) >>> 0
  }
  for (let i = 0; i < o.partida.length; i++) {
    semilla = (semilla * 31 + o.partida.charCodeAt(i)) >>> 0
  }

  const cantidad = 120 + (semilla % 4400)
  const delta = 8 + (semilla % Math.max(1, Math.round(cantidad * 0.18)))
  const esFaltante = TIPO_FALTANTE.has(o.tipoInconsistencia)
  const esUnidad = o.tipoInconsistencia === 'Diferencia de unidad'
  const valorB = esFaltante
    ? '—'
    : esUnidad
      ? 'M2'
      : `${(cantidad - delta).toFixed(2)}`
  const diferencia = esFaltante
    ? 'Sin dato en fuente B'
    : esUnidad
      ? 'Unidades no coincidentes'
      : `-${delta.toFixed(2)} (${((delta / cantidad) * 100).toFixed(1)}%)`

  return {
    campo: CAMPO_POR_INCONSISTENCIA[o.tipoInconsistencia] ?? 'Detalle',
    valorA: esUnidad ? 'M3' : `${cantidad.toFixed(2)}`,
    valorB,
    diferencia,
    estado: esFaltante
      ? 'faltante'
      : esUnidad
        ? 'diferencia'
        : 'diferencia',
  }
}

interface PanelDocProps {
  doc: DocumentoTipo
  fila: FilaComparada
  lado: 'a' | 'b'
}

function PanelDoc({ doc, fila, lado }: PanelDocProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <doc.icono className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{doc.nombre}</CardTitle>
        </div>
        <Badge variant="secondary">{fila.codigo}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {fila.campos.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <span className="text-muted-foreground">{c.campo}</span>
            <span className="text-right font-medium tabular-nums">
              {lado === 'a' ? (c.valorA === '—' ? '—' : c.valorA) : c.valorB === '—' ? '—' : c.valorB}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ComparadorPage() {
  const proyectos = useProyectos()
  const observaciones = useObservaciones()
  const [proyectoId, setProyectoId] = useState(proyectos[0]?.id ?? '')
  const [idDocA, setIdDocA] = useState<IdDoc>('presupuesto')
  const [idDocB, setIdDocB] = useState<IdDoc>('metrado')
  const [busqueda, setBusqueda] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const filasConfig = useFilasPorPagina()
  const [paginacion, setPaginacion] = usePaginacionConfig()
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [diffIndex, setDiffIndex] = useState(0)
  const filaRef = useRef<HTMLDivElement | null>(null)

  const proyecto = proyectos.find((p) => p.id === proyectoId) ?? proyectos[0]

  const documentosDisponibles = useMemo(() => {
    if (!proyecto) return []
    const estadoDocs = obtenerEstadoDocumentos(proyecto.id)
    const presentes = new Set<IdDoc>()
    for (const d of estadoDocs.documentos) {
      const id = CATEGORIA_AL_ID[d.categoria]
      if (id) presentes.add(id)
    }
    return DOCUMENTOS.filter((d) => presentes.has(d.id))
  }, [proyecto])

  const configs = useMemo<ConfigTipo[]>(() => {
    if (!proyecto) return []
    const deProyecto = observaciones.filter(
      (o) => o.proyecto === proyecto.codigo && o.regla in REGLA_AL_TIPO,
    )
    return (Object.keys(CONFIG_POR_TIPO) as IdTipo[]).map((tipo) => {
      const info = CONFIG_POR_TIPO[tipo]
      const filas: FilaComparada[] = deProyecto
        .filter((o) => REGLA_AL_TIPO[o.regla] === tipo)
        .map((o) => {
          const valores = campoParaObservacion(o)
          const campo: CampoComparado = {
            id: o.id,
            campo: valores.campo,
            valorA: valores.valorA,
            valorB: valores.valorB,
            diferencia: valores.diferencia,
            estado: valores.estado,
            criticidad: o.criticidad,
          }
          return {
            codigo: o.codigo,
            partida: o.partida,
            especialidad: '',
            campos: [campo],
          }
        })
      return { id: tipo, nombre: info.nombre, docA: info.docA, docB: info.docB, filas }
    })
  }, [proyecto, observaciones])

  const config = useMemo(() => {
    return configs.find(
      (c) =>
        (c.docA === idDocA && c.docB === idDocB) ||
        (c.docA === idDocB && c.docB === idDocA),
    ) ?? null
  }, [configs, idDocA, idDocB])

  useEffect(() => {
    const ids = documentosDisponibles.map((d) => d.id)
    if (!ids.includes(idDocA)) setIdDocA(ids[0] ?? 'presupuesto')
    if (!ids.includes(idDocB)) setIdDocB(ids[1] ?? ids[0] ?? 'metrado')
  }, [documentosDisponibles, idDocA, idDocB])

  useEffect(() => {
    setDiffIndex(0)
    setBusqueda('')
    setPaginacion((prev) => ({ ...prev, pageIndex: 0 }))
  }, [proyectoId, idDocA, idDocB, filtroCriticidad])

  const invertido = config ? config.docA === idDocB : false

  const docA = DOCUMENTOS.find((d) => d.id === idDocA) ?? DOCUMENTOS[0]
  const docB = DOCUMENTOS.find((d) => d.id === idDocB) ?? DOCUMENTOS[1]

  const filasFiltradas = useMemo(() => {
    if (!config) return []
    return config.filas.filter((f) =>
      f.partida.toLowerCase().includes(busqueda.toLowerCase()),
    )
  }, [config, busqueda])

  const diferencias = useMemo(() => {
    if (!config) return []
    return filasFiltradas
      .flatMap((f) =>
        f.campos
          .filter((c) => c.estado !== 'coincide')
          .map((c) => ({ ...c, codigo: f.codigo, partida: f.partida })),
      )
      .filter((d) => filtroCriticidad === 'todas' || d.criticidad === filtroCriticidad)
  }, [config, filasFiltradas, filtroCriticidad])

  const diffActual = diferencias[diffIndex] ?? null

  const filaSeleccionada = useMemo(() => {
    if (!diffActual) return filasFiltradas[0]
    return filasFiltradas.find((f) => f.campos.some((c) => c.id === diffActual.id)) ?? filasFiltradas[0]
  }, [filasFiltradas, diffActual])

  const columnas = useMemo<ColumnDef<(typeof diferencias)[number]>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: 'Código',
        sortingFn: 'alphanumeric',
      },
      {
        accessorKey: 'partida',
        header: 'Partida',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => <span className="whitespace-nowrap">{getValue<string>()}</span>,
      },
      {
        accessorKey: 'campo',
        header: 'Campo',
        sortingFn: 'alphanumeric',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2">
            <span className="text-muted-foreground capitalize">{row.original.campo}</span>
          </span>
        ),
      },
      {
        accessorKey: 'valorA',
        header: 'Valor A',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const v = getValue<string>()
          return v === '—' ? <span className="italic text-muted-foreground">—</span> : v
        },
      },
      {
        accessorKey: 'valorB',
        header: 'Valor B',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const v = getValue<string>()
          return v === '—' ? <span className="italic text-muted-foreground">—</span> : v
        },
      },
      {
        accessorKey: 'diferencia',
        header: 'Diferencia',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const v = getValue<string>()
          return v === '—' ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="text-warning">{v}</span>
          )
        },
      },
      {
        accessorKey: 'criticidad',
        header: 'Criticidad',
        sortingFn: 'alphanumeric',
        cell: ({ getValue }) => {
          const c = getValue<Criticidad>()
          return (
            <Badge variant="outline" className={CRITICIDAD_BADGE[c]}>
              {CRITICIDAD_LABEL[c]}
            </Badge>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: diferencias,
    columns: columnas,
    state: { sorting, pagination: paginacion },
    onSortingChange: setSorting,
    onPaginationChange: setPaginacion,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const totalPaginas = table.getPageCount()
  const primera = paginacion.pageIndex * paginacion.pageSize + 1
  const ultima = Math.min(
    (paginacion.pageIndex + 1) * paginacion.pageSize,
    table.getFilteredRowModel().rows.length,
  )

  function irADiferencia(idx: number) {
    const n = diferencias.length
    if (n === 0) return
    const next = ((idx % n) + n) % n
    setDiffIndex(next)
    setPaginacion((prev) => ({
      ...prev,
      pageIndex: Math.floor(next / prev.pageSize),
    }))
    filaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const mostrarPanel = Boolean(config) && filasFiltradas.length > 0

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
            <FolderKanban className="h-4 w-4 text-primary" />
            Proyecto
          </label>
          <Select value={proyecto?.id ?? ''} onValueChange={(v) => setProyectoId(v)}>
            <SelectTrigger aria-label="Proyecto">
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {proyectos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codigo} · {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <PanelLeft className="h-4 w-4 text-primary" />
              Documento A
            </label>
            <Select value={idDocA} onValueChange={(v) => setIdDocA(v as IdDoc)}>
              <SelectTrigger aria-label="Documento A">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentosDisponibles.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <PanelRight className="h-4 w-4 text-primary" />
              Documento B
            </label>
            <Select value={idDocB} onValueChange={(v) => setIdDocB(v as IdDoc)}>
              <SelectTrigger aria-label="Documento B">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentosDisponibles.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeIn>

      {!proyecto ? (
        <EmptyState
          icono={FolderKanban}
          titulo="Sin proyectos"
          descripcion="No hay proyectos registrados para comparar. Crea un proyecto primero."
        />
      ) : !config ? (
        <EmptyState
          icono={GitCompare}
          titulo="Combinación no soportada"
          descripcion="Documento A y Documento B no forman una comparación válida. Selecciona una de las combinaciones compatibles como Presupuesto vs. Metrado, Metrado vs. Plano, Partida vs. Especificación o Partida vs. Cronograma."
        />
      ) : (
        <FadeIn>
          <Card>
            <CardContent className="flex flex-wrap items-end justify-between gap-3 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <GitCompare className="h-4 w-4 text-primary" />
                  {config.nombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {docA.nombre} frente a {docB.nombre}
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar partida..."
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {mostrarPanel && filaSeleccionada && (
        <div ref={filaRef}>
          <Stagger className="space-y-4 lg:hidden">
            <StaggerItem>
              <Tabs defaultValue="a">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="a">Documento A</TabsTrigger>
                  <TabsTrigger value="b">Documento B</TabsTrigger>
                </TabsList>
<TabsContent value="a">
  <PanelDoc doc={invertido ? docB : docA} fila={filaSeleccionada} lado="a" />
</TabsContent>
<TabsContent value="b">
  <PanelDoc doc={invertido ? docA : docB} fila={filaSeleccionada} lado="b" />
</TabsContent>
              </Tabs>
            </StaggerItem>
          </Stagger>

          <Stagger className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Documento A · {invertido ? docB.nombre : docA.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {filaSeleccionada.campos.map((c) => {
                    const Icono = ESTADO_ICONO[c.estado]
                    const esDiff = diffActual && diffActual.id === c.id && diffActual.partida === filaSeleccionada.partida
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
                          ESTADO_CLASE_CAMPO[c.estado],
                          esDiff && 'ring-2 ring-primary',
                        )}
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icono className="h-4 w-4" />
                          {c.campo}
                        </span>
                        <span className="text-right font-medium">
                          {c.valorA === '—' ? <span className="italic text-muted-foreground">—</span> : c.valorA}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Documento B · {invertido ? docA.nombre : docB.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {filaSeleccionada.campos.map((c) => {
                    const Icono = ESTADO_ICONO[c.estado]
                    const esDiff = diffActual && diffActual.id === c.id && diffActual.partida === filaSeleccionada.partida
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg border px-3 py-2',
                          ESTADO_CLASE_CAMPO[c.estado],
                          esDiff && 'ring-2 ring-primary',
                        )}
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Icono className="h-4 w-4" />
                          {c.campo}
                        </span>
                        <span className="text-right font-medium">
                          {c.valorB === '—' ? <span className="italic text-muted-foreground">—</span> : c.valorB}
                        </span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </StaggerItem>
          </Stagger>
        </div>
      )}

      <FadeIn>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Diferencias detectadas</CardTitle>
              <Badge variant="secondary">{diferencias.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filtroCriticidad} onValueChange={setFiltroCriticidad}>
                <SelectTrigger className="w-40" aria-label="Filtrar por criticidad">
                  <SelectValue placeholder="Criticidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                disabled={diferencias.length === 0}
                onClick={() => irADiferencia(diffIndex - 1)}
                aria-label="Diferencia anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={diferencias.length === 0}
                onClick={() => irADiferencia(diffIndex + 1)}
                aria-label="Diferencia siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {diferencias.length === 0 ? (
              <EmptyState
                icono={CheckCircle2}
                titulo="Sin diferencias"
                descripcion="No se detectaron diferencias para el filtro y criterio seleccionado."
              />
            ) : (
              <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((header) => {
                          const canSort = header.column.getCanSort()
                          return (
                            <TableHead
                              key={header.id}
                              className={cn(canSort && 'cursor-pointer select-none')}
                              onClick={
                                canSort
                                  ? () =>
                                      header.column.toggleSorting(
                                        header.column.getIsSorted() === 'asc',
                                      )
                                  : undefined
                              }
                            >
                              <span className="inline-flex items-center gap-1">
                                {header.column.columnDef.header as string}
                                {canSort && <ArrowUpDown className="h-3.5 w-3.5" />}
                              </span>
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                          'cursor-pointer',
                          diffActual && diffActual.id === row.original?.id && 'bg-primary/5',
                        )}
                        onClick={() => {
                          if (!row.original) return
                          const idx = diferencias.findIndex(
                            (d) => d.id === row.original.id,
                          )
                          if (idx >= 0) {
                            setDiffIndex(idx)
                            setPaginacion((prev) => ({
                              ...prev,
                              pageIndex: Math.floor(idx / prev.pageSize),
                            }))
                            filaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium">
                    {diferencias.length === 0 ? 0 : primera}–{ultima}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">
                    {table.getFilteredRowModel().rows.length}
                  </span>{' '}
                  diferencias
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
                      {combinarFilasPorPagina(FILAS_POR_PAGINA, filasConfig).map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} / pág.</SelectItem>
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
                    <ChevronLeft className="h-4 w-4" />
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
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}