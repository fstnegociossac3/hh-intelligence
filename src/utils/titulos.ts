export function separarTitulo(pathname: string): {
  principal: string
  subtitulo: string
} {
  const rutasConocidas: Record<string, { principal: string; subtitulo: string }> =
    {
      '/dashboard': {
        principal: 'Dashboard',
        subtitulo: 'Vista general del sistema de revisión',
      },
      '/proyectos': {
        principal: 'Proyectos',
        subtitulo: 'Expedientes técnicos de obras públicas',
      },
      '/analisis': {
        principal: 'Análisis',
        subtitulo: 'Revisión inteligente de documentos',
      },
      '/observaciones': {
        principal: 'Observaciones',
        subtitulo: 'Hallazgos y cumplimiento normativo',
      },
      '/comparador': {
        principal: 'Comparador',
        subtitulo: 'Comparación de documentos y versiones',
      },
      '/reportes': {
        principal: 'Reportes',
        subtitulo: 'Generación de informes y matrices',
      },
      '/usuarios': {
        principal: 'Usuarios',
        subtitulo: 'Gestión de accesos y roles',
      },
      '/configuracion': {
        principal: 'Configuración',
        subtitulo: 'Parámetros del sistema',
      },
    }

  const coincidencia = rutasConocidas[pathname]
  if (coincidencia) return coincidencia

  if (pathname.startsWith('/proyectos/')) {
    return {
      principal: 'Proyecto',
      subtitulo: 'Detalle del expediente técnico',
    }
  }

  return { principal: 'H&H Intelligence', subtitulo: '' }
}
