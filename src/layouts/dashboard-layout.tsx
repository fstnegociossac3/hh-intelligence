import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar, SidebarMovil } from '@/components/sidebar'
import { Header } from '@/components/header'
import { separarTitulo } from '@/utils/titulos'

export function DashboardLayout() {
  const ubicacion = useLocation()
  const titulo = separarTitulo(ubicacion.pathname)
  const [colapsada, setColapsada] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        colapsada={colapsada}
        onToggle={() => setColapsada((v) => !v)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          titulo={titulo}
          onAbrirMenuMovil={() => setMenuMovilAbierto(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <SidebarMovil
        abierto={menuMovilAbierto}
        onOpenChange={setMenuMovilAbierto}
      />
    </div>
  )
}
