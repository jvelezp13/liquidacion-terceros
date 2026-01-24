/**
 * Funciones puras para calcular estadisticas de liquidaciones
 * Todas las funciones son testeables y sin side effects
 */

// Tipos para los calculos
export interface DatosResumen {
  totalPagado: number
  totalQuincenas: number
  viajesEjecutados: number
  viajesVariacion: number
  viajesNoEjecutados: number
  totalViajes: number
}

export interface DatosEvolucion {
  quincenaLabel: string
  quincenaId: string
  año: number
  mes: number
  quincena: number
  totalPagado: number
  viajesEjecutados: number
  viajesNoEjecutados: number
  viajesVariacion: number
  costoPorViaje: number
}

export interface DatosContratista {
  id: string
  nombre: string
  totalVehiculos: number
  totalViajes: number
  totalPagado: number
  costoPorViaje: number
  tasaCumplimiento: number
}

export interface DatosVehiculo {
  id: string
  placa: string
  contratistaId: string
  contratistaNombre: string
  totalViajes: number
  totalPagado: number
  costoPorViaje: number
}

export interface DatosRuta {
  id: string
  nombre: string
  codigo: string
  totalViajes: number
  kmTotal: number
  combustible: number
  peajes: number
  total: number
  costoPorViaje: number
}

export interface DesgloseCostos {
  fleteBases: number
  combustible: number
  peajes: number
  pernocta: number
  fletesAdicionales: number
  deducciones: number
  total: number
}

// Calculo del costo promedio por viaje
export function calcularCostoPorViaje(
  totalPagado: number,
  viajesEjecutados: number
): number {
  if (viajesEjecutados === 0) return 0
  return Math.round(totalPagado / viajesEjecutados)
}

// Calculo de la tasa de cumplimiento (ejecutados + variaciones / total)
export function calcularTasaCumplimiento(
  ejecutados: number,
  variaciones: number,
  total: number
): number {
  if (total === 0) return 0
  return Math.round(((ejecutados + variaciones) / total) * 100)
}

// Calculo del promedio mensual de pagos
export function calcularPromedioMensual(
  totalPagado: number,
  mesesTranscurridos: number
): number {
  if (mesesTranscurridos === 0) return 0
  return Math.round(totalPagado / mesesTranscurridos)
}

// Calculo de variacion porcentual entre dos periodos
export function calcularVariacionPorcentual(
  valorActual: number,
  valorAnterior: number
): number {
  if (valorAnterior === 0) {
    return valorActual > 0 ? 100 : 0
  }
  return Math.round(((valorActual - valorAnterior) / valorAnterior) * 100)
}

// Generar label de quincena (ej: "Q1 Ene", "Q2 Feb")
export function generarQuincenaLabel(
  año: number,
  mes: number,
  quincena: number
): string {
  const meses = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ]
  const mesLabel = meses[mes - 1] || 'N/A'
  return `Q${quincena} ${mesLabel}`
}

// Calcular desglose porcentual de costos
export function calcularPorcentajeDesglose(
  desglose: DesgloseCostos
): Record<keyof Omit<DesgloseCostos, 'total'>, number> {
  const { total, ...costos } = desglose
  if (total === 0) {
    return {
      fleteBases: 0,
      combustible: 0,
      peajes: 0,
      pernocta: 0,
      fletesAdicionales: 0,
      deducciones: 0,
    }
  }

  return {
    fleteBases: Math.round((costos.fleteBases / total) * 100),
    combustible: Math.round((costos.combustible / total) * 100),
    peajes: Math.round((costos.peajes / total) * 100),
    pernocta: Math.round((costos.pernocta / total) * 100),
    fletesAdicionales: Math.round((costos.fletesAdicionales / total) * 100),
    deducciones: Math.round((costos.deducciones / total) * 100),
  }
}

// Ordenar contratistas por total pagado (descendente)
export function ordenarContratistasPorPago(
  contratistas: DatosContratista[]
): DatosContratista[] {
  return [...contratistas].sort((a, b) => b.totalPagado - a.totalPagado)
}

// Obtener top N contratistas
export function getTopContratistas(
  contratistas: DatosContratista[],
  n: number = 5
): DatosContratista[] {
  return ordenarContratistasPorPago(contratistas).slice(0, n)
}

// Calcular promedio de costo por viaje de todos los contratistas
export function calcularPromedioCostoPorViaje(
  contratistas: DatosContratista[]
): number {
  if (contratistas.length === 0) return 0
  const totalCosto = contratistas.reduce((sum, c) => sum + c.totalPagado, 0)
  const totalViajes = contratistas.reduce((sum, c) => sum + c.totalViajes, 0)
  return calcularCostoPorViaje(totalCosto, totalViajes)
}

// Agrupar vehiculos por dia de la semana (para heatmap)
export interface ActividadDiaSemana {
  vehiculoId: string
  placa: string
  actividad: number[] // Indice 0-6 para Lun-Dom
}

// Labels para dias de la semana
export const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Colores para el heatmap segun intensidad
export function getColorIntensidad(valor: number, max: number): string {
  if (max === 0) return 'bg-slate-100'
  const porcentaje = valor / max
  if (porcentaje === 0) return 'bg-slate-100'
  if (porcentaje < 0.25) return 'bg-blue-100'
  if (porcentaje < 0.5) return 'bg-blue-200'
  if (porcentaje < 0.75) return 'bg-blue-300'
  return 'bg-blue-400'
}

// Calcular meses transcurridos entre dos fechas
export function calcularMesesTranscurridos(
  fechaInicio: Date,
  fechaFin: Date
): number {
  const años = fechaFin.getFullYear() - fechaInicio.getFullYear()
  const meses = fechaFin.getMonth() - fechaInicio.getMonth()
  const total = años * 12 + meses + 1 // +1 para incluir el mes actual
  return Math.max(total, 1)
}

// Colores para graficos de costos
export const coloresCostos = {
  fleteBases: '#3b82f6',      // blue-500
  combustible: '#f59e0b',     // amber-500
  peajes: '#10b981',          // emerald-500
  pernocta: '#8b5cf6',        // violet-500
  fletesAdicionales: '#ec4899', // pink-500
  deducciones: '#ef4444',     // red-500
}

// Labels legibles para tipos de costo
export const labelsCostos: Record<keyof Omit<DesgloseCostos, 'total'>, string> = {
  fleteBases: 'Flete Base',
  combustible: 'Combustible',
  peajes: 'Peajes',
  pernocta: 'Pernocta',
  fletesAdicionales: 'Fletes Adicionales',
  deducciones: 'Deducciones',
}
