import type { Analisis, Observacion } from '@/types'

export const analisis: Analisis[] = [
  {
    id: 'ana-001',
    proyectoId: 'proy-001',
    fecha: '2025-08-25',
    resultado: 'observado',
    puntaje: 72,
    documento: 'Expediente Técnico - Tomo I',
  },
  {
    id: 'ana-002',
    proyectoId: 'proy-002',
    fecha: '2025-08-10',
    resultado: 'conforme',
    puntaje: 95,
    documento: 'Expediente Técnico Integral',
  },
  {
    id: 'ana-003',
    proyectoId: 'proy-003',
    fecha: '2025-08-20',
    resultado: 'critico',
    puntaje: 48,
    documento: 'Estudio de Impacto Ambiental',
  },
  {
    id: 'ana-004',
    proyectoId: 'proy-004',
    fecha: '2025-08-05',
    resultado: 'critico',
    puntaje: 39,
    documento: 'Presupuesto y Análisis de Precios',
  },
  {
    id: 'ana-005',
    proyectoId: 'proy-005',
    fecha: '2025-08-28',
    resultado: 'observado',
    puntaje: 81,
    documento: 'Expediente Técnico - Tomo II',
  },
  {
    id: 'ana-006',
    proyectoId: 'proy-006',
    fecha: '2025-08-30',
    resultado: 'conforme',
    puntaje: 88,
    documento: 'Expediente Técnico Integral',
  },
]

export const observaciones: Observacion[] = [
  {
    id: 'obs-001',
    proyectoId: 'proy-001',
    codigoNorma: 'TUO de la Ley N° 30225',
    descripcion:
      'Las especificaciones técnicas del concreto no cumplen con la resistencia mínima exigida en el reglamento.',
    severidad: 'alta',
    estado: 'pendiente',
    fechaDeteccion: '2025-08-25',
    articulo: 'Art. 31',
  },
  {
    id: 'obs-002',
    proyectoId: 'proy-003',
    codigoNorma: 'Reglamento de la Ley N° 30225',
    descripcion:
      'Falta el estudio de impacto ambiental aprobado para la construcción del pozo de captación.',
    severidad: 'critica',
    estado: 'en_proceso',
    fechaDeteccion: '2025-08-20',
    articulo: 'Art. 47',
  },
  {
    id: 'obs-003',
    proyectoId: 'proy-004',
    codigoNorma: 'Reglamento Nacional de Edificaciones',
    descripcion:
      'El metrado de excavación no coincide con los planos de perfil longitudinal del tramo.',
    severidad: 'critica',
    estado: 'pendiente',
    fechaDeteccion: '2025-08-05',
    articulo: 'NTE CE.010',
  },
  {
    id: 'obs-004',
    proyectoId: 'proy-005',
    codigoNorma: 'Norma Técnica de Salud N° 021',
    descripcion:
      'El equipamiento médico propuesto no se encuentra en el petitorio vigente del MINSA.',
    severidad: 'media',
    estado: 'pendiente',
    fechaDeteccion: '2025-08-28',
    articulo: 'Anexo 4',
  },
  {
    id: 'obs-005',
    proyectoId: 'proy-005',
    codigoNorma: 'TUO de la Ley N° 30225',
    descripcion:
      'El cronograma de ejecución no contempla la licencia de construcción municipal.',
    severidad: 'baja',
    estado: 'en_proceso',
    fechaDeteccion: '2025-08-28',
    articulo: 'Art. 33',
  },
  {
    id: 'obs-006',
    proyectoId: 'proy-006',
    codigoNorma: 'Reglamento Nacional de Edificaciones',
    descripcion:
      'Las aulas proyectadas superan la densidad máxima de estudiantes por metro cuadrado.',
    severidad: 'media',
    estado: 'resuelta',
    fechaDeteccion: '2025-08-30',
    articulo: 'NTE A.040',
  },
]
