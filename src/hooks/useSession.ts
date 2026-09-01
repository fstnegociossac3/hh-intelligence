import { useState } from 'react'

interface SesionInfo {
  nombre: string
  email: string
  rol: string
}

const SESION_MOCK: SesionInfo = {
  nombre: 'Carlos Mendoza',
  email: 'carlos.mendoza@hhi.pe',
  rol: 'Administrador',
}

export function useSession() {
  const [sesion] = useState<SesionInfo>(SESION_MOCK)

  const cerrarSesion = () => {
    window.location.href = '/login'
  }

  return { sesion, cerrarSesion }
}
