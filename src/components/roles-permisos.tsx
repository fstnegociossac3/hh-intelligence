import { useState } from 'react'
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileText,
  FolderKanban,
  GitCompare,
  HardHat,
  KeyRound,
  LayoutDashboard,
  Save,
  ScanSearch,
  Settings2,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/motion'
import { cn } from '@/utils/cn'

type RolSistema = 'administrador' | 'jefe_proyecto' | 'especialista' | 'revisor'

const ROL_LABEL: Record<RolSistema, string> = {
  administrador: 'Administrador',
  jefe_proyecto: 'Jefe de Proyecto',
  especialista: 'Especialista Técnico',
  revisor: 'Revisor',
}

const ROL_DESCRIPCION: Record<RolSistema, string> = {
  administrador: 'Acceso total al sistema.',
  jefe_proyecto: 'Proyectos, documentos, análisis, observaciones, comparador y reportes.',
  especialista: 'Documentos asignados, análisis y observaciones.',
  revisor: 'Consulta de proyectos, resultados, observaciones y reportes.',
}

const ROL_ICONO: Record<RolSistema, LucideIcon> = {
  administrador: UserCog,
  jefe_proyecto: ClipboardCheck,
  especialista: HardHat,
  revisor: ShieldCheck,
}

type Modulo =
  | 'dashboard'
  | 'proyectos'
  | 'documentos'
  | 'analisis'
  | 'observaciones'
  | 'comparador'
  | 'reportes'
  | 'usuarios'
  | 'configuracion'

const MODULOS: { id: Modulo; nombre: string; icono: LucideIcon }[] = [
  { id: 'dashboard', nombre: 'Dashboard', icono: LayoutDashboard },
  { id: 'proyectos', nombre: 'Proyectos', icono: FolderKanban },
  { id: 'documentos', nombre: 'Documentos', icono: FileText },
  { id: 'analisis', nombre: 'Análisis', icono: ScanSearch },
  { id: 'observaciones', nombre: 'Observaciones', icono: ClipboardList },
  { id: 'comparador', nombre: 'Comparador', icono: GitCompare },
  { id: 'reportes', nombre: 'Reportes', icono: FileBarChart },
  { id: 'usuarios', nombre: 'Usuarios', icono: Users },
  { id: 'configuracion', nombre: 'Configuración', icono: Settings2 },
]

type Permiso =
  | 'ver'
  | 'crear'
  | 'editar'
  | 'ejecutar'
  | 'resolver'
  | 'reportes'
  | 'administrar'

const PERMISOS: { id: Permiso; nombre: string }[] = [
  { id: 'ver', nombre: 'Ver' },
  { id: 'crear', nombre: 'Crear' },
  { id: 'editar', nombre: 'Editar' },
  { id: 'ejecutar', nombre: 'Ejecutar análisis' },
  { id: 'resolver', nombre: 'Resolver observaciones' },
  { id: 'reportes', nombre: 'Generar reportes' },
  { id: 'administrar', nombre: 'Administrar usuarios' },
]

const ACCESO_SUGERIDO: Record<Modulo, RolSistema[]> = {
  dashboard: ['administrador'],
  proyectos: ['administrador', 'jefe_proyecto', 'revisor'],
  documentos: ['administrador', 'jefe_proyecto', 'especialista'],
  analisis: ['administrador', 'jefe_proyecto', 'especialista', 'revisor'],
  observaciones: ['administrador', 'jefe_proyecto', 'especialista', 'revisor'],
  comparador: ['administrador', 'jefe_proyecto'],
  reportes: ['administrador', 'jefe_proyecto', 'revisor'],
  usuarios: ['administrador'],
  configuracion: ['administrador'],
}

const PERMISOS_SUGERIDOS: Record<RolSistema, Permiso[]> = {
  administrador: ['ver', 'crear', 'editar', 'ejecutar', 'resolver', 'reportes', 'administrar'],
  jefe_proyecto: ['ver', 'crear', 'editar', 'ejecutar', 'resolver', 'reportes'],
  especialista: ['ver', 'crear', 'editar', 'ejecutar'],
  revisor: ['ver', 'resolver', 'reportes'],
}

function todosLosRoles(): RolSistema[] {
  return ['administrador', 'jefe_proyecto', 'especialista', 'revisor']
}

