export type RolEquipo = 'Jefe de Proyecto' | 'Especialista Técnico' | 'Revisor'

export type EstadoIntegrante = 'activo' | 'inactivo'

export interface DocumentoDetalle {
  id: string
  nombre: string
  categoria: string
  procesado: boolean
}

export interface MiembroEquipo {
  id: string
  nombre: string
  rol: RolEquipo
  especialidad: string
  estado: EstadoIntegrante
  proyectosAsignados: number
}

export interface ActividadReciente {
  id: string
  descripcion: string
  usuario: string
  fecha: string
}

export type EstadoCategoriaDoc = 'completo' | 'en_proceso' | 'con_error' | 'pendiente'

export interface CategoriaDocumento {
  id: string
  categoria: string
  cantidad: number
  procesados: number
  estado: EstadoCategoriaDoc
  ultimaActualizacion: string
}

export const DOC_CATEGORIAS: string[] = [
  'Planos',
  'Metrados',
  'Presupuesto',
  'Especificaciones técnicas',
  'Cronograma',
  'Términos de referencia',
  'Otros',
]

export interface ProyectoDetalle {
  documentosCargados: number
  documentosProcesados: number
  observaciones: number
  inconsistenciasCriticas: number
  indiceCoherencia: number
  documentos: DocumentoDetalle[]
  categorias: CategoriaDocumento[]
  equipo: MiembroEquipo[]
  actividad: ActividadReciente[]
}

export const ROLES_DISPONIBLES: RolEquipo[] = [
  'Jefe de Proyecto',
  'Especialista Técnico',
  'Revisor',
]

export const ESPECIALIDADES: string[] = [
  'Estructuras',
  'Hidráulica',
  'Vías y Transporte',
  'Sanitaria',
  'Eléctricas',
  'Arquitectura',
  'Costos y Presupuestos',
  'Geotecnia',
  'Ambiental',
]

export const INTEGRANTES_HN_HI: { nombre: string; especialidad: string }[] = [
  { nombre: 'Andrea Quispe', especialidad: 'Estructuras' },
  { nombre: 'Luis Paredes', especialidad: 'Vías y Transporte' },
  { nombre: 'María Torres', especialidad: 'Sanitaria' },
  { nombre: 'Carlos Mendoza', especialidad: 'Costos y Presupuestos' },
  { nombre: 'Pedro Salazar', especialidad: 'Arquitectura' },
  { nombre: 'Rosa Gutiérrez', especialidad: 'Hidráulica' },
  { nombre: 'Jorge Rojas', especialidad: 'Geotecnia' },
  { nombre: 'Lucía Fernández', especialidad: 'Eléctricas' },
  { nombre: 'Miguel Ortiz', especialidad: 'Ambiental' },
]

