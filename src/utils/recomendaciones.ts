export type TipoReporteRecomendaciones =
  | 'general'
  | 'inconsistencias'
  | 'observaciones'
  | 'coherencia'
  | 'trazabilidad'

export function recomendacionesPara(tipo: string): string[] {
  switch (tipo) {
    case 'inconsistencias':
      return [
        'Corregir las cantidades de partidas principales para alinear el presupuesto con el metrado.',
        'Complementar la información faltante en las partidas críticas del expediente.',
        'Registrar justificaciones técnicas para las diferencias de unidad detectadas.',
        'Programar una reejecución del análisis tras la corrección de las partidas observadas.',
      ]
    case 'observaciones':
      return [
        'Asignar responsables a las observaciones aún sin dueño asignado.',
        'Priorizar la resolución de observaciones de criticidad alta y crítica.',
        'Establecer planes de acción con fecha de vencimiento por observación.',
        'Recopilar evidencia documental de respaldo para cada hallazgo.',
      ]
    case 'coherencia':
      return [
        'Mantener la consistencia entre el metrado y los planos en las partidas de estructura.',
        'Revisar las relaciones con menor índice para elevar la coherencia general.',
        'Documentar desviaciones aceptadas en las especificaciones técnicas.',
        'Automatizar la verificación de coherencia en cada nueva versión del expediente.',
      ]
    case 'trazabilidad':
      return [
        'Consolidar el historial de versiones por documento en un único repositorio.',
        'Vincular cada cambio con la observación o solicitud que lo originó.',
        'Definir un flujo de aprobación formal para las nuevas versiones.',
        'Emitir reportes periódicos de trazabilidad por proyecto y entidad.',
      ]
    default:
      return [
        'Completar la documentación del expediente para cerrar los hallazgos pendientes.',
        'Validar las relaciones entre presupuesto, metrado y planos antes de la revisión.',
        'Coordinar con la entidad los plazos de subsanación de observaciones.',
        'Consolidar el expediente en la próxima reunión técnica de seguimiento.',
      ]
  }
}