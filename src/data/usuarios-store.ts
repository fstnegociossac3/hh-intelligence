import { useSyncExternalStore } from 'react'

import { USUARIOS_DEMO, type SesionUsuario } from '@/data/sesion-store'

export type RolUsuario = 'administrador' | 'revisor' | 'analista' | 'consulta'
export type EstadoUsuario = 'activo' | 'inactivo'

export interface UsuarioSistema {
  id: string
  nombres: string
  apellidos: string
  correo: string
  rol: RolUsuario
  especialidad: string
  proyectosAsignados: number
  estado: EstadoUsuario
  ultimoAcceso: string
  password: string
}

export const ROL_LABEL: Record<RolUsuario, string> = {
  administrador: 'Administrador',
  revisor: 'Revisor',
  analista: 'Analista',
  consulta: 'Consulta',
}

export const PASSWORD_DEMO = '123456'

const STORAGE_KEY = 'hhi_usuarios_v1'

const SEMILLA: UsuarioSistema[] = [
  { id: 'u-01', nombres: 'Andrea', apellidos: 'Quispe', correo: 'andrea.quispe@hhi.pe', rol: 'administrador', especialidad: 'Estructuras', proyectosAsignados: 4, estado: 'activo', ultimoAcceso: '2026-08-31T10:15:00', password: PASSWORD_DEMO },
  { id: 'u-02', nombres: 'Carlos', apellidos: 'Mendoza', correo: 'carlos.mendoza@hhi.pe', rol: 'analista', especialidad: 'Costos y Presupuestos', proyectosAsignados: 6, estado: 'activo', ultimoAcceso: '2026-08-31T09:40:00', password: PASSWORD_DEMO },
  { id: 'u-03', nombres: 'Lucía', apellidos: 'Fernández', correo: 'lucia.fernandez@hhi.pe', rol: 'revisor', especialidad: 'Eléctricas', proyectosAsignados: 3, estado: 'activo', ultimoAcceso: '2026-08-30T16:05:00', password: PASSWORD_DEMO },
  { id: 'u-04', nombres: 'Jorge', apellidos: 'Paredes', correo: 'jorge.paredes@hhi.pe', rol: 'analista', especialidad: 'Arquitectura', proyectosAsignados: 2, estado: 'activo', ultimoAcceso: '2026-08-30T11:20:00', password: PASSWORD_DEMO },
  { id: 'u-05', nombres: 'Ana', apellidos: 'Quispe', correo: 'ana.quispe@hhi.pe', rol: 'revisor', especialidad: 'Sanitaria', proyectosAsignados: 3, estado: 'inactivo', ultimoAcceso: '2026-08-12T08:00:00', password: PASSWORD_DEMO },
  { id: 'u-06', nombres: 'Pedro', apellidos: 'Rojas', correo: 'pedro.rojas@hhi.pe', rol: 'administrador', especialidad: 'Geotecnia', proyectosAsignados: 5, estado: 'activo', ultimoAcceso: '2026-08-31T08:30:00', password: PASSWORD_DEMO },
  { id: 'u-07', nombres: 'María', apellidos: 'Torres', correo: 'maria.torres@hhi.pe', rol: 'consulta', especialidad: 'Hidráulica', proyectosAsignados: 0, estado: 'activo', ultimoAcceso: '2026-08-29T14:45:00', password: PASSWORD_DEMO },
  { id: 'u-08', nombres: 'Miguel', apellidos: 'Ortiz', correo: 'miguel.ortiz@hhi.pe', rol: 'analista', especialidad: 'Ambiental', proyectosAsignados: 2, estado: 'inactivo', ultimoAcceso: '2026-08-05T09:10:00', password: PASSWORD_DEMO },
  { id: 'u-09', nombres: 'Rosa', apellidos: 'Gutiérrez', correo: 'rosa.gutierrez@hhi.pe', rol: 'revisor', especialidad: 'Vías y Transporte', proyectosAsignados: 4, estado: 'activo', ultimoAcceso: '2026-08-30T18:00:00', password: PASSWORD_DEMO },
  { id: 'u-10', nombres: 'Luis', apellidos: 'Paredes', correo: 'luis.paredes@hhi.pe', rol: 'consulta', especialidad: 'Estructuras', proyectosAsignados: 1, estado: 'activo', ultimoAcceso: '2026-08-27T12:30:00', password: PASSWORD_DEMO },
  { id: 'u-11', nombres: 'Pedro', apellidos: 'Salazar', correo: 'pedro.salazar@hhi.pe', rol: 'analista', especialidad: 'Arquitectura', proyectosAsignados: 1, estado: 'activo', ultimoAcceso: '2026-08-28T15:50:00', password: PASSWORD_DEMO },
  { id: 'u-12', nombres: 'Jorge', apellidos: 'Rojas', correo: 'jorge.rojas@hhi.pe', rol: 'administrador', especialidad: 'Geotecnia', proyectosAsignados: 2, estado: 'inactivo', ultimoAcceso: '2026-07-29T10:00:00', password: PASSWORD_DEMO },
]

