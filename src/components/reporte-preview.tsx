import {
  AlertTriangle,
  Building2,
  CalendarRange,
  CheckCircle2,
  Database,
  Download,
  FileBarChart,
  FileDown,
  Gauge,
  Hash,
  Landmark,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ProyectoEstadoBadge } from '@/components/proyecto-estado-badge'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO, ESTADO_NEUTRO } from '@/utils/estados-clases'
import { useProyectos } from '@/data/proyectos-store'
import { useObservaciones } from '@/data/observaciones-store'
import { useAnalisis } from '@/data/analisis-store'
import { obtenerEstadoDocumentos } from '@/data/documentos-store'
import { exportarReportePDF, imprimirReporteHTML, type DatosReportePDF } from '@/utils/export-import'
import { recomendacionesPara } from '@/utils/recomendaciones'

type Criticidad = 'critica' | 'alta' | 'media' | 'baja'
type EstadoObs = 'nueva' | 'asignada' | 'en_revision' | 'justificada' | 'resuelta'

interface ObservacionPrev {
  codigo: string
  partida: string
  tipo: string
  criticidad: Criticidad
  estado: EstadoObs
}

interface ReportePrev {
  tipo: string
  proyecto: string
  nombre: string
  fecha: string
  responsable: string
}

const CRITICIDAD_LABEL: Record<Criticidad, string> = {
  critica: 'CrÃ­tica',
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
  en_revision: 'En revisiÃ³n',
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

interface ResumenItem {
  label: string
  valor: number
  icono: LucideIcon
  tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export function ReportePreview({
  reporte,
  open,
  onOpenChange,
}: {
  reporte: ReportePrev
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const proyectos = useProyectos()
  const observaciones = useObservaciones()
  const analisis = useAnalisis()

  const proyecto = proyectos.find((p) => p.codigo === reporte.proyecto)

  if (!proyecto) return null

  const a = analisis.find((x) => x.codigo === reporte.proyecto) ?? null
  const observacionesProyecto = observaciones.filter(
    (o) => o.proyecto === reporte.proyecto,
  )
  const docs = a?.documentosAnalizados ?? 0

  const resumen = {
    documentos: docs,
    verificaciones: docs * 6 + 12,
    coincidencias: Math.round(docs * 0.72),
    advertencias: a?.observaciones ?? 0,
    inconsistencias: a?.inconsistencias ?? 0,
    indice: a && a.puntaje > 0 ? a.puntaje : 40,
  }

  const observacionesPreview: ObservacionPrev[] = observacionesProyecto
    .slice(0, 4)
    .map((o) => ({
      codigo: o.codigo,
      partida: o.partida,
      tipo: o.tipoInconsistencia,
      criticidad: o.criticidad,
      estado: o.estado,
    }))

  const recomendaciones = recomendacionesPara(reporte.tipo)

  const resumenItems: ResumenItem[] = [
    { label: 'Documentos analizados', valor: resumen.documentos, icono: Database, tono: 'info' },
    { label: 'Verificaciones ejecutadas', valor: resumen.verificaciones, icono: FileBarChart, tono: 'default' },
    { label: 'Coincidencias', valor: resumen.coincidencias, icono: CheckCircle2, tono: 'success' },
    { label: 'Advertencias', valor: resumen.advertencias, icono: Gauge, tono: 'warning' },
    { label: 'Inconsistencias', valor: resumen.inconsistencias, icono: AlertTriangle, tono: 'danger' },
    { label: 'Ãndice de coherencia', valor: resumen.indice, icono: Scale, tono: 'info' },
  ]

  const datosPDF: DatosReportePDF = {
    reporte: {
      nombre: reporte.nombre,
      tipo: reporte.tipo,
      proyecto: reporte.proyecto,
      fecha: reporte.fecha,
      responsable: reporte.responsable,
      estado: 'generado',
    },
    proyecto,
    resumen: {
      puntaje: resumen.indice,
      documentosAnalizados: resumen.documentos,
      observaciones: resumen.advertencias,
      inconsistencias: resumen.inconsistencias,
      documentosConError: a?.documentosConError ?? 0,
    },
    documentos: obtenerEstadoDocumentos(proyecto.id).documentos.map((d) => ({
      nombre: d.nombre,
      categoria: d.categoria,
      estado: d.estadoIa,
    })),
    coherencia: {
      indice: resumen.indice,
      verificaciones: resumen.verificaciones,
      coincidencias: resumen.coincidencias,
    },
    observaciones: observacionesProyecto.slice(0, 12).map((o) => ({
      codigo: o.codigo,
      partida: o.partida,
      tipo: o.tipoInconsistencia,
      criticidad: o.criticidad,
      estado: o.estado,
    })),
    resumenContenido: [
      `Se analizaron ${resumen.documentos} documento(s) del expediente tÃ©cnico ${reporte.proyecto}.`,
      `El motor de anÃ¡lisis registrÃ³ ${resumen.advertencias} observaciÃ³n(es) y ${resumen.inconsistencias} inconsistencia(s) de criticidad crÃ­tica.`,
      `El Ã­ndice de coherencia documental es de ${resumen.indice}%.`,
    ],
    recomendaciones,
    nombreArchivo: reporte.nombre,
  }

  const descargar = () => {
    exportarReportePDF(datosPDF)
    toast.success('Reporte exportado', {
      description: `Se descargÃ³ "${reporte.nombre}.pdf".`,
    })
  }

  const imprimir = () => {
    imprimirReporteHTML(datosPDF)
    toast.info('Enviando a impresiÃ³n', {
      description: `Abrir el cuadro de diÃ¡logo de impresiÃ³n para "${reporte.nombre}".`,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-x-hidden overflow-y-auto border-l-0 sm:max-w-2xl"
      >
        <SheetHeader className="pb-1">
          <SheetTitle>Vista previa del reporte</SheetTitle>
          <SheetDescription>
            {reporte.nombre} Â· {reporte.proyecto}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={imprimir}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Volver
            </Button>
            <Button size="sm" onClick={descargar}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="space-y-6 p-4 text-slate-800 sm:p-6">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    HH Intelligence
                  </p>
                  <p className="max-w-md truncate text-sm font-medium text-slate-600">
                    {proyecto.nombre}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-slate-900">
                  {reporte.nombre}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatFecha(reporte.fecha.slice(0, 10))}
                </p>
              </div>
            </header>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Hash className="h-4 w-4 text-indigo-600" />
                Datos del expediente
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Campo icono={Building2} etiqueta="Nombre del proyecto" valor={proyecto.nombre} />
                <Campo icono={Hash} etiqueta="CÃ³digo" valor={proyecto.codigo} mono />
                <Campo icono={Landmark} etiqueta="Entidad" valor={proyecto.entidad} />
                <Campo icono={UserRound} etiqueta="Responsable" valor={reporte.responsable} />
                <Campo icono={CalendarRange} etiqueta="Fecha del reporte" valor={formatFecha(reporte.fecha.slice(0, 10))} />
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    <FileDown className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Estado del expediente</span>
                    <div className="mt-0.5">
                      <ProyectoEstadoBadge estado={proyecto.estado} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-slate-200" />

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Scale className="h-4 w-4 text-indigo-600" />
                Resumen del anÃ¡lisis
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {resumenItems.map((item) => {
                  const Icono = item.icono
                  return (
                    <div
                      key={item.label}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <Icono
                        className={cn(
                          'mb-2 h-4 w-4',
                          item.tono === 'success' && 'text-success',
                          item.tono === 'warning' && 'text-warning',
                          item.tono === 'danger' && 'text-destructive',
                          item.tono === 'info' && 'text-info',
                          item.tono === 'default' && 'text-slate-600',
                        )}
                      />
                      <p className="text-xl font-bold text-slate-900">
                        {item.valor}
                      </p>
                      <p className="text-xs leading-tight text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>

            <Separator className="bg-slate-200" />

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Principales observaciones
              </h3>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="hidden grid-cols-12 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 lg:grid">
                  <span className="col-span-2">CÃ³digo</span>
                  <span className="col-span-3">Partida</span>
                  <span className="col-span-3">Tipo</span>
                  <span className="col-span-2">Criticidad</span>
                  <span className="col-span-2">Estado</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {observacionesPreview.map((o) => (
                    <div
                      key={o.codigo}
                      className="grid grid-cols-1 gap-2 px-3 py-3 text-sm lg:grid-cols-12 lg:items-center lg:gap-0 lg:py-2.5"
                    >
                      <span className="col-span-2 font-mono text-xs font-medium text-indigo-700">
                        {o.codigo}
                      </span>
                      <span className="col-span-3 truncate font-medium text-slate-800">
                        {o.partida}
                      </span>
                      <span className="col-span-3 truncate text-slate-600">
                        {o.tipo}
                      </span>
                      <span className="col-span-2">
                        <Badge variant="outline" className={CRITICIDAD_BADGE[o.criticidad]}>
                          {CRITICIDAD_LABEL[o.criticidad]}
                        </Badge>
                      </span>
                      <span className="col-span-2">
                        <Badge variant="outline" className={ESTADO_BADGE[o.estado]}>
                          {ESTADO_LABEL[o.estado]}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Separator className="bg-slate-200" />

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Recomendaciones
              </h3>
              <ul className="space-y-2">
                {recomendaciones.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={imprimir}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button size="sm" onClick={descargar}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Campo({
  icono: Icono,
  etiqueta,
  valor,
  mono,
}: {
  icono: LucideIcon
  etiqueta: string
  valor: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-500">
        <Icono className="h-4 w-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-slate-500">{etiqueta}</span>
        <span
          className={cn(
            'mt-0.5 text-sm font-medium text-slate-800',
            mono && 'font-mono text-xs',
          )}
        >
          {valor}
        </span>
      </div>
    </div>
  )
}
