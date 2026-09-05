import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  Eye,
  EyeOff,
  FileText,
  GitBranch,
  Loader2,
  Lock,
  Mail,
  Map,
  Network,
  Ruler,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Logo } from '@/components/logo'
import {
  iniciarSesion,
  tomarRutaOrigen,
  USUARIOS_DEMO,
  useSesionGuardada,
} from '@/data/sesion-store'

const CLAVE_DEMO = '123456'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Ingrese su correo electrónico')
    .email('Ingrese un correo válido'),
  password: z
    .string()
    .min(1, 'Ingrese su contraseña')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  recordarme: z.boolean().optional(),
})

type LoginValues = z.infer<typeof loginSchema>

function PanelVisual() {
  return (
    <aside className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:w-1/2">
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-semibold text-white">
            H&H Intelligence
          </span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Revisión inteligente de
              <br />
              expedientes técnicos
            </h2>
            <p className="max-w-md text-sm text-sidebar-foreground/70">
              IA aplicada a la ingeniería para auditar planos, documentos y
              normativa en obras públicas de forma automática y precisa.
            </p>
          </div>

          <div className="grid max-w-lg grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <Map className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-white">Planos técnicos</p>
              <p className="mt-1 text-xs text-sidebar-foreground/60">
                Lectura geométrica y dimensional
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <FileText className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-white">Documentos</p>
              <p className="mt-1 text-xs text-sidebar-foreground/60">
                Extracción de contenido relevante
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <GitBranch className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-white">Conexiones</p>
              <p className="mt-1 text-xs text-sidebar-foreground/60">
                Enlace entre hallazgos y normas
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <BrainCircuit className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-white">Inteligencia</p>
              <p className="mt-1 text-xs text-sidebar-foreground/60">
                Modelos de IA especializados
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Datos protegidos
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Enfoque en ingeniería
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Plataforma integral
          </div>
        </div>
      </div>
    </aside>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      recordarme: false,
    },
  })

  const recordarme = watch('recordarme')

  const sesionGuardada = useSesionGuardada()
  const [sesionAlMontar] = useState(sesionGuardada)
  if (sesionAlMontar) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (values: LoginValues) => {
    if (loading) return
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 900))

    const usuario = USUARIOS_DEMO.find(
      (u) =>
        u.email.toLowerCase() === values.email.trim().toLowerCase() &&
        values.password === CLAVE_DEMO,
    )

    if (usuario) {
      iniciarSesion(usuario, values.recordarme === true)
      toast.success(`Bienvenido, ${usuario.nombre}`, {
        description: `Rol: ${usuario.rol}.`,
      })
      const destino = tomarRutaOrigen() ?? '/dashboard'
      navigate(destino, { replace: true })
    } else {
      toast.error('Credenciales incorrectas')
      setLoading(false)
    }
  }

  const rellenarDemo = (email: string) => {
    setValue('email', email)
    setValue('password', CLAVE_DEMO)
    toast.info('Credenciales demo cargadas')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <PanelVisual />

      <main className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:max-w-xl">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3 lg:items-start">
            <Logo />
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-semibold tracking-tight">
                H&H Intelligence
              </h1>
              <p className="text-sm text-muted-foreground">
                Inicie sesión para continuar
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardHeader>
                <CardTitle>Acceso a la plataforma</CardTitle>
                <CardDescription>
                  Ingrese sus credenciales de acceso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@hhi.pe"
                      autoComplete="email"
                      className={cn(
                        errors.email && 'border-destructive',
                        'pl-9',
                      )}
                      aria-invalid={!!errors.email}
                      disabled={loading}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => toast.info('Enlace de recuperación enviado')}
                    >
                      ¿Olvidó su contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={mostrarPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        errors.password && 'border-destructive',
                        'pl-9 pr-10',
                      )}
                      aria-invalid={!!errors.password}
                      disabled={loading}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={
                        mostrarPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {mostrarPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recordarme"
                    checked={!!recordarme}
                    onCheckedChange={(v) =>
                      setValue('recordarme', v === true, {
                        shouldValidate: true,
                      })
                    }
                    disabled={loading}
                  />
                  <Label
                    htmlFor="recordarme"
                    className="font-normal text-muted-foreground"
                  >
                    Recordarme en este equipo
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Ingresar
                      <ArrowRight />
                    </>
                  )}
                </Button>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                  {USUARIOS_DEMO.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => rellenarDemo(u.email)}
                      disabled={loading}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {u.rol} · {u.email}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Clave demo: {CLAVE_DEMO}
                </p>
              </CardFooter>
            </form>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Prototipo — sin autenticación real
          </p>
        </div>
      </main>
    </div>
  )
}
