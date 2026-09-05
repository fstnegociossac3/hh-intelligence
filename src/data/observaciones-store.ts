import { useSyncExternalStore } from 'react'

import {
  obtenerProyectos,
  actualizarProyecto,
} from '@/data/proyectos-store'
import {
  registrarEvento,
  USUARIO_ACTUAL,
} from '@/data/historial-store'
import { agregarNotificacion } from '@/data/notificaciones-store'

export type CriticidadObs = 'critica' | 'alta' | 'media' | 'baja'
export type EstadoObs =
  | 'nueva'
  | 'asignada'
  | 'en_revision'
  | 'justificada'
  | 'resuelta'

export type ResultadoReanalisis = 'resuelta' | 'continua' | 'revision'

const RESULTADO_DESCRIPCION: Record<ResultadoReanalisis, string> = {
  resuelta: 'la inconsistencia fue resuelta',
  continua: 'la inconsistencia continúa',
  revision: 'requiere revisión manual',
}

export interface Observacion {
  id: string
  codigo: string
  proyecto: string
  partida: string
  tipoInconsistencia: string
  regla: string
  criticidad: CriticidadObs
  responsable: string
  estado: EstadoObs
  resultado?: ResultadoReanalisis
  fecha: string
}

const STORAGE_KEY = 'hh-intelligence:observaciones'

export const RESPONSABLES = [
  'Carlos Mendoza',
  'Lucía Fernández',
  'Jorge Paredes',
  'Ana Quispe',
  'Pedro Rojas',
]

export const REGLAS = [
  'Presupuesto vs. Metrado',
  'Metrado vs. Plano',
  'Partida vs. Especificación',
  'Partida vs. Cronograma',
]

export const TIPOS_INCONSISTENCIA = [
  'Diferencia de cantidad',
  'Coincidencia parcial con plano',
  'Información faltante',
  'Unidad inconsistente',
  'Especificación parcial',
  'Diferencia de unidad',
  'Cantidad sin respaldo',
  'Actividad no programada',
]

const PARTIDAS = [
  'Concreto simple en falsa zapata',
  'Acero de refuerzo',
  'Encofrado de cimientos',
  'Estudio de mecánica de suelos',
  'Red de desagüe PVC-SAL',
  'Tubería de ventilación',
  'Vigas de concreto armado',
  'Movimiento de tierras',
  'Salidas para artefactos empotrados',
  'Tableros de distribución',
  'Compactación de terreno',
  'Concreto armado en cimientos',
  'Muros de contención',
  'Tarrajeo en muros interiores',
  'Aparatos sanitarios',
  'Cisterna y tanque elevado',
  'Pintura en muros exteriores',
  'Cobertura con panel metálico',
]

const CRITICIDADES: CriticidadObs[] = [
  'alta',
  'critica',
  'media',
  'media',
  'alta',
  'baja',
]

const ESTADOS_CICLO: EstadoObs[] = [
  'nueva',
  'asignada',
  'en_revision',
  'justificada',
  'resuelta',
]

function generarSeed(): Observacion[] {
  const proyectos = obtenerProyectos()
  const lista: Observacion[] = []
  let n = 0
  for (const p of proyectos) {
    const cantidad = Math.max(0, p.observaciones)
    for (let i = 0; i < cantidad; i++) {
      const idx = n
      const fecha = new Date(Date.UTC(2026, 7, 1 + (idx % 28)))
      lista.push({
        id: `o-${String(idx + 1).padStart(3, '0')}`,
        codigo: `OBS-${String(idx + 1).padStart(3, '0')}`,
        proyecto: p.codigo,
        partida: PARTIDAS[idx % PARTIDAS.length],
        tipoInconsistencia: TIPOS_INCONSISTENCIA[idx % TIPOS_INCONSISTENCIA.length],
        regla: REGLAS[idx % REGLAS.length],
        criticidad: CRITICIDADES[idx % CRITICIDADES.length],
        responsable: RESPONSABLES[idx % RESPONSABLES.length],
        estado: ESTADOS_CICLO[idx % ESTADOS_CICLO.length],
        fecha: fecha.toISOString().slice(0, 10),
      })
      n += 1
    }
  }
  return lista
}

let cache: Observacion[] | null = null
const listeners = new Set<() => void>()

function leer(): Observacion[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cache = parsed as Observacion[]
        return cache
      }
    }
  } catch {
    // ignora datos corruptos y vuelve a generar el seed
  }
  cache = generarSeed()
  return cache
}

function escribir(observaciones: Observacion[]) {
  cache = observaciones
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observaciones))
  } catch {
    // almacenamiento no disponible
  }
  listeners.forEach((l) => l())
  sincronizarConteosProyectos()
}

