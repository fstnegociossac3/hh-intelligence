import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import {
  estaCierreManual,
  guardarRutaOrigen,
  useSesionGuardada,
} from '@/data/sesion-store'
import { rutas } from '@/routes/config'
import { puedeVerModulo } from '@/utils/permisos'

function RedirigirPorAccesoDenegado() {
  useEffect(() => {
    toast.error('No tiene permisos para acceder a este módulo.')
  }, [])

  return <Navigate to="/dashboard" replace />
}

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

  if (ruta && !puedeVerModulo(sesion.usuario.rol, ruta.modulo)) {
    return <RedirigirPorAccesoDenegado />
  }

  return <>{children}</>
}