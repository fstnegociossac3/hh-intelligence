export type ProyectoEstado =
  | 'borrador'
  | 'documentacion'
  | 'en_analisis'
  | 'observado'
  | 'revisado'

export type TipoObra =
  | 'Infraestructura'
  | 'Transportes'
  | 'Saneamiento'
  | 'Salud'
  | 'Educación'
  | 'Energía'

export interface Proyecto {
  id: string
  codigo: string
  nombre: string
  entidad: string
  sector: string
  tipoObra: TipoObra
  responsable: string
  avance: number
  observaciones: number
  monto: number
  fechaCreacion: string
  fechaInicio: string | null
  actualizadoEl: string
  estado: ProyectoEstado
  ubicacion: string
}

export interface Analisis {
  id: string
  proyectoId: string
  fecha: string
  resultado: 'conforme' | 'observado' | 'critico'
  puntaje: number
  documento: string
}

export type ObservacionSeveridad = 'baja' | 'media' | 'alta' | 'critica'

export interface Observacion {
  id: string
  proyectoId: string
  codigoNorma: string
  descripcion: string
  severidad: ObservacionSeveridad
  estado: 'pendiente' | 'en_proceso' | 'resuelta'
  fechaDeteccion: string
  articulo: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'administrador' | 'revisor' | 'analista' | 'consulta'
  estado: 'activo' | 'inactivo'
  ultimoAcceso: string
}

export interface ConfiguracionAccion {
  id: string
  clave: string
  valor: string
  descripcion: string
  categoria: string
}

export interface Reporte {
  id: string
  nombre: string
  tipo: 'expediente' | 'resumen' | 'cumplimiento'
  fechaGeneracion: string
  usuario: string
  formato: 'pdf' | 'excel'
}
