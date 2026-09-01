import {
  Bell,
  ChevronRight,
  HelpCircle,
  Home,
  Menu,
  Search,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { iniciales } from '@/utils/formatters'
import { useSession } from '@/hooks/useSession'

interface HeaderProps {
  titulo: { principal: string; subtitulo: string }
  onAbrirMenuMovil: () => void
}

export function Header({ titulo, onAbrirMenuMovil }: HeaderProps) {
  const ubicacion = useLocation()
  const { sesion, cerrarSesion } = useSession()

  const ruta = titulo.principal
  const esDashboard = ubicacion.pathname === '/dashboard'

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
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-44 pl-9 lg:w-64"
            aria-label="Buscar"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Buscar"
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
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="items-start">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Revisión completada</span>
                <span className="text-xs text-muted-foreground">
                  El análisis EXP-2025-0001 finalizó correctamente.
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="items-start">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Nueva observación</span>
                <span className="text-xs text-muted-foreground">
                  Se detectaron 3 hallazgos en el expediente EXP-2025-0003.
                </span>
              </div>
            </DropdownMenuItem>
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
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Ajustes</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={cerrarSesion}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
