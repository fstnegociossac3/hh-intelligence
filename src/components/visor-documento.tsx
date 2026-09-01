import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Navigation,
  PanelLeft,
  RotateCw,
  ScanLine,
  Search,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/utils/cn'
import { formatFecha } from '@/utils/formatters'
import { Badge } from '@/components/ui/badge'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_CRITICO, ESTADO_INFO } from '@/utils/estados-clases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import type { DocumentoLista, EstadoIa } from '@/data/proyecto-detalle'

type TipoVisor = 'pdf' | 'excel' | 'plano'

const ESTADO_IA_LABEL: Record<EstadoIa, string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  procesado: 'Procesado',
  error: 'Error',
}

const ESTADO_IA_CLASE: Record<EstadoIa, string> = {
  pendiente: ESTADO_WARNING,
  procesando: ESTADO_INFO,
  procesado: ESTADO_OK,
  error: ESTADO_CRITICO,
}

function tipoDe(nombre: string): string {
  return (nombre.split('.').pop() ?? '').toLowerCase()
}

function detectarTipo(documento: DocumentoLista): TipoVisor {
  const ext = tipoDe(documento.nombre)
  if (ext === 'xlsx' || ext === 'xls') return 'excel'
  if (documento.categoria === 'Planos' || ext === 'dwg') return 'plano'
  return 'pdf'
}

function iconoTipo(tipo: TipoVisor): LucideIcon {
  if (tipo === 'excel') return FileSpreadsheet
  if (tipo === 'plano') return ScanLine
  return FileText
}

type TipoIA =
  | 'presupuesto'
  | 'metrados'
  | 'cronograma'
  | 'especificaciones'
  | 'planos'

interface FilaIA {
  id: string
  clave: string
  columnas: (string | number)[]
  confianza: number
}

interface ConfigIA {
  etiqueta: string
  columnas: string[]
  filas: FilaIA[]
  confianza: number
}

const PLANOS_IA_FILAS: FilaIA[] = [
  { id: 'pl-01', clave: 'Sala', columnas: ['AR-01', 'Ambiente', 'Arquitectura', 'Lámina 01'], confianza: 98 },
  { id: 'pl-02', clave: 'Oficina', columnas: ['AR-02', 'Ambiente', 'Arquitectura', 'Lámina 01'], confianza: 95 },
  { id: 'pl-03', clave: 'Archivo', columnas: ['AR-03', 'Ambiente', 'Arquitectura', 'Lámina 01'], confianza: 93 },
  { id: 'pl-04', clave: 'Cocina', columnas: ['AR-04', 'Ambiente', 'Arquitectura', 'Lámina 02'], confianza: 90 },
  { id: 'pl-05', clave: 'Área común', columnas: ['AR-05', 'Circulación', 'Arquitectura', 'Lámina 02'], confianza: 87 },
]

const ESPECIFICACIONES_IA_FILAS: FilaIA[] = [
  { id: 'esp-01', clave: 'Concreto armado', columnas: ['01', 'Resistencia f\'c=210 kg/cm²', 'E.060', 'Concreto premezclado'], confianza: 98 },
  { id: 'esp-02', clave: 'Acero de refuerzo', columnas: ['02', 'Grado 60, fy=4200 kg/cm²', 'E.060', 'Acero corrugado'], confianza: 96 },
  { id: 'esp-03', clave: 'Encofrado', columnas: ['03', 'Madera cepillada, 3 usos', 'E.060', 'Madera tornillo'], confianza: 93 },
  { id: 'esp-04', clave: 'Tarraj eo', columnas: ['04', 'Cemento-arena 1:5, e=1.5 cm', 'E.070', 'Mortero'], confianza: 91 },
  { id: 'esp-05', clave: 'Pintura', columnas: ['05', 'Látex lavable, 2 manos', 'E.100', 'Pintura acrílica'], confianza: 87 },
]

