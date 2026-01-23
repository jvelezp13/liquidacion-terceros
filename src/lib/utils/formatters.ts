import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea fecha en formato largo: "15 ene 2025"
 */
export function formatFecha(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "d MMM yyyy", { locale: es })
}

/**
 * Formatea fecha en formato corto: "15/01"
 */
export function formatFechaCorta(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "dd/MM", { locale: es })
}

/**
 * Formatea fecha completa con día de semana: "Lunes 15 de enero 2025"
 */
export function formatFechaCompleta(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "EEEE d 'de' MMMM yyyy", { locale: es })
}

/**
 * Formatea rango de fechas: "1 ene - 15 ene 2025"
 */
export function formatRangoFechas(inicio: Date | string, fin: Date | string): string {
  const dInicio = typeof inicio === 'string' ? new Date(inicio) : inicio
  const dFin = typeof fin === 'string' ? new Date(fin) : fin

  // Si son del mismo mes/año
  if (format(dInicio, 'MM-yyyy') === format(dFin, 'MM-yyyy')) {
    return `${format(dInicio, 'd', { locale: es })} - ${format(dFin, 'd MMM yyyy', { locale: es })}`
  }

  // Si son de diferentes meses
  return `${format(dInicio, 'd MMM', { locale: es })} - ${format(dFin, 'd MMM yyyy', { locale: es })}`
}

/**
 * Formatea moneda colombiana: "$100.000"
 */
export function formatCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

/**
 * Formatea número sin símbolo de moneda: "100.000"
 */
export function formatNumero(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

/**
 * Formatea porcentaje: "75.5%"
 */
export function formatPorcentaje(valor: number, decimales: number = 1): string {
  return `${valor.toFixed(decimales)}%`
}

/**
 * Formatea km con unidad: "250 km"
 */
export function formatKilometros(km: number): string {
  return `${formatNumero(km)} km`
}
