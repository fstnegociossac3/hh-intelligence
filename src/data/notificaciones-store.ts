import { useSyncExternalStore } from 'react'

export type TipoNotificacion =
  | 'documento'
  | 'analisis'
  | 'observacion'
  | 'observacion_resuelta'
  | 'reporte'

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  titulo: string
  descripcion: string
  ruta: string
  fecha: string
  leida: boolean
}

const STORAGE_KEY = 'hh-intelligence:notificaciones'
const LIMITE = 30

let cache: Notificacion[] | null = null
const listeners = new Set<() => void>()

function leer(): Notificacion[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cache = parsed as Notificacion[]
        return cache
      }
    }
  } catch {
    // datos corruptos → lista vacía
  }
  cache = []
  return cache
}

function escribir(lista: Notificacion[]) {
  cache = lista
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  } catch {
    // almacenamiento no disponible
  }
  listeners.forEach((l) => l())
}

export function suscribirNotificaciones(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useNotificaciones(): Notificacion[] {
  return useSyncExternalStore(suscribirNotificaciones, leer)
}

export function agregarNotificacion(
  datos: Omit<Notificacion, 'id' | 'fecha' | 'leida'>,
) {
  const notificacion: Notificacion = {
    id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fecha: new Date().toISOString(),
    leida: false,
    ...datos,
  }
  escribir([notificacion, ...leer()].slice(0, LIMITE))
}

export function marcarNotificacionLeida(id: string) {
  escribir(leer().map((n) => (n.id === id ? { ...n, leida: true } : n)))
}

export function marcarTodasLeidas() {
  escribir(leer().map((n) => ({ ...n, leida: true })))
}