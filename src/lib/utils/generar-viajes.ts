// Funciones puras de lógica de negocio para generación de viajes
// Sin dependencias de Supabase - 100% testeables

// Tipo para costos de un día desde planificacion_lejanias
export interface CostoDiaPlanificacion {
  dia: string // 'lunes', 'martes', etc.
  semana: number
  km_total: number
  combustible: number
  adicionales: number
  peajes?: number
  pernocta: number
}

// Tipo para almacenar datos de planificación de una ruta
export interface DatosRutaPlanificacion {
  costos: CostoDiaPlanificacion[]
  peajesCiclo: number
  frecuencia: string
}

// Resultado del cálculo de costos para un viaje
export interface CostosViaje {
  costoCombustible: number
  costoPeajes: number
  costoAdicionales: number
  costoPernocta: number
  requierePernocta: boolean
  nochesPernocta: number
  kmRecorridos: number
  costoTotal: number
}

// Mapeo de día ISO (1-7) a nombre de día
export const DIAS_NOMBRE: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
  7: 'domingo',
}

/**
 * Calcula los costos de un viaje basándose en los datos de planificación de la ruta
 *
 * @param datosRuta - Datos de planificación de la ruta (costos por día, peajes, frecuencia)
 * @param diaISO - Día de la semana en formato ISO (1=Lunes, 7=Domingo)
 * @param usarPrimerDiaSiFalta - Si es true y no hay costos para el día, usa el primer día disponible
 *                               Útil para variaciones de ruta que se ejecutan en días diferentes
 * @returns Objeto con todos los costos calculados para el viaje
 */
export function calcularCostosViaje(
  datosRuta: DatosRutaPlanificacion | undefined,
  diaISO: number,
  usarPrimerDiaSiFalta: boolean = false
): CostosViaje {
  // Valores por defecto si no hay datos de ruta
  if (!datosRuta || !datosRuta.costos || datosRuta.costos.length === 0) {
    return {
      costoCombustible: 0,
      costoPeajes: 0,
      costoAdicionales: 0,
      costoPernocta: 0,
      requierePernocta: false,
      nochesPernocta: 0,
      kmRecorridos: 0,
      costoTotal: 0,
    }
  }

  const diaNombre = DIAS_NOMBRE[diaISO]

  // Buscar costos del día específico
  let costoDia = datosRuta.costos.find((c) => c.dia === diaNombre)

  // Si no hay costos para este día y está habilitado el fallback, usar el primer día disponible
  // Esto es útil para variaciones de ruta: los costos (km, combustible) son iguales
  // independientemente del día en que se ejecute la ruta
  if (!costoDia && usarPrimerDiaSiFalta) {
    costoDia = datosRuta.costos[0]
  }

  if (!costoDia) {
    // No hay costos para este día
    return {
      costoCombustible: 0,
      costoPeajes: 0,
      costoAdicionales: 0,
      costoPernocta: 0,
      requierePernocta: false,
      nochesPernocta: 0,
      kmRecorridos: 0,
      costoTotal: 0,
    }
  }

  // FIX 5: Guardar km recorridos
  const kmRecorridos = costoDia.km_total || 0

  const costoCombustible = costoDia.combustible || 0
  const costoAdicionales = costoDia.adicionales || 0

  // FIX 4: Pernocta al 50% (solo el conductor, el copiloto no va con terceros)
  const costoPernocta = Math.round((costoDia.pernocta || 0) / 2)
  const requierePernocta = costoPernocta > 0
  const nochesPernocta = requierePernocta ? 1 : 0

  // FIX 2: Peajes distribuidos proporcionalmente entre días del ciclo
  // peajes_ciclo es el total del ciclo, lo dividimos entre la cantidad de días
  const diasCiclo = datosRuta.costos.length || 1
  const costoPeajes = Math.round(datosRuta.peajesCiclo / diasCiclo)

  const costoTotal = costoCombustible + costoPeajes + costoAdicionales + costoPernocta

  return {
    costoCombustible,
    costoPeajes,
    costoAdicionales,
    costoPernocta,
    requierePernocta,
    nochesPernocta,
    kmRecorridos,
    costoTotal,
  }
}

/**
 * Convierte día de JavaScript (0=Dom) a día ISO (1=Lun, 7=Dom)
 */
export function convertirDiaJSaISO(diaJS: number): number {
  return diaJS === 0 ? 7 : diaJS
}

/**
 * Determina el número de semana dentro de la quincena (1 o 2)
 */
export function getSemanaQuincena(fecha: Date, fechaInicioQuincena: Date): number {
  const diffDias = Math.floor(
    (fecha.getTime() - fechaInicioQuincena.getTime()) / (1000 * 60 * 60 * 24)
  )
  return diffDias < 7 ? 1 : 2
}
