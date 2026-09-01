import { useState } from 'react'
import {
  Bell,
  FileSearch,
  Info,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  Users,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import { KpiCard } from '@/components/kpi-card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/motion'

export function ShowcasePage() {
  const [sheetAbierto, setSheetAbierto] = useState(false)

  return (
    <div className="space-y-10">
      <FadeIn className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Sistema visual reutilizable
        </h2>
        <p className="text-sm text-muted-foreground">
          Librería de componentes basada en shadcn/ui, adaptada para H&amp;H
          Intelligence.
        </p>
      </FadeIn>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Métricas (KpiCard)</h3>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <KpiCard
              titulo="Presupuesto total"
              valor="S/ 46.2 M"
              detalle="Expedientes en sistema"
              icono={Wallet}
              tono="info"
              tendencia={{ valor: '+12%', positiva: true }}
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              titulo="Con observaciones"
              valor="14"
              detalle="Requieren revisión"
              icono={AlertTriangle}
              tono="warning"
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              titulo="Críticos"
              valor="3"
              detalle="Hallazgos de severidad crítica"
              icono={XCircle}
              tono="danger"
            />
          </StaggerItem>
          <StaggerItem>
            <KpiCard
              titulo="Aprobados"
              valor="28"
              detalle="Expedientes conformes"
              icono={TrendingUp}
              tono="success"
            />
          </StaggerItem>
        </Stagger>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Estados</h3>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge estado="correcto" />
          <StatusBadge estado="advertencia" />
          <StatusBadge estado="critico" />
          <StatusBadge estado="pendiente" />
          <StatusBadge estado="procesando" />
          <StatusBadge estado="completado" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Secundario</Badge>
          <Badge variant="outline">Contorno</Badge>
          <Badge>Por defecto</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Formularios</h3>
        <Card>
          <CardHeader>
            <CardTitle>Formulario de prueba</CardTitle>
            <CardDescription>
              Input, Select, Textarea y botones
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input placeholder="Código del expediente" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transporte">Transportes</SelectItem>
                <SelectItem value="salud">Salud</SelectItem>
                <SelectItem value="educacion">Educación</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Descripción del proyecto..." />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => toast('Cancelado')}>
                Cancelar
              </Button>
              <Button
                onClick={() => toast.success('Guardado correctamente')}
              >
                <Plus />
                Guardar
              </Button>
              <Button
                variant="destructive"
                onClick={() => toast.error('Ha ocurrido un error')}
              >
                <Trash2 />
                Eliminar
              </Button>
              <Button variant="secondary" disabled>
                <Loader2 className="animate-spin" />
                Procesando
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Alertas</h3>
        <Alert variant="info">
          <Info />
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>
            El sistema generó el informe correctamente.
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTriangle />
          <AlertTitle>Advertencia</AlertTitle>
          <AlertDescription>
            Se detectaron observaciones pendientes de resolver.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>Crítico</AlertTitle>
          <AlertDescription>
            Error de lectura en el expediente técnico.
          </AlertDescription>
        </Alert>
        <Alert variant="success">
          <CheckCircle2 />
          <AlertTitle>Correcto</AlertTitle>
          <AlertDescription>
            Documento validado y aprobado.
          </AlertDescription>
        </Alert>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Tabla</h3>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">EXP-2025-0147</TableCell>
                  <TableCell>Parque Central de Huancayo</TableCell>
                  <TableCell>
                    <StatusBadge estado="procesando" />
                  </TableCell>
                  <TableCell className="text-right">S/ 2.4 M</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">EXP-2025-0163</TableCell>
                  <TableCell>Sistema de agua potable</TableCell>
                  <TableCell>
                    <StatusBadge estado="advertencia" />
                  </TableCell>
                  <TableCell className="text-right">S/ 9.6 M</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">EXP-2025-0171</TableCell>
                  <TableCell>Vía departamental HU-108</TableCell>
                  <TableCell>
                    <StatusBadge estado="critico" />
                  </TableCell>
                  <TableCell className="text-right">S/ 12.3 M</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Diálogos, overlays y menús</h3>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar análisis</DialogTitle>
                <DialogDescription>
                  Se ejecutará la revisión inteligente del expediente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button>Ejecutar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setSheetAbierto(true)}>
            Abrir panel lateral
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings />
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Opciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ver detalle</DropdownMenuItem>
              <DropdownMenuItem>Revisar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Rechazar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Bell />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notificaciones</TooltipContent>
          </Tooltip>
        </div>

        <Sheet open={sheetAbierto} onOpenChange={setSheetAbierto}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Panel de revisión</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <p>Contenido del panel lateral con información complementaria.</p>
              <Progress value={64} />
            </div>
          </SheetContent>
        </Sheet>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Pestañas y progreso</h3>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <Tabs defaultValue="resumen">
              <TabsList>
                <TabsTrigger value="resumen">Resumen</TabsTrigger>
                <TabsTrigger value="detalle">Detalle</TabsTrigger>
                <TabsTrigger value="archivos">Archivos</TabsTrigger>
              </TabsList>
              <TabsContent value="resumen" className="text-sm">
                Vista de resumen del expediente.
              </TabsContent>
              <TabsContent value="detalle" className="text-sm">
                Vista de detalle técnico.
              </TabsContent>
              <TabsContent value="archivos" className="text-sm">
                Documentos adjuntos.
              </TabsContent>
            </Tabs>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Avance del análisis</span>
                  <span className="font-medium">64%</span>
                </div>
                <Progress value={64} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Conformidad normativa</span>
                  <span className="font-medium">92%</span>
                </div>
                <Progress value={92} className="[&>div]:bg-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Skeleton y estado vacío</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </Card>
          <EmptyState
            icono={FileSearch}
            titulo="Sin resultados"
            descripcion="No se encontraron expedientes que coincidan con los filtros aplicados."
          >
            <Button variant="outline">
              <Search />
              Limpiar filtros
            </Button>
          </EmptyState>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Usuarios (KpiCard + Badge)</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            titulo="Usuarios activos"
            valor="42"
            detalle="Accesos habilitados"
            icono={Users}
            tono="default"
          />
          <KpiCard
            titulo="Pendientes"
            valor="7"
            detalle="Revisiones en espera"
            icono={Clock}
            tono="info"
            tendencia={{ valor: '-3', positiva: true }}
          />
          <KpiCard
            titulo="Advertencias"
            valor="5"
            detalle="Sesiones críticas"
            icono={AlertTriangle}
            tono="warning"
          />
        </div>
      </section>
    </div>
  )
}
