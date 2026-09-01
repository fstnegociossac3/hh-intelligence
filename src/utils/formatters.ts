export function formatMoneda(valor: number, locale = 'es-PE', moneda = 'PEN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatFecha(fecha: string) {
  const date = new Date(fecha)
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  const letras = partes
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
  return letras || '?'
}