const CRONOGRAMA_IA_FILAS: FilaIA[] = [
  { id: 'cr-01', clave: 'Obras provisionales', columnas: ['Obras provisionales', '2025-09-01', '2025-09-10', '10', '100%'], confianza: 98 },
  { id: 'cr-02', clave: 'Movimiento de tierras', columnas: ['Movimiento de tierras', '2025-09-11', '2025-09-30', '20', '82%'], confianza: 95 },
  { id: 'cr-03', clave: 'Concreto simple', columnas: ['Concreto simple', '2025-10-01', '2025-10-15', '15', '64%'], confianza: 93 },
  { id: 'cr-04', clave: 'Concreto armado', columnas: ['Concreto armado', '2025-10-16', '2025-11-30', '46', '48%'], confianza: 90 },
  { id: 'cr-05', clave: 'Acero de refuerzo', columnas: ['Acero de refuerzo', '2025-10-20', '2025-11-25', '37', '41%'], confianza: 87 },
]

const METRADOS_IA_FILAS: FilaIA[] = [
  { id: 'mt-01', clave: 'Obras provisionales', columnas: ['01', 'Obras provisionales', 'GLB', '1.00'], confianza: 98 },
  { id: 'mt-02', clave: 'Movimiento de tierras', columnas: ['02', 'Movimiento de tierras', 'M3', '1,250.00'], confianza: 96 },
  { id: 'mt-03', clave: 'Concreto simple', columnas: ['03', 'Concreto simple', 'M3', '420.00'], confianza: 93 },
  { id: 'mt-04', clave: 'Concreto armado', columnas: ['04', 'Concreto armado', 'M3', '680.00'], confianza: 90 },
  { id: 'mt-05', clave: 'Acero de refuerzo', columnas: ['05', 'Acero de refuerzo', 'KG', '12,500.00'], confianza: 87 },
]

const PRESUPUESTO_IA_FILAS: FilaIA[] = [
  { id: 'pr-01', clave: 'Obras provisionales', columnas: ['01', 'Obras provisionales', 'GLB', '1.00', '12,000.00', '12,000.00'], confianza: 98 },
  { id: 'pr-02', clave: 'Movimiento de tierras', columnas: ['02', 'Movimiento de tierras', 'M3', '1,250.00', '38.50', '48,125.00'], confianza: 96 },
  { id: 'pr-03', clave: 'Concreto simple', columnas: ['03', 'Concreto simple', 'M3', '420.00', '410.00', '172,200.00'], confianza: 93 },
  { id: 'pr-04', clave: 'Concreto armado', columnas: ['04', 'Concreto armado', 'M3', '680.00', '520.00', '353,600.00'], confianza: 91 },
  { id: 'pr-05', clave: 'Acero de refuerzo', columnas: ['05', 'Acero de refuerzo', 'KG', '12,500.00', '6.80', '85,000.00'], confianza: 87 },
]

const TIPO_IA_POR_CATEGORIA: Record<string, TipoIA> = {
  Presupuesto: 'presupuesto',
  'Presupuesto y Metrados': 'presupuesto',
  Metrados: 'metrados',
  Cronograma: 'cronograma',
  'Especificaciones técnicas': 'especificaciones',
  Planos: 'planos',
}

const CONFIG_IA: Record<TipoIA, Omit<ConfigIA, 'filas' | 'confianza'>> = {
  presupuesto: {
    etiqueta: 'PRESUPUESTO',
    columnas: ['Código', 'Partida', 'Unidad', 'Cantidad', 'Precio unitario', 'Parcial'],
  },
  metrados: {
    etiqueta: 'METRADOS',
    columnas: ['Código', 'Descripción', 'Unidad', 'Cantidad'],
  },
  cronograma: {
    etiqueta: 'CRONOGRAMA',
    columnas: ['Actividad', 'Fecha inicio', 'Fecha fin', 'Duración', 'Avance'],
  },
  especificaciones: {
    etiqueta: 'ESPECIFICACIONES',
    columnas: ['Partida', 'Característica técnica', 'Norma', 'Material'],
  },
  planos: {
    etiqueta: 'PLANOS',
    columnas: ['Código de elemento', 'Tipo', 'Especialidad', 'Referencia'],
  },
}

