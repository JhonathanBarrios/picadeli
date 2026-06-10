/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD
 * Evita problemas de zona horaria usando toLocaleDateString con locale 'en-CA'
 */
export function getLocalDateString(): string {
  return new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Convierte una fecha a formato local YYYY-MM-DD
 */
export function toLocalDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
