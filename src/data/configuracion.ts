import type { ConfiguracionAccion, Reporte } from '@/types'

export const configuraciones: ConfiguracionAccion[] = [
  {
    id: 'cfg-001',
    clave: 'umbral.puntaje.aprobacion',
    valor: '85',
    descripcion: 'Puntaje mínimo para considerar un expediente como aprobado.',
    categoria: 'Análisis',
  },
  {
    id: 'cfg-002',
    clave: 'ia.modelo.tokenizacion',
    valor: 'gpt-4o',
    descripcion: 'Modelo de lenguaje utilizado para el análisis documental.',
    categoria: 'Inteligencia Artificial',
  },
  {
    id: 'cfg-003',
    clave: 'expediente.maximo.mb',
    valor: '200',
    descripcion: 'Tamaño máximo permitido por expediente técnico.',
    categoria: 'Almacenamiento',
  },
  {
    id: 'cfg-004',
    clave: 'npt.nivel.ambiental',
    valor: '2000',
    descripcion: 'Nivel de Punto de Tope según la ley N° 30225.',
    categoria: 'Normativa',
  },
  {
    id: 'cfg-005',
    clave: 'notificacion.plazo',
    valor: '48',
    descripcion: 'Plazo en horas para notificar observaciones críticas.',
    categoria: 'Notificaciones',
  },
  {
    id: 'cfg-006',
    clave: 'reporte.formato.descarga',
    valor: 'pdf',
    descripcion: 'Formato por defecto para la descarga de reportes.',
    categoria: 'Reportes',
  },
]

export const reportes: Reporte[] = [
  {
    id: 'rep-001',
    nombre: 'Resumen Ejecutivo de Revisión - Junio 2025',
    tipo: 'resumen',
    fechaGeneracion: '2025-07-01',
    usuario: 'Carlos Mendoza',
    formato: 'pdf',
  },
  {
    id: 'rep-002',
    nombre: 'Expediente EXP-2025-0147 - Resultado',
    tipo: 'expediente',
    fechaGeneracion: '2025-08-25',
    usuario: 'Lucía Ramírez',
    formato: 'pdf',
  },
  {
    id: 'rep-003',
    nombre: 'Matriz de Cumplimiento Normativo',
    tipo: 'cumplimiento',
    fechaGeneracion: '2025-08-31',
    usuario: 'Andrés Quispe',
    formato: 'excel',
  },
  {
    id: 'rep-004',
    nombre: 'Resumen de Observaciones por Entidad',
    tipo: 'resumen',
    fechaGeneracion: '2025-08-29',
    usuario: 'Paola Gutiérrez',
    formato: 'excel',
  },
]
