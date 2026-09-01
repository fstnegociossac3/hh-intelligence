import { useMemo, useRef, useState } from 'react'
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

const CONFIGS: ConfigTipo[] = [
  {
    id: 'presupuesto_metrado',
    nombre: 'Presupuesto vs. Metrado',
    docA: 'presupuesto',
    docB: 'metrado',
    filas: [
      {
        codigo: '01.01',
        partida: 'Excavación para cimentaciones',
        especialidad: 'Estructuras',
        campos: [
          { id: 'cant', campo: 'Cantidad', valorA: '420.00', valorB: '380.00', diferencia: '-40.00 (9.5%)', estado: 'diferencia', criticidad: 'alta' },
          { id: 'unid', campo: 'Unidad', valorA: 'M3', valorB: 'M3', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'desc', campo: 'Descripción', valorA: 'Excavación en suelo natural', valorB: 'Excavación en suelo natural', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
        ],
      },
      {
        codigo: '01.02',
        partida: 'Falso piso de concreto',
        especialidad: 'Estructuras',
        campos: [
          { id: 'cant', campo: 'Cantidad', valorA: '1,800.00', valorB: '1,650.00', diferencia: '-150.00 (8.3%)', estado: 'diferencia', criticidad: 'media' },
          { id: 'unid', campo: 'Unidad', valorA: 'M2', valorB: 'M2', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'desc', campo: 'Descripción', valorA: 'e=0.10 m', valorB: '—', diferencia: 'Falta especificación de espesor', estado: 'faltante', criticidad: 'media' },
        ],
      },
      {
        codigo: '01.03',
        partida: 'Acero de refuerzo f\'y=4200 kg/cm2',
        especialidad: 'Estructuras',
        campos: [
          { id: 'cant', campo: 'Cantidad', valorA: '12,500.00', valorB: '12,500.00', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'unid', campo: 'Unidad', valorA: 'KG', valorB: 'KG', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'desc', campo: 'Descripción', valorA: 'Grado 60', valorB: 'Grado 60', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
        ],
      },
      {
        codigo: '01.04',
        partida: 'Encofrado y desencofrado',
        especialidad: 'Estructuras',
        campos: [
          { id: 'cant', campo: 'Cantidad', valorA: '2,400.00', valorB: '—', diferencia: 'Falta cantidad en metrado', estado: 'faltante', criticidad: 'critica' },
          { id: 'unid', campo: 'Unidad', valorA: 'M2', valorB: '—', diferencia: 'Sin unidad', estado: 'faltante', criticidad: 'media' },
        ],
      },
    ],
  },
  {
    id: 'metrado_plano',
    nombre: 'Metrado vs. Plano',
    docA: 'metrado',
    docB: 'plano',
    filas: [
      {
        codigo: '02.01',
        partida: 'Zapatas Z-1',
        especialidad: 'Estructuras',
        campos: [
          { id: 'area', campo: 'Área (M2)', valorA: '6.00', valorB: '6.00', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'peso', campo: 'Peso acero (KG)', valorA: '180.00', valorB: '180.00', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'desc', campo: 'Descripción', valorA: 'Z-1 2.00x3.00', valorB: 'Z-1 2.00x3.00', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
        ],
      },
      {
        codigo: '02.02',
        partida: 'Columnas C-1 piso 1',
        especialidad: 'Estructuras',
        campos: [
          { id: 'area', campo: 'Área (M2)', valorA: '1.20', valorB: '1.20', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'peso', campo: 'Peso acero (KG)', valorA: '320.00', valorB: '280.00', diferencia: '-40.00 (12.5%)', estado: 'diferencia', criticidad: 'alta' },
          { id: 'desc', campo: 'Descripción', valorA: 'C-1 0.30x0.40', valorB: 'C-1 0.30x0.40', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
        ],
      },
      {
        codigo: '02.03',
        partida: 'Vigas V-1 nivel 2',
        especialidad: 'Estructuras',
        campos: [
          { id: 'area', campo: 'Área (M2)', valorA: '4.20', valorB: '4.20', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'peso', campo: 'Peso acero (KG)', valorA: '540.00', valorB: '—', diferencia: 'Falta detalle en plano', estado: 'faltante', criticidad: 'media' },
        ],
      },
      {
        codigo: '02.04',
        partida: 'Losas aligeradas',
        especialidad: 'Estructuras',
        campos: [
          { id: 'area', campo: 'Área (M2)', valorA: '—', valorB: '520.00', diferencia: 'Falta metrado', estado: 'faltante', criticidad: 'critica' },
        ],
      },
    ],
  },
  {
    id: 'partida_especificacion',
    nombre: 'Partida vs. Especificación',
    docA: 'presupuesto',
    docB: 'especificacion',
    filas: [
      {
        codigo: '03.01',
        partida: 'Concreto f\'c=210 kg/cm2',
        especialidad: 'Estructuras',
        campos: [
          { id: 'desc', campo: 'Descripción', valorA: 'Concreto estructural', valorB: 'Concreto estructural', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'norma', campo: 'Norma', valorA: 'E.060', valorB: 'E.060', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'material', campo: 'Material', valorA: '—', valorB: 'Cemento Tipo I', diferencia: 'Falta material en partida', estado: 'faltante', criticidad: 'media' },
        ],
      },
      {
        codigo: '03.02',
        partida: 'Acero estructural A-36',
        especialidad: 'Estructuras',
        campos: [
          { id: 'desc', campo: 'Descripción', valorA: 'Acero grado 60', valorB: 'GA60 / ASTM', diferencia: 'Alcance parcial de la especificación', estado: 'diferencia', criticidad: 'alta' },
          { id: 'norma', campo: 'Norma', valorA: 'E.060 / ASTM', valorB: 'ASTM A615', diferencia: 'Norma incompleta', estado: 'diferencia', criticidad: 'media' },
        ],
      },
      {
        codigo: '03.03',
        partida: 'Tabiquería de ladrillo',
        especialidad: 'Arquitectura',
        campos: [
          { id: 'desc', campo: 'Descripción', valorA: 'Muro de 0.15', valorB: 'Muro de 0.15', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'material', campo: 'Material', valorA: 'Ladrillo KK 18', valorB: 'Ladrillo KK 18', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
        ],
      },
    ],
  },
  {
    id: 'partida_cronograma',
    nombre: 'Partida vs. Cronograma',
    docA: 'presupuesto',
    docB: 'cronograma',
    filas: [
      {
        codigo: '04.01',
        partida: 'Excavación para cimentaciones',
        especialidad: 'Estructuras',
        campos: [
          { id: 'inicio', campo: 'Fecha inicio', valorA: '2026-03-15', valorB: '2026-03-15', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'fin', campo: 'Fecha fin', valorA: '2026-04-20', valorB: '2026-04-20', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'duracion', campo: 'Duración (días)', valorA: '36', valorB: '36', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
        ],
      },
      {
        codigo: '04.02',
        partida: 'Concreto f\'c=210 kg/cm2',
        especialidad: 'Estructuras',
        campos: [
          { id: 'inicio', campo: 'Fecha inicio', valorA: '2026-05-01', valorB: '2026-05-01', diferencia: '—', estado: 'coincide', criticidad: 'baja' },
          { id: 'fin', campo: 'Fecha fin', valorA: '2026-07-30', valorB: '2026-08-10', diferencia: '+11 días de desfase', estado: 'diferencia', criticidad: 'alta' },
          { id: 'duracion', campo: 'Duración (días)', valorA: '90', valorB: '101', diferencia: '+11 días', estado: 'diferencia', criticidad: 'media' },
        ],
      },
      {
        codigo: '04.03',
        partida: 'Acero de refuerzo',
        especialidad: 'Estructuras',
        campos: [
          { id: 'inicio', campo: 'Fecha inicio', valorA: '2026-04-01', valorB: '—', diferencia: 'Actividad no programada', estado: 'faltante', criticidad: 'critica' },
        ],
      },
    ],
  },
]

interface PanelDocProps {
  doc: DocumentoTipo
  fila: FilaComparada
}

function PanelDoc({ doc, fila }: PanelDocProps) {
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
              {c.valorA === '—' ? '—' : c.valorA}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ComparadorPage() {
  const [idDocA, setIdDocA] = useState<IdDoc>('presupuesto')
  const [idDocB, setIdDocB] = useState<IdDoc>('metrado')
  const [busqueda, setBusqueda] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [filtroCriticidad, setFiltroCriticidad] = useState('todas')
  const [diffIndex, setDiffIndex] = useState(0)
  const filaRef = useRef<HTMLDivElement | null>(null)

  const config = useMemo(() => {
    return CONFIGS.find(
      (c) =>
        (c.docA === idDocA && c.docB === idDocB) ||
        (c.docA === idDocB && c.docB === idDocA),
    ) ?? null
  }, [idDocA, idDocB])

  const invertido = config ? config.docA === idDocB : false

  const docA = DOCUMENTOS.find((d) => d.id === idDocA)!
  const docB = DOCUMENTOS.find((d) => d.id === idDocB)!

  const filasFiltradas = useMemo(() => {
    if (!config) return []
    return config.filas.filter((f) =>
      f.partida.toLowerCase().includes(busqueda.toLowerCase()),
    )
  }, [config, busqueda])

  const filaSeleccionada = filasFiltradas[0]

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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  })

  function irADiferencia(idx: number) {
    const n = diferencias.length
    if (n === 0) return
    const next = ((idx % n) + n) % n
    setDiffIndex(next)
    filaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const mostrarPanel = Boolean(config) && filasFiltradas.length > 0

  return (
    <div className="space-y-6">
      <FadeIn>
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
                {DOCUMENTOS.map((d) => (
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
                {DOCUMENTOS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FadeIn>

      {!config ? (
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
                  <PanelDoc doc={invertido ? docB : docA} fila={filaSeleccionada} />
                </TabsContent>
                <TabsContent value="b">
                  <PanelDoc doc={invertido ? docA : docB} fila={filaSeleccionada} />
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
              <div className="overflow-hidden rounded-lg border">
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
                    {table.getRowModel().rows.map((row, i) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                          'cursor-pointer',
                          i === diffIndex && 'bg-primary/5',
                        )}
                        onClick={() =>
                          row.original && setDiffIndex(i)
                        }
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
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}