import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import {
  estaCierreManual,
  guardarRutaOrigen,
  useSesionGuardada,
} from '@/data/sesion-store'
import { rutas } from '@/routes/config'
import { MODULOS_POR_ROL, rolComoClave } from '@/utils/permisos'

export function RequiereSesion({ children }: { children: ReactNode }) {
  const sesion = useSesionGuardada()
  const ubicacion = useLocation()

  if (!sesion) {
    if (!estaCierreManual()) {
      guardarRutaOrigen(ubicacion.pathname)
    }
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  const ruta = rutas.find(
    (r) =>
      ubicacion.pathname === r.path ||
      ubicacion.pathname.startsWith(`${r.path}/`),
  )

  if (ruta) {
    const clave = rolComoClave(sesion.usuario.rol)
    if (!MODULOS_POR_ROL[clave].includes(ruta.modulo)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}