const FILAS_IA: Record<TipoIA, FilaIA[]> = {
  presupuesto: PRESUPUESTO_IA_FILAS,
  metrados: METRADOS_IA_FILAS,
  cronograma: CRONOGRAMA_IA_FILAS,
  especificaciones: ESPECIFICACIONES_IA_FILAS,
  planos: PLANOS_IA_FILAS,
}

function detectarTipoIA(documento: DocumentoLista): TipoIA {
  const porCategoria = TIPO_IA_POR_CATEGORIA[documento.categoria]
  if (porCategoria) return porCategoria
  if (tipoDe(documento.nombre) === 'xlsx' || tipoDe(documento.nombre) === 'xls')
    return 'presupuesto'
  if (documento.categoria === 'Planos' || tipoDe(documento.nombre) === 'dwg')
    return 'planos'
  return 'especificaciones'
}

const CONFIANZA_POR_TIPO: Record<TipoIA, number> = {
  presupuesto: 96,
  metrados: 93,
  cronograma: 91,
  especificaciones: 87,
  planos: 84,
}

function colorConfianza(confianza: number) {
  if (confianza >= 95) return '[&>div]:bg-emerald-500'
  if (confianza >= 88) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-orange-500'
}

function generarPaginas(tipo: TipoVisor): { numero: number; label: string }[] {
  const total = tipo === 'plano' ? 1 : tipo === 'excel' ? 4 : 8
  const prefijo = tipo === 'excel' ? 'Hoja' : 'Página'
  return Array.from({ length: total }, (_, i) => ({
    numero: i + 1,
    label: `${prefijo} ${i + 1}`,
  }))
}

function EstadoIaBadge({ estado }: { estado: EstadoIa }) {
  return (
    <Badge variant="outline" className={ESTADO_IA_CLASE[estado]}>
      {ESTADO_IA_LABEL[estado]}
    </Badge>
  )
}

