'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'

/**
 * Tipo para los costos de una planificación de ruta
 */
export interface CostosPlanificacionRuta {
  planificacion_id: string
  ruta_id: string

  // Costos por ciclo (semana o quincena)
  km_ciclo: number
  combustible_ciclo: number
  adicionales_ciclo: number
  peajes_ciclo: number
  pernoctas_ciclo: number
  costo_pernocta_ciclo: number
  total_ciclo: number

  // Costos mensuales
  km_mensual: number
  combustible_mensual: number
  adicionales_mensual: number
  peajes_mensual: number
  noches_pernocta_mensual: number
  costo_pernocta_mensual: number
  total_mensual: number

  // Frecuencia de la planificación
  frecuencia: 'semanal' | 'quincenal'

  // Metadata
  costos_calculados_at: string | null

  // Valores calculados para liquidación
  costo_promedio_por_viaje: number
  dias_operacion_por_ciclo: number
}

/**
 * Hook para obtener los costos de una ruta desde la planificación de lejanías
 * Usa los costos guardados en planificacion_lejanias
 */
export function useCostosRutaPlanificada(rutaId: string | undefined) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['costos-ruta-planificada', escenario?.id, rutaId],
    queryFn: async (): Promise<CostosPlanificacionRuta | null> => {
      if (!escenario?.id || !rutaId) return null

      // Buscar planificación para esta ruta
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planificacion, error } = await (supabase as any)
        .from('planificacion_lejanias')
        .select(`
          id,
          ruta_id,
          frecuencia,
          km_ciclo,
          combustible_ciclo,
          adicionales_ciclo,
          peajes_ciclo,
          pernoctas_ciclo,
          costo_pernocta_ciclo,
          total_ciclo,
          km_mensual,
          combustible_mensual,
          adicionales_mensual,
          peajes_mensual,
          noches_pernocta_mensual,
          costo_pernocta_mensual,
          total_mensual,
          costos_calculados_at,
          costos_por_dia
        `)
        .eq('escenario_id', escenario.id)
        .eq('ruta_id', rutaId)
        .eq('tipo', 'logistico')
        .single()

      if (error || !planificacion) {
        return null
      }

      // Calcular días de operación por ciclo (días únicos en costos_por_dia)
      let diasOperacionPorCiclo = 0
      if (planificacion.costos_por_dia && Array.isArray(planificacion.costos_por_dia)) {
        // Contar días únicos (sin contar duplicados de semana 1 y 2)
        const diasUnicos = new Set<string>()
        for (const dia of planificacion.costos_por_dia) {
          diasUnicos.add(`${dia.semana}-${dia.dia}`)
        }
        diasOperacionPorCiclo = diasUnicos.size
      }

      // Calcular costo promedio por viaje
      const costoPromedioPorViaje = diasOperacionPorCiclo > 0
        ? (planificacion.total_ciclo || 0) / diasOperacionPorCiclo
        : 0

      return {
        planificacion_id: planificacion.id,
        ruta_id: planificacion.ruta_id,
        frecuencia: planificacion.frecuencia,
        km_ciclo: planificacion.km_ciclo || 0,
        combustible_ciclo: planificacion.combustible_ciclo || 0,
        adicionales_ciclo: planificacion.adicionales_ciclo || 0,
        peajes_ciclo: planificacion.peajes_ciclo || 0,
        pernoctas_ciclo: planificacion.pernoctas_ciclo || 0,
        costo_pernocta_ciclo: planificacion.costo_pernocta_ciclo || 0,
        total_ciclo: planificacion.total_ciclo || 0,
        km_mensual: planificacion.km_mensual || 0,
        combustible_mensual: planificacion.combustible_mensual || 0,
        adicionales_mensual: planificacion.adicionales_mensual || 0,
        peajes_mensual: planificacion.peajes_mensual || 0,
        noches_pernocta_mensual: planificacion.noches_pernocta_mensual || 0,
        costo_pernocta_mensual: planificacion.costo_pernocta_mensual || 0,
        total_mensual: planificacion.total_mensual || 0,
        costos_calculados_at: planificacion.costos_calculados_at,
        costo_promedio_por_viaje: costoPromedioPorViaje,
        dias_operacion_por_ciclo: diasOperacionPorCiclo,
      }
    },
    enabled: !!escenario?.id && !!rutaId,
  })
}

/**
 * Hook para obtener costos de múltiples rutas a la vez
 * Útil para la generación masiva de viajes
 */
