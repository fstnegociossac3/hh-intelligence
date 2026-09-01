import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  CheckCircle2,
  File,
  FileUp,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { ESTADO_OK, ESTADO_INFO, ESTADO_NEUTRO, ESTADO_CRITICO } from '@/utils/estados-clases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOC_CATEGORIAS, ESPECIALIDADES } from '@/data/proyecto-detalle'
import type { CategoriaDocumento, DocumentoLista } from '@/data/proyecto-detalle'

type EstadoCarga = 'pendiente' | 'cargando' | 'cargado' | 'error'

interface FilaCarga {
  id: string
  file: File
  categoria: string
  especialidad: string
  version: string
  descripcion: string
}

interface UploadForm {
  archivos: FilaCarga[]
}

const filaSquema = z.object({
  id: z.string(),
  file: z.custom<File>(),
  categoria: z.string().min(1, 'Selecciona la categoría'),
  especialidad: z.string().min(1, 'Selecciona la especialidad'),
  version: z.string().min(1, 'Indica la versión'),
  descripcion: z.string(),
})

const uploadSchema = z.object({
  archivos: z.array(filaSquema).min(1, 'Agrega al menos un archivo'),
})

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    '.xlsx',
  ],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

const MAX_SIZE = 20 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function tipoDe(nombre: string) {
  const ext = nombre.split('.').pop()?.toUpperCase() ?? 'ARCHIVO'
  return ext
}

const ESTADO_LABEL: Record<EstadoCarga, string> = {
  pendiente: 'Pendiente',
  cargando: 'Cargando',
  cargado: 'Cargado',
  error: 'Error',
}

const ESTADO_CLASE: Record<EstadoCarga, string> = {
  pendiente: ESTADO_NEUTRO,
  cargando: ESTADO_INFO,
  cargado: ESTADO_OK,
  error: ESTADO_CRITICO,
}

const fechaHoy = () => new Date().toISOString().slice(0, 10)

function EstadoCargaBadge({ estado }: { estado: EstadoCarga }) {
  const icono: Record<EstadoCarga, ReactNode> = {
    pendiente: <File className="h-3.5 w-3.5" />,
    cargando: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    cargado: <CheckCircle2 className="h-3.5 w-3.5" />,
    error: <AlertTriangle className="h-3.5 w-3.5" />,
  }
  return (
    <Badge variant="outline" className={ESTADO_CLASE[estado]}>
      {icono[estado]}
      {ESTADO_LABEL[estado]}
    </Badge>
  )
}

