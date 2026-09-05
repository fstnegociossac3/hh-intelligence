import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { DashboardLayout } from '@/layouts/dashboard-layout'
import { RequiereSesion } from '@/components/requiere-sesion'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { ProyectosPage } from '@/pages/proyectos'
import { ProyectoDetallePage } from '@/pages/proyecto-detalle'
import { AnalisisPage } from '@/pages/analisis'
import { ObservacionesPage } from '@/pages/observaciones'
import { ComparadorPage } from '@/pages/comparador'
import { ReportesPage } from '@/pages/reportes'
import { UsuariosPage } from '@/pages/usuarios'
import { ConfiguracionPage } from '@/pages/configuracion'
import { PerfilPage } from '@/pages/perfil'
import { NotFoundPage } from '@/pages/not-found'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequiereSesion>
              <DashboardLayout />
            </RequiereSesion>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/proyectos" element={<ProyectosPage />} />
          <Route path="/proyectos/:id" element={<ProyectoDetallePage />} />
          <Route path="/analisis" element={<AnalisisPage />} />
          <Route path="/observaciones" element={<ObservacionesPage />} />
          <Route path="/comparador" element={<ComparadorPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster position="bottom-right" richColors />
    </>
  )
}
