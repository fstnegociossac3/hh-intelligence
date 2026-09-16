import { useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'

export const ESQUEMA_CLAVE = 'hh-config'
export const EVENTO_CONFIG = 'hh-config-change'

export interface ConfiguracionPersistida {
  tema: string
  densidad: string
  notificaciones: Record<string, boolean>
  paginaInicio: string
  filasPorPagina: string
  formatoFecha: string
  ayudas: boolean
}

const CONFIG_DEF: ConfiguracionPersistida = {
  tema: 'sistema',
  densidad: 'comoda',
  notificaciones: {},
  paginaInicio: 'Dashboard',
  filasPorPagina: '10',
  formatoFecha: 'es-pe',
  ayudas: true,
}

const PAGINAS_RUTA: Record<string, string> = {
  Dashboard: '/dashboard',
  Proyectos: '/proyectos',
  Analisis: '/analisis',
  Observaciones: '/observaciones',
  Reportes: '/reportes',
}

let cache: ConfiguracionPersistida | null = null
const listeners = new Set<() => void>()

function leer(): ConfiguracionPersistida {
  if (cache) return cache
  try {
    const crudo = localStorage.getItem(ESQUEMA_CLAVE)
    if (crudo) {
      const parseado = JSON.parse(crudo) as Partial<ConfiguracionPersistida>
      cache = { ...CONFIG_DEF, ...parseado }
      return cache
    }
  } catch {
    // configuración dañada → valores por defecto
  }
  cache = { ...CONFIG_DEF }
  return cache
}

function invalidar() {
  cache = null
  listeners.forEach((l) => l())
}

function suscribir(listener: () => void) {
  listeners.add(listener)
  const alCambiar = () => invalidar()
  window.addEventListener(EVENTO_CONFIG, alCambiar)
  window.addEventListener('storage', alCambiar)
  return () => {
    listeners.delete(listener)
    window.removeEventListener(EVENTO_CONFIG, alCambiar)
    window.removeEventListener('storage', alCambiar)
  }
}

export function useConfiguracion(): ConfiguracionPersistida {
  return useSyncExternalStore(suscribir, leer)
}

export function obtenerConfiguracion(): ConfiguracionPersistida {
  return leer()
}

export function notificarConfiguracionCambiada() {
  window.dispatchEvent(new Event(EVENTO_CONFIG))
}

export function useFilasPorPagina(): number {
  const config = useConfiguracion()
  const numero = Number.parseInt(config.filasPorPagina, 10)
  return Number.isFinite(numero) && numero > 0 ? numero : 10
}

export function rutaPaginaInicio(): string {
  const config = leer()
  return PAGINAS_RUTA[config.paginaInicio] ?? '/dashboard'
}

export function combinarFilasPorPagina(opciones: number[], configurado: number): number[] {
  return Array.from(new Set([...opciones, configurado])).sort((a, b) => a - b)
}

export function usePaginacionConfig(porDefecto = 10) {
  const filasConfig = useFilasPorPagina()
  const [paginacion, setPaginacion] = useState({
    pageIndex: 0,
    pageSize: filasConfig || porDefecto,
  })

  useEffect(() => {
    setPaginacion((prev) =>
      prev.pageSize === filasConfig ? prev : { pageIndex: 0, pageSize: filasConfig },
    )
  }, [filasConfig])

  return [paginacion, setPaginacion] as const
}