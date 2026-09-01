import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  GitCompare,
  History,
  RotateCcw,
  Tag,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { formatFecha } from '@/utils/formatters'
import type { DocumentoLista, EstadoIa } from '@/data/proyecto-detalle'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

type ResultadoAnalisis = 'conforme' | 'observado' | 'critico' | 'pendiente'

interface VersionDoc {
  version: string
  fecha: string
  usuario: string
  motivo: string
  estadoProcesamiento: EstadoIa
  resultado: ResultadoAnalisis
}

const PROCESAMIENTO_LABEL: Record<EstadoIa, string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  procesado: 'Procesado',
  error: 'Error',
}

const PROCESAMIENTO_BADGE: Record<EstadoIa, string> = {
  pendiente: ESTADO_WARNING,
  procesando: ESTADO_INFO,
  procesado: ESTADO_OK,
  error: ESTADO_CRITICO,
}

const RESULTADO_LABEL: Record<ResultadoAnalisis, string> = {
  conforme: 'Conforme',
  observado: 'Observado',
  critico: 'Crítico',
  pendiente: 'Pendiente',
}

const RESULTADO_BADGE: Record<ResultadoAnalisis, string> = {
  conforme: ESTADO_OK,
  observado: ESTADO_WARNING,
  critico: ESTADO_CRITICO,
  pendiente: ESTADO_NEUTRO,
}

const RESULTADO_ICONO: Record<ResultadoAnalisis, LucideIcon> = {
  conforme: CheckCircle2,
  observado: TriangleAlert,
  critico: XCircle,
  pendiente: Clock3,
}

function esEstadoIa(v: string): v is EstadoIa {
  return v === 'pendiente' || v === 'procesando' || v === 'procesado' || v === 'error'
}

const MOTIVOS = [
  'Corrección de metrados y partidas',
  'Actualización de especificaciones técnicas',
  'Incorporación de observaciones del revisor',
  'Complemento de información del expediente',
  'Revisión de planos y detalles estructurales',
]

export function numeroVersiones(doc: DocumentoLista) {
  const [majRaw] = doc.version.split('.').map(Number)
  return majRaw <= 1 ? 2 : majRaw === 2 ? 3 : 4
}

function buildVersiones(doc: DocumentoLista): VersionDoc[] {
  const [majRaw, minRaw] = doc.version.split('.').map(Number)
  const total = numeroVersiones(doc)

  const usernames = [
    doc.responsable,
    'Andrea Quispe',
    'Carlos Mendoza',
    'Lucía Fernández',
  ]
  const estados: EstadoIa[] = ['error', 'pendiente', 'procesando', 'procesado']
  const resultados: ResultadoAnalisis[] = ['pendiente', 'observado', 'observado', 'conforme']

  const labels: string[] = []
  let M = majRaw
  let m = minRaw
  for (let i = 0; i < total; i++) {
    labels.unshift(`${M}.${m}`)
    m -= 1
    if (m < 0) {
      M -= 1
      m = 1
    }
    if (M < 1) break
  }

  const fechaBase = parseISO(doc.fecha)
  const fechas = labels.map((_, i) => {
    const f = new Date(fechaBase)
    const diasAtras = (labels.length - 1 - i) * 8
    f.setDate(f.getDate() - diasAtras)
    return f.toISOString().slice(0, 19)
  })

  return labels.map((label, i) => {
    const esNueva = i === labels.length - 1
    const estadoProcesamiento: EstadoIa = esNueva && esEstadoIa(doc.estadoIa.toString())
      ? (doc.estadoIa as EstadoIa)
      : estados[i % estados.length]
    return {
      version: label,
      fecha: fechas[i],
      usuario: usernames[(i + 1) % usernames.length],
      motivo: MOTIVOS[i % MOTIVOS.length],
      estadoProcesamiento,
      resultado: resultados[i % resultados.length],
    }
  })
}

interface CampoComparacion {
  campo: string
  anterior: string
  nuevo: string
  estado: ResultadoAnalisis
}

const COMPARACION_MOCK: CampoComparacion[] = [
  { campo: 'Cantidad de partidas', anterior: '142', nuevo: '158', estado: 'conforme' },
  { campo: 'Metrado - Excavación (m³)', anterior: '1,240.50', nuevo: '1,318.75', estado: 'observado' },
  { campo: 'Acero de refuerzo (kg)', anterior: '18,420', nuevo: '19,105', estado: 'conforme' },
  { campo: "Concreto f'c 210 (m³)", anterior: '520', nuevo: '486', estado: 'critico' },
  { campo: 'Unidad - Partida 04.03', anterior: 'glb', nuevo: 'm²', estado: 'observado' },
]

