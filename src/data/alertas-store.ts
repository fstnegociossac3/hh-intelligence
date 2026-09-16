import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'hh-intelligence:alertas-descartadas'

let cache: string[] | null = null
const listeners = new Set<() => void>()

function leer(): string[] {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        cache = parsed as string[]
        return cache
      }
    }
  } catch {
    // datos corruptos → lista vacía
  }
  cache = []
  return cache
}

function escribir(lista: string[]) {
  cache = lista
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  } catch {
    // almacenamiento no disponible
  }
  listeners.forEach((l) => l())
}

export function suscribirAlertasDescartadas(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAlertasDescartadas(): string[] {
  return useSyncExternalStore(suscribirAlertasDescartadas, leer)
}

export function descartarAlerta(id: string) {
  const actuales = leer()
  if (actuales.includes(id)) return
  escribir([...actuales, id])
}

export function restaurarAlerta(id: string) {
  escribir(leer().filter((x) => x !== id))
}

export function restaurarTodasLasAlertas() {
  escribir([])
}