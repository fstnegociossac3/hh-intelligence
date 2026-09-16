import { useSyncExternalStore } from 'react'

import { proyectos as datosProyectos } from '@/data/proyectos'
import { eliminarDocumentos } from '@/data/documentos-store'
import { eliminarEquipo, equipoDesdeProyecto, guardarEquipo } from '@/data/equipo-store'
import { eliminarObservacionesDeProyecto } from '@/data/observaciones-store'
import { eliminarHistorialDeProyecto } from '@/data/historial-store'
import { eliminarEjecucion } from '@/data/analisis-store'
import { eliminarNotificacionesDeProyecto } from '@/data/notificaciones-store'
import type { Proyecto, ProyectoEstado } from '@/types'

const STORAGE_KEY = 'hh-intelligence:proyectos'

let cache: Proyecto[] | null = null
const listeners = new Set<() => void>()

function leer(): Proyecto[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cache = parsed as Proyecto[]
        return cache
      }
    }
  } catch {
    // ignora datos corruptos y vuelve a usar los datos iniciales
  }
  cache = datosProyectos
  return cache
}

function escribir(proyectos: Proyecto[]) {
  cache = proyectos
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proyectos))
  } catch {
    // almacenamiento no disponible
  }
  listeners.forEach((l) => l())
}

export function suscribirProyectos(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useProyectos(): Proyecto[] {
  return useSyncExternalStore(suscribirProyectos, leer)
}

export function obtenerProyectos(): Proyecto[] {
  return leer()
}

export function guardarProyectos(proyectos: Proyecto[]) {
  escribir(proyectos)
}

export function crearProyecto(proyecto: Proyecto) {
  escribir([proyecto, ...leer()])
  guardarEquipo(proyecto.id, equipoDesdeProyecto(proyecto))
}

export function actualizarProyecto(id: string, datos: Partial<Proyecto>) {
  escribir(leer().map((p) => (p.id === id ? { ...p, ...datos } : p)))
}

export function eliminarProyecto(id: string) {
  const proyecto = leer().find((p) => p.id === id)
  escribir(leer().filter((p) => p.id !== id))
  if (!proyecto) return
  eliminarDocumentos(proyecto.id)
  eliminarEquipo(proyecto.id)
  eliminarObservacionesDeProyecto(proyecto.codigo)
  eliminarHistorialDeProyecto(proyecto.id)
  eliminarEjecucion(proyecto.id)
  eliminarNotificacionesDeProyecto(proyecto.id, proyecto.codigo)
}

export function duplicarProyecto(proyecto: Proyecto): Proyecto {
  const ahora = new Date().toISOString().slice(0, 10)
  const nuevo: Proyecto = {
    ...proyecto,
    id: `proy-${Date.now()}`,
    codigo: `${proyecto.codigo}-COPIA`,
    nombre: `${proyecto.nombre} (Copia)`,
    estado: 'borrador' as ProyectoEstado,
    avance: 0,
    observaciones: 0,
    fechaCreacion: ahora,
    actualizadoEl: ahora,
  }
  escribir([nuevo, ...leer()])
  return nuevo
}