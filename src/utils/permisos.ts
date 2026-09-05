import { useSession } from '@/hooks/useSession'

export type RolSesion = 'administrador' | 'analista' | 'revisor' | 'consulta'

export type ModuloSistema =
  | 'dashboard'
  | 'proyectos'
  | 'analisis'
  | 'observaciones'
  | 'comparador'
  | 'reportes'
  | 'usuarios'
  | 'configuracion'

export const MODULO_LABEL: Record<ModuloSistema, string> = {
  dashboard: 'Dashboard',
  proyectos: 'Proyectos',
  analisis: 'Análisis',
  observaciones: 'Observaciones',
  comparador: 'Comparador',
  reportes: 'Reportes',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
}

export const ROLES_LECTURA: readonly RolSesion[] = ['consulta', 'revisor']

export const MODULOS_POR_ROL: Record<RolSesion, readonly ModuloSistema[]> = {
  administrador: [
    'dashboard',
    'proyectos',
    'analisis',
    'observaciones',
    'comparador',
    'reportes',
    'usuarios',
    'configuracion',
  ],
  analista: [
    'dashboard',
    'proyectos',
    'analisis',
    'observaciones',
    'reportes',
  ],
  revisor: [
    'dashboard',
    'proyectos',
    'analisis',
    'observaciones',
    'reportes',
  ],
  consulta: [
    'dashboard',
    'proyectos',
    'analisis',
    'observaciones',
    'comparador',
    'reportes',
  ],
}

export function rolComoClave(
  rol: string | null | undefined,
): RolSesion {
  const normalizado = (rol ?? '').trim().toLowerCase() as RolSesion
  return normalizado in MODULOS_POR_ROL ? normalizado : 'consulta'
}

export function puedeVerModulo(rol: string, modulo: ModuloSistema): boolean {
  return MODULOS_POR_ROL[rolComoClave(rol)].includes(modulo)
}

export function esRolLectura(rol: string): boolean {
  return ROLES_LECTURA.includes(rolComoClave(rol))
}

export function esRolAdmin(rol: string): boolean {
  return rolComoClave(rol) === 'administrador'
}

export interface Permisos {
  rol: string
  rolClave: RolSesion
  esAdmin: boolean
  puedeEditar: boolean
  puedeVer: (modulo: ModuloSistema) => boolean
}

export function usePermisos(): Permisos {
  const { sesion } = useSession()

  if (!sesion) {
    return {
      rol: 'Consulta',
      rolClave: 'consulta',
      esAdmin: false,
      puedeEditar: false,
      puedeVer: () => false,
    }
  }

  const clave = rolComoClave(sesion.rol)

  return {
    rol: sesion.rol,
    rolClave: clave,
    esAdmin: clave === 'administrador',
    puedeEditar: !ROLES_LECTURA.includes(clave),
    puedeVer: (modulo: ModuloSistema) =>
      MODULOS_POR_ROL[clave].includes(modulo),
  }
}