export function RolesPermisos() {
  const rolOrden = todosLosRoles()

  const [acceso, setAcceso] = useState<Record<Modulo, RolSistema[]>>(() => {
    const inicial = {} as Record<Modulo, RolSistema[]>
    for (const m of MODULOS) inicial[m.id] = [...ACCESO_SUGERIDO[m.id]]
    return inicial
  })

  const [permisos, setPermisos] = useState<Record<RolSistema, Permiso[]>>(() => {
    const inicial = {} as Record<RolSistema, Permiso[]>
    for (const rol of rolOrden) {
      const sugerido = PERMISOS_SUGERIDOS[rol] ?? []
      inicial[rol] = [...sugerido]
    }
    return inicial
  })

  const [rolSeleccionado, setRolSeleccionado] = useState<RolSistema>('administrador')
  const RolIcono = ROL_ICONO[rolSeleccionado]

  const tieneAcceso = (modulo: Modulo, rol: RolSistema) =>
    acceso[modulo].includes(rol)

  const toggleAcceso = (modulo: Modulo, rol: RolSistema) => {
    setAcceso((prev) => {
      const actuales = prev[modulo]
      const nuevos = actuales.includes(rol)
        ? actuales.filter((r) => r !== rol)
        : [...actuales, rol]
      return { ...prev, [modulo]: nuevos }
    })
  }

  const tienePermiso = (permiso: Permiso) =>
    permisos[rolSeleccionado].includes(permiso)

  const togglePermiso = (permiso: Permiso) => {
    setPermisos((prev) => {
      const actuales = prev[rolSeleccionado]
      const nuevos = actuales.includes(permiso)
        ? actuales.filter((p) => p !== permiso)
        : [...actuales, permiso]
      return { ...prev, [rolSeleccionado]: nuevos }
    })
  }

  const marcarTodoRol = (rol: RolSistema, activar: boolean) => {
    setAcceso((prev) => {
      const next = { ...prev }
      for (const m of MODULOS) {
        next[m.id] = activar
          ? Array.from(new Set([...next[m.id], rol]))
          : next[m.id].filter((r) => r !== rol)
      }
      return next
    })
  }

  const rolTieneAlgo = (rol: RolSistema) =>
    MODULOS.some((m) => acceso[m.id].includes(rol))

  const marcarTodoModulo = (modulo: Modulo, activar: boolean) => {
    setAcceso((prev) => ({
      ...prev,
      [modulo]: activar ? [...rolOrden] : [],
    }))
  }

  const Guardar = () => {
    toast.success('Permisos guardados', {
      description: 'Los cambios de roles y permisos se guardaron (simulado).',
    })
  }

  const totalModulos = MODULOS.length

  return (
    <FadeIn className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <KeyRound className="h-5 w-5 text-primary" />
            Roles y permisos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Matriz de acceso por módulo y permisos por rol (simulado).
          </p>
        </div>
        <Button onClick={Guardar} className="gap-1.5">
          <Save className="h-4 w-4" />
          Guardar cambios
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Matriz de permisos · Módulos por rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Módulo
                    </th>
                    {rolOrden.map((rol) => (
                      <th key={rol} className="px-2 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">
                            {shortRol(rol)}
                          </span>
                          <button
                            type="button"
                            className="text-[10px] font-medium text-primary hover:underline"
                            onClick={() => marcarTodoRol(rol, !rolTieneAlgo(rol))}
                          >
                            {rolTieneAlgo(rol) ? 'limpiar' : 'todo'}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULOS.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                          onClick={() =>
                            marcarTodoModulo(m.id, !tieneAcceso(m.id, rolOrden[0]))
                          }
                          title="Marcar todo el módulo"
                        >
                          <m.icono className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium">{m.nombre}</span>
                        </button>
                      </td>
                      {rolOrden.map((rol) => (
                        <td key={rol} className="px-2 py-2.5 text-center">
                          <Checkbox
                            checked={tieneAcceso(m.id, rol)}
                            onCheckedChange={() => toggleAcceso(m.id, rol)}
                            aria-label={`${ROL_LABEL[rol]} · ${m.nombre}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {MODULOS.map((m) => {
                const Icono = m.icono
                return (
                  <div key={m.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        className="flex min-w-0 items-center gap-2 text-left"
                        onClick={() =>
                          marcarTodoModulo(m.id, !tieneAcceso(m.id, rolOrden[0]))
                        }
                        title="Marcar todo el módulo"
                      >
                        <Icono className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{m.nombre}</span>
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {rolOrden.filter((r) => tieneAcceso(m.id, r)).length}/{rolOrden.length}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {rolOrden.map((rol) => (
                        <label
                          key={rol}
                          className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/40"
                        >
                          <span className="text-xs">{shortRol(rol)}</span>
                          <Checkbox
                            checked={tieneAcceso(m.id, rol)}
                            onCheckedChange={() => toggleAcceso(m.id, rol)}
                            aria-label={`${ROL_LABEL[rol]} · ${m.nombre}`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Permisos por rol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {rolOrden.map((rol) => {
                const Icono = ROL_ICONO[rol]
                const activo = rol === rolSeleccionado
                return (
                  <button
                    key={rol}
                    type="button"
                    onClick={() => setRolSeleccionado(rol)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                      activo
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    <Icono className="h-3.5 w-3.5" />
                    {shortRol(rol)}
                  </button>
                )
              })}
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <RolIcono />
                  {ROL_LABEL[rolSeleccionado]}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {ROL_DESCRIPCION[rolSeleccionado]}
              </p>
              <Badge variant="secondary" className="mt-2">
                {permisos[rolSeleccionado].length} de {PERMISOS.length} permisos
              </Badge>
            </div>

            <div className="space-y-1">
              {PERMISOS.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <span className="text-sm">{p.nombre}</span>
                  <Checkbox
                    checked={tienePermiso(p.id)}
                    onCheckedChange={() => togglePermiso(p.id)}
                    aria-label={`${ROL_LABEL[rolSeleccionado]} · ${p.nombre}`}
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            {rolOrden.map((rol) => {
              const Icono = ROL_ICONO[rol]
              const contados = MODULOS.filter((m) =>
                acceso[m.id].includes(rol),
              ).length
              return (
                <div key={rol} className="flex min-w-0 items-start gap-2">
                  <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <Icono className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {ROL_LABEL[rol]}
                      <Badge variant="secondary">
                        {contados}/{totalModulos} módulos
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ROL_DESCRIPCION[rol]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  )
}

function shortRol(rol: RolSistema) {
  return ROL_LABEL[rol]
}