function MiniPagina({ tipo }: { tipo: TipoVisor }) {
  if (tipo === 'plano') {
    return (
      <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-sm border border-blue-300 bg-blue-50">
        <ScanLine className="h-4 w-4 text-blue-600" />
      </div>
    )
  }
  return (
    <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-sm border bg-muted/60">
      <ScanLine className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

interface PaginaItem {
  numero: number
  label: string
}

function Miniaturas({
  paginas,
  actual,
  onSeleccionar,
  tipo,
}: {
  paginas: PaginaItem[]
  actual: number
  onSeleccionar: (i: number) => void
  tipo: TipoVisor
}) {
  return (
    <div className="flex flex-col gap-2">
      {paginas.map((pagina) => (
        <button
          key={pagina.numero}
          type="button"
          onClick={() => onSeleccionar(pagina.numero - 1)}
          className={cn(
            'flex items-center gap-2.5 rounded-md border p-2 text-left transition-colors',
            pagina.numero - 1 === actual
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted',
          )}
        >
          <MiniPagina tipo={tipo} />
          <span className="min-w-0 flex-1 truncate text-xs font-medium">
            {pagina.label}
          </span>
          <span
            className={cn(
              'rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
              pagina.numero - 1 === actual
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {pagina.numero}
          </span>
        </button>
      ))}
    </div>
  )
}

function TablaExcel({ resaltar }: { resaltar?: Set<string> }) {
  const cabeceras = ['Partida', 'Descripción', 'Und.', 'Cant.', 'P.U.', 'Parcial']
  const filasExcel = [
    ['01', 'Obras provisionales', 'GLB', '1.00', '12,000.00', '12,000.00'],
    ['02', 'Movimiento de tierras', 'M3', '1,250.00', '38.50', '48,125.00'],
    ['03', 'Concreto simple', 'M3', '420.00', '410.00', '172,200.00'],
    ['04', 'Concreto armado', 'M3', '680.00', '520.00', '353,600.00'],
    ['05', 'Acero de refuerzo', 'KG', '12,500.00', '6.80', '85,000.00'],
    ['06', 'Encofrado y desencofrado', 'M2', '1,800.00', '28.00', '50,400.00'],
  ]
  return (
    <div className="w-full overflow-auto rounded-md border bg-white shadow-sm">
      <table className="w-full min-w-[560px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50">
            {cabeceras.map((c) => (
              <th
                key={c}
                className="border-b border-r px-2 py-2 text-left font-medium text-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filasExcel.map((fila, i) => {
            const estaResaltado = resaltar?.has(fila[1] as string)
            return (
              <tr
                key={i}
                className={cn(
                  i % 2 === 1 && !estaResaltado && 'bg-muted/30',
                  estaResaltado &&
                    'bg-emerald-50 outline outline-1 outline-emerald-400',
                )}
              >
                {fila.map((celda, j) => (
                  <td
                    key={j}
                    className={cn(
                      'border-b border-r px-2 py-1.5 whitespace-nowrap',
                      j === 0 || j === 4 || j === 5 ? 'text-right' : '',
                    )}
                  >
                    {celda}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 font-medium">
            <td colSpan={5} className="border-r px-2 py-2 text-right">
              Costo directo
            </td>
            <td className="px-2 py-2 text-right">721,325.00</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function PlanoTecnico({
  nombre,
  resaltar,
}: {
  nombre: string
  resaltar?: Set<string>
}) {
  const habitaciones = ['Sala', 'Oficina', 'Archivo', 'Cocina']
  const comun = 'Área común'
  return (
    <div className="w-[640px] rounded-md border border-blue-300 bg-white p-2 shadow-sm">
      <div
        className="relative h-72 overflow-hidden rounded-sm border border-blue-200"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, rgba(59,130,246,0.10) 0 1px, transparent 1px 24px), repeating-linear-gradient(to bottom, rgba(59,130,246,0.10) 0 1px, transparent 1px 24px)',
        }}
      >
        <div className="absolute right-3 top-3 flex flex-col items-center text-blue-700">
          <Navigation className="h-4 w-4" />
          <span className="text-[9px] font-medium">N</span>
        </div>

        <div className="absolute inset-x-8 bottom-12 top-8 rounded-sm border-2 border-blue-400 bg-white/70">
          <div className="absolute inset-y-4 left-4 right-1/2 grid grid-cols-2 gap-2 border-r border-blue-300 pr-3">
            {habitaciones.map((r) => (
              <div
                key={r}
                className={cn(
                  'flex items-center justify-center rounded-sm border border-blue-300 text-[9px] font-medium',
                  resaltar?.has(r)
                    ? 'bg-emerald-300 outline outline-2 outline-emerald-500'
                    : 'bg-blue-100/50',
                )}
              >
                {r}
              </div>
            ))}
          </div>
          <div
            className={cn(
              'absolute inset-y-4 right-4 left-1/2 flex items-center justify-center gap-2 rounded-sm border border-blue-300 text-[9px] font-medium',
              resaltar?.has(comun)
                ? 'bg-emerald-300 outline outline-2 outline-emerald-500'
                : 'bg-blue-100/50',
            )}
          >
            {comun}
          </div>
        </div>

        <div className="absolute bottom-2 left-8 right-8 flex items-center justify-between text-[9px] text-blue-700">
          <span>← 8.50 m →</span>
          <span>← 12.00 m →</span>
        </div>
      </div>
      <p className="mt-1 flex items-center justify-between gap-2 text-[10px] text-blue-800">
        <span className="truncate font-medium">
          {nombre.replace(/\.\w+$/, '')}
        </span>
        <span className="shrink-0">ESC 1/100 · LÁM. 01</span>
      </p>
    </div>
  )
}

function PaginaPDF({
  nombre,
  numero,
  total,
  resaltar,
}: {
  nombre: string
  numero: number
  total: number
  resaltar?: Set<string>
}) {
  const secciones = [
    {
      texto: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Este documento corresponde a la memoria descriptiva del expediente técnico del proyecto.',
      clave: 'Obras provisionales',
    },
    {
      texto: 'Se detallan las especificaciones técnicas de los componentes estructurales, acabados e instalaciones de acuerdo con la normativa vigente.',
      clave: 'Concreto armado',
    },
    {
      texto: 'Incluye los metrados referenciales, análisis de precios unitarios y el presupuesto estimado de la obra.',
      clave: 'Acero de refuerzo',
    },
  ]
  return (
    <div className="w-[560px] rounded-md border bg-white p-8 shadow-sm">
      <p className="border-b pb-2 text-sm font-semibold text-foreground">
        {nombre.replace(/\.\w+$/, '')}
      </p>
      <p className="mt-4 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Sección {numero}
      </p>
      <div className="mt-2 space-y-3 text-xs text-muted-foreground">
        {secciones.map((s) => (
          <p
            key={s.clave}
            className={cn(
              'rounded p-2',
              resaltar?.has(s.clave)
                ? 'bg-emerald-50 outline outline-1 outline-emerald-400'
                : 'bg-muted/50',
            )}
          >
            {s.texto}
          </p>
        ))}
        <div className="flex gap-3">
          <div className="h-14 w-1/3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20" />
          <div className="flex-1 space-y-1.5 pt-1">
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-5/6 rounded bg-muted" />
            <div className="h-1.5 w-2/3 rounded bg-muted" />
          </div>
        </div>
      </div>
      <p className="mt-6 flex items-center justify-between border-t pt-2 text-[10px] text-muted-foreground">
        <span>{nombre}</span>
        <span>
          {numero} / {total}
        </span>
      </p>
    </div>
  )
}

function PanelPreview({
  documento,
  tipo,
  pagina,
  totalPaginas,
  zoom,
  rotar,
  ajustarAncho,
  resaltar,
  className,
}: {
  documento: DocumentoLista
  tipo: TipoVisor
  pagina: number
  totalPaginas: number
  zoom: number
  rotar: number
  ajustarAncho: boolean
  resaltar?: Set<string>
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-center overflow-auto bg-slate-100 p-4',
        className ?? 'min-h-0 flex-1',
      )}
    >
      <div
        style={{
          transform: `scale(${zoom / 100}) rotate(${rotar}deg)`,
          width: ajustarAncho ? '100%' : undefined,
          transformOrigin: 'top center',
        }}
        className="mx-auto shrink-0 transition-transform"
      >
        {tipo === 'excel' ? (
          <TablaExcel resaltar={resaltar} />
        ) : tipo === 'plano' ? (
          <PlanoTecnico nombre={documento.nombre} resaltar={resaltar} />
        ) : (
          <PaginaPDF
            nombre={documento.nombre}
            numero={pagina + 1}
            total={totalPaginas}
            resaltar={resaltar}
          />
        )}
      </div>
    </div>
  )
}

function PanelPaginas({
  tipo,
  paginas,
  actual,
  buscar,
  onBuscar,
  onSeleccionar,
  className,
}: {
  tipo: TipoVisor
  paginas: PaginaItem[]
  actual: number
  buscar: string
  onBuscar: (v: string) => void
  onSeleccionar: (i: number) => void
  className?: string
}) {
  const Icono = iconoTipo(tipo)
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icono className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Páginas</span>
        <Badge variant="outline" className="ml-auto">
          {paginas.length}
        </Badge>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-8"
          placeholder="Buscar página..."
          value={buscar}
          onChange={(e) => onBuscar(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {paginas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-muted-foreground">
            <Search className="h-5 w-5" />
            <span>No se encontraron páginas</span>
          </div>
        ) : (
          <Miniaturas
            paginas={paginas}
            actual={actual}
            onSeleccionar={onSeleccionar}
            tipo={tipo}
          />
        )}
      </div>
    </div>
  )
}

function PanelInfo({ documento }: { documento: DocumentoLista }) {
  const filas: [string, React.ReactNode][] = [
    [
      'Categoría',
      <Badge key="categoria" variant="secondary">
        {documento.categoria}
      </Badge>,
    ],
    ['Especialidad', documento.especialidad],
    ['Versión', `v${documento.version}`],
    ['Estado', <EstadoIaBadge key="estado" estado={documento.estadoIa} />],
    ['Responsable', documento.responsable],
    ['Fecha', formatFecha(documento.fecha)],
  ]
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Nombre
        </p>
        <p className="mt-0.5 break-words text-sm font-medium">
          {documento.nombre}
        </p>
      </div>
      <Separator />
      {filas.map(([k, v]) => (
        <div
          key={k}
          className="flex items-start justify-between gap-2 text-sm"
        >
          <span className="shrink-0 text-muted-foreground">{k}</span>
          <span className="text-right font-medium">{v}</span>
        </div>
      ))}
    </div>
  )
}

function BarraHerramientas({
  tipo,
  pagina,
  totalPaginas,
  onPaginaAnterior,
  onPaginaSiguiente,
  zoom,
  onZoomMenos,
  onZoomMas,
  ajustarAncho,
  onAjustarAncho,
  onRotar,
  onAlternarIzquierda,
}: {
  tipo: TipoVisor
  pagina: number
  totalPaginas: number
  onPaginaAnterior: () => void
  onPaginaSiguiente: () => void
  zoom: number
  onZoomMenos: () => void
  onZoomMas: () => void
  ajustarAncho: boolean
  onAjustarAncho: () => void
  onRotar: () => void
  onAlternarIzquierda: () => void
}) {
  const Icono = iconoTipo(tipo)
  return (
    <div className="flex shrink-0 items-center gap-1 border-b bg-background px-2 py-1.5">
      <Button
        variant="ghost"
        size="icon"
        className="hidden h-8 w-8 md:inline-flex lg:hidden"
        onClick={onAlternarIzquierda}
        aria-label="Alternar panel de páginas"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={pagina === 0}
        onClick={onPaginaAnterior}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="flex min-w-20 items-center justify-center gap-1 text-xs">
        <Icono className="h-3.5 w-3.5 text-muted-foreground" />
        {pagina + 1} / {totalPaginas}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={pagina === totalPaginas - 1}
        onClick={onPaginaSiguiente}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomMenos}
        aria-label="Alejar"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="w-11 text-center text-xs tabular-nums">{zoom}%</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onZoomMas}
        aria-label="Acercar"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', ajustarAncho && 'bg-muted')}
        onClick={onAjustarAncho}
        aria-label="Ajustar ancho"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onRotar}
        aria-label="Rotar documento"
      >
        <RotateCw className="h-4 w-4" />
      </Button>
    </div>
  )
}

function ConfianzaIa({
  valor,
  compacto,
}: {
  valor: number
  compacto?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', compacto && 'w-24')}>
      <Progress value={valor} className={cn(colorConfianza(valor), compacto ? 'h-1.5' : 'h-2')} />
      <span className="w-9 shrink-0 text-right text-xs tabular-nums font-medium">
        {valor}%
      </span>
    </div>
  )
}

function CeldaConfianza({ valor }: { valor: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Progress value={valor} className={cn('h-1.5 w-12', colorConfianza(valor))} />
      <span className="w-9 text-right text-xs tabular-nums font-medium">
        {valor}%
      </span>
    </div>
  )
}

function PanelInfoExtraida({
  documento,
  onResaltar,
}: {
  documento: DocumentoLista
  onResaltar: (filas: Set<string>) => void
}) {
  const tipoIA = useMemo(() => detectarTipoIA(documento), [documento])
  const filas = useMemo(() => FILAS_IA[tipoIA], [tipoIA])
  const config = CONFIG_IA[tipoIA]
  const confianzaGlobal = CONFIANZA_POR_TIPO[tipoIA]

  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columnas = useMemo<ColumnDef<FilaIA>[]>(() => {
    const cols: ColumnDef<FilaIA>[] = [
      {
        id: 'seleccion',
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <button
            type="button"
            aria-label="Seleccionar todo"
            onClick={table.getToggleAllRowsSelectedHandler()}
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded border transition-colors',
              table.getIsAllRowsSelected()
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-muted',
            )}
          >
            {table.getIsAllRowsSelected() && <Check className="h-3 w-3" />}
          </button>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            aria-label={`Seleccionar fila ${row.index + 1}`}
            onClick={row.getToggleSelectedHandler()}
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded border transition-colors',
              row.getIsSelected()
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input hover:bg-muted',
            )}
          >
            {row.getIsSelected() && <Check className="h-3 w-3" />}
          </button>
        ),
      },
    ]
    config.columnas.forEach((nombre) => {
      cols.push({
        accessorKey: nombre,
        header: nombre,
        cell: ({ column, getValue }) => {
          const idx = config.columnas.indexOf(String(column.id))
          const valor = getValue<string | number>()
          return (
            <span
              className={cn(
                idx === 0
                  ? 'font-medium text-foreground'
                  : idx === 1
                    ? 'text-muted-foreground'
                    : 'text-foreground',
              )}
            >
              {valor}
            </span>
          )
        },
      })
    })
    cols.push({
      id: 'confianza',
      size: 110,
      header: 'Confianza',
      enableSorting: true,
      sortingFn: (a, b) => a.original.confianza - b.original.confianza,
      cell: ({ row }) => <CeldaConfianza valor={row.original.confianza} />,
    })
    return cols
  }, [config.columnas])

  const table = useReactTable({
    data: filas,
    columns: columnas,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  })

  const filasSeleccionadas = table
    .getSelectedRowModel()
    .rows.map((r) => r.original.clave)
  const seleccionarTodas = () => {
    table.toggleAllRowsSelected(true)
    onResaltar(new Set(filas.map((f) => f.clave)))
  }
  const limpiar = () => {
    table.resetRowSelection()
    onResaltar(new Set())
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            Información extraída por IA
            <Badge
              variant="secondary"
              className="gap-1 border-info/40 bg-info/10 text-info"
            >
              <ScanLine className="h-3 w-3" />
              Extraído automáticamente
            </Badge>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {config.etiqueta} · {filas.length} registros detectados
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-muted-foreground">
              Confianza IA
            </span>
            <ConfianzaIa valor={confianzaGlobal} compacto />
          </div>
          {filasSeleccionadas.length > 0 ? (
            <Button variant="outline" size="sm" className="h-7" onClick={limpiar}>
              Limpiar selección
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={seleccionarTodas}
            >
              Seleccionar todo
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            {table.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id}>
                {grupo.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'whitespace-nowrap text-xs',
                      header.id === 'seleccion' && 'w-10',
                      header.id === 'confianza' && 'text-right',
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            aria-label={`Ordenar por ${header.column.id}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {header.column.getIsSorted() === 'asc' ? (
                              '▲'
                            ) : header.column.getIsSorted() === 'desc' ? (
                              '▼'
                            ) : (
                              '↕'
                            )}
                          </button>
                        )}
                      </span>
                    )}
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
                  className="h-24 text-center text-muted-foreground"
                >
                  Sin información extraída para este documento.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={() => {
                    const proxima = { ...rowSelection }
                    if (row.getIsSelected()) {
                      delete proxima[row.id]
                    } else {
                      proxima[row.id] = true
                    }
                    setRowSelection(proxima)
                    const claves = filas
                      .filter((f) => proxima[f.id])
                      .map((f) => f.clave)
                    onResaltar(new Set(claves))
                  }}
                  className={cn(
                    'cursor-pointer',
                    row.getIsSelected() &&
                      'bg-primary/5 data-[state=selected]:bg-primary/5',
                  )}
                >
                  {row.getVisibleCells().map((celda) => (
                    <TableCell key={celda.id} className="whitespace-nowrap py-2">
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

      <div className="flex shrink-0 items-center gap-3 border-t bg-muted/20 px-4 py-1.5">
        <span className="text-xs text-muted-foreground">
          {filasSeleccionadas.length > 0
            ? `${filasSeleccionadas.length} fila(s) seleccionada(s) — resaltadas en la vista previa`
            : 'Selecciona una fila para resaltarla en la vista previa'}
        </span>
        <span className="ml-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <ScanLine className="h-3.5 w-3.5 text-primary" />
          Datos simulados · sin cruces entre documentos
        </span>
      </div>
    </div>
  )
}

export function VisorDocumento({
  documento,
  onCerrar,
}: {
  documento: DocumentoLista
  onCerrar: () => void
}) {
  const tipo = detectarTipo(documento)
  const paginas = useMemo(() => generarPaginas(tipo), [tipo])
  const [pagina, setPagina] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [rotar, setRotar] = useState(0)
  const [ajustarAncho, setAjustarAncho] = useState(false)
  const [izquierdaAbierta, setIzquierdaAbierta] = useState(true)
  const [buscarPagina, setBuscarPagina] = useState('')
  const [resaltarClaves, setResaltarClaves] = useState<Set<string>>(new Set())

  const paginasFiltradas = useMemo(
    () =>
      paginas.filter((p) =>
        p.label.toLowerCase().includes(buscarPagina.toLowerCase()),
      ),
    [paginas, buscarPagina],
  )

  const Icono = iconoTipo(tipo)
  const irPagina = (i: number) => setPagina(Math.min(Math.max(i, 0), paginas.length - 1))
  const irAnterior = () => irPagina(pagina - 1)
  const irSiguiente = () => irPagina(pagina + 1)

  const barra = (
    <BarraHerramientas
      tipo={tipo}
      pagina={pagina}
      totalPaginas={paginas.length}
      onPaginaAnterior={irAnterior}
      onPaginaSiguiente={irSiguiente}
      zoom={zoom}
      onZoomMenos={() => setZoom((z) => Math.max(25, z - 25))}
      onZoomMas={() => setZoom((z) => Math.min(300, z + 25))}
      ajustarAncho={ajustarAncho}
      onAjustarAncho={() => setAjustarAncho((v) => !v)}
      onRotar={() => setRotar((r) => (r + 90) % 360)}
      onAlternarIzquierda={() => setIzquierdaAbierta((v) => !v)}
    />
  )

  const preview = (
    <PanelPreview
      documento={documento}
      tipo={tipo}
      pagina={pagina}
      totalPaginas={paginas.length}
      zoom={zoom}
      rotar={rotar}
      ajustarAncho={ajustarAncho}
      resaltar={resaltarClaves}
      className="min-h-0 flex-1"
    />
  )

  const panelIA = (
    <PanelInfoExtraida
      documento={documento}
      onResaltar={setResaltarClaves}
    />
  )

  const panelPaginas = (
    <PanelPaginas
      tipo={tipo}
      paginas={paginasFiltradas}
      actual={pagina}
      buscar={buscarPagina}
      onBuscar={setBuscarPagina}
      onSeleccionar={setPagina}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b bg-muted/30 px-4 py-2.5 pr-12">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white',
            tipo === 'excel'
              ? 'bg-emerald-600'
              : tipo === 'plano'
                ? 'bg-blue-600'
                : 'bg-red-500',
          )}
        >
          <Icono className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{documento.nombre}</p>
          <p className="truncate text-xs text-muted-foreground">
            {documento.categoria} · {documento.especialidad}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onCerrar}
          aria-label="Cerrar visor"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="hidden min-h-0 flex-1 md:flex">
        <aside
          className={cn(
            'w-56 shrink-0 flex-col overflow-hidden border-r',
            izquierdaAbierta ? 'hidden md:flex' : 'hidden lg:flex',
          )}
        >
          {panelPaginas}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            {barra}
            {preview}
          </div>
          <div className="h-[38%] shrink-0 border-t p-2 lg:h-[40%]">
            {panelIA}
          </div>
        </div>

        <aside className="hidden w-64 shrink-0 overflow-y-auto border-l bg-background p-4 md:block">
          <PanelInfo documento={documento} />
        </aside>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden md:hidden">
        <Tabs defaultValue="documento" className="flex h-full flex-col">
          <TabsList className="mx-3 mt-3 w-auto">
            <TabsTrigger value="documento" className="flex-1">
              Información IA
            </TabsTrigger>
            <TabsTrigger value="informacion" className="flex-1">
              Detalles
            </TabsTrigger>
            <TabsTrigger value="paginas" className="flex-1">
              Páginas
            </TabsTrigger>
          </TabsList>
          <TabsContent value="documento" className="min-h-0 flex-1 p-2">
            {panelIA}
          </TabsContent>
          <TabsContent
            value="informacion"
            className="min-h-0 flex-1 overflow-y-auto p-4"
          >
            <PanelInfo documento={documento} />
          </TabsContent>
          <TabsContent value="paginas" className="min-h-0 flex-1">
            {panelPaginas}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}