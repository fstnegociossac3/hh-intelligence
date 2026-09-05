import { useSyncExternalStore } from 'react'

import { obtenerProyectos } from '@/data/proyectos-store'

export type AccionHistorial =
  | 'proyecto_creado'
  | 'proyecto_editado'
  | 'documento_cargado'
  | 'documento_procesado'
  | 'analisis_ejecutado'
  | 'observacion_creada'
  | 'observacion_resuelta'
  | 'reanalisis_ejecutado'
  | 'reporte_generado'

export interface EventoHistorial {
  id: string
  proyectoId: string
  proyectoCodigo: string
  accion: AccionHistorial
  usuario: string
  descripcion: string
  fecha: string
}

export const USUARIO_ACTUAL = 'Claudia Torres · Supervisor'
export const USUARIO_IA = 'IA · HH Intelligence · Motor de análisis'

const STORAGE_KEY = 'hh-intelligence:historial'

let cache: EventoHistorial[] | null = null
const listeners = new Set<() => void>()

function generarSeed(): EventoHistorial[] {
  return obtenerProyectos().map((p, i) => ({
    id: `hi-${String(i + 1).padStart(3, '0')}`,
    proyectoId: p.id,
    proyectoCodigo: p.codigo,
    accion: 'proyecto_creado',
    usuario: p.responsable || USUARIO_ACTUAL,
    descripcion: `Expediente ${p.codigo} · ${p.nombre} creado en el sistema`,
    fecha: `${p.fechaCreacion}T09:00:00`,
  }))
}

function leer(): EventoHistorial[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cache = parsed as EventoHistorial[]
        return cache
      }
    }
  } catch {
    // datos corruptos → reseed
  }
  cache = generarSeed()
  return cache
}

function escribir(eventos: EventoHistorial[]) {
  cache = eventos
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos))
  } catch {
    // almacenamiento no disponible
  }
  listeners.forEach((l) => l())
}

export function suscribirHistorial(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useHistorial(): EventoHistorial[] {
  return useSyncExternalStore(suscribirHistorial, leer)
}

export function obtenerHistorial(): EventoHistorial[] {
  return leer()
}

export function historialDeProyecto(proyectoId: string): EventoHistorial[] {
  return leer().filter((e) => e.proyectoId === proyectoId)
}

export function proyectoIdDeCodigo(codigo: string): string {
  return obtenerProyectos().find((p) => p.codigo === codigo)?.id ?? codigo
}

export function proyectoCodigoDeId(proyectoId: string): string {
  return obtenerProyectos().find((p) => p.id === proyectoId)?.codigo ?? proyectoId
}

interface DatosEvento {
  proyectoId?: string
  proyectoCodigo?: string
  accion: AccionHistorial
  usuario: string
  descripcion: string
  fecha?: string
}

export function registrarEvento(datos: DatosEvento) {
  const proyectos = obtenerProyectos()
  const proyectoId =
    datos.proyectoId ??
    proyectos.find((p) => p.codigo === datos.proyectoCodigo)?.id ??
    datos.proyectoCodigo ??
    ''
  const proyectoCodigo =
    datos.proyectoCodigo ??
    proyectos.find((p) => p.id === datos.proyectoId)?.codigo ??
    datos.proyectoId ??
    ''
  const evento: EventoHistorial = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    proyectoId,
    proyectoCodigo,
    accion: datos.accion,
    usuario: datos.usuario,
    descripcion: datos.descripcion,
    fecha: datos.fecha ?? new Date().toISOString(),
  }
  escribir([evento, ...leer()])
}