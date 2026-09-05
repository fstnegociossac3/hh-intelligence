import { useSyncExternalStore } from 'react'

export interface SesionUsuario {
  id: string
  nombre: string
  email: string
  rol: string
}

interface SesionGuardada {
  usuario: SesionUsuario
  iniciadaEn: string
}

const STORAGE_KEY = 'hh-intelligence:sesion'
const RUTA_ORIGEN_KEY = 'hh-intelligence:ruta-origen'

export const USUARIOS_DEMO: SesionUsuario[] = [
  {
    id: 'admin-demo',
    nombre: 'Carlos Mendoza',
    email: 'admin@hh.com',
    rol: 'Administrador',
  },
  {
    id: 'analista-demo',
    nombre: 'María Torres',
    email: 'analista@hh.com',
    rol: 'Analista',
  },
  {
    id: 'consulta-demo',
    nombre: 'Diego Rojas',
    email: 'consulta@hh.com',
    rol: 'Consulta',
  },
]

export const USUARIO_DEMO: SesionUsuario = USUARIOS_DEMO[0]

let cache: SesionGuardada | null | undefined
let cierreManual = false
const oyentes = new Set<() => void>()

function almacen(tipo: 'local' | 'session'): Storage | null {
  try {
    return tipo === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function leer(): SesionGuardada | null {
  for (const tipo of ['session', 'local'] as const) {
    const store = almacen(tipo)
    if (!store) continue
    try {
      const raw = store.getItem(STORAGE_KEY)
      if (!raw) continue
      const parsed = JSON.parse(raw) as SesionGuardada
      if (parsed && typeof parsed === 'object' && parsed.usuario) {
        return parsed
      }
    } catch {
      // datos corruptos → se ignora
    }
  }
  return null
}

function obtenerGuardada(): SesionGuardada | null {
  if (cache === undefined) cache = leer()
  return cache
}

export function suscribirSesion(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useSesionGuardada(): SesionGuardada | null {
  return useSyncExternalStore(suscribirSesion, obtenerGuardada, obtenerGuardada)
}

export function iniciarSesion(usuario: SesionUsuario, recordarme: boolean) {
  cierreManual = false
  const sesion: SesionGuardada = {
    usuario,
    iniciadaEn: new Date().toISOString(),
  }
  const texto = JSON.stringify(sesion)
  const destino: 'local' | 'session' = recordarme ? 'local' : 'session'

  for (const tipo of ['local', 'session'] as const) {
    const store = almacen(tipo)
    if (!store) continue
    try {
      if (tipo === destino) {
        store.setItem(STORAGE_KEY, texto)
      } else {
        store.removeItem(STORAGE_KEY)
      }
    } catch {
      // almacenamiento no disponible
    }
  }

  cache = sesion
  oyentes.forEach((oyente) => oyente())
}

export function actualizarSesion(cambios: Partial<SesionUsuario>) {
  const actual = cache === undefined ? leer() : cache
  if (!actual) return

  const usuario: SesionUsuario = { ...actual.usuario, ...cambios }
  const sesion: SesionGuardada = {
    usuario,
    iniciadaEn: actual.iniciadaEn,
  }
  const texto = JSON.stringify(sesion)

  let destino: 'local' | 'session' = 'session'
  for (const tipo of ['local', 'session'] as const) {
    const store = almacen(tipo)
    if (!store) continue
    try {
      if (store.getItem(STORAGE_KEY)) {
        destino = tipo
        break
      }
    } catch {
      // almacenamiento no disponible
    }
  }

  const store = almacen(destino)
  if (store) {
    try {
      store.setItem(STORAGE_KEY, texto)
    } catch {
      // almacenamiento no disponible
    }
  }

  cache = sesion
  oyentes.forEach((oyente) => oyente())
}

export function cerrarSesionPersistida() {
  for (const tipo of ['local', 'session'] as const) {
    const store = almacen(tipo)
    if (!store) continue
    try {
      store.removeItem(STORAGE_KEY)
      store.removeItem(RUTA_ORIGEN_KEY)
    } catch {
      // almacenamiento no disponible
    }
  }

  cache = null
  oyentes.forEach((oyente) => oyente())
}

export function guardarRutaOrigen(ruta: string) {
  try {
    sessionStorage.setItem(RUTA_ORIGEN_KEY, ruta)
  } catch {
    // almacenamiento no disponible
  }
}

export function tomarRutaOrigen(): string | null {
  try {
    const ruta = sessionStorage.getItem(RUTA_ORIGEN_KEY)
    sessionStorage.removeItem(RUTA_ORIGEN_KEY)
    return ruta
  } catch {
    return null
  }
}

export function marcarCierreManual() {
  cierreManual = true
}

export function estaCierreManual(): boolean {
  return cierreManual
}