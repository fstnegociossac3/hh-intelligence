import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { Logo } from '@/components/logo'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { NavLink } from 'react-router-dom'
import { rutas } from '@/routes/config'
import { iniciales } from '@/utils/formatters'
import { useSession } from '@/hooks/useSession'
import { LogOut, ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { MODULOS_POR_ROL, rolComoClave } from '@/utils/permisos'

interface SidebarBaseProps {
  colapsada?: boolean
  onToggle?: () => void
  onCerrarMovil?: () => void
}

function SidebarContenido({
  colapsada = false,
  onToggle,
  onCerrarMovil,
}: SidebarBaseProps) {
  const { sesion, cerrarSesion } = useSession()

  if (!sesion) return null

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-5',
          colapsada && 'justify-center px-4',
        )}
      >
        <Logo />
        {!colapsada && (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold leading-tight text-white">
              H&amp;H Intelligence
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              Revisión de expedientes
            </span>
          </div>
        )}
        {onCerrarMovil && (
          <button
            type="button"
            onClick={onCerrarMovil}
            aria-label="Cerrar menú"
            className="ml-auto rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {onToggle && (
        <div
          className={cn(
            'flex items-center pt-2',
            colapsada ? 'justify-center px-2' : 'justify-end px-3',
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={colapsada ? 'Expandir menú' : 'Contraer menú'}
            title={colapsada ? 'Expandir menú' : 'Contraer menú'}
            className={cn(
              'flex items-center rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white',
              !colapsada && 'gap-2 px-2 py-1.5 text-xs font-medium',
            )}
          >
            {colapsada ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                Contraer
              </>
            )}
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {rutas
          .filter((ruta) =>
            MODULOS_POR_ROL[rolComoClave(sesion.rol)].includes(ruta.modulo),
          )
          .map((ruta) => {
          const Icon = ruta.icon
          const item = (
            <NavLink
              key={ruta.path}
              to={ruta.path}
              onClick={onCerrarMovil}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  colapsada && 'justify-center px-2',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!colapsada && <span className="truncate">{ruta.nombre}</span>}
            </NavLink>
          )

          if (colapsada) {
            return (
              <Tooltip key={ruta.path}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right" className="bg-sidebar-accent text-white">
                  {ruta.nombre}
                </TooltipContent>
              </Tooltip>
            )
          }

          return item
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="flex flex-col gap-3 p-4">
        {colapsada ? (
          <div className="flex justify-center">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={sesion.nombre}
              />
              <AvatarFallback className="bg-sidebar-accent text-white">
                {iniciales(sesion.nombre)}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={sesion.nombre}
              />
              <AvatarFallback className="bg-sidebar-accent text-white">
                {iniciales(sesion.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-white">
                {sesion.nombre}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {sesion.email}
              </span>
            </div>
            <Badge variant="secondary" className="bg-sidebar-accent text-white">
              {sesion.rol}
            </Badge>
          </div>
        )}
        <button
          type="button"
          onClick={cerrarSesion}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            colapsada && 'justify-center px-2',
          )}
          title={colapsada ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!colapsada && 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )
}

interface SidebarProps {
  colapsada: boolean
  onToggle: () => void
}

export function Sidebar({ colapsada, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out lg:flex',
        colapsada ? 'w-16' : 'w-64',
      )}
    >
      <SidebarContenido colapsada={colapsada} onToggle={onToggle} />
    </aside>
  )
}

interface SidebarMovilProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
}

export function SidebarMovil({ abierto, onOpenChange }: SidebarMovilProps) {
  return (
    <Sheet open={abierto} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 max-w-[85%] p-0 lg:hidden"
        aria-describedby={undefined}
      >
        <SidebarContenido
          colapsada={false}
          onCerrarMovil={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
