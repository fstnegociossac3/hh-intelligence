import type { CategoriaDocumento, DocumentoLista } from '@/data/proyecto-detalle'
import {
  DOCUMENTOS_MOCK,
  obtenerDetalleProyecto,
} from '@/data/proyecto-detalle'
import {
  registrarEvento,
  USUARIO_IA,
} from '@/data/historial-store'

const STORAGE_KEY = 'hhi_documentos_v1'

interface EstadoDocumentos {
  documentos: DocumentoLista[]
  categorias: CategoriaDocumento[]
}

type RegistroDocumentos = Record<string, EstadoDocumentos>

const listeners = new Set<() => void>()

function notificar() {
  listeners.forEach((l) => l())
}

export function suscribirDocumentos(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function leerRegistro(): RegistroDocumentos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as RegistroDocumentos
  } catch {
    return {}
  }
}

function escribirRegistro(registro: RegistroDocumentos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registro))
}

function seedProyecto(proyectoId: string): EstadoDocumentos {
  const detalle = obtenerDetalleProyecto(proyectoId)
  const documentos: DocumentoLista[] = DOCUMENTOS_MOCK.map((d) => ({
    ...d,
    id: `${proyectoId}-${d.id}`,
  })).slice(0, Math.max(detalle.documentosCargados, 8))
  return {
    documentos,
    categorias: detalle.categorias.map((c) => ({ ...c })),
  }
}

export function obtenerEstadoDocumentos(proyectoId: string): EstadoDocumentos {
  const registro = leerRegistro()
  if (!registro[proyectoId]) {
    registro[proyectoId] = seedProyecto(proyectoId)
    escribirRegistro(registro)
  }
  return registro[proyectoId]
}

export function guardarEstadoDocumentos(
  proyectoId: string,
  documentos: DocumentoLista[],
  categorias: CategoriaDocumento[],
) {
  const registro = leerRegistro()
  registro[proyectoId] = {
    documentos,
    categorias: categorias.map((c) => ({ ...c })),
  }
  escribirRegistro(registro)
  notificar()
}

export function procesarDocumentosIa(proyectoId: string): number {
  const estado = obtenerEstadoDocumentos(proyectoId)
  let procesados = 0
  const documentos = estado.documentos.map((d) => {
    if (d.estadoIa !== 'procesado') {
      procesados += 1
      registrarEvento({
        proyectoId,
        accion: 'documento_procesado',
        usuario: USUARIO_IA,
        descripcion: `Documento "${d.nombre}" procesado por IA (${d.categoria})`,
      })
      return { ...d, estadoIa: 'procesado' as const }
    }
    return d
  })
  if (procesados > 0) {
    guardarEstadoDocumentos(proyectoId, documentos, estado.categorias)
  }
  return procesados
}