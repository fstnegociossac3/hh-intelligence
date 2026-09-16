import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, isAfter, parseISO } from 'date-fns'
import { z } from 'zod'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Proyecto, ProyectoEstado, TipoObra } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ProyectoEstadoBadge, PROYECTO_ESTADO_LABEL } from '@/components/proyecto-estado-badge'
import { cn } from '@/utils/cn'

const ESTADOS_DISPONIBLES = [
  'borrador',
  'documentacion',
  'en_analisis',
  'observado',
  'revisado',
] as const

const TIPOS_OBRA_DISPONIBLES = [
  'Infraestructura',
  'Transportes',
  'Saneamiento',
  'Salud',
  'Educación',
  'Energía',
] as const satisfies readonly TipoObra[]

const ESTADOS_INICIALES = [
  'borrador',
  'documentacion',
  'en_analisis',
] as const

const DEPARTAMENTOS = ['Junín', 'Lima', 'Cusco', 'Arequipa', 'Cajamarca']

const PROVINCIAS_POR_DEPARTAMENTO: Record<string, string[]> = {
  'Junín': ['Huancayo', 'Jauja', 'Concepción', 'Satipo', 'Chanchamayo'],
  'Lima': ['Lima', 'Huaral', 'Cañete', 'Huarochirí'],
  'Cusco': ['Cusco', 'Urubamba', 'La Convención', 'Anta'],
  'Arequipa': ['Arequipa', 'Camaná', 'Islay', 'Caylloma'],
  'Cajamarca': ['Cajamarca', 'Jaén', 'Chota', 'Celendín'],
}

const DISTRITOS_POR_PROVINCIA: Record<string, string[]> = {
  'Huancayo': ['Huancayo', 'Chilca', 'El Tambo', 'Huancán', 'Pilcomayo'],
  'Jauja': ['Jauja', 'Yauyos', 'Acolla', 'Ataura'],
  'Concepción': ['Concepción', 'Mito', 'Comas', 'Santa Rosa'],
  'Satipo': ['Satipo', 'Mazamari', 'Pangoa', 'Llaylla'],
  'Chanchamayo': ['La Merced', 'Perené', 'Pichanaqui', 'San Ramón'],
  'Lima': ['Lima', 'Miraflores', 'San Isidro', 'La Molina', 'Surco'],
  'Huaral': ['Huaral', 'Chancay', 'Aucallama'],
  'Cañete': ['San Vicente', 'Mala', 'Chilca', 'Asia'],
  'Huarochirí': ['Matucana', 'Chosica', 'San Bartolomé'],
  'Cusco': ['Cusco', 'San Sebastián', 'Wanchaq', 'San Jerónimo'],
  'Urubamba': ['Urubamba', 'Ollantaytambo', 'Yucay'],
  'La Convención': ['Quillabamba', 'Santa Ana', 'Machupicchu'],
  'Anta': ['Anta', 'Zurite', 'Chinchaypujio'],
  'Arequipa': ['Arequipa', 'Cayma', 'Cerro Colorado', 'Alto Selva Alegre'],
  'Camaná': ['Camaná', 'José María Quimper', 'Mariscal Cáceres'],
  'Islay': ['Mollendo', 'Mejía', 'Cocachacra'],
  'Caylloma': ['Cabanaconde', 'Chivay', 'Majes'],
  'Cajamarca': ['Cajamarca', 'Baños del Inca', 'Llacanora'],
  'Jaén': ['Jaén', 'Bellavista', 'Las Pirias'],
  'Chota': ['Chota', 'Choropampa', 'Lajas'],
  'Celendín': ['Celendín', 'Chumuch', 'Huasmin'],
}

const ESPECIALISTAS_SUGERIDOS = [
  'Ing. Estructuras',
  'Ing. Hidráulica',
  'Ing. Vial',
  'Ing. Sanitaria',
  'Arquitecto',
  'Ing. Electromecánica',
]

const PASOS = [
  { titulo: 'Información general', icono: Building2 },
  { titulo: 'Equipo', icono: Users },
  { titulo: 'Programación', icono: ClipboardCheck },
  { titulo: 'Confirmación', icono: Check },
]

const CAMPOS_PASO: (keyof NuevoProyectoValues)[][] = [
  [
    'nombre',
    'codigo',
    'entidad',
    'tipoObra',
    'departamento',
    'provincia',
    'distrito',
    'descripcion',
  ],
  ['jefeProyecto', 'especialistas', 'revisor'],
  ['fechaInicio', 'fechaEntrega', 'estadoInicial'],
]

