import { useState } from 'react'
import {
  ArrowRight,
  FileText,
  FileSpreadsheet,
  FileImage,
  FilePlus2,
  FileCheck2,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  CheckCircle2,
  RotateCcw,
  History,
  UserCog,
  Flag,
  GitBranch,
  RefreshCw,
  Loader2,
  Workflow,
  GitCompare,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
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
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'

type Criticidad = 'critica' | 'alta' | 'media' | 'baja'
type EstadoObs = 'nueva' | 'asignada' | 'en_revision' | 'justificada' | 'resuelta'

interface Observacion {
  id: string
  codigo: string
  proyecto: string
  partida: string
  tipoInconsistencia: string
  regla: string
  criticidad: Criticidad
  responsable: string
  estado: EstadoObs
  fecha: string
}

const USUARIO_ACTUAL = 'Claudia Torres · Supervisor'

const TIPOS_ESTADO: EstadoObs[] = [
  'nueva',
  'asignada',
  'en_revision',
  'justificada',
  'resuelta',
]

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

const RESPONSABLES = [
  'Carlos Mendoza',
  'Lucía Fernández',
  'Jorge Paredes',
  'Ana Quispe',
  'Pedro Rojas',
]

const DOC_POR_REGLAS: Record<
  string,
  { tipoA: string; docA: string; tipoB: string; docB: string }
> = {
  'Presupuesto vs. Metrado': {
    tipoA: 'Planilla de presupuesto',
    docA: 'Presupuesto General.xlsx',
    tipoB: 'Planilla de metrados',
    docB: 'Metrados de Obra.xlsx',
  },
  'Metrado vs. Plano': {
    tipoA: 'Planilla de metrados',
    docA: 'Metrados de Obra.xlsx',
    tipoB: 'Plano del proyecto',
    docB: 'Planos Estructurales - Cimentación.pdf',
  },
  'Partida vs. Especificación': {
    tipoA: 'Presupuesto General.xlsx',
    docA: 'Presupuesto General.xlsx',
    tipoB: 'Especificaciones técnicas',
    docB: 'Especificaciones Técnicas - Concreto.docx',
  },
  'Partida vs. Cronograma': {
    tipoA: 'Presupuesto General.xlsx',
    docA: 'Presupuesto General.xlsx',
    tipoB: 'Cronograma de ejecución',
    docB: 'Cronograma de Ejecución.xlsx',
  },
}

const VALORES: Record<string, { valorA: string; valorB: string; diferencia: string }> = {
  'Diferencia de cantidad': { valorA: '420.00', valorB: '380.00', diferencia: '-40.00 (9.5%)' },
  'Coincidencia parcial con plano': { valorA: '1,800.00', valorB: '1,650.00', diferencia: '-150.00 (8.3%)' },
  'Información faltante': { valorA: '320.00', valorB: '—', diferencia: 'Sin dato en fuente B' },
  'Unidad inconsistente': { valorA: 'ML', valorB: 'M2', diferencia: 'Unidades no coincidentes' },
  'Especificación parcial': { valorA: 'Acero grado 60', valorB: 'GA60 / ASTM', diferencia: 'Alcance parcial' },
  'Diferencia de unidad': { valorA: 'M3', valorB: 'M3', diferencia: '—' },
  'Cantidad sin respaldo': { valorA: '2,400.00', valorB: '—', diferencia: 'Falta respaldo en plano' },
  'Actividad no programada': { valorA: '13.00', valorB: '—', diferencia: 'Sin actividad' },
}

const RECOMENDACION: Record<EstadoObs, string> = {
  nueva:
    'Recomendación: asignar un responsable técnico y definir el alcance del hallazgo antes de continuar con la conciliación.',
  asignada:
    'Recomendación: el responsable debe revisar los documentos A y B y registrar la justificación o corrección de la inconsistencia.',
  en_revision:
    'Recomendación: validar la evidencia adjunta y confirmar si la corrección ha sido aplicada en ambas fuentes.',
  justificada:
    'Recomendación: aceptar la justificación si la evidencia es consistente y cerrar la observación en el siguiente paso.',
  resuelta:
    'Recomendación: la información ha sido conciliada. No se requiere acción adicional en esta iteración.',
}

function DocCard({
  tipo,
  nombre,
  icono: Icono,
}: {
  tipo: string
  nombre: string
  icono: typeof FileText
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icono className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{tipo}</p>
          <p className="truncate text-sm font-medium text-sidebar-foreground">{nombre}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
        {titulo}
      </p>
      {children}
    </div>
  )
}

interface EventoTimeline {
  id: number
  usuario: string
  accion: string
  detalle?: string
  fecha: Date
  icono: LucideIcon
}

function seedTimeline(o: Observacion): EventoTimeline[] {
  const base = new Date(`${o.fecha}T09:00:00`)
  const eventos: EventoTimeline[] = [
    {
      id: 1,
      usuario: 'IA · HH Intelligence',
      accion: 'Observación detectada',
      detalle: `${o.tipoInconsistencia} en ${o.partida}`,
      fecha: base,
      icono: GitBranch,
    },
  ]
  if (o.estado === 'asignada' || o.estado === 'en_revision' || o.estado === 'justificada' || o.estado === 'resuelta') {
    eventos.push({
      id: 2,
      usuario: USUARIO_ACTUAL,
      accion: 'Asignada a especialista',
      detalle: `Responsable: ${o.responsable || '—'}`,
      fecha: new Date(base.getTime() + 3600_000),
      icono: UserCog,
    })
  }
  if (o.estado === 'en_revision' || o.estado === 'justificada' || o.estado === 'resuelta') {
    eventos.push({
      id: 3,
      usuario: o.responsable || 'Especialista',
      accion: 'En revisión',
      detalle: 'Revisando documentos A y B',
      fecha: new Date(base.getTime() + 7200_000),
      icono: History,
    })
  }
  if (o.estado === 'justificada' || o.estado === 'resuelta') {
    eventos.push({
      id: 4,
      usuario: o.responsable || 'Especialista',
      accion: 'Corrección registrada',
      detalle: 'Justificación aceptada',
      fecha: new Date(base.getTime() + 10800_000),
      icono: ShieldCheck,
    })
  }
  if (o.estado === 'resuelta') {
    eventos.push({
      id: 5,
      usuario: USUARIO_ACTUAL,
      accion: 'Observación resuelta',
      fecha: new Date(base.getTime() + 14400_000),
      icono: CheckCircle2,
    })
  }
  return eventos
}

type ResultadoReanalisis = 'resuelta' | 'continua' | 'revision'

interface VersionHistorial {
  id: string
  version: string
  fecha: Date
  responsable: string
  resultado: string
}

const PASOS_REANALISIS: { etiqueta: string; icono: LucideIcon }[] = [
  { etiqueta: 'Preparando nueva versión', icono: FilePlus2 },
  { etiqueta: 'Procesando documento', icono: Loader2 },
  { etiqueta: 'Actualizando relaciones', icono: Workflow },
  { etiqueta: 'Ejecutando comparación', icono: GitCompare },
  { etiqueta: 'Generando resultado', icono: FileCheck2 },
]

const RESULTADO_LABEL: Record<ResultadoReanalisis, string> = {
  resuelta: 'Observación resuelta',
  continua: 'Inconsistencia continúa',
  revision: 'Requiere revisión manual',
}

const RESULTADO_BADGE: Record<ResultadoReanalisis, string> = {
  resuelta: ESTADO_OK,
  continua: ESTADO_CRITICO,
  revision: ESTADO_WARNING,
}

function resultadoParaEstado(estado: EstadoObs): ResultadoReanalisis {
  if (estado === 'resuelta') return 'resuelta'
  if (estado === 'justificada') return 'resuelta'
  return 'continua'
}

export function DetalleObservacionAmplio({
  open,
  onOpenChange,
  o,
  onActualizar,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  o: Observacion
  onActualizar: (c: {
    estado?: EstadoObs
    criticidad?: Criticidad
    responsable?: string
  }) => void
}) {
  const [comentario, setComentario] = useState('')
  const [responsable, setResponsable] = useState(o.responsable)
  const [timeline, setTimeline] = useState<EventoTimeline[]>(() => seedTimeline(o))
  const [reanalizando, setReanalizando] = useState(false)
  const [paso, setPaso] = useState(0)
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoReanalisis | null>(() =>
    resultadoParaEstado(o.estado),
  )
  const [versiones, setVersiones] = useState<VersionHistorial[]>(() => [
    {
      id: `${o.id}-v1`,
      version: 'v1',
      fecha: new Date(`${o.fecha}T09:00:00`),
      responsable: 'IA · HH Intelligence',
      resultado: 'Inconsistencia continúa',
    },
  ])

  function registrar(accion: string, detalle: string | undefined, icono: LucideIcon) {
    const id = Date.now()
    setTimeline((prev) => [
      ...prev,
      {
        id,
        usuario: USUARIO_ACTUAL,
        accion,
        detalle,
        fecha: new Date(),
        icono,
      },
    ])
  }

  function asignarEspecialista(v: string) {
    setResponsable(v)
    onActualizar({
      responsable: v,
      estado: o.estado === 'nueva' ? 'asignada' : o.estado,
    })
    registrar('Asignada a especialista', `Responsable: ${v}`, UserCog)
    toast.success('Asignar especialista', {
      description: `${v} asignado como especialista de ${o.codigo}.`,
    })
  }

  function cambiarResponsable(v: string) {
    setResponsable(v)
    onActualizar({ responsable: v })
    registrar('Cambio de responsable', `Nuevo responsable: ${v}`, UserRound)
    toast.success('Responsable cambiado', {
      description: `Responsable actualizado a ${v}.`,
    })
  }

  function cambiarCriticidad(v: Criticidad) {
    onActualizar({ criticidad: v })
    registrar('Cambio de criticidad', `Criticidad → ${CRITICIDAD_LABEL[v]}`, Flag)
    toast.success('Criticidad actualizada', {
      description: `Criticidad de ${o.codigo} establecida como ${CRITICIDAD_LABEL[v]}.`,
    })
  }

  function cambiarEstado(v: EstadoObs) {
    onActualizar({ estado: v })
    registrar('Cambio de estado', `Estado → ${ESTADO_LABEL[v]}`, GitBranch)
    toast.success('Estado actualizado', {
      description: `${o.codigo} ahora está en estado ${ESTADO_LABEL[v]}.`,
    })
  }

  function agregarComentario() {
    const texto = comentario.trim()
    if (!texto) return
    registrar('Comentario agregado', texto, MessageSquarePlus)
    setComentario('')
    toast.success('Comentario agregado', {
      description: `Comentario registrado en ${o.codigo}.`,
    })
  }

  function justificar() {
    onActualizar({ estado: 'justificada' })
    registrar('Justificación registrada', 'Observación justificada', ShieldCheck)
    toast.success('Observación justificada', {
      description: `${o.codigo} marcada como justificada.`,
    })
  }

  function resolver() {
    onActualizar({ estado: 'resuelta' })
    registrar('Observación resuelta', undefined, CheckCircle2)
    toast.success('Observación resuelta', {
      description: `${o.codigo} marcada como resuelta.`,
    })
  }

  function reabrir() {
    onActualizar({ estado: 'en_revision' })
    registrar('Observación reabierta', 'Devolución a revisión', RotateCcw)
    toast.info('Observación reabierta', {
      description: `${o.codigo} vuelve a estado En revisión.`,
    })
  }

  function reanalizar() {
    if (reanalizando) return
    setReanalizando(true)
    setResultado(null)
    setPaso(0)
    setProgreso(0)
    toast.info('Reanálisis iniciado', {
      description: 'Procesando una nueva versión del documento.',
    })

    PASOS_REANALISIS.forEach((_, i) => {
      setTimeout(() => setPaso(i + 1), 700 * (i + 1))
    })
    ;[20, 40, 60, 80].forEach((p) => {
      setTimeout(() => setProgreso(p), 700 * (p / 20))
    })

    setTimeout(() => {
      const nuevoResultado: ResultadoReanalisis =
        o.estado === 'resuelta' || o.estado === 'justificada'
          ? 'resuelta'
          : Math.random() > 0.4
            ? 'resuelta'
            : Math.random() > 0.5
              ? 'continua'
              : 'revision'
      setProgreso(100)
      setPaso(5)
      setReanalizando(false)
      setResultado(nuevoResultado)

      const versionId = `v${versiones.length + 1}`
      const nuevaVersion: VersionHistorial = {
        id: `${o.id}-${versionId}`,
        version: versionId,
        fecha: new Date(),
        responsable: USUARIO_ACTUAL,
        resultado: RESULTADO_LABEL[nuevoResultado],
      }
      setVersiones((prev) => [...prev, nuevaVersion])

      if (nuevoResultado === 'resuelta') {
        onActualizar({ estado: 'resuelta' })
        registrar('Reanálisis completado', 'Observación resuelta', CheckCircle2)
        toast.success('Observación resuelta', {
          description: `El reanálisis de ${o.codigo} confirma que la inconsistencia fue resuelta.`,
        })
      } else if (nuevoResultado === 'continua') {
        onActualizar({ estado: 'en_revision' })
        registrar('Reanálisis completado', 'Inconsistencia continúa', GitCompare)
        toast.error('Inconsistencia continúa', {
          description: `El documento actualizado aún presenta la inconsistencia en ${o.codigo}.`,
        })
      } else {
        onActualizar({ estado: 'en_revision' })
        registrar('Reanálisis completado', 'Requiere revisión manual', History)
        toast.warning('Requiere revisión manual', {
          description: `${o.codigo} requiere una revisión manual del especialista.`,
        })
      }
    }, 3600)
  }

  function formatearFecha(d: Date) {
    return format(d, 'dd MMM yyyy')
  }

  function formatearHora(d: Date) {
    return format(d, 'HH:mm')
  }

  const docs = DOC_POR_REGLAS[o.regla] ?? {
    tipoA: 'Documento A',
    docA: o.regla,
    tipoB: 'Documento B',
    docB: 'Fuente complementaria',
  }
  const valores =
    VALORES[o.tipoInconsistencia] ?? { valorA: '—', valorB: '—', diferencia: '—' }

  const esResuelta = o.estado === 'resuelta'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-x-hidden overflow-y-auto border-l-0 sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            {o.codigo}
          </SheetTitle>
          <SheetDescription className="text-sidebar-foreground/70">
            {o.partida}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Dato etiqueta="Proyecto">{o.proyecto}</Dato>
            <Dato etiqueta="Fecha">{formatFecha(o.fecha)}</Dato>
            <Dato etiqueta="Responsable">{responsable}</Dato>
            <Dato etiqueta="Regla de revisión">
              <Badge variant="secondary">{o.regla}</Badge>
            </Dato>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dato etiqueta="Criticidad">
              <Badge variant="outline" className={CRITICIDAD_BADGE[o.criticidad]}>
                {CRITICIDAD_LABEL[o.criticidad]}
              </Badge>
            </Dato>
            <Dato etiqueta="Estado">
              <Badge variant="outline" className={ESTADO_BADGE[o.estado]}>
                {ESTADO_LABEL[o.estado]}
              </Badge>
            </Dato>
          </div>

          <Seccion titulo="Descripción del hallazgo">
            <p className="text-sm">
              La partida <strong>{o.partida}</strong> presenta{' '}
              <strong>{o.tipoInconsistencia.toLowerCase()}</strong> según la regla{' '}
              <strong>{o.regla}</strong>. Los valores cruzados entre las fuentes no
              resultan coincidentes y requieren conciliación.
            </p>
          </Seccion>

          <div className="grid gap-4 lg:grid-cols-2">
            <Seccion titulo="Documento A">
              <DocCard tipo={docs.tipoA} nombre={docs.docA} icono={FileSpreadsheet} />
            </Seccion>
            <Seccion titulo="Documento B">
              <DocCard tipo={docs.tipoB} nombre={docs.docB} icono={FileImage} />
            </Seccion>
          </div>

          <Seccion titulo="Valores comparados">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-black/20 p-3">
                <p className="text-xs text-muted-foreground">Documento A</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{valores.valorA}</p>
                <p className="truncate text-xs text-muted-foreground">{docs.tipoA}</p>
              </div>
              <div className="rounded-lg bg-black/20 p-3">
                <p className="text-xs text-muted-foreground">Documento B</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{valores.valorB}</p>
                <p className="truncate text-xs text-muted-foreground">{docs.tipoB}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-black/20 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
                Diferencia detectada
              </span>
              <span className="text-sm font-semibold text-warning">{valores.diferencia}</span>
            </div>
          </Seccion>

          <Seccion titulo="Evidencia relacionada">
            <div className="grid gap-2 sm:grid-cols-3">
              <Evidencia icono={FileSpreadsheet} nombre="Recorte de metrado.xlsx" />
              <Evidencia icono={FileImage} nombre="Detalle plano.pdf" />
              <Evidencia icono={FileText} nombre="Memo de revisión.docx" />
            </div>
          </Seccion>

          <Seccion titulo="Recomendación simulada de IA">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">{RECOMENDACION[o.estado]}</p>
            </div>
          </Seccion>

          <Seccion titulo="Reanálisis">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reanalizar documento</p>
                    <p className="text-xs text-muted-foreground">
                      Reprocesar el documento corregido y generar una nueva versión
                      de comparación.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={reanalizar}
                  disabled={reanalizando}
                  className="shrink-0"
                >
                  {reanalizando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {reanalizando ? 'Reanalizando...' : 'Reanalizar'}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {reanalizando || resultado ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {reanalizando
                          ? PASOS_REANALISIS[Math.min(paso, 4)].etiqueta
                          : 'Reanálisis completado'}
                      </span>
                      <span className="tabular-nums font-medium">{progreso}%</span>
                    </div>
                    <Progress
                      value={progreso}
                      className="h-2"
                    />

                    <ol className="space-y-2">
                      {PASOS_REANALISIS.map((p, i) => {
                        const Icono = p.icono
                        const completado = paso > i
                        const activo = reanalizando && paso === i + 1
                        return (
                          <li
                            key={p.etiqueta}
                            className={cn(
                              'flex items-center gap-2 text-sm',
                              reanalizando && !completado && !activo
                                ? 'text-muted-foreground/50'
                                : completado || resultado
                                  ? 'text-sidebar-foreground'
                                  : 'text-sidebar-foreground',
                            )}
                          >
                            {activo ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : completado || (resultado && i < 5) ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Icono
                                className={cn(
                                  'h-4 w-4',
                                  activo && 'text-primary',
                                  !completado && !activo && 'text-muted-foreground/40',
                                )}
                              />
                            )}
                            <span
                              className={
                                completado || (resultado && i < 5)
                                  ? 'line-through opacity-70'
                                  : ''
                              }
                            >
                              {p.etiqueta}
                            </span>
                          </li>
                        )
                      })}
                    </ol>

                    {resultado && !reanalizando && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      >
                        <span className="text-sm font-medium">Resultado:</span>
                        <Badge
                          variant="outline"
                          className={RESULTADO_BADGE[resultado]}
                        >
                          {RESULTADO_LABEL[resultado]}
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-dashed border-white/10 p-3 text-center text-sm text-muted-foreground"
                  >
                    Presiona <strong>Reanalizar</strong> para iniciar el flujo de
                    reprocesamiento del documento corregido.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Seccion>

          <Seccion titulo="Comentarios">
            <div className="flex gap-2">
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe un comentario para la observación..."
                rows={2}
                className="bg-black/20"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-auto shrink-0"
                aria-label="Enviar comentario"
                disabled={!comentario.trim()}
                onClick={agregarComentario}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Seccion>

          <Seccion titulo="Asignar especialista / Responsable">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <UserCog className="h-4 w-4" />
                  Asignar especialista
                </label>
                <Select value={responsable} onValueChange={asignarEspecialista}>
                  <SelectTrigger className="bg-black/20" aria-label="Asignar especialista">
                    <SelectValue placeholder="Seleccionar especialista" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSABLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                  Cambiar responsable
                </label>
                <Select value={responsable} onValueChange={cambiarResponsable}>
                  <SelectTrigger className="bg-black/20" aria-label="Cambiar responsable">
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSABLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Seccion>

          <Seccion titulo="Cambiar criticidad / estado">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Flag className="h-4 w-4" />
                  Cambiar criticidad
                </label>
                <Select value={o.criticidad} onValueChange={(v) => cambiarCriticidad(v as Criticidad)}>
                  <SelectTrigger className="bg-black/20" aria-label="Cambiar criticidad">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CRITICIDAD_LABEL) as Criticidad[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CRITICIDAD_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  Cambiar estado
                </label>
                <Select value={o.estado} onValueChange={(v) => cambiarEstado(v as EstadoObs)}>
                  <SelectTrigger className="bg-black/20" aria-label="Cambiar estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_ESTADO.map((e) => (
                      <SelectItem key={e} value={e}>
                        {ESTADO_LABEL[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Seccion>

          <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              className="flex-1"
              disabled={o.estado === 'justificada' || esResuelta}
              onClick={justificar}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Justificar
            </Button>
            <Button
              className="flex-1"
              disabled={esResuelta}
              onClick={resolver}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Resolver
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={!esResuelta}
              onClick={reabrir}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reabrir
            </Button>
          </div>

          <Seccion titulo="Timeline de la observación">
            <ol className="relative ml-2 space-y-5 border-l-2 border-white/10 pl-5">
              {timeline.map((e) => {
                const Icono = e.icono
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[34px] flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-sidebar text-primary">
                      <Icono className="h-4 w-4" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{e.accion}</p>
                      {e.detalle && (
                        <p className="text-xs text-muted-foreground">{e.detalle}</p>
                      )}
                      <p className="mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-sidebar-foreground/80">
                          {e.usuario}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatearFecha(e.fecha)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatearHora(e.fecha)}</span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </Seccion>

          <Seccion titulo="Historial de versiones">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Versión</th>
                    <th className="py-2 pr-3 font-medium">Fecha</th>
                    <th className="py-2 pr-3 font-medium">Responsable</th>
                    <th className="py-2 font-medium">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...versiones].reverse().map((v) => (
                    <tr key={v.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 pr-3">
                        <Badge variant="secondary">{v.version}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {format(v.fecha, 'dd MMM yyyy')}
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {v.responsable}
                      </td>
                      <td className="py-2.5">
                        {v.resultado === 'Observación resuelta' ? (
                          <span className="inline-flex items-center gap-1.5 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            {v.resultado}
                          </span>
                        ) : v.resultado === 'Requiere revisión manual' ? (
                          <span className="inline-flex items-center gap-1.5 text-warning">
                            <History className="h-4 w-4" />
                            {v.resultado}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-destructive">
                            <GitCompare className="h-4 w-4" />
                            {v.resultado}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <div className="mt-1 text-sm font-medium text-sidebar-foreground">{children}</div>
    </div>
  )
}

function Evidencia({
  icono: Icono,
  nombre,
}: {
  icono: typeof FileText
  nombre: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icono className="h-4 w-4" />
      </div>
      <span className="truncate text-xs text-sidebar-foreground">{nombre}</span>
    </div>
  )
}