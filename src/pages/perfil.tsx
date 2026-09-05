import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserRound, ShieldCheck, Eye, PenLine } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSession } from '@/hooks/useSession'
import { actualizarSesion, USUARIOS_DEMO } from '@/data/sesion-store'
import {
  MODULO_LABEL,
  MODULOS_POR_ROL,
  esRolLectura,
  rolComoClave,
} from '@/utils/permisos'
import { iniciales } from '@/utils/formatters'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const perfilSchema = z.object({
  nombre: z.string().min(1, 'Ingrese su nombre completo'),
  email: z.string().min(1, 'Ingrese su correo').email('Correo inválido'),
})

type PerfilValues = z.infer<typeof perfilSchema>

export function PerfilPage() {
  const { sesion } = useSession()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PerfilValues>({
    resolver: zodResolver(perfilSchema),
    values: {
      nombre: sesion?.nombre ?? '',
      email: sesion?.email ?? '',
    },
  })

  if (!sesion) return null

  const clave = rolComoClave(sesion.rol)
  const lectura = esRolLectura(sesion.rol)
  const modulos = MODULOS_POR_ROL[clave]

  const guardar = (values: PerfilValues) => {
    actualizarSesion({ nombre: values.nombre.trim(), email: values.email.trim() })
    toast.success('Perfil actualizado', {
      description: 'Los cambios se reflejaron en su perfil y en la barra lateral.',
    })
  }

  const cambiarDemo = (usuario: (typeof USUARIOS_DEMO)[number]) => {
    actualizarSesion({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    })
    toast.info(`Ahora eres ${usuario.nombre}`, {
      description: `Rol de demostración: ${usuario.rol}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mi perfil</h2>
          <p className="text-sm text-muted-foreground">
            Administre sus datos personales y revise sus permisos de acceso.
          </p>
        </div>
        <Badge variant={lectura ? 'outline' : 'secondary'}>
          {lectura ? (
            <Eye className="mr-1 h-3.5 w-3.5" />
          ) : (
            <PenLine className="mr-1 h-3.5 w-3.5" />
          )}
          {lectura ? 'Solo lectura' : 'Escritura activa'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit(guardar)} noValidate>
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
              <CardDescription>
                El nombre y el correo se actualizan en el encabezado, la barra
                lateral y esta página al instante.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://github.com/shadcn.png" alt={sesion.nombre} />
                  <AvatarFallback className="text-lg">
                    {iniciales(sesion.nombre)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-base font-semibold">
                    {sesion.nombre}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {sesion.email}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  autoComplete="name"
                  aria-invalid={!!errors.nombre}
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <UserRound className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Rol y permisos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rol actual</span>
                <Badge variant="secondary">{sesion.rol}</Badge>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium">Módulos disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {modulos.map((modulo) => (
                    <Badge key={modulo} variant="outline">
                      {MODULO_LABEL[modulo]}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cambiar de rol (demo)</CardTitle>
              <CardDescription>
                Prototipo: permite probar los roles visuales sin volver a
                iniciar sesión.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {USUARIOS_DEMO.map((usuario) => (
                <Button
                  key={usuario.id}
                  type="button"
                  variant={
                    sesion.rol.toLowerCase() === usuario.rol.toLowerCase()
                      ? 'default'
                      : 'outline'
                  }
                  className="w-full justify-start"
                  onClick={() => cambiarDemo(usuario)}
                >
                  <span className="truncate">{usuario.nombre}</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-muted text-muted-foreground"
                  >
                    {usuario.rol}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}