export function VersionesDocumento({
  documento,
  open,
  onOpenChange,
}: {
  documento: DocumentoLista
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const versiones = useMemo(() => buildVersiones(documento), [documento])
  const [versionActual, setVersionActual] = useState(documento.version)
  const [verId, setVerId] = useState<string | null>(null)

  const actual = versiones.find((v) => v.version === versionActual) ?? versiones[versiones.length - 1]
  const anterior = versiones[Math.max(0, versiones.indexOf(actual) - 1)]

  const verSeleccionada = versiones.find((v) => v.version === verId) ?? null

  const marcarActual = (v: VersionDoc) => {
    setVersionActual(v.version)
    toast.success('Versión marcada como actual', {
      description: `${documento.nombre} · v${v.version}.`,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l-0 sm:max-w-3xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Versiones del documento
          </SheetTitle>
          <SheetDescription>
            Historial de versiones y comparación simulada.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{documento.nombre}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
                <InfoCampo etiqueta="Versión actual" valor={`v${actual.version}`} mono />
                <InfoCampo etiqueta="Fecha" valor={formatFecha(actual.fecha.slice(0, 10))} />
                <InfoCampo etiqueta="Responsable" valor={actual.usuario} />
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant="outline" className={cn('mt-0.5 w-fit', PROCESAMIENTO_BADGE[actual.estadoProcesamiento])}>
                    {PROCESAMIENTO_LABEL[actual.estadoProcesamiento]}
                  </Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Nº de versiones</span>
                  <span className="mt-0.5 font-semibold">{versiones.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Tamaño</span>
                  <span className="mt-0.5">{formatBytes(documento.tamaño)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GitCompare className="h-4 w-4 text-primary" />
            Comparación simulada
          </h3>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline">v{anterior.version}</Badge>
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
              v{actual.version}
            </Badge>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-12 border-b bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground sm:grid">
            <span className="col-span-3">Campo</span>
            <span className="col-span-3">Valor anterior</span>
            <span className="col-span-3">Valor nuevo</span>
            <span className="col-span-3">Estado del reanálisis</span>
          </div>
          <div className="divide-y divide-border">
            {COMPARACION_MOCK.map((c) => {
              const Icono = RESULTADO_ICONO[c.estado]
              return (
                <div
                  key={c.campo}
                  className="grid grid-cols-1 gap-1.5 px-3 py-2.5 text-sm sm:grid-cols-12 sm:items-center sm:gap-0"
                >
                  <span className="col-span-3 font-medium">{c.campo}</span>
                  <span className="col-span-3 text-xs text-muted-foreground sm:line-through sm:decoration-destructive/50">
                    {c.anterior}
                  </span>
                  <span className="col-span-3 text-xs font-semibold text-success">
                    {c.nuevo}
                  </span>
                  <span className="col-span-3">
                    <Badge variant="outline" className={cn('gap-1', RESULTADO_BADGE[c.estado])}>
                      <Icono className="h-3 w-3" />
                      {RESULTADO_LABEL[c.estado]}
                    </Badge>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-primary" />
            Historial de versiones
          </h3>
          <Badge variant="secondary" className="ml-auto">
            {versiones.length} versiones
          </Badge>
        </div>

        <div className="mt-3 space-y-2">
          {versiones.map((v) => {
            const esActual = v.version === versionActual
            const Icono = RESULTADO_ICONO[v.resultado]
            return (
              <div
                key={v.version}
                className={cn(
                  'rounded-lg border bg-card p-3 transition-colors',
                  esActual && 'border-primary/40 bg-primary/5',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        v{v.version}
                      </span>
                      {esActual && (
                        <Badge className="gap-1">
                          <BadgeCheck className="h-3 w-3" />
                          Actual
                        </Badge>
                      )}
                      {verSeleccionada?.version === v.version && (
                        <Badge variant="secondary">En vista previa</Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {v.motivo}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{v.usuario}</span>
                      <span>·</span>
                      <span>
                        {format(parseISO(v.fecha), 'dd MMM yyyy · HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant="outline" className={PROCESAMIENTO_BADGE[v.estadoProcesamiento]}>
                      {PROCESAMIENTO_LABEL[v.estadoProcesamiento]}
                    </Badge>
                    <Badge variant="outline" className={RESULTADO_BADGE[v.resultado]}>
                      <Icono className="mr-1 h-3 w-3" />
                      {RESULTADO_LABEL[v.resultado]}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setVerId(v.version)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver versión
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() =>
                      toast.info('Comparar versiones', {
                        description: `Comparando v${anterior.version} vs. v${actual.version}.`,
                      })
                    }
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    Comparar versiones
                  </Button>
                  {!esActual && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => marcarActual(v)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Marcar versión actual
                    </Button>
                  )}
                </div>

                {verSeleccionada?.version === v.version && (
                  <div className="mt-3 rounded-md border border-dashed bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Vista previa simulada
                    </p>
                    <div className="mt-2 flex items-start gap-3">
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded border bg-background">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <InfoCampo etiqueta="Versión" valor={`v${v.version}`} mono />
                        <InfoCampo etiqueta="Usuario" valor={v.usuario} />
                        <InfoCampo etiqueta="Fecha" valor={formatFecha(v.fecha.slice(0, 10))} />
                        <InfoCampo etiqueta="Tamaño" valor={formatBytes(documento.tamaño)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function InfoCampo({
  etiqueta,
  valor,
  mono,
}: {
  etiqueta: string
  valor: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <span className={cn('mt-0.5 font-medium', mono && 'font-mono text-xs')}>
        {valor}
      </span>
    </div>
  )
}