import { useMemo, useState } from 'react'
import {
  type ColumnDef,
  type Header,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderKanban,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RolesPermisos } from '@/components/roles-permisos'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'
import { EmptyState } from '@/components/empty-state'
import { formatFecha } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { ESTADO_OK, ESTADO_WARNING, ESTADO_INFO, ESTADO_NEUTRO, PUNTO_OK, PUNTO_NEUTRO } from '@/utils/estados-clases'
import { ESPECIALIDADES } from '@/data/proyecto-detalle'

const FILAS_POR_PAGINA = [8, 10, 15, 20]

type Rol = 'administrador' | 'revisor' | 'analista' | 'consulta'
type EstadoUsuario = 'activo' | 'inactivo'

interface UsuarioFila {
  id: string
  nombres: string
  apellidos: string
  correo: string
  rol: Rol
  especialidad: string
  proyectosAsignados: number
  estado: EstadoUsuario
  ultimoAcceso: string
}

const ROL_LABEL: Record<Rol, string> = {
  administrador: 'Administrador',
  revisor: 'Revisor',
  analista: 'Analista',
  consulta: 'Consulta',
}

const ROL_BADGE: Record<Rol, string> = {
  administrador: ESTADO_INFO,
  revisor: ESTADO_NEUTRO,
  analista: ESTADO_WARNING,
  consulta: ESTADO_NEUTRO,
}

const ESTADO_LABEL: Record<EstadoUsuario, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

const ESTADO_BADGE: Record<EstadoUsuario, string> = {
  activo: ESTADO_OK,
  inactivo: ESTADO_NEUTRO,
}

const MOCK_USUARIOS: UsuarioFila[] = [
  { id: 'u-01', nombres: 'Andrea', apellidos: 'Quispe', correo: 'andrea.quispe@hhi.pe', rol: 'administrador', especialidad: 'Estructuras', proyectosAsignados: 4, estado: 'activo', ultimoAcceso: '2026-08-31T10:15:00' },
  { id: 'u-02', nombres: 'Carlos', apellidos: 'Mendoza', correo: 'carlos.mendoza@hhi.pe', rol: 'analista', especialidad: 'Costos y Presupuestos', proyectosAsignados: 6, estado: 'activo', ultimoAcceso: '2026-08-31T09:40:00' },
  { id: 'u-03', nombres: 'Lucía', apellidos: 'Fernández', correo: 'lucia.fernandez@hhi.pe', rol: 'revisor', especialidad: 'Eléctricas', proyectosAsignados: 3, estado: 'activo', ultimoAcceso: '2026-08-30T16:05:00' },
  { id: 'u-04', nombres: 'Jorge', apellidos: 'Paredes', correo: 'jorge.paredes@hhi.pe', rol: 'analista', especialidad: 'Arquitectura', proyectosAsignados: 2, estado: 'activo', ultimoAcceso: '2026-08-30T11:20:00' },
  { id: 'u-05', nombres: 'Ana', apellidos: 'Quispe', correo: 'ana.quispe@hhi.pe', rol: 'revisor', especialidad: 'Sanitaria', proyectosAsignados: 3, estado: 'inactivo', ultimoAcceso: '2026-08-12T08:00:00' },
  { id: 'u-06', nombres: 'Pedro', apellidos: 'Rojas', correo: 'pedro.rojas@hhi.pe', rol: 'administrador', especialidad: 'Geotecnia', proyectosAsignados: 5, estado: 'activo', ultimoAcceso: '2026-08-31T08:30:00' },
  { id: 'u-07', nombres: 'María', apellidos: 'Torres', correo: 'maria.torres@hhi.pe', rol: 'consulta', especialidad: 'Hidráulica', proyectosAsignados: 0, estado: 'activo', ultimoAcceso: '2026-08-29T14:45:00' },
  { id: 'u-08', nombres: 'Miguel', apellidos: 'Ortiz', correo: 'miguel.ortiz@hhi.pe', rol: 'analista', especialidad: 'Ambiental', proyectosAsignados: 2, estado: 'inactivo', ultimoAcceso: '2026-08-05T09:10:00' },
  { id: 'u-09', nombres: 'Rosa', apellidos: 'Gutiérrez', correo: 'rosa.gutierrez@hhi.pe', rol: 'revisor', especialidad: 'Vías y Transporte', proyectosAsignados: 4, estado: 'activo', ultimoAcceso: '2026-08-30T18:00:00' },
  { id: 'u-10', nombres: 'Luis', apellidos: 'Paredes', correo: 'luis.paredes@hhi.pe', rol: 'consulta', especialidad: 'Estructuras', proyectosAsignados: 1, estado: 'activo', ultimoAcceso: '2026-08-27T12:30:00' },
  { id: 'u-11', nombres: 'Pedro', apellidos: 'Salazar', correo: 'pedro.salazar@hhi.pe', rol: 'analista', especialidad: 'Arquitectura', proyectosAsignados: 1, estado: 'activo', ultimoAcceso: '2026-08-28T15:50:00' },
  { id: 'u-12', nombres: 'Jorge', apellidos: 'Rojas', correo: 'jorge.rojas@hhi.pe', rol: 'administrador', especialidad: 'Geotecnia', proyectosAsignados: 2, estado: 'inactivo', ultimoAcceso: '2026-07-29T10:00:00' },
]