const nuevoProyectoSchema = z.object({
  nombre: z
    .string()
    .min(5, 'Ingrese el nombre del proyecto (mín. 5 caracteres)'),
  codigo: z.string().min(3, 'Ingrese el código del expediente'),
  entidad: z.string().min(3, 'Ingrese la entidad pública'),
  tipoObra: z.enum(TIPOS_OBRA_DISPONIBLES, {
    message: 'Seleccione el tipo de obra',
  }),
  departamento: z.string().min(1, 'Seleccione el departamento'),
  provincia: z.string().min(1, 'Seleccione la provincia'),
  distrito: z.string().min(1, 'Seleccione el distrito'),
  descripcion: z
    .string()
    .min(10, 'Ingrese una descripción (mín. 10 caracteres)'),
  jefeProyecto: z.string().min(3, 'Ingrese el jefe de proyecto'),
  especialistas: z.string().min(3, 'Ingrese al menos un especialista'),
  revisor: z.string().min(3, 'Ingrese el revisor'),
  fechaInicio: z.string().min(1, 'Seleccione la fecha de inicio'),
  fechaEntrega: z.string().min(1, 'Seleccione la fecha de entrega'),
  estadoInicial: z.enum(ESTADOS_DISPONIBLES, {
    message: 'Seleccione el estado',
  }),
})

type NuevoProyectoValues = z.infer<typeof nuevoProyectoSchema>

const VALUES_VACIOS: NuevoProyectoValues = {
  nombre: '',
  codigo: '',
  entidad: '',
  tipoObra: 'Infraestructura',
  departamento: '',
  provincia: '',
  distrito: '',
  descripcion: '',
  jefeProyecto: '',
  especialistas: '',
  revisor: '',
  fechaInicio: '',
  fechaEntrega: '',
  estadoInicial: 'borrador',
}

function valoresDesdeProyecto(proyecto: Proyecto): NuevoProyectoValues {
  const partes = proyecto.ubicacion
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return {
    nombre: proyecto.nombre,
    codigo: proyecto.codigo,
    entidad: proyecto.entidad,
    tipoObra: proyecto.tipoObra,
    departamento: proyecto.departamento ?? partes[0] ?? '',
    provincia: proyecto.provincia ?? partes[1] ?? '',
    distrito: proyecto.distrito ?? partes[2] ?? '',
    descripcion: proyecto.descripcion ?? '',
    jefeProyecto: proyecto.responsable,
    especialistas: proyecto.especialistas ?? '',
    revisor: proyecto.revisor ?? '',
    fechaInicio: proyecto.fechaInicio ?? '',
    fechaEntrega: proyecto.fechaEntrega ?? '',
    estadoInicial: proyecto.estado,
  }
}

export interface ProyectoFormProps {
  modo: 'crear' | 'editar'
  proyecto?: Proyecto
  onGuardar: (proyecto: Proyecto) => void
  onCerrar: () => void
}

