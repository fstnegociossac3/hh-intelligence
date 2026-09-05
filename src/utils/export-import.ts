import { jsPDF } from 'jspdf'
import type { Proyecto } from '@/types'
import type { Observacion } from '@/data/observaciones-store'

const ESTADOS_PROYECTO = [
  'borrador',
  'documentacion',
  'en_analisis',
  'observado',
  'revisado',
]

const TIPOS_OBRA = [
  'Infraestructura',
  'Transportes',
  'Saneamiento',
  'Salud',
  'Educación',
  'Energía',
]

const CRITICIDADES_OBS = ['critica', 'alta', 'media', 'baja']

const ESTADOS_OBS = [
  'nueva',
  'asignada',
  'en_revision',
  'justificada',
  'resuelta',
]

export function descargarJSON(datos: unknown, nombre: string) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre.endsWith('.json') ? nombre : `${nombre}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function leerArchivoJSON<T>(file: File): Promise<T> {
  const texto = await file.text()
  return JSON.parse(texto) as T
}

/* ------------------------------------------------------------------ */
/*  Generación de PDF                                                  */
/* ------------------------------------------------------------------ */

const COLOR_PRIMARIO: [number, number, number] = [16, 43, 84]
const COLOR_SUAVE: [number, number, number] = [239, 242, 247]
const COLOR_TEXTO: [number, number, number] = [45, 55, 72]
const COLOR_MUTED: [number, number, number] = [120, 130, 145]

type Fila = (string | number)[]

function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(valor)
}

function encabezadoPagina(doc: jsPDF, titulo: string, subtitulo: string) {
  const ancho = doc.internal.pageSize.getWidth()
  doc.setFillColor(...COLOR_PRIMARIO)
  doc.rect(0, 0, ancho, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(titulo, 14, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(subtitulo, 14, 17)
  doc.setFontSize(7)
  doc.setTextColor(200, 210, 228)
  doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, ancho - 14, 12, {
    align: 'right',
  })
  doc.text('HH Intelligence', ancho - 14, 19, { align: 'right' })
  doc.setTextColor(...COLOR_TEXTO)
  doc.setFont('helvetica', 'normal')
}

function piePagina(doc: jsPDF) {
  const ancho = doc.internal.pageSize.getWidth()
  const alto = doc.internal.pageSize.getHeight()
  const pagina = doc.getNumberOfPages()
  doc.setDrawColor(...COLOR_SUAVE)
  doc.line(14, alto - 12, ancho - 14, alto - 12)
  doc.setFontSize(7)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(`Página ${pagina}`, ancho - 14, alto - 6, { align: 'right' })
  doc.text('Documento informativo generado por HH Intelligence', 14, alto - 6)
}

function guardarMargen(doc: jsPDF): number {
  const alto = doc.internal.pageSize.getHeight()
  return alto - 20
}

function tituloSeccion(doc: jsPDF, x: number, y: number, texto: string) {
  doc.setFillColor(...COLOR_PRIMARIO)
  doc.rect(x, y, 6, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_PRIMARIO)
  doc.text(texto, x + 10, y + 4.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_TEXTO)
}

function asegurarEspacio(doc: jsPDF, y: number, minimo: number): number {
  const limite = guardarMargen(doc)
  if (y + minimo > limite) {
    piePagina(doc)
    doc.addPage()
    encabezadoPagina(doc, 'Reporte', '')
    return 30
  }
  return y
}

function dibujarLista(
  doc: jsPDF,
  inicioY: number,
  items: string[],
  x: number,
  ancho: number,
  numerada = false,
): number {
  let y = inicioY
  const limite = guardarMargen(doc)
  items.forEach((item, i) => {
    const lineas = doc.splitTextToSize(item, ancho)
    const alto = lineas.length * 4 + 4
    if (y + alto > limite) {
      piePagina(doc)
      doc.addPage()
      encabezadoPagina(doc, 'Reporte', '')
      y = 30
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...COLOR_PRIMARIO)
    doc.text(numerada ? `${i + 1}.` : '•', x, y + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXTO)
    doc.text(lineas, x + 6, y + 3)
    y += alto
  })
  return y
}

export function exportarProyectosPDF(
  proyectos: Proyecto[],
  observaciones: Observacion[],
  nombreArchivo: string,
) {
  const doc = new jsPDF()
  const ancho = doc.internal.pageSize.getWidth()
  let y = 0

  encabezadoPagina(doc, 'Listado de Expedientes', 'Resumen de proyectos registrados')
  y = 34

  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(`${proyectos.length} expediente(s) registrado(s) en el sistema.`, 14, y)
  y += 10

  const columnas = ['Código', 'Nombre del proyecto', 'Entidad', 'Sector', 'Tipo de obra', 'Estado', 'Monto']
  const filas: Fila[] = proyectos.map((p) => [
    p.codigo,
    p.nombre,
    p.entidad,
    p.sector,
    p.tipoObra,
    estadoLabel(p.estado),
    formatoMoneda(p.monto),
  ])
  const anchos = [22, 55, 42, 28, 26, 22, 28]
  y = dibujarTablaReturnY(doc, y, columnas, filas, anchos, ancho - 28)

  documentarObservaciones(doc, observaciones)
  piePagina(doc)
  doc.save(nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`)
}