export function CargarDocumentosDialog({
  setCategorias,
  setDocumentos,
}: {
  setCategorias: Dispatch<SetStateAction<CategoriaDocumento[]>>
  setDocumentos: Dispatch<SetStateAction<DocumentoLista[]>>
}) {
  const [progresos, setProgresos] = useState<
    Record<string, { estado: EstadoCarga; progreso: number }>
  >({})
  const timers = useRef<Record<string, number>>({})

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { archivos: [] },
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'archivos',
  })

  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearInterval)
  }, [])

  const onDrop = useCallback(
    (aceptados: File[]) => {
      aceptados.forEach((archivo) => {
        const id = crypto.randomUUID()
        append({
          id,
          file: archivo,
          categoria: '',
          especialidad: '',
          version: '1.0',
          descripcion: '',
        })
        setProgresos((p) => ({
          ...p,
          [id]: { estado: 'pendiente', progreso: 0 },
        }))
      })
    },
    [append],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPT,
      maxSize: MAX_SIZE,
    })

  useEffect(() => {
    fileRejections.forEach((r) => {
      r.errors.forEach((e) => toast.error(`Archivo rechazado: ${e.message}`))
    })
  }, [fileRejections])

  const estadoDe = (id: string): EstadoCarga =>
    progresos[id]?.estado ?? 'pendiente'
  const progresoDe = (id: string) => progresos[id]?.progreso ?? 0

  const simular = (id: string) => {
    const fila = getValues('archivos').find((f) => f.id === id)
    if (!fila) return
    setProgresos((p) => ({ ...p, [id]: { estado: 'cargando', progreso: 0 } }))
    let pct = 0
    const falla = Math.random() < 0.15
    const timer = window.setInterval(() => {
      pct += Math.floor(Math.random() * 30) + 8
      if (pct >= 100) {
        clearInterval(timer)
        delete timers.current[id]
        if (falla) {
          setProgresos((p) => ({ ...p, [id]: { estado: 'error', progreso: 92 } }))
          toast.error('Error al cargar el archivo', {
            description: fila.file.name,
          })
        } else {
          setProgresos((p) => ({ ...p, [id]: { estado: 'cargado', progreso: 100 } }))
          toast.success('Documento cargado', {
            description: fila.file.name,
          })
          setDocumentos((prev) => [
            ...prev,
            {
              id,
              nombre: fila.file.name,
              categoria: fila.categoria,
              especialidad: fila.especialidad,
              version: fila.version,
              fecha: fechaHoy(),
              tamaño: fila.file.size,
              estadoIa: 'pendiente',
              responsable: 'Sin asignar',
            },
          ])
          setCategorias((prev) => {
            const cat = fila.categoria
            const existe = prev.some((c) => c.categoria === cat)
            if (!existe) {
              return [
                ...prev,
                {
                  id: `cat-${Date.now()}`,
                  categoria: cat,
                  cantidad: 1,
                  procesados: 1,
                  estado: 'completo',
                  ultimaActualizacion: fechaHoy(),
                },
              ]
            }
            return prev.map((c) =>
              c.categoria === cat
                ? {
                    ...c,
                    cantidad: c.cantidad + 1,
                    procesados: c.procesados + 1,
                    estado: 'completo',
                    ultimaActualizacion: fechaHoy(),
                  }
                : c,
            )
          })
        }
      } else {
        setProgresos((p) => ({
          ...p,
          [id]: { estado: 'cargando', progreso: pct },
        }))
      }
    }, 350)
    timers.current[id] = timer
  }

  const cancelar = (id: string) => {
    clearInterval(timers.current[id])
    delete timers.current[id]
    setProgresos((p) => ({ ...p, [id]: { estado: 'pendiente', progreso: 0 } }))
    toast.info('Carga cancelada')
  }

  const eliminar = (index: number, id: string) => {
    clearInterval(timers.current[id])
    delete timers.current[id]
    remove(index)
    setProgresos((p) => {
      const copia = { ...p }
      delete copia[id]
      return copia
    })
    toast.info('Archivo eliminado de la lista')
  }

  const confirmar = handleSubmit(() => {
    const filas = getValues('archivos')
    const porCargar = filas.filter((f) => {
      const st = progresos[f.id]?.estado ?? 'pendiente'
      return st === 'pendiente' || st === 'error'
    })
    if (porCargar.length === 0) {
      toast.info('No hay archivos por cargar')
      return
    }
    toast.info('Iniciando carga de documentos', {
      description: `${porCargar.length} archivo(s)`,
    })
    porCargar.forEach((f) => simular(f.id))
  })

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-black">Cargar documentos</SheetTitle>
        <SheetDescription className="text-muted-foreground">
          Adjunta archivos del expediente. Formatos admitidos: PDF, XLSX, XLS,
          DOCX, JPG y PNG.
        </SheetDescription>
      </SheetHeader>

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/30 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">
          {isDragActive
            ? 'Suelta los archivos aquí'
            : 'Arrastra y suelta archivos o haz clic para seleccionar'}
        </p>
        <p className="text-xs text-muted-foreground">
          PDF · XLSX · XLS · DOCX · JPG · PNG — máx. 20 MB
        </p>
      </div>

      {fields.length > 0 && (
        <>
          <Separator className="my-1" />
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const estado = estadoDe(field.id)
              const progreso = progresoDe(field.id)
              return (
                <div key={field.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-600">
                        <FileUp className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {field.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tipoDe(field.file.name)} ·{' '}
                          {formatBytes(field.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <EstadoCargaBadge estado={estado} />
                      {estado === 'cargando' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => cancelar(field.id)}
                          aria-label="Cancelar carga"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {estado === 'error' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => simular(field.id)}
                          aria-label="Reintentar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => eliminar(index, field.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {(estado === 'cargando' || estado === 'cargado' || estado === 'error') && (
                    <Progress value={progreso} className="mt-3 h-1.5" />
                  )}

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Categoría
                      </Label>
                      <Controller
                        control={control}
                        name={`archivos.${index}.categoria`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOC_CATEGORIAS.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Especialidad
                      </Label>
                      <Controller
                        control={control}
                        name={`archivos.${index}.especialidad`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {ESPECIALIDADES.map((e) => (
                                <SelectItem key={e} value={e}>
                                  {e}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Versión
                      </Label>
                      <Controller
                        control={control}
                        name={`archivos.${index}.version`}
                        render={({ field: f }) => (
                          <Input
                            className="h-8 text-xs"
                            value={f.value}
                            onChange={f.onChange}
                            placeholder="1.0"
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Descripción (opcional)
                      </Label>
                      <Controller
                        control={control}
                        name={`archivos.${index}.descripcion`}
                        render={({ field: f }) => (
                          <Input
                            className="h-8 text-xs"
                            value={f.value}
                            onChange={f.onChange}
                            placeholder="Nota breve"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {errors.archivos?.[index]?.categoria && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {errors.archivos[index].categoria.message}
                    </p>
                  )}
                  {errors.archivos?.[index]?.version && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {errors.archivos[index].version.message}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <SheetFooter className="gap-2 pt-2">
        <SheetClose asChild>
          <Button variant="outline">Cancelar</Button>
        </SheetClose>
        <Button onClick={confirmar} disabled={fields.length === 0}>
          <FileUp />
          Confirmar carga
        </Button>
      </SheetFooter>
    </>
  )
}