const detallePorProyecto: Record<string, ProyectoDetalle> = {
  'proy-001': {
    documentosCargados: 12,
    documentosProcesados: 10,
    observaciones: 2,
    inconsistenciasCriticas: 0,
    indiceCoherencia: 88,
    documentos: [
      { id: 'doc-1', nombre: 'Expediente Técnico - Tomo I', categoria: 'Memoria', procesado: true },
      { id: 'doc-2', nombre: 'Expediente Técnico - Tomo II', categoria: 'Memoria', procesado: true },
      { id: 'doc-3', nombre: 'Planos de Arquitectura', categoria: 'Planos', procesado: true },
      { id: 'doc-4', nombre: 'Planos Estructurales', categoria: 'Planos', procesado: true },
      { id: 'doc-5', nombre: 'Presupuesto y Metrados', categoria: 'Presupuesto', procesado: true },
      { id: 'doc-6', nombre: 'Estudio de Mecánica de Suelos', categoria: 'Estudios', procesado: true },
    ],
    categorias: [
      { id: 'cat-1', categoria: 'Planos', cantidad: 3, procesados: 3, estado: 'completo', ultimaActualizacion: '2025-08-26' },
      { id: 'cat-2', categoria: 'Metrados', cantidad: 2, procesados: 2, estado: 'completo', ultimaActualizacion: '2025-08-25' },
      { id: 'cat-3', categoria: 'Presupuesto', cantidad: 2, procesados: 1, estado: 'en_proceso', ultimaActualizacion: '2025-08-28' },
      { id: 'cat-4', categoria: 'Especificaciones técnicas', cantidad: 2, procesados: 2, estado: 'completo', ultimaActualizacion: '2025-08-24' },
      { id: 'cat-5', categoria: 'Cronograma', cantidad: 1, procesados: 0, estado: 'pendiente', ultimaActualizacion: '2025-08-22' },
      { id: 'cat-6', categoria: 'Términos de referencia', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-20' },
      { id: 'cat-7', categoria: 'Otros', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-21' },
    ],
    equipo: [
      { id: 'eq-1', nombre: 'Andrea Quispe', rol: 'Jefe de Proyecto', especialidad: 'Estructuras', estado: 'activo', proyectosAsignados: 4 },
      { id: 'eq-2', nombre: 'Carlos Mendoza', rol: 'Especialista Técnico', especialidad: 'Costos y Presupuestos', estado: 'activo', proyectosAsignados: 6 },
      { id: 'eq-3', nombre: 'Rosa Gutiérrez', rol: 'Especialista Técnico', especialidad: 'Hidráulica', estado: 'activo', proyectosAsignados: 3 },
      { id: 'eq-4', nombre: 'Jorge Rojas', rol: 'Revisor', especialidad: 'Geotecnia', estado: 'inactivo', proyectosAsignados: 2 },
    ],
    actividad: [
      { id: 'act-1', descripcion: 'Se ejecutó análisis estructural sobre los planos.', usuario: 'Carlos Mendoza', fecha: '2025-08-29' },
      { id: 'act-2', descripcion: 'Documentos procesados correctamente.', usuario: 'Sistema', fecha: '2025-08-28' },
      { id: 'act-3', descripcion: 'Se cargó el Tomo I del expediente técnico.', usuario: 'Andrea Quispe', fecha: '2025-08-27' },
    ],
  },
  'proy-002': {
    documentosCargados: 18,
    documentosProcesados: 16,
    observaciones: 5,
    inconsistenciasCriticas: 1,
    indiceCoherencia: 74,
    documentos: [
      { id: 'doc-1', nombre: 'Expediente Técnico Integral', categoria: 'Memoria', procesado: true },
      { id: 'doc-2', nombre: 'Planos del Puente', categoria: 'Planos', procesado: true },
      { id: 'doc-3', nombre: 'Estudio Hidrológico', categoria: 'Estudios', procesado: true },
      { id: 'doc-4', nombre: 'Presupuesto General', categoria: 'Presupuesto', procesado: true },
    ],
    categorias: [
      { id: 'cat-1', categoria: 'Planos', cantidad: 5, procesados: 5, estado: 'completo', ultimaActualizacion: '2025-08-20' },
      { id: 'cat-2', categoria: 'Metrados', cantidad: 2, procesados: 1, estado: 'en_proceso', ultimaActualizacion: '2025-08-23' },
      { id: 'cat-3', categoria: 'Presupuesto', cantidad: 2, procesados: 1, estado: 'con_error', ultimaActualizacion: '2025-08-25' },
      { id: 'cat-4', categoria: 'Especificaciones técnicas', cantidad: 3, procesados: 3, estado: 'completo', ultimaActualizacion: '2025-08-19' },
      { id: 'cat-5', categoria: 'Cronograma', cantidad: 2, procesados: 2, estado: 'completo', ultimaActualizacion: '2025-08-18' },
      { id: 'cat-6', categoria: 'Términos de referencia', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-16' },
      { id: 'cat-7', categoria: 'Otros', cantidad: 3, procesados: 3, estado: 'completo', ultimaActualizacion: '2025-08-17' },
    ],
    equipo: [
      { id: 'eq-1', nombre: 'Luis Paredes', rol: 'Jefe de Proyecto', especialidad: 'Vías y Transporte', estado: 'activo', proyectosAsignados: 5 },
      { id: 'eq-2', nombre: 'Rosa Gutiérrez', rol: 'Especialista Técnico', especialidad: 'Hidráulica', estado: 'activo', proyectosAsignados: 3 },
      { id: 'eq-3', nombre: 'Miguel Ortiz', rol: 'Especialista Técnico', especialidad: 'Ambiental', estado: 'activo', proyectosAsignados: 2 },
      { id: 'eq-4', nombre: 'Pedro Salazar', rol: 'Revisor', especialidad: 'Arquitectura', estado: 'inactivo', proyectosAsignados: 1 },
    ],
    actividad: [
      { id: 'act-1', descripcion: 'Se detectaron inconsistencias en el presupuesto.', usuario: 'Sistema', fecha: '2025-08-25' },
      { id: 'act-2', descripcion: 'Análisis de coherencia concluido.', usuario: 'Carlos Mendoza', fecha: '2025-08-24' },
    ],
  },
  'proy-003': {
    documentosCargados: 9,
    documentosProcesados: 7,
    observaciones: 7,
    inconsistenciasCriticas: 2,
    indiceCoherencia: 52,
    documentos: [
      { id: 'doc-1', nombre: 'Estudio de Impacto Ambiental', categoria: 'Estudios', procesado: true },
      { id: 'doc-2', nombre: 'Planos de Redes', categoria: 'Planos', procesado: true },
      { id: 'doc-3', nombre: 'Memoria Descriptiva', categoria: 'Memoria', procesado: true },
      { id: 'doc-4', nombre: 'Estudio Hidrogeológico', categoria: 'Estudios', procesado: false },
    ],
    categorias: [
      { id: 'cat-1', categoria: 'Planos', cantidad: 2, procesados: 1, estado: 'en_proceso', ultimaActualizacion: '2025-08-23' },
      { id: 'cat-2', categoria: 'Metrados', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-21' },
      { id: 'cat-3', categoria: 'Presupuesto', cantidad: 1, procesados: 0, estado: 'pendiente', ultimaActualizacion: '2025-08-19' },
      { id: 'cat-4', categoria: 'Especificaciones técnicas', cantidad: 2, procesados: 1, estado: 'con_error', ultimaActualizacion: '2025-08-24' },
      { id: 'cat-5', categoria: 'Cronograma', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-20' },
      { id: 'cat-6', categoria: 'Términos de referencia', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-18' },
      { id: 'cat-7', categoria: 'Otros', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-17' },
    ],
    equipo: [
      { id: 'eq-1', nombre: 'María Torres', rol: 'Jefe de Proyecto', especialidad: 'Sanitaria', estado: 'activo', proyectosAsignados: 3 },
      { id: 'eq-2', nombre: 'Miguel Ortiz', rol: 'Especialista Técnico', especialidad: 'Ambiental', estado: 'activo', proyectosAsignados: 2 },
      { id: 'eq-3', nombre: 'Pedro Salazar', rol: 'Revisor', especialidad: 'Arquitectura', estado: 'activo', proyectosAsignados: 1 },
    ],
    actividad: [
      { id: 'act-1', descripcion: 'Falta el estudio de impacto ambiental aprobado.', usuario: 'Sistema', fecha: '2025-08-27' },
      { id: 'act-2', descripcion: 'Observaciones críticas pendientes.', usuario: 'María Torres', fecha: '2025-08-26' },
    ],
  },
  'proy-006': {
    documentosCargados: 8,
    documentosProcesados: 6,
    observaciones: 5,
    inconsistenciasCriticas: 0,
    indiceCoherencia: 81,
    documentos: [
      { id: 'doc-1', nombre: 'Expediente Técnico Integral', categoria: 'Memoria', procesado: true },
      { id: 'doc-2', nombre: 'Planos de Arquitectura', categoria: 'Planos', procesado: true },
      { id: 'doc-3', nombre: 'Planos Estructurales', categoria: 'Planos', procesado: false },
      { id: 'doc-4', nombre: 'Presupuesto', categoria: 'Presupuesto', procesado: false },
    ],
    categorias: [
      { id: 'cat-1', categoria: 'Planos', cantidad: 2, procesados: 2, estado: 'completo', ultimaActualizacion: '2025-08-28' },
      { id: 'cat-2', categoria: 'Metrados', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-27' },
      { id: 'cat-3', categoria: 'Presupuesto', cantidad: 1, procesados: 0, estado: 'pendiente', ultimaActualizacion: '2025-08-26' },
      { id: 'cat-4', categoria: 'Especificaciones técnicas', cantidad: 2, procesados: 1, estado: 'en_proceso', ultimaActualizacion: '2025-08-29' },
      { id: 'cat-5', categoria: 'Cronograma', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-25' },
      { id: 'cat-6', categoria: 'Términos de referencia', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-24' },
      { id: 'cat-7', categoria: 'Otros', cantidad: 0, procesados: 0, estado: 'pendiente', ultimaActualizacion: '2025-08-23' },
    ],
    equipo: [
      { id: 'eq-1', nombre: 'Pedro Salazar', rol: 'Jefe de Proyecto', especialidad: 'Arquitectura', estado: 'activo', proyectosAsignados: 2 },
      { id: 'eq-2', nombre: 'Carlos Mendoza', rol: 'Especialista Técnico', especialidad: 'Costos y Presupuestos', estado: 'activo', proyectosAsignados: 6 },
      { id: 'eq-3', nombre: 'Lucía Fernández', rol: 'Especialista Técnico', especialidad: 'Eléctricas', estado: 'activo', proyectosAsignados: 2 },
      { id: 'eq-4', nombre: 'Rosa Gutiérrez', rol: 'Revisor', especialidad: 'Hidráulica', estado: 'activo', proyectosAsignados: 3 },
    ],
    actividad: [
      { id: 'act-1', descripcion: 'Se cargó el Tomo I del expediente.', usuario: 'Pedro Salazar', fecha: '2025-08-30' },
      { id: 'act-2', descripcion: 'Análisis de cumplimiento normativo concluido.', usuario: 'Sistema', fecha: '2025-08-29' },
    ],
  },
}

const detallePorDefecto: ProyectoDetalle = {
  documentosCargados: 10,
  documentosProcesados: 8,
  observaciones: 3,
  inconsistenciasCriticas: 1,
  indiceCoherencia: 78,
  documentos: [
    { id: 'doc-1', nombre: 'Expediente Técnico', categoria: 'Memoria', procesado: true },
    { id: 'doc-2', nombre: 'Planos de Especialidades', categoria: 'Planos', procesado: true },
    { id: 'doc-3', nombre: 'Presupuesto y Metrados', categoria: 'Presupuesto', procesado: false },
  ],
  categorias: [
    { id: 'cat-1', categoria: 'Planos', cantidad: 3, procesados: 2, estado: 'en_proceso', ultimaActualizacion: '2025-08-29' },
    { id: 'cat-2', categoria: 'Metrados', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-27' },
    { id: 'cat-3', categoria: 'Presupuesto', cantidad: 1, procesados: 0, estado: 'pendiente', ultimaActualizacion: '2025-08-26' },
    { id: 'cat-4', categoria: 'Especificaciones técnicas', cantidad: 2, procesados: 2, estado: 'completo', ultimaActualizacion: '2025-08-25' },
    { id: 'cat-5', categoria: 'Cronograma', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-24' },
    { id: 'cat-6', categoria: 'Términos de referencia', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-22' },
    { id: 'cat-7', categoria: 'Otros', cantidad: 1, procesados: 1, estado: 'completo', ultimaActualizacion: '2025-08-21' },
  ],
  equipo: [
    { id: 'eq-1', nombre: 'Carlos Mendoza', rol: 'Jefe de Proyecto', especialidad: 'Costos y Presupuestos', estado: 'activo', proyectosAsignados: 6 },
    { id: 'eq-2', nombre: 'Andrea Quispe', rol: 'Especialista Técnico', especialidad: 'Estructuras', estado: 'activo', proyectosAsignados: 4 },
    { id: 'eq-3', nombre: 'Jorge Rojas', rol: 'Especialista Técnico', especialidad: 'Geotecnia', estado: 'inactivo', proyectosAsignados: 2 },
    { id: 'eq-4', nombre: 'Rosa Gutiérrez', rol: 'Revisor', especialidad: 'Hidráulica', estado: 'inactivo', proyectosAsignados: 3 },
  ],
  actividad: [
    { id: 'act-1', descripcion: 'Proyecto registrado en el sistema.', usuario: 'Carlos Mendoza', fecha: '2025-08-31' },
  ],
}

export function obtenerDetalleProyecto(proyectoId: string): ProyectoDetalle {
  return detallePorProyecto[proyectoId] ?? detallePorDefecto
}

export type EstadoIa = 'pendiente' | 'procesando' | 'procesado' | 'error'

export interface DocumentoLista {
  id: string
  nombre: string
  categoria: string
  especialidad: string
  version: string
  fecha: string
  tamaño: number
  estadoIa: EstadoIa
  responsable: string
}

export const VERSIONES: string[] = ['1.0', '1.1', '2.0', '2.1', '3.0']

export const DOCUMENTOS_MOCK: DocumentoLista[] = [
  { id: 'doc-t1', nombre: 'Expediente Técnico - Tomo I.pdf', categoria: 'Planos', especialidad: 'Estructuras', version: '2.0', fecha: '2025-08-26', tamaño: 8420000, estadoIa: 'procesado', responsable: 'Andrea Quispe' },
  { id: 'doc-t2', nombre: 'Planos de Arquitectura - Lámina 01.pdf', categoria: 'Planos', especialidad: 'Arquitectura', version: '1.0', fecha: '2025-08-20', tamaño: 4120000, estadoIa: 'procesado', responsable: 'Pedro Salazar' },
  { id: 'doc-t3', nombre: 'Planos Estructurales - Cimentación.pdf', categoria: 'Planos', especialidad: 'Estructuras', version: '2.1', fecha: '2025-08-24', tamaño: 6230000, estadoIa: 'procesando', responsable: 'Andrea Quispe' },
  { id: 'doc-t4', nombre: 'Metrados de Obra.xlsx', categoria: 'Metrados', especialidad: 'Costos y Presupuestos', version: '1.1', fecha: '2025-08-22', tamaño: 640000, estadoIa: 'procesado', responsable: 'Carlos Mendoza' },
  { id: 'doc-t5', nombre: 'Presupuesto General.xlsx', categoria: 'Presupuesto', especialidad: 'Costos y Presupuestos', version: '2.0', fecha: '2025-08-19', tamaño: 380000, estadoIa: 'error', responsable: 'Carlos Mendoza' },
  { id: 'doc-t6', nombre: 'Especificaciones Técnicas - Concreto.docx', categoria: 'Especificaciones técnicas', especialidad: 'Estructuras', version: '1.0', fecha: '2025-08-18', tamaño: 1240000, estadoIa: 'procesado', responsable: 'Andrea Quispe' },
  { id: 'doc-t7', nombre: 'Cronograma de Ejecución.xlsx', categoria: 'Cronograma', especialidad: 'Costos y Presupuestos', version: '1.0', fecha: '2025-08-15', tamaño: 410000, estadoIa: 'procesado', responsable: 'Carlos Mendoza' },
  { id: 'doc-t8', nombre: 'Términos de Referencia.pdf', categoria: 'Términos de referencia', especialidad: 'Ambiental', version: '1.0', fecha: '2025-08-12', tamaño: 2100000, estadoIa: 'procesado', responsable: 'Miguel Ortiz' },
  { id: 'doc-t9', nombre: 'Fotos de Campo - Frente 1.jpg', categoria: 'Otros', especialidad: 'Geotecnia', version: '1.0', fecha: '2025-08-10', tamaño: 5200000, estadoIa: 'procesado', responsable: 'Jorge Rojas' },
  { id: 'doc-t10', nombre: 'Levantamiento Topográfico.dwg', categoria: 'Planos', especialidad: 'Vías y Transporte', version: '1.1', fecha: '2025-08-08', tamaño: 9300000, estadoIa: 'pendiente', responsable: 'Luis Paredes' },
  { id: 'doc-t11', nombre: 'Análisis de Precios Unitarios.xlsx', categoria: 'Presupuesto', especialidad: 'Costos y Presupuestos', version: '1.0', fecha: '2025-08-05', tamaño: 290000, estadoIa: 'procesado', responsable: 'Carlos Mendoza' },
  { id: 'doc-t12', nombre: 'Estudio de Mecánica de Suelos.pdf', categoria: 'Metrados', especialidad: 'Geotecnia', version: '2.0', fecha: '2025-08-02', tamaño: 7600000, estadoIa: 'procesando', responsable: 'Jorge Rojas' },
  { id: 'doc-t13', nombre: 'Memoria Descriptiva.docx', categoria: 'Especificaciones técnicas', especialidad: 'Arquitectura', version: '3.0', fecha: '2025-07-30', tamaño: 980000, estadoIa: 'procesado', responsable: 'Pedro Salazar' },
  { id: 'doc-t14', nombre: 'Imagen Satelital - Zona A.png', categoria: 'Otros', especialidad: 'Ambiental', version: '1.0', fecha: '2025-07-28', tamaño: 3900000, estadoIa: 'error', responsable: 'Miguel Ortiz' },
  { id: 'doc-t15', nombre: 'Presupuesto Analítico.xls', categoria: 'Presupuesto', especialidad: 'Costos y Presupuestos', version: '1.0', fecha: '2025-07-25', tamaño: 330000, estadoIa: 'pendiente', responsable: 'Carlos Mendoza' },
  { id: 'doc-t16', nombre: 'Planos de Instalaciones Eléctricas.pdf', categoria: 'Planos', especialidad: 'Eléctricas', version: '1.0', fecha: '2025-07-22', tamaño: 5880000, estadoIa: 'procesado', responsable: 'Lucía Fernández' },
  { id: 'doc-t17', nombre: 'Especificaciones - Drenaje.docx', categoria: 'Especificaciones técnicas', especialidad: 'Sanitaria', version: '1.1', fecha: '2025-07-20', tamaño: 1120000, estadoIa: 'procesado', responsable: 'María Torres' },
  { id: 'doc-t18', nombre: 'Cronograma Actualizado.xlsx', categoria: 'Cronograma', especialidad: 'Costos y Presupuestos', version: '2.1', fecha: '2025-07-18', tamaño: 460000, estadoIa: 'procesando', responsable: 'Carlos Mendoza' },
]
