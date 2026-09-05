import { useSyncExternalStore } from 'react'

import type { Proyecto } from '@/types'
import {
  obtenerProyectos,
  suscribirProyectos,
} from '@/data/proyectos-store'
import {
  obtenerObservaciones,
  suscribirObservaciones,
  type Observacion,
  REGLAS,
} from '@/data/observaciones-store'
import {
  obtenerEstadoDocumentos,
  suscribirDocumentos,
} from '@/data/documentos-store'
import {
  registrarEvento,
  USUARIO_IA,
} from '@/data/historial-store'

export type ResultadoAnalisis = 'conforme' | 'observado' | 'critico' | 'pendiente'

export interface RegistroAnalisis {
  id: string
  proyectoId: string
  codigo: string
  proyecto: string
  fecha: string
  resultado: ResultadoAnalisis
  puntaje: number
  documentosCargados: number
  documentosAnalizados: number
  documentosConError: number
  observaciones: number
  inconsistencias: number
  responsable: string
}

export interface TotalesAnalisis {
  total: number
  conformes: number
  observados: number
  criticos: number
  pendientes: number
  observaciones: number
  inconsistencias: number
  documentosCargados: number
  documentosAnalizados: number
  documentosConError: number
}

const ESTADOS_ABIERTOS = new Set<string>([
  'nueva',
  'asignada',
  'en_revision',
])

function puntajeProyecto(obs: Observacion[]): number {
  if (obs.length === 0) return 99
  const penalizacion = obs.reduce(
    (acc, o) =>
      acc +
      (o.criticidad === 'critica'
        ? 12
        : o.criticidad === 'alta'
          ? 8
          : o.criticidad === 'media'
            ? 4
            : 1),
    0,
  )
  return Math.max(15, 100 - penalizacion)
}

const EJECUCIONES_KEY = 'hhi_analisis_ejecuciones_v1'

let cacheEjecuciones: Record<string, string> | null = null

function leerEjecuciones(): Record<string, string> {
  if (!cacheEjecuciones) {
    try {
      const raw = localStorage.getItem(EJECUCIONES_KEY)
      cacheEjecuciones = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    } catch {
      cacheEjecuciones = {}
    }
  }
  return cacheEjecuciones
}

function escribirEjecuciones() {
  try {
    localStorage.setItem(EJECUCIONES_KEY, JSON.stringify(cacheEjecuciones))
  } catch {
    // almacenamiento no disponible
  }
}

export function registrarEjecucion(proyectoId: string) {
  leerEjecuciones()[proyectoId] = new Date().toISOString()
  escribirEjecuciones()
  recalcular()
  const proyecto = obtenerProyectos().find((p) => p.id === proyectoId)
  registrarEvento({
    proyectoId,
    accion: 'analisis_ejecutado',
    usuario: USUARIO_IA,
    descripcion: `Análisis inteligente ejecutado sobre ${
      proyecto ? `${proyecto.codigo} · ${proyecto.nombre}` : proyectoId
    }`,
  })
}

function fechaEjecucion(proyectoId: string): string | undefined {
  return leerEjecuciones()[proyectoId]
}

function calcularRegistro(p: Proyecto): RegistroAnalisis {
  const docs = obtenerEstadoDocumentos(p.id)
  const observaciones = obtenerObservaciones().filter(
    (o) => o.proyecto === p.codigo,
  )

  const documentosCargados = docs.documentos.length
  const documentosAnalizados = docs.documentos.filter(
    (d) => d.estadoIa === 'procesado',
  ).length
  const documentosConError = docs.documentos.filter(
    (d) => d.estadoIa === 'error',
  ).length
  const inconsistencias = observaciones.filter(
    (o) => o.criticidad === 'critica',
  ).length

  const ejecutado = fechaEjecucion(p.id)
  const sinAnalizar =
    !ejecutado &&
    (p.estado === 'borrador' ||
      (p.estado === 'documentacion' && documentosAnalizados === 0))

  let resultado: ResultadoAnalisis
  let puntaje: number

  if (sinAnalizar) {
    resultado = 'pendiente'
    puntaje = 0
  } else {
    puntaje = puntajeProyecto(observaciones)
    if (inconsistencias > 0 || puntaje < 60) {
      resultado = 'critico'
    } else if (observaciones.length > 0 || puntaje < 80) {
      resultado = 'observado'
    } else {
      resultado = 'conforme'
    }
  }

  return {
    id: `an-${p.id}`,
    proyectoId: p.id,
    codigo: p.codigo,
    proyecto: p.nombre,
    fecha: ejecutado ?? p.actualizadoEl,
    resultado,
    puntaje: sinAnalizar ? 0 : puntaje,
    documentosCargados,
    documentosAnalizados: sinAnalizar ? 0 : documentosAnalizados,
    documentosConError,
    observaciones: observaciones.length,
    inconsistencias,
    responsable: p.responsable,
  }
}

export function calcularTotales(registros: RegistroAnalisis[]): TotalesAnalisis {
  return registros.reduce<TotalesAnalisis>(
    (acc, r) => {
      acc.total += 1
      acc.conformes += r.resultado === 'conforme' ? 1 : 0
      acc.observados += r.resultado === 'observado' ? 1 : 0
      acc.criticos += r.resultado === 'critico' ? 1 : 0
      acc.pendientes += r.resultado === 'pendiente' ? 1 : 0
      acc.observaciones += r.observaciones
      acc.inconsistencias += r.inconsistencias
      acc.documentosCargados += r.documentosCargados
      acc.documentosAnalizados += r.documentosAnalizados
      acc.documentosConError += r.documentosConError
      return acc
    },
    {
      total: 0,
      conformes: 0,
      observados: 0,
      criticos: 0,
      pendientes: 0,
      observaciones: 0,
      inconsistencias: 0,
      documentosCargados: 0,
      documentosAnalizados: 0,
      documentosConError: 0,
    },
  )
}

export function coherenciaPorRegla(obs: Observacion[]) {
  return REGLAS.map((regla) => {
    const de = obs.filter((o) => o.regla === regla)
    const penalizacion = de.reduce(
      (acc, o) =>
        acc +
        (o.criticidad === 'critica'
          ? 10
          : o.criticidad === 'alta'
            ? 6
            : o.criticidad === 'media'
              ? 3
              : 1),
      0,
    )
    return { label: regla, score: Math.max(40, 100 - penalizacion) }
  })
}

export function coherenciaPromedio(obs: Observacion[]): number {
  const scores = coherenciaPorRegla(obs)
  return Math.round(
    scores.reduce((acc, s) => acc + s.score, 0) / Math.max(scores.length, 1),
  )
}

let cache: RegistroAnalisis[] | null = null
const listenersAnalisis = new Set<() => void>()

function recalcular() {
  cache = null
  listenersAnalisis.forEach((l) => l())
}

suscribirProyectos(recalcular)
suscribirObservaciones(recalcular)
suscribirDocumentos(recalcular)

function suscribirAnalisis(listener: () => void) {
  listenersAnalisis.add(listener)
  return () => {
    listenersAnalisis.delete(listener)
  }
}

function snapshot(): RegistroAnalisis[] {
  if (!cache) {
    cache = obtenerProyectos().map(calcularRegistro)
  }
  return cache
}

export function useAnalisis(): RegistroAnalisis[] {
  return useSyncExternalStore(suscribirAnalisis, snapshot)
}

export function obtenerAnalisis(): RegistroAnalisis[] {
  return snapshot()
}

export function esObservacionAbierta(estado: string): boolean {
  return ESTADOS_ABIERTOS.has(estado)
}