function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    borrador: 'Borrador',
    documentacion: 'Documentación',
    en_analisis: 'En análisis',
    observado: 'Observado',
    revisado: 'Revisado',
    nueva: 'Nueva',
    asignada: 'Asignada',
    en_revision: 'En revisión',
    justificada: 'Justificada',
    resuelta: 'Resuelta',
    critica: 'Crítica',
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
    pendiente: 'Pendiente',
    generado: 'Generado',
    conforme: 'Conforme',
    critico: 'Crítico',
    procesado: 'Procesado',
    procesando: 'Procesando',
    error: 'Con error',
  }
  return map[estado] ?? estado
}

function dibujarTablaReturnY(
  doc: jsPDF,
  inicioY: number,
  headers: string[],
  filas: Fila[],
  anchos: number[],
  totalAncho: number,
  tituloPagina = 'Reporte',
): number {
  let y = inicioY
  const x0 = 14
  const altoCelda = 8
  const margenPagina = guardarMargen(doc)

  const encabezado = () => {
    doc.setFillColor(...COLOR_PRIMARIO)
    doc.rect(x0, y, totalAncho, altoCelda, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    let cx = x0
    headers.forEach((h, i) => {
      doc.setTextColor(255, 255, 255)
      doc.text(h, cx + 3, y + altoCelda / 2 + 0.5, { baseline: 'middle' })
      cx += anchos[i]
    })
    y += altoCelda
  }

  encabezado()

  filas.forEach((fila) => {
    if (y + altoCelda > margenPagina) {
      piePagina(doc)
      doc.addPage()
      encabezadoPagina(doc, tituloPagina, '')
      y = 26
      encabezado()
    }
    let cx = x0
    doc.setFillColor(255, 255, 255)
    doc.rect(x0, y, totalAncho, altoCelda, 'F')
    doc.setDrawColor(...COLOR_SUAVE)
    doc.rect(x0, y, totalAncho, altoCelda, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR_TEXTO)
    fila.forEach((celda, i) => {
      doc.text(doc.splitTextToSize(String(celda), anchos[i] - 6), cx + 3, y + altoCelda / 2 + 0.5, { baseline: 'middle' })
      cx += anchos[i]
    })
    y += altoCelda
  })

  return y
}

function documentarObservaciones(doc: jsPDF, observaciones: Observacion[]) {
  if (!observaciones.length) return
  const ancho = doc.internal.pageSize.getWidth()
  let y = asegurarEspacio(doc, doc.getNumberOfPages() > 1 ? 30 : 40, 30)
  tituloSeccion(doc, 14, y, 'Observaciones registradas')
  y += 12

  const headers = ['Código', 'Proyecto', 'Partida', 'Crítica', 'Estado', 'Fecha']
  const filas: Fila[] = observaciones.map((o) => [
    o.codigo,
    o.proyecto,
    o.partida,
    nivelCriticidad(o.criticidad),
    estadoLabel(o.estado),
    o.fecha,
  ])
  const anchos = [22, 28, 60, 22, 22, 22]

  dibujarTablaReturnY(doc, y, headers, filas, anchos, ancho - 28)
}

function nivelCriticidad(c: string): string {
  const map: Record<string, string> = {
    critica: 'Crítica',
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  }
  return map[c] ?? c
}

function estadoCategoriaLabel(estado: string): string {
  const map: Record<string, string> = {
    completo: 'Completo',
    en_proceso: 'En proceso',
    con_error: 'Con error',
    pendiente: 'Pendiente',
  }
  return map[estado] ?? estado
}

interface CampoExpediente {
  campo: string
  valor: string
}

export function exportarExpedientePDF(opciones: {
  proyecto: Proyecto
  detalle: {
    actividad: { descripcion: string; usuario: string; fecha: string }[]
    categorias: { categoria: string; cantidad: number; procesados: number; estado: string }[]
    equipo: { nombre: string; rol: string; especialidad: string; estado: string }[]
    documentos: { nombre: string; categoria: string; procesado: boolean }[]
    observaciones: Observacion[]
  }
  nombreArchivo: string
}) {
  const { proyecto, detalle, nombreArchivo } = opciones
  const doc = new jsPDF()
  const ancho = doc.internal.pageSize.getWidth()
  let y = 0

  encabezadoPagina(doc, `Expediente ${proyecto.codigo}`, 'Reporte de expediente técnico')
  y = 34

  const datosResumen: CampoExpediente[] = [
    { campo: 'Código', valor: proyecto.codigo },
    { campo: 'Nombre', valor: proyecto.nombre },
    { campo: 'Entidad', valor: proyecto.entidad },
    { campo: 'Sector', valor: proyecto.sector },
    { campo: 'Tipo de obra', valor: proyecto.tipoObra },
    { campo: 'Ubicación', valor: proyecto.ubicacion },
    { campo: 'Responsable', valor: proyecto.responsable },
    { campo: 'Estado', valor: estadoLabel(proyecto.estado) },
    { campo: 'Avance', valor: `${proyecto.avance}%` },
    { campo: 'Monto', valor: formatoMoneda(proyecto.monto) },
    { campo: 'Creado', valor: proyecto.fechaCreacion },
    { campo: 'Actualizado', valor: proyecto.actualizadoEl },
  ]

  y = dibujarDetalleClaveValor(doc, y, ancho - 28, 'Datos generales', datosResumen)

  if (detalle.categorias.length) {
    const filasCategorias: Fila[] = detalle.categorias.map((c) => [
      c.categoria,
      c.cantidad,
      c.procesados,
      `${String(Math.round((c.procesados / Math.max(c.cantidad, 1)) * 100))}%`,
      estadoCategoriaLabel(c.estado),
    ])
    y = dibujarTablaReturnY(doc, y + 10, ['Categoría', 'Total', 'Procesados', 'Avance', 'Estado'], filasCategorias, [60, 20, 24, 22, 24], ancho - 28)
  }

  if (detalle.equipo.length) {
    const filasEquipo: Fila[] = detalle.equipo.map((e) => [
      e.nombre,
      e.rol,
      e.especialidad,
      e.estado === 'activo' ? 'Activo' : 'Inactivo',
    ])
    y = dibujarTablaReturnY(doc, y + 10, ['Nombre', 'Rol', 'Especialidad', 'Estado'], filasEquipo, [45, 40, 45, 20], ancho - 28)
  }

  if (detalle.documentos.length) {
    const filasDocs: Fila[] = detalle.documentos.map((d) => [
      d.nombre,
      d.categoria,
      d.procesado ? 'Procesado' : 'Pendiente',
    ])
    y = dibujarTablaReturnY(doc, y + 10, ['Documento', 'Categoría', 'Estado'], filasDocs, [70, 50, 30], ancho - 28)
  }

  if (detalle.observaciones.length) {
    const filasObs: Fila[] = detalle.observaciones.map((o) => [
      o.codigo,
      o.partida,
      nivelCriticidad(o.criticidad),
      estadoLabel(o.estado),
      o.fecha,
    ])
    y = dibujarTablaReturnY(doc, y + 10, ['Código', 'Partida', 'Crítica', 'Estado', 'Fecha'], filasObs, [22, 60, 22, 23, 23], ancho - 28)
  }

  if (detalle.actividad.length) {
    y = asegurarEspacio(doc, y + 10, 20)
    tituloSeccion(doc, 14, y, 'Actividad reciente')
    y += 10
    detalle.actividad.forEach((a) => {
      y = asegurarEspacio(doc, y, 8)
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_TEXTO)
      doc.text(`•  ${a.descripcion}`, 18, y)
      doc.setFontSize(7)
      doc.setTextColor(...COLOR_MUTED)
      doc.text(`${a.usuario} · ${a.fecha}`, 26, y + 4)
      y += 8
    })
  }

  piePagina(doc)
  doc.save(nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`)
}

function dibujarDetalleClaveValor(
  doc: jsPDF,
  inicioY: number,
  totalAncho: number,
  titulo: string,
  datos: CampoExpediente[],
): number {
  let y = inicioY
  const x0 = 14
  const margenPagina = guardarMargen(doc)

  {
    doc.setFillColor(...COLOR_PRIMARIO)
    doc.rect(x0, y, totalAncho, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(titulo, x0 + 3, y + 5)
    y += 8
  }

  const mitad = Math.ceil(datos.length / 2)
  const colIzq = datos.slice(0, mitad)
  const colDer = datos.slice(mitad)
  const anchoCol = (totalAncho - 6) / 2
  const altoFila = 8

  const dibujarColumna = (lista: CampoExpediente[], cx: number) => {
    let cy = y
    lista.forEach((d) => {
      if (cy + altoFila > margenPagina) {
        piePagina(doc)
        doc.addPage()
        encabezadoPagina(doc, titulo, '')
        cy = 26
        cx = x0
      }
      doc.setDrawColor(...COLOR_SUAVE)
      doc.setFillColor(...COLOR_SUAVE)
      doc.rect(cx, cy, anchoCol, altoFila, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...COLOR_MUTED)
      doc.text(d.campo.toUpperCase(), cx + 3, cy + 3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...COLOR_TEXTO)
      doc.text(doc.splitTextToSize(d.valor, anchoCol - 6), cx + 3, cy + 6)
      cy += altoFila
    })
    return cy
  }

  const yIzq = dibujarColumna(colIzq, x0)
  dibujarColumna(colDer, x0 + anchoCol + 6)

  return Math.max(yIzq, y)
}

export interface InformeDocumentoItem {
  nombre: string
  categoria: string
  estado: string
}

export interface InformeObservacionItem {
  codigo: string
  partida: string
  tipo: string
  criticidad: string
  estado: string
}

export interface InformeCoherenciaItem {
  indice: number
  verificaciones: number
  coincidencias: number
}

export interface DatosReportePDF {
  reporte: {
    nombre: string
    tipo: string
    proyecto: string
    fecha: string
    responsable: string
    estado: string
  }
  proyecto: Proyecto | null
  resumen: {
    puntaje: number
    documentosAnalizados: number
    observaciones: number
    inconsistencias: number
    documentosConError: number
  } | null
  documentos?: InformeDocumentoItem[]
  coherencia?: InformeCoherenciaItem | null
  observaciones?: InformeObservacionItem[]
  resumenContenido?: string[]
  recomendaciones?: string[]
  nombreArchivo: string
}

export function exportarReportePDF(opciones: DatosReportePDF) {
  const {
    reporte,
    proyecto,
    resumen,
    documentos,
    coherencia,
    observaciones,
    resumenContenido,
    recomendaciones,
    nombreArchivo,
  } = opciones
  const doc = new jsPDF()
  const ancho = doc.internal.pageSize.getWidth()
  let y = 0

  encabezadoPagina(doc, reporte.nombre, `Reporte del expediente ${reporte.proyecto}`)
  y = 36

  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(
    proyecto
      ? `Expediente: ${proyecto.nombre} · Entidad: ${proyecto.entidad}`
      : `Expediente ${reporte.proyecto}`,
    14,
    y,
  )
  y += 8
  doc.text(
    `Responsable: ${reporte.responsable} · Fecha: ${reporte.fecha.slice(0, 10)} · Estado: ${estadoLabel(reporte.estado)}`,
    14,
    y,
  )
  y += 12

  if (proyecto) {
    const datosResumen: CampoExpediente[] = [
      { campo: 'Código', valor: proyecto.codigo },
      { campo: 'Sector', valor: proyecto.sector },
      { campo: 'Tipo de obra', valor: proyecto.tipoObra },
      { campo: 'Ubicación', valor: proyecto.ubicacion },
      { campo: 'Avance', valor: `${proyecto.avance}%` },
      { campo: 'Monto', valor: formatoMoneda(proyecto.monto) },
    ]
    y = dibujarDetalleClaveValor(doc, y, ancho - 28, 'Datos del expediente', datosResumen)
  }

  if (resumen) {
    const filasResumen: Fila[] = [
      ['Puntaje de análisis', resumen.puntaje > 0 ? `${resumen.puntaje}%` : '—'],
      ['Documentos analizados', resumen.documentosAnalizados],
      ['Documentos con error', resumen.documentosConError],
      ['Observaciones', resumen.observaciones],
      ['Inconsistencias críticas', resumen.inconsistencias],
    ]
    y = dibujarTablaReturnY(
      doc,
      y + 10,
      ['Métrica', 'Valor'],
      filasResumen,
      [80, 30],
      ancho - 28,
      reporte.nombre,
    )
  }

  if (documentos && documentos.length) {
    y = asegurarEspacio(doc, y + 10, 20)
    tituloSeccion(doc, 14, y, 'Documentos analizados')
    y += 8
    const filasDocs: Fila[] = documentos.map((d, i) => [
      i + 1,
      d.nombre,
      d.categoria,
      estadoLabel(d.estado),
    ])
    y = dibujarTablaReturnY(
      doc,
      y,
      ['Nº', 'Documento', 'Categoría', 'Estado'],
      filasDocs,
      [8, 74, 48, 24],
      ancho - 28,
      reporte.nombre,
    )
  }

  if (coherencia) {
    y = asegurarEspacio(doc, y + 10, 20)
    tituloSeccion(doc, 14, y, 'Coherencia del expediente')
    y += 8
    const indice =
      coherencia.indice > 0 ? `${coherencia.indice}%` : '—'
    const nivel =
      coherencia.indice >= 80
        ? 'Alta'
        : coherencia.indice >= 60
          ? 'Media'
          : coherencia.indice > 0
            ? 'Baja'
            : '—'
    const filasCoherencia: Fila[] = [
      ['Índice de coherencia', indice],
      ['Nivel de coherencia', nivel],
      ['Verificaciones ejecutadas', coherencia.verificaciones],
      ['Coincidencias detectadas', coherencia.coincidencias],
    ]
    y = dibujarTablaReturnY(
      doc,
      y,
      ['Métrica', 'Valor'],
      filasCoherencia,
      [70, 40],
      ancho - 28,
      reporte.nombre,
    )
  }

  if (observaciones && observaciones.length) {
    y = asegurarEspacio(doc, y + 10, 20)
    tituloSeccion(doc, 14, y, 'Observaciones del expediente')
    y += 8
    const filasObs: Fila[] = observaciones.map((o) => [
      o.codigo,
      o.partida,
      o.tipo,
      nivelCriticidad(o.criticidad),
      estadoLabel(o.estado),
    ])
    y = dibujarTablaReturnY(
      doc,
      y,
      ['Código', 'Partida', 'Tipo', 'Criticidad', 'Estado'],
      filasObs,
      [20, 40, 48, 20, 20],
      ancho - 28,
      reporte.nombre,
    )
  }

  if (resumenContenido && resumenContenido.length) {
    y = asegurarEspacio(doc, y + 10, 20)
    tituloSeccion(doc, 14, y, 'Resumen del análisis')
    y += 10
    y = dibujarLista(doc, y, resumenContenido, 14, ancho - 40)
  }

  if (recomendaciones && recomendaciones.length) {
    y = asegurarEspacio(doc, y + 10, 20)
    tituloSeccion(doc, 14, y, 'Recomendaciones')
    y += 10
    y = dibujarLista(doc, y, recomendaciones, 14, ancho - 40, true)
  }

  piePagina(doc)
  doc.save(nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`)
}

