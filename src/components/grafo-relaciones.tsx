import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Network,
  Focus,
  RotateCcw,
  Layers,
  Ruler,
  PencilRuler,
  DollarSign,
  CalendarClock,
  Layers3,
  Hash,
  FileText,
  Link,
  FolderKanban,
} from 'lucide-react'

import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/badge'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_NEUTRO, PROGRESO_OK } from '@/utils/estados-clases'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type TipoNodo = 'partida' | 'presupuesto' | 'metrado' | 'plano' | 'especificacion' | 'cronograma'
type TipoDoc = Exclude<TipoNodo, 'partida'>
type EstadoRel = 'encontrada' | 'parcial' | 'no_encontrada'
type RelacionesPartida = Record<TipoDoc, EstadoRel>

const TIPOS_DOCUMENTO: TipoDoc[] = [
  'presupuesto',
  'metrado',
  'plano',
  'especificacion',
  'cronograma',
]

const LABEL_TIPO: Record<TipoNodo, string> = {
  partida: 'Partida',
  presupuesto: 'Presupuesto',
  metrado: 'Metrado',
  plano: 'Plano',
  especificacion: 'Especificación',
  cronograma: 'Cronograma',
}

const ICONO_TIPO: Record<TipoNodo, typeof Layers> = {
  partida: Layers3,
  presupuesto: DollarSign,
  metrado: Ruler,
  plano: Layers,
  especificacion: PencilRuler,
  cronograma: CalendarClock,
}

const ESTADO_LABEL: Record<EstadoRel, string> = {
  encontrada: 'Encontrado',
  parcial: 'Parcial',
  no_encontrada: 'No encontrado',
}

const ESTADO_BADGE: Record<EstadoRel, string> = {
  encontrada: ESTADO_OK,
  parcial: ESTADO_WARNING,
  no_encontrada: ESTADO_NEUTRO,
}

const DOCUMENTO_ORIGEN: Record<TipoNodo, string> = {
  partida: 'Múltiples documentos',
  presupuesto: 'Presupuesto General.xlsx',
  metrado: 'Metrados de Obra.xlsx',
  plano: 'Planos Estructurales - Cimentación.pdf',
  especificacion: 'Especificaciones Técnicas.docx',
  cronograma: 'Cronograma de Ejecución.xlsx',
}

interface NodoData {
  codigo: string
  descripcion: string
  tipo: TipoNodo
  documentoOrigen: string
  especialidad?: string
  estado: EstadoRel
  confianza: number
  relaciones: string[]
  [key: string]: unknown
}

type ParteNode = Node<NodoData, 'partida' | 'doc'>

const ESPECIALIDADES_GRAFO = ['Estructuras', 'Sanitaria', 'Eléctricas']

interface PartidaGrafo {
  id: string
  codigo: string
  descripcion: string
  especialidad: string
  relaciones: RelacionesPartida
  planoOrigen: string
}

const PARTIDAS_GRAFO: PartidaGrafo[] = [
  {
    id: 'g-01',
    codigo: '03.02.01',
    descripcion: "Concreto f'c=210 kg/cm²",
    especialidad: 'Estructuras',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'encontrada',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'no_encontrada',
    },
    planoOrigen: 'Planos Estructurales - Cimentación.pdf',
  },
  {
    id: 'g-02',
    codigo: '02.01',
    descripcion: 'Redes de desagüe',
    especialidad: 'Sanitaria',
    relaciones: {
      presupuesto: 'encontrada',
      metrado: 'parcial',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'no_encontrada',
    },
    planoOrigen: 'Planos de Instalaciones Sanitarias.pdf',
  },
  {
    id: 'g-03',
    codigo: '03.01',
    descripcion: 'Salidas para artefactos empotrados',
    especialidad: 'Eléctricas',
    relaciones: {
      presupuesto: 'parcial',
      metrado: 'no_encontrada',
      plano: 'encontrada',
      especificacion: 'encontrada',
      cronograma: 'encontrada',
    },
    planoOrigen: 'Planos de Instalaciones Eléctricas.pdf',
  },
]

const CONFI_NODE: Record<TipoNodo, number> = {
  partida: 92,
  presupuesto: 93,
  metrado: 88,
  plano: 91,
  especificacion: 85,
  cronograma: 79,
}

