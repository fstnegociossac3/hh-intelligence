import { useEffect, useState } from 'react'
import {
  Bell,
  BellRing,
  CalendarDays,
  CircleHelp,
  Home,
  Monitor,
  Moon,
  Palette,
  Rows3,
  Settings2,
  SlidersHorizontal,
  Sun,
  SunMoon,
  Table2,
  User,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FadeIn } from '@/components/ui/motion'
import { ESPECIALIDADES } from '@/data/proyecto-detalle'
import { cn } from '@/utils/cn'

const ESQUEMA_CLAVE = 'hh-config'

type Tema = 'claro' | 'oscuro' | 'sistema'

const ROLES_PERFIL = [
  { id: 'administrador', nombre: 'Administrador' },
  { id: 'jefe_proyecto', nombre: 'Jefe de Proyecto' },
  { id: 'especialista', nombre: 'Especialista Técnico' },
  { id: 'revisor', nombre: 'Revisor' },
] as const

const TEMAS: { id: Tema; nombre: string; icono: LucideIcon }[] = [
  { id: 'claro', nombre: 'Claro', icono: Sun },
  { id: 'oscuro', nombre: 'Oscuro', icono: Moon },
  { id: 'sistema', nombre: 'Del sistema', icono: Monitor },
]

const DENSIDAD = [
  { id: 'compacta', nombre: 'Compacta', icono: Rows3 },
  { id: 'comoda', nombre: 'Cómoda', icono: Table2 },
]

const FECHAS = [
  { id: 'es-pe', nombre: 'Día MMM Año (es-PE)', ejemplo: '05 mar 2026' },
  { id: 'dd-mm-aaaa', nombre: 'DD/MM/AAAA', ejemplo: '05/03/2026' },
  { id: 'aaaa-mm-dd', nombre: 'AAAA-MM-DD', ejemplo: '2026-03-05' },
]

const PAGINAS_INICIO = ['Dashboard', 'Proyectos', 'Analisis', 'Observaciones', 'Reportes']

const NOTIFICACIONES_DEF: { id: string; nombre: string; descripcion: string; activa: boolean }[] = [
  { id: 'observaciones', nombre: 'Nuevas observaciones', descripcion: 'Cuando se detecte una nueva observación en un documento.', activa: true },
  { id: 'criticas', nombre: 'Observaciones críticas', descripcion: 'Cuando una observación supere el umbral de criticidad.', activa: true },
  { id: 'asignaciones', nombre: 'Asignaciones', descripcion: 'Cuando te asignen un proyecto o documento.', activa: true },
  { id: 'reanalisis', nombre: 'Reanálisis completados', descripcion: 'Cuando termine un proceso de reanálisis solicitado.', activa: false },
  { id: 'reportes', nombre: 'Reportes generados', descripcion: 'Cuando un reporte termine de generarse.', activa: false },
]

interface ConfigPersistida {
  tema: Tema
  densidad: string
  notificaciones: Record<string, boolean>
  paginaInicio: string
  filasPorPagina: string
  formatoFecha: string
  ayudas: boolean
}

const CONFIG_DEF: ConfigPersistida = {
  tema: 'sistema',
  densidad: 'comoda',
  notificaciones: Object.fromEntries(NOTIFICACIONES_DEF.map((n) => [n.id, n.activa])),
  paginaInicio: 'Dashboard',
  filasPorPagina: '10',
  formatoFecha: 'es-pe',
  ayudas: true,
}

function cargarConfig(): ConfigPersistida {
  try {
    const crudo = localStorage.getItem(ESQUEMA_CLAVE)
    if (crudo) return { ...CONFIG_DEF, ...JSON.parse(crudo) }
  } catch {
    /* ignorar config dañada */
  }
  return CONFIG_DEF
}

function guardarConfig(config: ConfigPersistida) {
  try {
    localStorage.setItem(ESQUEMA_CLAVE, JSON.stringify(config))
  } catch {
    /* almacenamiento no disponible */
  }
}

