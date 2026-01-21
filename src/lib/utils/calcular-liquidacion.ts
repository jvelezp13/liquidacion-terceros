import type {
  LiqViajeEjecutado,
  LiqVehiculoTerceroConDetalles,
} from '@/types/database.types'

// Resultado del cálculo de liquidación
export interface ResultadoCalculoLiquidacion {
  viajes_ejecutados: number
  viajes_variacion: number // Viajes con otra ruta (pagan 100%)
  viajes_no_ejecutados: number
  flete_base: number
  total_combustible: number
  total_peajes: number
  total_fletes_adicionales: number
  total_pernocta: number
  subtotal: number
  retencion_1_porciento: number
}

// Calcular liquidación para un vehículo en una quincena
export function calcularLiquidacionVehiculo(
  viajes: LiqViajeEjecutado[],
  vehiculoTercero: LiqVehiculoTerceroConDetalles
): ResultadoCalculoLiquidacion {
  const costos = vehiculoTercero.vehiculo_costos

  // Contar viajes por estado
  let viajesEjecutados = 0
  let viajesVariacion = 0
  let viajesNoEjecutados = 0

  // Acumular costos de viajes
  let totalCombustible = 0
  let totalPeajes = 0
  let totalFletesAdicionales = 0
  let totalPernocta = 0

  for (const viaje of viajes) {
    if (viaje.estado === 'ejecutado') {
      viajesEjecutados++
      totalCombustible += viaje.costo_combustible
      totalPeajes += viaje.costo_peajes
      totalFletesAdicionales += viaje.costo_flete_adicional
      totalPernocta += viaje.costo_pernocta
    } else if (viaje.estado === 'variacion') {
      // Variación paga 100% igual que ejecutado
      viajesVariacion++
      totalCombustible += viaje.costo_combustible
      totalPeajes += viaje.costo_peajes
      totalFletesAdicionales += viaje.costo_flete_adicional
      totalPernocta += viaje.costo_pernocta
    } else if (viaje.estado === 'no_ejecutado') {
      viajesNoEjecutados++
      // No se suman costos para no ejecutados
    }
    // pendiente no se cuenta
  }

  // Total de viajes que se pagan (ejecutados + variación)
  const viajesPagados = viajesEjecutados + viajesVariacion

  // Calcular flete base según modalidad
  let fleteBase = 0
  if (costos) {
    if (costos.modalidad_tercero === 'por_viaje' && costos.costo_por_viaje) {
      // Flete = costo por viaje * viajes pagados (ejecutados + variación)
      fleteBase = costos.costo_por_viaje * viajesPagados
    } else if (costos.modalidad_tercero === 'flete_fijo' && costos.flete_mensual) {
      // Flete fijo mensual dividido por 2 (quincena)
      // Solo se paga completo si hay al menos 1 viaje pagado
      if (viajesPagados > 0) {
        fleteBase = costos.flete_mensual / 2
      }
    }
  }

  // Calcular subtotal
  const subtotal =
    fleteBase +
    totalCombustible +
    totalPeajes +
    totalFletesAdicionales +
    totalPernocta

  // Calcular retención 1%
  const retencion1Porciento = Math.round(subtotal * 0.01)

  return {
    viajes_ejecutados: viajesEjecutados,
    viajes_variacion: viajesVariacion,
    viajes_no_ejecutados: viajesNoEjecutados,
    flete_base: Math.round(fleteBase),
    total_combustible: Math.round(totalCombustible),
    total_peajes: Math.round(totalPeajes),
    total_fletes_adicionales: Math.round(totalFletesAdicionales),
    total_pernocta: Math.round(totalPernocta),
    subtotal: Math.round(subtotal),
    retencion_1_porciento: retencion1Porciento,
  }
}

// Formatear moneda colombiana
export function formatCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

// Calcular porcentaje de ejecución
export function calcularPorcentajeEjecucion(
  ejecutados: number,
  variacion: number,
  total: number
): number {
  if (total === 0) return 0
  // Ejecutados + variación cuentan como 100% cada uno
  return Math.round(((ejecutados + variacion) / total) * 100)
}