function sincronizarConteosProyectos() {
  for (const p of obtenerProyectos()) {
    const conteo = leer().filter((o) => o.proyecto === p.codigo).length
    if (p.observaciones !== conteo) {
      actualizarProyecto(p.id, { observaciones: conteo })
    }
  }
}

export function suscribirObservaciones(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useObservaciones(): Observacion[] {
  return useSyncExternalStore(suscribirObservaciones, leer)
}

export function obtenerObservaciones(): Observacion[] {
  return leer()
}

export function guardarObservaciones(observaciones: Observacion[]) {
  escribir(observaciones)
}

export function observacionesDeProyecto(codigo: string): Observacion[] {
  return leer().filter((o) => o.proyecto === codigo)
}

export function crearObservacion(observacion: Observacion) {
  escribir([observacion, ...leer()])
  registrarEvento({
    proyectoCodigo: observacion.proyecto,
    accion: 'observacion_creada',
    usuario: USUARIO_ACTUAL,
    descripcion: `Observación ${observacion.codigo} · ${observacion.partida} creada (Criticidad ${observacion.criticidad})`,
  })
  agregarNotificacion({
    tipo: 'observacion',
    titulo: 'Nueva observación',
    descripcion: `${observacion.codigo} · ${observacion.partida} en ${observacion.proyecto}.`,
    ruta: `/observaciones?obs=${observacion.id}`,
  })
}

export function actualizarObservacion(
  id: string,
  datos: Partial<Observacion>,
) {
  const existente = leer().find((o) => o.id === id)
  escribir(leer().map((o) => (o.id === id ? { ...o, ...datos } : o)))
  if (!existente) return
  if (datos.resultado) {
    registrarEvento({
      proyectoCodigo: existente.proyecto,
      accion: 'reanalisis_ejecutado',
      usuario: USUARIO_ACTUAL,
      descripcion: `Reanálisis de ${existente.codigo} · ${existente.partida}: ${RESULTADO_DESCRIPCION[datos.resultado]}`,
    })
    if (datos.resultado === 'resuelta') {
      agregarNotificacion({
        tipo: 'observacion_resuelta',
        titulo: 'Observación resuelta',
        descripcion: `${existente.codigo} · ${existente.partida} confirmada como resuelta.`,
        ruta: `/observaciones?obs=${existente.id}`,
      })
    }
  } else if (datos.estado === 'resuelta') {
    registrarEvento({
      proyectoCodigo: existente.proyecto,
      accion: 'observacion_resuelta',
      usuario: USUARIO_ACTUAL,
      descripcion: `Observación ${existente.codigo} · ${existente.partida} resuelta`,
    })
    agregarNotificacion({
      tipo: 'observacion_resuelta',
      titulo: 'Observación resuelta',
      descripcion: `${existente.codigo} · ${existente.partida} fue marcada como resuelta.`,
      ruta: `/observaciones?obs=${existente.id}`,
    })
  }
}

export function eliminarObservacion(id: string) {
  escribir(leer().filter((o) => o.id !== id))
}

export function generarObservacionesSimuladas(
  codigo: string,
  responsable: string,
): number {
  const lista = leer()
  let maxN = 0
  for (const o of lista) {
    const m = /^o-(\d+)$/.exec(o.id)
    if (m) maxN = Math.max(maxN, Number(m[1]))
  }

  const r = Math.random()
  const cantidad = r < 0.45 ? 0 : r < 0.75 ? 1 : 2
  const nuevas: Observacion[] = []
  const fecha = new Date().toISOString().slice(0, 10)

  for (let i = 0; i < cantidad; i++) {
    maxN += 1
    const idx = maxN
    nuevas.push({
      id: `o-${String(idx).padStart(3, '0')}`,
      codigo: `OBS-${String(idx).padStart(3, '0')}`,
      proyecto: codigo,
      partida: PARTIDAS[idx % PARTIDAS.length],
      tipoInconsistencia:
        TIPOS_INCONSISTENCIA[idx % TIPOS_INCONSISTENCIA.length],
      regla: REGLAS[idx % REGLAS.length],
      criticidad: CRITICIDADES[idx % CRITICIDADES.length],
      responsable,
      estado: 'nueva',
      fecha,
    })
  }

  if (nuevas.length > 0) {
    escribir([...nuevas, ...lista])
    for (const obs of nuevas) {
      registrarEvento({
        proyectoCodigo: codigo,
        accion: 'observacion_creada',
        usuario: responsable,
        descripcion: `Observación ${obs.codigo} · ${obs.partida} detectada por IA (Criticidad ${obs.criticidad})`,
      })
    }
    agregarNotificacion({
      tipo: 'observacion',
      titulo: 'Nueva observación',
      descripcion: `Se detectaron ${nuevas.length} nueva(s) inconsistencia(s) en ${codigo} durante el análisis.`,
      ruta: `/observaciones?obs=${nuevas[0].id}`,
    })
  }
  return nuevas.length
}