let cache: UsuarioSistema[] | null = null
const oyentes = new Set<() => void>()

function notificar() {
  oyentes.forEach((oyente) => oyente())
}

function leer(): UsuarioSistema[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as UsuarioSistema[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // datos corruptos → se re-siembra
  }
  const semilla = SEMILLA.map((u) => ({ ...u }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(semilla))
  } catch {
    // almacenamiento no disponible
  }
  return semilla
}

function obtenerUsuarios(): UsuarioSistema[] {
  if (cache === null) cache = leer()
  return cache
}

export function suscribirUsuarios(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useUsuarios(): UsuarioSistema[] {
  return useSyncExternalStore(suscribirUsuarios, obtenerUsuarios, () => [])
}

function escribir(lista: UsuarioSistema[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista))
  } catch {
    // almacenamiento no disponible
  }
  cache = lista
  notificar()
}

export function crearUsuario(
  datos: Omit<UsuarioSistema, 'id' | 'proyectosAsignados' | 'ultimoAcceso'>,
): UsuarioSistema {
  const lista = obtenerUsuarios()
  const nuevo: UsuarioSistema = {
    ...datos,
    id: `u-${Date.now()}`,
    proyectosAsignados: 0,
    ultimoAcceso: new Date().toISOString(),
  }
  escribir([nuevo, ...lista])
  return nuevo
}

export function actualizarUsuario(
  id: string,
  cambios: Partial<Omit<UsuarioSistema, 'id'>>,
) {
  const lista = obtenerUsuarios()
  escribir(
    lista.map((u) =>
      u.id === id ? { ...u, ...cambios } : u,
    ),
  )
}

export function cambiarEstadoUsuario(id: string, estado: EstadoUsuario) {
  actualizarUsuario(id, { estado })
}

export function eliminarUsuario(id: string) {
  escribir(obtenerUsuarios().filter((u) => u.id !== id))
}

export function autenticar(
  correo: string,
  password: string,
): SesionUsuario | null {
  const normalizado = correo.trim().toLowerCase()

  const persistido = obtenerUsuarios().find(
    (u) =>
      u.correo.toLowerCase() === normalizado &&
      u.estado === 'activo' &&
      u.password === password,
  )
  if (persistido) {
    actualizarUsuario(persistido.id, {
      ultimoAcceso: new Date().toISOString(),
    })
    return {
      id: persistido.id,
      nombre: `${persistido.nombres} ${persistido.apellidos}`,
      email: persistido.correo,
      rol: ROL_LABEL[persistido.rol],
    }
  }

  const demo = USUARIOS_DEMO.find(
    (u) =>
      u.email.toLowerCase() === normalizado &&
      password === PASSWORD_DEMO,
  )
  return demo ? { ...demo } : null
}