export function ProyectoForm({
  modo,
  proyecto,
  onGuardar,
  onCerrar,
}: ProyectoFormProps) {
  const [paso, setPaso] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const esEdicion = modo === 'editar'

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<NuevoProyectoValues>({
    resolver: zodResolver(nuevoProyectoSchema),
    defaultValues: esEdicion && proyecto ? valoresDesdeProyecto(proyecto) : VALUES_VACIOS,
  })

  const valores = watch()

  const provincias = DEPARTAMENTOS.includes(valores.departamento)
    ? PROVINCIAS_POR_DEPARTAMENTO[valores.departamento]
    : []
  const distritos = provincias.includes(valores.provincia)
    ? DISTRITOS_POR_PROVINCIA[valores.provincia]
    : []

  const esUltimoPaso = paso === PASOS.length - 1

  const siguiente = async () => {
    const valido = await trigger(CAMPOS_PASO[paso])
    if (!valido) return
    setPaso((p) => Math.min(p + 1, PASOS.length - 1))
  }

  const anterior = () => setPaso((p) => Math.max(p - 1, 0))

  const onSubmit = async (data: NuevoProyectoValues) => {
    if (guardando) return

    const inicio = parseISO(data.fechaInicio)
    const entrega = parseISO(data.fechaEntrega)
    if (isAfter(inicio, entrega)) {
      toast.error(
        'La fecha de entrega debe ser posterior a la fecha de inicio',
      )
      return
    }

    setGuardando(true)
    await new Promise((resolve) => setTimeout(resolve, 700))

    const hoy = new Date()
    const base = esEdicion && proyecto ? proyecto : null
    const guardado: Proyecto = {
      id: base?.id ?? `proy-${Date.now()}`,
      codigo: data.codigo.trim(),
      nombre: data.nombre.trim(),
      entidad: data.entidad.trim(),
      sector: base?.sector ?? data.tipoObra,
      tipoObra: data.tipoObra,
      responsable: data.jefeProyecto.trim(),
      avance: base?.avance ?? 0,
      observaciones: base?.observaciones ?? 0,
      monto: base?.monto ?? 0,
      fechaCreacion: base?.fechaCreacion ?? format(hoy, 'yyyy-MM-dd'),
      fechaInicio: data.fechaInicio,
      fechaEntrega: data.fechaEntrega,
      actualizadoEl: format(hoy, 'yyyy-MM-dd'),
      estado: data.estadoInicial,
      ubicacion: `${data.departamento}, ${data.provincia}, ${data.distrito}`,
      descripcion: data.descripcion.trim(),
      especialistas: data.especialistas.trim(),
      revisor: data.revisor.trim(),
      departamento: data.departamento,
      provincia: data.provincia,
      distrito: data.distrito,
    }

    onGuardar(guardado)
  }

  const agregarEspecialista = (valor: string) => {
    const actual = getValues('especialistas')
    const lista = actual
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (lista.includes(valor)) return
    setValue(
      'especialistas',
      lista.length ? `${lista.join(', ')}, ${valor}` : valor,
      { shouldValidate: true },
    )
  }

  const textoError = (campo: keyof NuevoProyectoValues) => {
    const mensaje = errors[campo]?.message
    return mensaje ? <p className="text-xs text-destructive">{mensaje}</p> : null
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PASOS.map((p, i) => {
          const Icono = p.icono
          const activo = i === paso
          const completado = i < paso
          return (
            <li key={p.titulo}>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                  activo
                    ? 'border-primary bg-primary/10 text-foreground'
                    : completado
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-muted text-muted-foreground',
                )}
              >
                <Icono className="h-4 w-4 shrink-0" />
                <span className="truncate">{p.titulo}</span>
              </div>
            </li>
          )
        })}
      </ol>

      <Separator />

      {paso === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-nombre">Nombre del proyecto</Label>
            <Input
              id="np-nombre"
              placeholder="Ej: Mejoramiento del puente vehicular..."
              {...register('nombre')}
            />
            {textoError('nombre')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-codigo">Código</Label>
            <Input
              id="np-codigo"
              placeholder="EXP-2026-0001"
              {...register('codigo')}
            />
            {textoError('codigo')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-entidad">Entidad pública</Label>
            <Input
              id="np-entidad"
              placeholder="Ej: Municipalidad Provincial de..."
              {...register('entidad')}
            />
            {textoError('entidad')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-tipo">Tipo de obra</Label>
            <Select
              value={valores.tipoObra}
              onValueChange={(v) =>
                setValue('tipoObra', v as TipoObra, { shouldValidate: true })
              }
            >
              <SelectTrigger id="np-tipo">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OBRA_DISPONIBLES.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('tipoObra')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-depto">Departamento</Label>
            <Select
              value={valores.departamento}
              onValueChange={(v) => {
                setValue('departamento', v, { shouldValidate: true })
                setValue('provincia', '')
                setValue('distrito', '')
              }}
            >
              <SelectTrigger id="np-depto">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTAMENTOS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('departamento')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-prov">Provincia</Label>
            <Select
              value={valores.provincia}
              onValueChange={(v) => {
                setValue('provincia', v, { shouldValidate: true })
                setValue('distrito', '')
              }}
              disabled={!provincias.length}
            >
              <SelectTrigger id="np-prov">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {provincias.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('provincia')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-distrito">Distrito</Label>
            <Select
              value={valores.distrito}
              onValueChange={(v) =>
                setValue('distrito', v, { shouldValidate: true })
              }
              disabled={!distritos.length}
            >
              <SelectTrigger id="np-distrito">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {distritos.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('distrito')}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-desc">Descripción</Label>
            <Textarea
              id="np-desc"
              placeholder="Describa el alcance del expediente técnico..."
              rows={3}
              {...register('descripcion')}
            />
            {textoError('descripcion')}
          </div>
        </div>
      )}

      {paso === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-jefe">Jefe de proyecto</Label>
            <Input
              id="np-jefe"
              placeholder="Nombre del responsable del proyecto"
              {...register('jefeProyecto')}
            />
            {textoError('jefeProyecto')}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-espec">Especialistas</Label>
            <Input
              id="np-espec"
              placeholder="Ej: Ing. Estructuras, Ing. Hidráulica"
              {...register('especialistas')}
            />
            <div className="flex flex-wrap gap-1.5">
              {ESPECIALISTAS_SUGERIDOS.map((esp) => (
                <button
                  key={esp}
                  type="button"
                  onClick={() => agregarEspecialista(esp)}
                  className="rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  + {esp.replace('Ing. ', '')}
                </button>
              ))}
            </div>
            {textoError('especialistas')}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-revisor">Revisor</Label>
            <Input
              id="np-revisor"
              placeholder="Nombre del revisor del expediente"
              {...register('revisor')}
            />
            {textoError('revisor')}
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="np-inicio">Fecha de inicio</Label>
            <Input
              id="np-inicio"
              type="date"
              {...register('fechaInicio')}
            />
            {textoError('fechaInicio')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-entrega">Fecha estimada de entrega</Label>
            <Input
              id="np-entrega"
              type="date"
              {...register('fechaEntrega')}
            />
            {textoError('fechaEntrega')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-estado">
              {esEdicion ? 'Estado' : 'Estado inicial'}
            </Label>
            <Select
              value={valores.estadoInicial}
              onValueChange={(v) =>
                setValue('estadoInicial', v as ProyectoEstado, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="np-estado">
                <SelectValue placeholder="Seleccione" />
              </SelectTrigger>
              <SelectContent>
                {(esEdicion ? ESTADOS_DISPONIBLES : ESTADOS_INICIALES).map((e) => (
                  <SelectItem key={e} value={e}>
                    {PROYECTO_ESTADO_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {textoError('estadoInicial')}
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Información general
            </h4>
            <dl className="space-y-1.5 text-sm">
              <FilaResumen etiqueta="Nombre" valor={valores.nombre} />
              <FilaResumen etiqueta="Código" valor={valores.codigo} />
              <FilaResumen etiqueta="Entidad" valor={valores.entidad} />
              <FilaResumen etiqueta="Tipo de obra" valor={valores.tipoObra} />
              <FilaResumen
                etiqueta="Ubicación"
                valor={`${valores.departamento}, ${valores.provincia}, ${valores.distrito}`}
              />
              <FilaResumen etiqueta="Descripción" valor={valores.descripcion} />
            </dl>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                Equipo
              </h4>
              <dl className="space-y-1.5 text-sm">
                <FilaResumen
                  etiqueta="Jefe de proyecto"
                  valor={valores.jefeProyecto}
                />
                <FilaResumen
                  etiqueta="Especialistas"
                  valor={valores.especialistas}
                />
                <FilaResumen etiqueta="Revisor" valor={valores.revisor} />
              </dl>
            </div>

            <div className="space-y-1">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                Programación
              </h4>
              <dl className="space-y-1.5 text-sm">
                <FilaResumen
                  etiqueta="Inicio"
                  valor={
                    valores.fechaInicio
                      ? format(parseISO(valores.fechaInicio), 'dd/MM/yyyy')
                      : ''
                  }
                />
                <FilaResumen
                  etiqueta="Entrega"
                  valor={
                    valores.fechaEntrega
                      ? format(parseISO(valores.fechaEntrega), 'dd/MM/yyyy')
                      : ''
                  }
                />
                <FilaResumen
                  etiqueta="Estado"
                  valor={PROYECTO_ESTADO_LABEL[valores.estadoInicial]}
                />
                {esEdicion && (
                  <dd className="mt-1">
                    <ProyectoEstadoBadge estado={valores.estadoInicial} />
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      )}

      <Separator />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onCerrar}
          disabled={guardando}
        >
          Cancelar
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {paso > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={anterior}
              disabled={guardando}
            >
              <ArrowLeft />
              Anterior
            </Button>
          )}

          {esUltimoPaso ? (
            <Button type="submit" disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 />
                  {esEdicion ? 'Guardar cambios' : 'Guardar proyecto'}
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={siguiente}>
              Siguiente
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

function FilaResumen({
  etiqueta,
  valor,
}: {
  etiqueta: string
  valor: string
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-muted-foreground">{etiqueta}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium">{valor}</dd>
    </div>
  )
}