function estadoGlobal(rel: RelacionesPartida): EstadoRel {
  const valores = Object.values(rel)
  if (valores.some((v) => v === 'encontrada')) return 'encontrada'
  if (valores.some((v) => v === 'parcial')) return 'parcial'
  return 'no_encontrada'
}

function contar(rel: RelacionesPartida, estado: EstadoRel) {
  return Object.values(rel).filter((v) => v === estado).length
}

const X_TIPO: Record<TipoNodo, number> = {
  presupuesto: 0,
  metrado: 230,
  partida: 460,
  plano: 690,
  especificacion: 920,
  cronograma: 1150,
}

function construirNodos(
  partidas: PartidaGrafo[],
  documentoActivo: 'todos' | TipoDoc,
): ParteNode[] {
  const nodos: ParteNode[] = []
  partidas.forEach((p, i) => {
    const y = 40 + i * 190
    nodos.push({
      id: `partida-${p.id}`,
      type: 'partida',
      position: { x: X_TIPO.partida, y },
      data: {
        codigo: p.codigo,
        descripcion: p.descripcion,
        tipo: 'partida',
        documentoOrigen: DOCUMENTO_ORIGEN.partida,
        especialidad: p.especialidad,
        estado: estadoGlobal(p.relaciones),
        confianza: CONFI_NODE.partida,
        relaciones: TIPOS_DOCUMENTO.map((t) => LABEL_TIPO[t]),
      },
    })
    TIPOS_DOCUMENTO.forEach((tipo) => {
      if (documentoActivo !== 'todos' && documentoActivo !== tipo) return
      const estado = p.relaciones[tipo]
      if (estado === 'no_encontrada') return
      const docOrigen =
        tipo === 'plano' ? p.planoOrigen : DOCUMENTO_ORIGEN[tipo]
      nodos.push({
        id: `doc-${p.id}-${tipo}`,
        type: 'doc',
        position: { x: X_TIPO[tipo], y },
        data: {
          codigo: `${p.codigo} · ${LABEL_TIPO[tipo]}`,
          descripcion: p.descripcion,
          tipo,
          documentoOrigen: docOrigen,
          estado,
          confianza: Math.max(
            60,
            CONFI_NODE[tipo] + (estado === 'parcial' ? -8 : 0),
          ),
          relaciones: [`${p.codigo} — ${p.descripcion}`],
        },
      })
    })
  })
  return nodos
}

function construirAristas(
  partidas: PartidaGrafo[],
  documentoActivo: 'todos' | TipoDoc,
): Edge[] {
  const aristas: Edge[] = []
  partidas.forEach((p) => {
    TIPOS_DOCUMENTO.forEach((tipo) => {
      if (p.relaciones[tipo] === 'no_encontrada') return
      if (documentoActivo !== 'todos' && documentoActivo !== tipo) return
      aristas.push({
        id: `${p.id}-${tipo}`,
        source: `doc-${p.id}-${tipo}`,
        target: `partida-${p.id}`,
        animated: p.relaciones[tipo] === 'parcial',
        className:
          p.relaciones[tipo] === 'encontrada' ? 'grafo-arista-ok' : 'grafo-arista-parcial',
        markerEnd: { type: 'arrowclosed' },
      })
    })
  })
  return aristas
}

function useIsMobile() {
  const [movil, setMovil] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(max-width: 1023px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const cambiar = () => setMovil(mq.matches)
    cambiar()
    mq.addEventListener('change', cambiar)
    return () => mq.removeEventListener('change', cambiar)
  }, [])
  return movil
}

function NodoPartida({ data }: NodeProps<ParteNode>) {
  const Icono = ICONO_TIPO.partida
  return (
    <div
      className={cn(
        'group relative w-[210px] rounded-lg border bg-card p-3 shadow-sm',
        data.especialidad === 'Estructuras' && 'border-blue-300',
        data.especialidad === 'Sanitaria' && 'border-teal-300',
        data.especialidad === 'Eléctricas' && 'border-yellow-300',
      )}
    >
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Right} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icono className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-mono text-muted-foreground">
              {data.codigo}
            </p>
            <p className="truncate text-sm font-medium leading-tight">
              {data.descripcion}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Badge variant="outline" className={ESTADO_BADGE[data.estado]}>
          {ESTADO_LABEL[data.estado]}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {data.especialidad}
        </Badge>
      </div>
    </div>
  )
}

