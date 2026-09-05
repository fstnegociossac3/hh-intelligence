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
import type { ModuloSistema } from '@/utils/permisos'

export interface AppRoute {
  path: string
  nombre: string
  descripcion: string
  icon: LucideIcon
  modulo: ModuloSistema
}

export const rutas: AppRoute[] = [
  {
    path: '/dashboard',
    nombre: 'Dashboard',
    descripcion: 'Vista general del sistema',
    icon: LayoutDashboard,
    modulo: 'dashboard',
  },
  {
    path: '/proyectos',
    nombre: 'Proyectos',
    descripcion: 'Expedientes técnicos de obras públicas',
    icon: FileText,
    modulo: 'proyectos',
  },
  {
    path: '/analisis',
    nombre: 'Análisis',
    descripcion: 'Revisión inteligente de documentos',
    icon: ClipboardCheck,
    modulo: 'analisis',
  },
  {
    path: '/observaciones',
    nombre: 'Observaciones',
    descripcion: 'Hallazgos y cumplimiento normativo',
    icon: BarChart3,
    modulo: 'observaciones',
  },
  {
    path: '/comparador',
    nombre: 'Comparador',
    descripcion: 'Comparación de documentos y versiones',
    icon: GitCompare,
    modulo: 'comparador',
  },
  {
    path: '/reportes',
    nombre: 'Reportes',
    descripcion: 'Generación de informes y matrices',
    icon: FileText,
    modulo: 'reportes',
  },
  {
    path: '/usuarios',
    nombre: 'Usuarios',
    descripcion: 'Gestión de accesos y roles',
    icon: Users,
    modulo: 'usuarios',
  },
  {
    path: '/configuracion',
    nombre: 'Configuración',
    descripcion: 'Parámetros del sistema',
    icon: Settings,
    modulo: 'configuracion',
  },
]