function escapeHtml(valor: string): string {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function imprimirReporteHTML(opciones: DatosReportePDF) {
  const { reporte, proyecto, resumen, documentos, coherencia, observaciones, resumenContenido, recomendaciones } = opciones

  const filasResumen: string =
    resumen
      ? [
          ['Puntaje de análisis', `${resumen.puntaje}%`],
          ['Documentos analizados', String(resumen.documentosAnalizados)],
          ['Documentos con error', String(resumen.documentosConError)],
          ['Observaciones', String(resumen.observaciones)],
          ['Inconsistencias críticas', String(resumen.inconsistencias)],
        ]
          .map(
            ([k, v]) =>
              `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`,
          )
          .join('')
      : ''

  const filasDocs: string =
    documentos && documentos.length
      ? documentos
          .map(
            (d, i) =>
              `<tr><td class="num">${i + 1}</td><td>${escapeHtml(d.nombre)}</td><td>${escapeHtml(d.categoria)}</td><td>${escapeHtml(estadoLabel(d.estado))}</td></tr>`,
          )
          .join('')
      : ''

  const indice = coherencia ? (coherencia.indice > 0 ? `${coherencia.indice}%` : '—') : '—'
  const nivel =
    !coherencia || coherencia.indice <= 0
      ? '—'
      : coherencia.indice >= 80
        ? 'Alta'
        : coherencia.indice >= 60
          ? 'Media'
          : 'Baja'
  const filasCoherencia: string =
    coherencia
      ? [
          ['Índice de coherencia', indice],
          ['Nivel de coherencia', nivel],
          ['Verificaciones ejecutadas', String(coherencia.verificaciones)],
          ['Coincidencias detectadas', String(coherencia.coincidencias)],
        ]
          .map(
            ([k, v]) =>
              `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`,
          )
          .join('')
      : ''

  const filasObs: string =
    observaciones && observaciones.length
      ? observaciones
          .map(
            (o) =>
              `<tr><td class="mono">${escapeHtml(o.codigo)}</td><td>${escapeHtml(o.partida)}</td><td>${escapeHtml(o.tipo)}</td><td>${escapeHtml(nivelCriticidad(o.criticidad))}</td><td>${escapeHtml(estadoLabel(o.estado))}</td></tr>`,
          )
          .join('')
      : ''

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(reporte.nombre)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2d3748; margin: 0; }
  .hoja { max-width: 820px; margin: 0 auto; padding: 24px 32px; }
  header.cab { background: #102b54; color: #fff; padding: 22px 28px; border-radius: 8px; }
  header.cab h1 { margin: 0; font-size: 18px; }
  header.cab p { margin: 4px 0 0; font-size: 12px; opacity: .85; }
  .meta { display: flex; flex-wrap: wrap; gap: 18px; margin: 18px 0; padding: 14px 18px; background: #eff2f7; border-radius: 8px; font-size: 12px; }
  .meta b { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #788291; }
  h2 { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #102b54; margin: 22px 0 8px; }
  h2::before { content: ""; width: 12px; height: 12px; background: #102b54; border-radius: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
  th, td { border: 1px solid #dfe4ec; padding: 6px 8px; text-align: left; vertical-align: top; }
  thead th { background: #102b54; color: #fff; font-weight: 600; }
  td.num, td.mono { font-family: ui-monospace, Consolas, monospace; }
  ul, ol { margin: 4px 0 0; padding-left: 20px; font-size: 12px; line-height: 1.6; }
  .pie { margin-top: 22px; border-top: 1px solid #dfe4ec; padding-top: 8px; font-size: 10px; color: #788291; text-align: center; }
  @media print {
    body { margin: 0; }
    .hoja { max-width: 100%; padding: 0; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="hoja">
  <header class="cab">
    <h1>${escapeHtml(reporte.nombre)}</h1>
    <p>Expediente ${escapeHtml(reporte.proyecto)} · HH Intelligence</p>
  </header>

  <div class="meta">
    <div class="campo"><b>Proyecto</b>${escapeHtml(proyecto ? proyecto.nombre : reporte.proyecto)}</div>
    <div class="campo"><b>Código</b>${escapeHtml(proyecto ? proyecto.codigo : reporte.proyecto)}</div>
    <div class="campo"><b>Fecha</b>${escapeHtml(reporte.fecha.slice(0, 10))}</div>
    <div class="campo"><b>Estado</b>${escapeHtml(estadoLabel(reporte.estado))}</div>
    <div class="campo"><b>Responsable</b>${escapeHtml(reporte.responsable)}</div>
    ${proyecto ? `<div class="campo"><b>Entidad</b>${escapeHtml(proyecto.entidad)}</div>` : ''}
    ${proyecto ? `<div class="campo"><b>Avance</b>${proyecto.avance}%</div>` : ''}
  </div>

  ${filasResumen ? `<h2>Resumen del análisis</h2><table>${filasResumen}</table>` : ''}

  ${filasDocs ? `<h2>Documentos analizados</h2><table><thead><tr><th style="width:5%">Nº</th><th>Documento</th><th>Categoría</th><th>Estado</th></tr></thead><tbody>${filasDocs}</tbody></table>` : ''}

  ${filasCoherencia ? `<h2>Coherencia del expediente</h2><table>${filasCoherencia}</table>` : ''}

  ${filasObs ? `<h2>Observaciones del expediente</h2><table><thead><tr><th>Código</th><th>Partida</th><th>Tipo</th><th>Criticidad</th><th>Estado</th></tr></thead><tbody>${filasObs}</tbody></table>` : ''}

  ${resumenContenido && resumenContenido.length ? `<h2>Resumen del análisis</h2><ul>${resumenContenido.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}

  ${recomendaciones && recomendaciones.length ? `<h2>Recomendaciones</h2><ol>${recomendaciones.map((r, i) => `<li key=${i}>${escapeHtml(r)}</li>`).join('')}</ol>` : ''}

  <div class="pie">Documento informativo generado por HH Intelligence · ${new Date().toLocaleString('es-PE')}</div>
</div>
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.focus(); window.print(); }, 250)
  })
</script>
</body>
</html>`

  const ventana = window.open('about:blank', '_blank', 'width=960,height=720')
  if (!ventana) return
  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
  ventana.document.title = reporte.nombre
}

export function esProyectoValido(x: unknown): x is Proyecto {
  if (!x || typeof x !== 'object') return false
  const p = x as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.codigo === 'string' &&
    typeof p.nombre === 'string' &&
    typeof p.entidad === 'string' &&
    typeof p.sector === 'string' &&
    typeof p.tipoObra === 'string' &&
    TIPOS_OBRA.includes(p.tipoObra) &&
    typeof p.responsable === 'string' &&
    typeof p.avance === 'number' &&
    typeof p.observaciones === 'number' &&
    typeof p.monto === 'number' &&
    typeof p.fechaCreacion === 'string' &&
    (typeof p.fechaInicio === 'string' || p.fechaInicio === null) &&
    typeof p.actualizadoEl === 'string' &&
    typeof p.estado === 'string' &&
    ESTADOS_PROYECTO.includes(p.estado) &&
    typeof p.ubicacion === 'string'
  )
}

export function esObservacionValida(x: unknown): x is Observacion {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.codigo === 'string' &&
    typeof o.proyecto === 'string' &&
    typeof o.partida === 'string' &&
    typeof o.tipoInconsistencia === 'string' &&
    typeof o.regla === 'string' &&
    typeof o.criticidad === 'string' &&
    CRITICIDADES_OBS.includes(o.criticidad) &&
    typeof o.responsable === 'string' &&
    typeof o.estado === 'string' &&
    ESTADOS_OBS.includes(o.estado) &&
    typeof o.fecha === 'string'
  )
}