function detectarSistema(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function aplicarTema(tema: Tema) {
  const oscuro = tema === 'oscuro' || (tema === 'sistema' && detectarSistema())
  document.documentElement.classList.toggle('dark', oscuro)
}

const perfilSchema = z.object({
  nombres: z.string().min(2, 'Ingresa al menos 2 caracteres'),
  apellidos: z.string().min(2, 'Ingresa al menos 2 caracteres'),
  correo: z.string().email('Ingresa un correo válido'),
  rol: z.string().min(1, 'Selecciona un rol'),
  especialidad: z.string(),
})

type PerfilFormValues = z.infer<typeof perfilSchema>

const PERFIL_DEF: PerfilFormValues = {
  nombres: 'María Fernanda',
  apellidos: 'Quispe Rojas',
  correo: 'maria.quispe@empresa.pe',
  rol: 'jefe_proyecto',
  especialidad: ESPECIALIDADES[0] ?? '',
}

export function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfigPersistida>(CONFIG_DEF)

  useEffect(() => {
    setConfig(cargarConfig())
  }, [])

  useEffect(() => {
    aplicarTema(config.tema)
  }, [config.tema])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (config.tema === 'sistema') aplicarTema('sistema')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [config.tema])

  const actualizar = (parcial: Partial<ConfigPersistida>) => {
    setConfig((prev) => {
      const siguiente = { ...prev, ...parcial }
      guardarConfig(siguiente)
      return siguiente
    })
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Settings2 className="h-5 w-5 text-primary" />
            Configuración
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra tu perfil, apariencia, notificaciones y preferencias del sistema.
          </p>
        </div>
      </FadeIn>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto sm:inline-flex">
          <TabsTrigger value="perfil"><User className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="apariencia"><Palette className="h-4 w-4" /> Apariencia</TabsTrigger>
          <TabsTrigger value="notificaciones"><Bell className="h-4 w-4" /> Notificaciones</TabsTrigger>
          <TabsTrigger value="preferencias"><SlidersHorizontal className="h-4 w-4" /> Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <PerfilTab />
        </TabsContent>

        <TabsContent value="apariencia">
          <AparienciaTab config={config} onActualizar={actualizar} />
        </TabsContent>

        <TabsContent value="notificaciones">
          <NotificacionesTab config={config} onActualizar={actualizar} />
        </TabsContent>

        <TabsContent value="preferencias">
          <PreferenciasTab config={config} onActualizar={actualizar} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PerfilTab() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: PERFIL_DEF,
  })

  const rol = watch('rol')
  const especialidad = watch('especialidad')

  const onGuardar = (valores: PerfilFormValues) => {
    toast.success('Perfil actualizado', {
      description: `${valores.nombres} ${valores.apellidos}.`,
    })
  }

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" />
            Información personal
          </CardTitle>
          <CardDescription>
            Datos que se muestran en tu perfil y en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-semibold text-primary">
              MQ
            </div>
            <div className="text-sm">
              <p className="font-medium">Avatar</p>
              <p className="text-muted-foreground">Imagen de perfil (simulada).</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombre</Label>
              <Input id="nombres" placeholder="Nombres" {...register('nombres')} />
              {errors.nombres && (
                <p className="text-xs text-destructive">{errors.nombres.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" placeholder="Apellidos" {...register('apellidos')} />
              {errors.apellidos && (
                <p className="text-xs text-destructive">{errors.apellidos.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" placeholder="correo@empresa.pe" {...register('correo')} />
            {errors.correo && (
              <p className="text-xs text-destructive">{errors.correo.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={rol} onValueChange={(v) => setValue('rol', v, { shouldValidate: true })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_PERFIL.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rol && (
                <p className="text-xs text-destructive">{errors.rol.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Especialidad</Label>
              <Select value={especialidad} onValueChange={(v) => setValue('especialidad', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIALIDADES.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="gap-1.5">
          Guardar perfil
        </Button>
      </div>
    </form>
  )
}

function OpcionSeleccion(
  props: React.PropsWithChildren<{ opciones: { id: string; nombre: string; icono?: LucideIcon; descripcion?: string }[]; seleccionada: string; onSelect: (id: string) => void }>,
) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {props.opciones.map((op) => {
        const Icono = op.icono
        const activa = op.id === props.seleccionada
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => props.onSelect(op.id)}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              activa
                ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/30'
                : 'border-border hover:bg-muted/40',
            )}
          >
            {Icono && <Icono className={cn('mb-2 h-5 w-5', activa ? 'text-primary' : 'text-muted-foreground')} />}
            <p className="text-sm font-medium">{op.nombre}</p>
            {op.descripcion && (
              <p className="mt-0.5 text-xs text-muted-foreground">{op.descripcion}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}

function AparienciaTab({ config, onActualizar }: { config: ConfigPersistida; onActualizar: (p: Partial<ConfigPersistida>) => void }) {
  const guardar = () => {
    toast.success('Apariencia actualizada', {
      description: 'El tema y la densidad se aplicaron y guardaron.',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SunMoon className="h-4 w-4 text-primary" />
            Tema
          </CardTitle>
          <CardDescription>Elige cómo se ve la interfaz del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpcionSeleccion
            opciones={TEMAS}
            seleccionada={config.tema}
            onSelect={(id) => onActualizar({ tema: id as Tema })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rows3 className="h-4 w-4 text-primary" />
            Densidad de interfaz
          </CardTitle>
          <CardDescription>Controla el espacio entre los elementos.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpcionSeleccion
            opciones={DENSIDAD}
            seleccionada={config.densidad}
            onSelect={(id) => onActualizar({ densidad: id })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} className="gap-1.5">
          Guardar apariencia
        </Button>
      </div>
    </div>
  )
}

function NotificacionesTab({ config, onActualizar }: { config: ConfigPersistida; onActualizar: (p: Partial<ConfigPersistida>) => void }) {
  const activar = (id: string, valor: boolean) => {
    onActualizar({
      notificaciones: { ...config.notificaciones, [id]: valor },
    })
  }

  const guardar = () => {
    toast.success('Notificaciones actualizadas', {
      description: 'Tus preferencias de notificación se guardaron.',
    })
  }

  const activas = NOTIFICACIONES_DEF.filter((n) => config.notificaciones[n.id]).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-primary" />
            Preferencias de notificación
          </CardTitle>
          <CardDescription>
            <Badge variant="secondary">{activas} de {NOTIFICACIONES_DEF.length} activas</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {NOTIFICACIONES_DEF.map((n) => (
            <label
              key={n.id}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div>
                <p className="text-sm font-medium">{n.nombre}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.descripcion}</p>
              </div>
              <Checkbox
                checked={config.notificaciones[n.id]}
                onCheckedChange={(v) => activar(n.id, Boolean(v))}
                className="mt-1"
                aria-label={n.nombre}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} className="gap-1.5">
          Guardar notificaciones
        </Button>
      </div>
    </div>
  )
}

function PreferenciasTab({ config, onActualizar }: { config: ConfigPersistida; onActualizar: (p: Partial<ConfigPersistida>) => void }) {
  const guardar = () => {
    toast.success('Preferencias guardadas', {
      description: 'Tus preferencias generales se aplicaron.',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Preferencias generales
          </CardTitle>
          <CardDescription>Configura el comportamiento predeterminado del sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Home className="h-4 w-4 text-muted-foreground" /> Página inicial
            </Label>
            <Select value={config.paginaInicio} onValueChange={(v) => onActualizar({ paginaInicio: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGINAS_INICIO.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Table2 className="h-4 w-4 text-muted-foreground" /> Cantidad de filas por tabla
            </Label>
            <Select value={config.filasPorPagina} onValueChange={(v) => onActualizar({ filasPorPagina: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['5', '10', '20', '50'].map((n) => (
                  <SelectItem key={n} value={n}>{n} filas</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground" /> Formato de fecha
            </Label>
            <Select value={config.formatoFecha} onValueChange={(v) => onActualizar({ formatoFecha: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FECHAS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Ejemplo: {FECHAS.find((f) => f.id === config.formatoFecha)?.ejemplo}
            </p>
          </div>

          <label className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="flex items-start gap-2">
              <CircleHelp className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Mostrar ayudas contextuales</p>
                <p className="text-xs text-muted-foreground">
                  Muestra consejos y descripciones de ayuda en las secciones.
                </p>
              </div>
            </div>
            <Checkbox
              checked={config.ayudas}
              onCheckedChange={(v) => onActualizar({ ayudas: Boolean(v) })}
              className="mt-1"
              aria-label="Mostrar ayudas contextuales"
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={guardar} className="gap-1.5">
          Guardar preferencias
        </Button>
      </div>
    </div>
  )
}