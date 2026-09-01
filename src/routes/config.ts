import {
  BarChart3,
  ClipboardCheck,
GitCompare,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AppRoute {
  path: string
  nombre: string
  descripcion: string
  icon: LucideIcon
}

export const rutas: AppRoute[] = [
  {
    path: '/dashboard',
    nombre: 'Dashboard',
    descripcion: 'Vista general del sistema',
    icon: LayoutDashboard,
  },
  {
    path: '/proyectos',
    nombre: 'Proyectos',
    descripcion: 'Expedientes técnicos de obras públicas',
    icon: FileText,
  },
  {
    path: '/analisis',
    nombre: 'Análisis',
    descripcion: 'Revisión inteligente de documentos',
    icon: ClipboardCheck,
  },
  {
    path: '/observaciones',
    nombre: 'Observaciones',
    descripcion: 'Hallazgos y cumplimiento normativo',
    icon: BarChart3,
  },
  {
    path: '/comparador',
    nombre: 'Comparador',
    descripcion: 'Comparación de documentos y versiones',
    icon: GitCompare,
  },
  {
    path: '/reportes',
    nombre: 'Reportes',
    descripcion: 'Generación de informes y matrices',
    icon: FileText,
  },
  {
    path: '/usuarios',
    nombre: 'Usuarios',
    descripcion: 'Gestión de accesos y roles',
    icon: Users,
  },
  {
    path: '/configuracion',
    nombre: 'Configuración',
    descripcion: 'Parámetros del sistema',
    icon: Settings,
  },
]
