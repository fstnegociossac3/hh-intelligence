import { useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  FileBarChart,
  FileCheck2,
  HelpCircle,
  Home,
  Menu,
  ScanSearch,
  Search,
  User,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BuscadorGlobal } from '@/components/buscador-global'
import { iniciales, formatFecha } from '@/utils/formatters'
import { useSession } from '@/hooks/useSession'
import {
  marcarNotificacionLeida,
  marcarTodasLeidas,
  useNotificaciones,
  type TipoNotificacion,
} from '@/data/notificaciones-store'

interface HeaderProps {
  titulo: { principal: string; subtitulo: string }
  onAbrirMenuMovil: () => void
}

const ICONO_NOTIFICACION: Record<TipoNotificacion, LucideIcon> = {
  documento: FileCheck2,
  analisis: ScanSearch,
  observacion: AlertTriangle,
  observacion_resuelta: CircleCheck,
  reporte: FileBarChart,
}

const COLOR_ICONO_NOTIFICACION: Record<TipoNotificacion, string> = {
  documento: 'text-primary',
  analisis: 'text-primary',
  observacion: 'text-destructive',
  observacion_resuelta: 'text-emerald-500',
  reporte: 'text-primary',
}

export function Header({ titulo, onAbrirMenuMovil }: HeaderProps) {
  const ubicacion = useLocation()
  const navigate = useNavigate()
  const { sesion, cerrarSesion } = useSession()
  const notificaciones = useNotificaciones()
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false)

  if (!sesion) return null

  const ruta = titulo.principal
  const esDashboard = ubicacion.pathname === '/dashboard'
  const noLeidas = notificaciones.filter((n) => !n.leida).length

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-4 sm:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onAbrirMenuMovil}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <nav
        aria-label="Ruta de navegación"
        className="flex min-w-0 flex-col gap-0.5"
      >
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 rounded transition-colors hover:text-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          {!esDashboard && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{ruta}</span>
            </>
          )}
        </div>
        {titulo.subtitulo && (
          <p className="hidden text-xs text-muted-foreground sm:block">
            {titulo.subtitulo}
          </p>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden w-52 lg:w-80 md:block">
          <BuscadorGlobal />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Buscar"
          onClick={() => setBusquedaMovilAbierta(true)}
        >
          <Search className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              {noLeidas > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                  {noLeidas > 9 ? '9+' : noLeidas}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <div className="flex items-center justify-between pr-2">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              {noLeidas > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-primary"
                  onClick={marcarTodasLeidas}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notificaciones.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No hay notificaciones.
              </p>
            ) : (
              <div className="max-h-80 overflow-auto">
                {notificaciones.slice(0, 10).map((n) => {
                  const Icono = ICONO_NOTIFICACION[n.tipo]
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className="items-start gap-2.5 py-2.5"
                      onClick={() => {
                        marcarNotificacionLeida(n.id)
                        navigate(n.ruta)
                      }}
                    >
                      <span
                        className={`mt-0.5 shrink-0 ${COLOR_ICONO_NOTIFICACION[n.tipo]}`}
                      >
                        <Icono className="h-4 w-4" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {n.titulo}
                          {!n.leida && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {n.descripcion}
                        </span>
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatFecha(n.fecha.slice(0, 10))}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 rounded-full p-1"
              aria-label="Menú de usuario"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" alt={sesion.nombre} />
                <AvatarFallback>{iniciales(sesion.nombre)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">
                {sesion.nombre}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{sesion.nombre}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {sesion.email}
                </span>
                <span className="text-xs font-medium text-primary">
                  {sesion.rol}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>Ajustes</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={cerrarSesion}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {busquedaMovilAbierta && (
        <div className="fixed inset-x-0 top-0 z-[60] border-b bg-card p-3 shadow-sm md:hidden">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <BuscadorGlobal
                autoFocus
                onResultado={() => setBusquedaMovilAbierta(false)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Cerrar búsqueda"
              onClick={() => setBusquedaMovilAbierta(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}