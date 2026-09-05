import { useNavigate } from 'react-router-dom'

import {
  cerrarSesionPersistida,
  marcarCierreManual,
  useSesionGuardada,
} from '@/data/sesion-store'

export function useSession() {
  const guardada = useSesionGuardada()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    marcarCierreManual()
    cerrarSesionPersistida()
    navigate('/login', { replace: true })
  }

  return {
    sesion: guardada?.usuario ?? null,
    cerrarSesion,
  }
}