const ROLES_DISPONIBLES: Rol[] = ['administrador', 'revisor', 'analista', 'consulta']

function CeldaSortable({ header }: { header: Header<UsuarioFila, unknown> }) {
  if (header.isPlaceholder) return null
  const column = header.column
  const puede = column.getCanSort()
  const orden = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors',
        puede ? 'cursor-pointer hover:text-foreground' : 'cursor-default',
      )}
    >
      <span>{flexRender(column.columnDef.header, header.getContext())}</span>
      {puede &&
        (orden === 'asc' ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : orden === 'desc' ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        ))}
    </button>
  )
}

const usuarioSchema = z.object({
  nombres: z.string().min(1, 'Ingrese los nombres'),
  apellidos: z.string().min(1, 'Ingrese los apellidos'),
  correo: z.string().min(1, 'Ingrese el correo').email('Correo no válido'),
  rol: z.enum(['administrador', 'revisor', 'analista', 'consulta'], {
    required_error: 'Seleccione un rol',
  }),
  especialidad: z.string().min(1, 'Seleccione una especialidad'),
  estado: z.enum(['activo', 'inactivo'], {
    required_error: 'Seleccione un estado',
  }),
})

type UsuarioFormValues = z.infer<typeof usuarioSchema>

export function UsuariosPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [paginacion, setPaginacion] = useState({ pageIndex: 0, pageSize: 10 })
  const [usuarios, setUsuarios] = useState<UsuarioFila[]>(MOCK_USUARIOS)
  const [drawer, setDrawer] = useState<{
    modo: 'crear' | 'editar'
    usuario: UsuarioFila | null
  } | null>(null)

  const datosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRol !== 'todos' && u.rol !== filtroRol) return false
      if (filtroEstado !== 'todos' && u.estado !== filtroEstado) return false
      return true
    })
  }, [filtroRol, filtroEstado, usuarios])

  const columnas = useMemo<ColumnDef<UsuarioFila>[]>(
    () => [
      {
        accessorKey: 'usuario',
        header: 'Usuario',
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {u.nombres.charAt(0)}
                {u.apellidos.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {u.nombres} {u.apellidos}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.especialidad}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'correo',
        header: 'Correo',
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{row.original.correo}</span>
          </span>
        ),
      },
      {
        accessorKey: 'rol',
        header: 'Rol',
        cell: ({ row }) => (
          <Badge variant="outline" className={ROL_BADGE[row.original.rol]}>
            {ROL_LABEL[row.original.rol]}
          </Badge>
        ),
      },
      {
        id: 'especialidad',
        header: 'Especialidad',
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate text-xs">
            {row.original.especialidad}
          </span>
        ),
      },
      {
        accessorKey: 'proyectosAsignados',
        header: 'Proyectos asignados',
        cell: ({ row }) => (
          <Badge variant="secondary" className="gap-1">
            <FolderKanban className="h-3 w-3" />
            {row.original.proyectosAsignados}
          </Badge>
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant="outline" className={ESTADO_BADGE[row.original.estado]}>
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                row.original.estado === 'activo'
                  ? PUNTO_OK
                  : PUNTO_NEUTRO,
              )}
            />
            {ESTADO_LABEL[row.original.estado]}
          </Badge>
        ),
      },
      {
        accessorKey: 'ultimoAcceso',
        header: 'Último acceso',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatFecha(row.original.ultimoAcceso.slice(0, 10))}
          </span>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Acciones">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                {row.original.nombres} {row.original.apellidos}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => verUsuario(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editarUsuario(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toggleEstado(row.original.id)}
                className={
                  row.original.estado === 'inactivo'
? 'text-success focus:text-success'
                  : undefined
                }
              >
                <Power className="mr-2 h-4 w-4" />
                {row.original.estado === 'activo' ? 'Desactivar' : 'Activar'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data: datosFiltrados,
    columns: columnas,
    state: { sorting, globalFilter: busqueda, pagination: paginacion },
    onSortingChange: setSorting,
    onGlobalFilterChange: setBusqueda,
    onPaginationChange: setPaginacion,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
  })

  const filas = table.getRowModel().rows
  const totalPaginas = table.getPageCount()
  const primera = paginacion.pageIndex * paginacion.pageSize + 1
  const ultima = Math.min(
    (paginacion.pageIndex + 1) * paginacion.pageSize,
    table.getFilteredRowModel().rows.length,
  )

  const kpis = useMemo(
    () => ({
      total: usuarios.length,
      activos: usuarios.filter((u) => u.estado === 'activo').length,
      inactivos: usuarios.filter((u) => u.estado === 'inactivo').length,
      administradores: usuarios.filter((u) => u.rol === 'administrador').length,
    }),
    [usuarios],
  )

  const kpiItems: {
    titulo: string
    valor: number
    detalle: string
    icono: LucideIcon
    tono: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }[] = [
    { titulo: 'Total usuarios', valor: kpis.total, detalle: 'Cuentas registradas', icono: Users, tono: 'default' },
    { titulo: 'Activos', valor: kpis.activos, detalle: 'Con acceso habilitado', icono: UserCheck, tono: 'success' },
    { titulo: 'Inactivos', valor: kpis.inactivos, detalle: 'Acceso deshabilitado', icono: Power, tono: 'danger' },
    { titulo: 'Administradores', valor: kpis.administradores, detalle: 'Con permisos totales', icono: ShieldCheck, tono: 'info' },
  ]

  const verUsuario = (u: UsuarioFila) => {
    toast.info('Ver usuario', {
      description: `${u.nombres} ${u.apellidos} · ${ROL_LABEL[u.rol]} · ${u.correo}.`,
    })
  }

  const editarUsuario = (u: UsuarioFila) => {
    setDrawer({ modo: 'editar', usuario: u })
  }

  const crearUsuario = () => {
    setDrawer({ modo: 'crear', usuario: null })
  }

  const toggleEstado = (id: string) => {
    setUsuarios((prev) => {
      const target = prev.find((u) => u.id === id)
      const nuevoEstado: EstadoUsuario =
        target?.estado === 'activo' ? 'inactivo' : 'activo'
      toast.success(
        target
          ? `${target.nombres} ${target.apellidos} ahora está ${ESTADO_LABEL[nuevoEstado].toLowerCase()}`
          : 'Estado actualizado',
      )
      return prev.map((u) =>
        u.id === id ? { ...u, estado: nuevoEstado } : u,
      )
    })
  }

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiItems.map((kpi) => (
          <StaggerItem key={kpi.titulo}>
            <KpiCard
              titulo={kpi.titulo}
              valor={kpi.valor}
              detalle={kpi.detalle}
              icono={kpi.icono}
              tono={kpi.tono}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <UserCog className="h-5 w-5 text-primary" />
          Gestión de usuarios
        </h2>
        <Button onClick={crearUsuario} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </FadeIn>

      <FadeIn className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre, correo o especialidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              aria-label="Buscar usuarios"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center lg:gap-2">
            <Select value={filtroRol} onValueChange={setFiltroRol}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los roles</SelectItem>
                {ROLES_DISPONIBLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROL_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((grupo) => (
                  <TableRow key={grupo.id}>
                    {grupo.headers.map((header) => (
                      <TableHead key={header.id}>
                        <CeldaSortable header={header} />
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnas.length} className="h-48 p-0">
                      <EmptyState
                        titulo="Sin usuarios"
                        descripcion="No hay usuarios que coincidan con los filtros aplicados."
                        icono={UserRound}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((fila) => (
                    <TableRow key={fila.id}>
                      {fila.getVisibleCells().map((celda) => (
                        <TableCell key={celda.id}>
                          {flexRender(celda.column.columnDef.cell, celda.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {filas.length === 0 ? (
              <EmptyState
                titulo="Sin usuarios"
                descripcion="No hay usuarios que coincidan con los filtros aplicados."
                icono={UserRound}
              />
            ) : (
              filas.map((fila) => {
                const u = fila.original
                return (
                  <div key={fila.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {u.nombres.charAt(0)}
                          {u.apellidos.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {u.nombres} {u.apellidos}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {u.correo}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={ESTADO_BADGE[u.estado]}>
                        {ESTADO_LABEL[u.estado]}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={ROL_BADGE[u.rol]}>
                        {ROL_LABEL[u.rol]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {u.especialidad}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {u.proyectosAsignados} proyectos
                      </span>
                      <span>Último acceso: {formatFecha(u.ultimoAcceso.slice(0, 10))}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 border-t pt-3">
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => verUsuario(u)}>
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => editarUsuario(u)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn('gap-1.5', u.estado === 'inactivo' && 'text-success')}
                        onClick={() => toggleEstado(u.id)}
                      >
                        <Power className="h-3.5 w-3.5" />
                        {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Mostrando{' '}
            <span className="font-medium">
              {filas.length === 0 ? 0 : primera}–{ultima}
            </span>{' '}
            de{' '}
            <span className="font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{' '}
            usuarios
          </p>
<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <Select
              value={String(paginacion.pageSize)}
              onValueChange={(v) =>
                setPaginacion((prev) => ({ ...prev, pageSize: Number(v), pageIndex: 0 }))
              }
            >
              <SelectTrigger className="w-28" aria-label="Filas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILAS_POR_PAGINA.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / pág.</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Página anterior">
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center text-sm">
              {paginacion.pageIndex + 1} / {Math.max(totalPaginas, 1)}
            </span>
            <Button variant="outline" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Página siguiente">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </FadeIn>

      <RolesPermisos />

      {drawer && (
        <UsuarioFormDrawer
          key={drawer.modo === 'crear' ? 'crear' : drawer.usuario!.id}
          modo={drawer.modo}
          usuario={drawer.usuario}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setDrawer(null)
          }}
          onGuardar={(valores) => {
            if (drawer.modo === 'crear') {
              const nuevo: UsuarioFila = {
                id: `u-${Date.now()}`,
                proyectosAsignados: 0,
                ultimoAcceso: '2026-08-31T00:00:00',
                ...valores,
              }
              setUsuarios((prev) => [nuevo, ...prev])
              toast.success('Usuario creado', {
                description: `${valores.nombres} ${valores.apellidos}.`,
              })
            } else {
              setUsuarios((prev) =>
                prev.map((u) =>
                  u.id === drawer.usuario!.id ? { ...u, ...valores } : u,
                ),
              )
              toast.success('Usuario actualizado', {
                description: `${valores.nombres} ${valores.apellidos}.`,
              })
            }
            setDrawer(null)
          }}
        />
      )}
    </div>
  )
}

function UsuarioFormDrawer({
  modo,
  usuario,
  open,
  onOpenChange,
  onGuardar,
}: {
  modo: 'crear' | 'editar'
  usuario: UsuarioFila | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onGuardar: (valores: UsuarioFormValues) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: usuario
      ? {
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          correo: usuario.correo,
          rol: usuario.rol,
          especialidad: usuario.especialidad,
          estado: usuario.estado,
        }
      : {
          nombres: '',
          apellidos: '',
          correo: '',
          rol: 'analista',
          especialidad: '',
          estado: 'activo',
        },
  })

  const esEdicion = modo === 'editar'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l-0 sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {esEdicion ? (
              <Pencil className="h-5 w-5" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
            {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
          </SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Actualice los datos de la cuenta.'
              : 'Registre una nueva cuenta de usuario.'}
          </SheetDescription>
        </SheetHeader>

        <form
          id="form-usuario"
          onSubmit={handleSubmit(onGuardar)}
          noValidate
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="us-nombres">Nombres</Label>
            <Input
              id="us-nombres"
              placeholder="Ej. Andrea"
              className={cn(errors.nombres && 'border-destructive')}
              aria-invalid={!!errors.nombres}
              {...register('nombres')}
            />
            {errors.nombres && (
              <p className="text-xs text-destructive">{errors.nombres.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="us-apellidos">Apellidos</Label>
            <Input
              id="us-apellidos"
              placeholder="Ej. Quispe"
              className={cn(errors.apellidos && 'border-destructive')}
              aria-invalid={!!errors.apellidos}
              {...register('apellidos')}
            />
            {errors.apellidos && (
              <p className="text-xs text-destructive">
                {errors.apellidos.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="us-correo">Correo</Label>
            <Input
              id="us-correo"
              type="email"
              placeholder="usuario@hhi.pe"
              className={cn('pl-9', errors.correo && 'border-destructive')}
              aria-invalid={!!errors.correo}
              {...register('correo')}
            />
            {errors.correo && (
              <p className="text-xs text-destructive">{errors.correo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select
              value={watch('rol') ?? ''}
              onValueChange={(v) =>
                setValue('rol', v as UsuarioFormValues['rol'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className={cn(errors.rol && 'border-destructive')}>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES_DISPONIBLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROL_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rol && (
              <p className="text-xs text-destructive">{errors.rol.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Especialidad</Label>
            <Select
              value={watch('especialidad') ?? ''}
              onValueChange={(v) =>
                setValue('especialidad', v, { shouldValidate: true })
              }
            >
              <SelectTrigger className={cn(errors.especialidad && 'border-destructive')}>
                <SelectValue placeholder="Seleccione una especialidad" />
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.especialidad && (
              <p className="text-xs text-destructive">
                {errors.especialidad.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={watch('estado') ?? ''}
              onValueChange={(v) =>
                setValue('estado', v as UsuarioFormValues['estado'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className={cn(errors.estado && 'border-destructive')}>
                <SelectValue placeholder="Seleccione un estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            {errors.estado && (
              <p className="text-xs text-destructive">{errors.estado.message}</p>
            )}
          </div>
        </form>

        <SheetFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-usuario">
            {esEdicion ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}