export function useCostosRutasPlanificadas(rutaIds: string[]) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['costos-rutas-planificadas', escenario?.id, rutaIds.sort().join(',')],
    queryFn: async (): Promise<Map<string, CostosPlanificacionRuta>> => {
      const resultado = new Map<string, CostosPlanificacionRuta>()
      if (!escenario?.id || rutaIds.length === 0) return resultado

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planificaciones, error } = await (supabase as any)
        .from('planificacion_lejanias')
        .select(`
          id,
          ruta_id,
          frecuencia,
          km_ciclo,
          combustible_ciclo,
          adicionales_ciclo,
          peajes_ciclo,
          pernoctas_ciclo,
          costo_pernocta_ciclo,
          total_ciclo,
          km_mensual,
          combustible_mensual,
          adicionales_mensual,
          peajes_mensual,
          noches_pernocta_mensual,
          costo_pernocta_mensual,
          total_mensual,
          costos_calculados_at,
          costos_por_dia
        `)
        .eq('escenario_id', escenario.id)
        .eq('tipo', 'logistico')
        .in('ruta_id', rutaIds)

      if (error || !planificaciones) {
        return resultado
      }

      for (const plan of planificaciones) {
        if (!plan.ruta_id) continue

        // Calcular días de operación
        let diasOperacionPorCiclo = 0
        if (plan.costos_por_dia && Array.isArray(plan.costos_por_dia)) {
          const diasUnicos = new Set<string>()
          for (const dia of plan.costos_por_dia) {
            diasUnicos.add(`${dia.semana}-${dia.dia}`)
          }
          diasOperacionPorCiclo = diasUnicos.size
        }

        const costoPromedioPorViaje = diasOperacionPorCiclo > 0
          ? (plan.total_ciclo || 0) / diasOperacionPorCiclo
          : 0

        resultado.set(plan.ruta_id, {
          planificacion_id: plan.id,
          ruta_id: plan.ruta_id,
          frecuencia: plan.frecuencia,
          km_ciclo: plan.km_ciclo || 0,
          combustible_ciclo: plan.combustible_ciclo || 0,
          adicionales_ciclo: plan.adicionales_ciclo || 0,
          peajes_ciclo: plan.peajes_ciclo || 0,
          pernoctas_ciclo: plan.pernoctas_ciclo || 0,
          costo_pernocta_ciclo: plan.costo_pernocta_ciclo || 0,
          total_ciclo: plan.total_ciclo || 0,
          km_mensual: plan.km_mensual || 0,
          combustible_mensual: plan.combustible_mensual || 0,
          adicionales_mensual: plan.adicionales_mensual || 0,
          peajes_mensual: plan.peajes_mensual || 0,
          noches_pernocta_mensual: plan.noches_pernocta_mensual || 0,
          costo_pernocta_mensual: plan.costo_pernocta_mensual || 0,
          total_mensual: plan.total_mensual || 0,
          costos_calculados_at: plan.costos_calculados_at,
          costo_promedio_por_viaje: costoPromedioPorViaje,
          dias_operacion_por_ciclo: diasOperacionPorCiclo,
        })
      }

      return resultado
    },
    enabled: !!escenario?.id && rutaIds.length > 0,
  })
}

/**
 * Función para obtener costos de ruta por día específico
 * Útil para asignar costos a un viaje específico
 */
export function getCostosParaDia(
  costosPlanificacion: CostosPlanificacionRuta,
  diaSemana: number // 1=Lun, 2=Mar, ..., 6=Sab, 7=Dom
): {
  combustible: number
  peajes: number
  adicionales: number
  pernocta: number
  total: number
} | null {
  // Si no hay días de operación, no podemos calcular
  if (costosPlanificacion.dias_operacion_por_ciclo <= 0) {
    return null
  }

  // Distribuir costos del ciclo entre los días de operación
  const diasOperacion = costosPlanificacion.dias_operacion_por_ciclo
  const combustiblePorDia = costosPlanificacion.combustible_ciclo / diasOperacion
  const peajesPorDia = costosPlanificacion.peajes_ciclo / diasOperacion
  const adicionalesPorDia = costosPlanificacion.adicionales_ciclo / diasOperacion
  const pernoctaPorDia = costosPlanificacion.costo_pernocta_ciclo / (costosPlanificacion.pernoctas_ciclo || 1)

  return {
    combustible: combustiblePorDia,
    peajes: peajesPorDia,
    adicionales: adicionalesPorDia,
    pernocta: pernoctaPorDia,
    total: combustiblePorDia + peajesPorDia + adicionalesPorDia,
  }
}