function NodoDoc({ data }: NodeProps<ParteNode>) {
  const Icono = ICONO_TIPO[data.tipo]
  return (
    <div
      className={cn(
        'w-[210px] rounded-lg border bg-card p-3 shadow-sm',
        data.estado === 'encontrada' &&
          'border-emerald-200 bg-emerald-50/40',
        data.estado === 'parcial' && 'border-amber-200 bg-amber-50/40',
        !['encontrada', 'parcial'].includes(data.estado) &&
          'border-muted bg-muted/20',
      )}
    >
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icono className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {LABEL_TIPO[data.tipo]}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {data.documentoOrigen}
          </p>
        </div>
        <Badge variant="outline" className={ESTADO_BADGE[data.estado]}>
          {ESTADO_LABEL[data.estado]}
        </Badge>
      </div>
    </div>
  )
}

const nodeTypes = { partida: NodoPartida, doc: NodoDoc }

function GrafoInner() {
  const mobile = useIsMobile()
  const { fitView, setViewport } = useReactFlow()
  const [seleccion, setSeleccion] = useState<NodoData | null>(null)
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas')
  const [filtroDocumento, setFiltroDocumento] = useState<'todos' | TipoDoc>(
    'todos',
  )

  const partidas = useMemo(
    () =>
      filtroEspecialidad === 'todas'
        ? PARTIDAS_GRAFO
        : PARTIDAS_GRAFO.filter((p) => p.especialidad === filtroEspecialidad),
    [filtroEspecialidad],
  )

  const nodos = useMemo(
    () => construirNodos(partidas, filtroDocumento),
    [partidas, filtroDocumento],
  )
  const aristas = useMemo(
    () => construirAristas(partidas, filtroDocumento),
    [partidas, filtroDocumento],
  )

  useEffect(() => {
    const t = window.setTimeout(() => fitView({ padding: 0.3 }), 80)
    return () => window.clearTimeout(t)
  }, [filtroEspecialidad, filtroDocumento, fitView])

  const resetear = () => {
    setSeleccion(null)
    setViewport({ x: 0, y: 0, zoom: 1 })
  }

  const seleccionar = (nodo: NodoData) => setSeleccion(nodo)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filtroEspecialidad}
          onValueChange={setFiltroEspecialidad}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Especialidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las especialidades</SelectItem>
            {ESPECIALIDADES_GRAFO.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtroDocumento}
          onValueChange={(v) => setFiltroDocumento(v as 'todos' | TipoDoc)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los documentos</SelectItem>
            {TIPOS_DOCUMENTO.map((t) => (
              <SelectItem key={t} value={t}>
                {LABEL_TIPO[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mobile ? (
        <VistaMovil partidas={partidas} onSeleccionar={seleccionar} />
      ) : (
        <div className="h-[520px] rounded-lg border bg-card/40">
          <ReactFlow
            nodes={nodos}
            edges={aristas}
            nodeTypes={nodeTypes}
            onNodeClick={(_, nodo) => seleccionar(nodo.data as NodoData)}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} />
            <Controls showInteractive={false} />
            <PanelTop>
              <div className="flex items-center gap-2 rounded-lg border bg-background/90 p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fitView({ padding: 0.3 })}
                  aria-label="Centrar vista"
                >
                  <Focus className="h-4 w-4" />
                  <span className="hidden sm:inline">Centrar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetear}
                  aria-label="Resetear vista"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </div>
            </PanelTop>
          </ReactFlow>
        </div>
      )}

      <Sheet open={!!seleccion} onOpenChange={(o) => !o && setSeleccion(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {seleccion && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconoCajita tipo={seleccion.tipo} />
                  </span>
                  {seleccion.codigo}
                </SheetTitle>
                <SheetDescription>{seleccion.descripcion}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <DatoRow iconoB={Hash} etiqueta="Código">
                  {seleccion.codigo}
                </DatoRow>
                <DatoRow iconoB={FileText} etiqueta="Tipo">
                  <Badge variant="secondary">{LABEL_TIPO[seleccion.tipo]}</Badge>
                </DatoRow>
                <DatoRow iconoB={FolderKanban} etiqueta="Documento origen">
                  <span className="text-sm">{seleccion.documentoOrigen}</span>
                </DatoRow>
                {seleccion.especialidad && (
                  <DatoRow iconoB={Layers3} etiqueta="Especialidad">
                    <span className="text-sm">{seleccion.especialidad}</span>
                  </DatoRow>
                )}

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Relaciones
                  </p>
                  {seleccion.tipo === 'partida' ? (
                    <div className="grid grid-cols-1 gap-1.5">
                      {TIPOS_DOCUMENTO.map((t) => {
                        const partes = PARTIDAS_GRAFO.find(
                          (p) => p.codigo === seleccion.codigo,
                        )
                        const estado = partes
                          ? partes.relaciones[t]
                          : 'no_encontrada'
                        return (
                          <div
                            key={t}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <IconoCajita tipo={t} className="h-3.5 w-3.5 text-muted-foreground" />
                              {LABEL_TIPO[t]}
                            </span>
                            <Badge variant="outline" className={ESTADO_BADGE[estado]}>
                              {ESTADO_LABEL[estado]}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {seleccion.relaciones.map((r) => (
                        <li
                          key={r}
                          className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm"
                        >
                          <Link className="h-3.5 w-3.5 text-muted-foreground" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Estado
                  </p>
                  <Badge variant="outline" className={ESTADO_BADGE[seleccion.estado]}>
                    {ESTADO_LABEL[seleccion.estado]}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {seleccion.estado === 'encontrada' &&
                      'Relación verificada en la estructura común.'}
                    {seleccion.estado === 'parcial' &&
                      'Coincidencia parcial pendiente de revisión.'}
                    {seleccion.estado === 'no_encontrada' &&
                      'Sin vínculo detectado en los documentos.'}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Confianza IA
                    </p>
                    <span className="text-sm font-semibold tabular-nums">
                      {seleccion.confianza}%
                    </span>
                  </div>
                  <Progress
                    value={seleccion.confianza}
                    className={cn('h-2', PROGRESO_OK)}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function PanelTop({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-2 top-2 z-10">{children}</div>
  )
}

function IconoCajita({
  tipo,
  className,
}: {
  tipo: TipoNodo
  className?: string
}) {
  const Icono = ICONO_TIPO[tipo]
  return <Icono className={cn('h-4 w-4', className)} />
}

function DatoRow({
  iconoB: Icono,
  etiqueta,
  children,
}: {
  iconoB: typeof Hash
  etiqueta: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Icono className="h-4 w-4" />
        {etiqueta}
      </span>
      <span className="text-right">{children}</span>
    </div>
  )
}

function VistaMovil({
  partidas,
  onSeleccionar,
}: {
  partidas: PartidaGrafo[]
  onSeleccionar: (data: NodoData) => void
}) {
  return (
    <div className="grid gap-3">
      {partidas.map((p) => {
        const estado = estadoGlobal(p.relaciones)
        const encontradas = contar(p.relaciones, 'encontrada')
        const parciales = contar(p.relaciones, 'parcial')
        const nodoBase: NodoData = {
          codigo: p.codigo,
          descripcion: p.descripcion,
          tipo: 'partida',
          documentoOrigen: DOCUMENTO_ORIGEN.partida,
          especialidad: p.especialidad,
          estado,
          confianza: CONFI_NODE.partida,
relaciones: TIPOS_DOCUMENTO.map((t) => LABEL_TIPO[t]),
        }
        return (
          <div key={p.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">
                  {p.codigo}
                </p>
                <p className="text-sm font-medium">{p.descripcion}</p>
              </div>
              <Badge variant="outline" className={ESTADO_BADGE[estado]}>
                {ESTADO_LABEL[estado]}
              </Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              {TIPOS_DOCUMENTO.map((t) => {
                const e = p.relaciones[t]
                return (
                  <div
                    key={t}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconoCajita tipo={t} className="h-3.5 w-3.5 text-muted-foreground" />
                      {LABEL_TIPO[t]}
                    </span>
                    <Badge variant="outline" className={ESTADO_BADGE[e]}>
                      {ESTADO_LABEL[e]}
                    </Badge>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {encontradas} de 5 encontradas · {parciales} parciales
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSeleccionar(nodoBase)}
              >
                Ver detalle
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function GrafoRelaciones() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Network className="h-4 w-4 text-primary" />
          Grafo de relaciones
        </h3>
        <p className="text-sm text-muted-foreground">
          Visualizá las partidas técnicas y su vínculo con cada documento del
          proyecto. Arrastrá los nodos, hacé zoom y seleccioná uno para ver el
          detalle.
        </p>
      </div>
      <ReactFlowProvider>
        <GrafoInner />
      </ReactFlowProvider>
    </div>
  )
}