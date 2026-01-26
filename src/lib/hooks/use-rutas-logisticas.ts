'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type { RutaLogistica } from '@/types'

// Tipo extendido (municipios no disponibles en este proyecto)
export interface RutaLogisticaConMunicipios extends RutaLogistica {
  municipios: never[]
}

// Hook para obtener rutas logísticas de un vehículo específico
export function useRutasLogisticasVehiculo(vehiculoId: string | undefined) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['rutas-logisticas-vehiculo', vehiculoId, escenario?.id],
    queryFn: async (): Promise<RutaLogisticaConMunicipios[]> => {
      if (!vehiculoId || !escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener rutas del vehículo (sin municipios - la tabla ruta_municipios no existe)
      const { data: rutas, error: rutasError } = await sb
        .from('rutas_logisticas')
        .select('*')
        .eq('vehiculo_id', vehiculoId)
        .eq('escenario_id', escenario.id)
        .eq('activo', true)
        .order('nombre')

      if (rutasError) throw rutasError
      if (!rutas || rutas.length === 0) return []

      // Retornar rutas con array vacío de municipios
      const rutasConMunicipios = (rutas as RutaLogistica[]).map((ruta) => ({
        ...ruta,
        municipios: [],
      }))

      return rutasConMunicipios
    },
    enabled: !!vehiculoId && !!escenario?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Tipo para info de día del ciclo
export interface InfoDiaCiclo {
  diaCiclo: number
  diaNombre: string
  tienePernocta: boolean
}

// Tipo para costo por día de planificación
interface CostoPorDia {
  dia: string
  semana: number
  pernocta: number
}

// Hook para obtener info de días del ciclo de múltiples rutas
// Retorna un Map de ruta_id -> InfoDiaCiclo[]
export function useInfoDiasCicloRutas(rutaIds: string[]) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['info-dias-ciclo-rutas', rutaIds.sort().join(','), escenario?.id],
    queryFn: async (): Promise<Map<string, InfoDiaCiclo[]>> => {
      if (rutaIds.length === 0 || !escenario?.id) return new Map()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener planificación de las rutas
      const { data: planificaciones, error } = await sb
        .from('planificacion_lejanias')
        .select('ruta_id, costos_por_dia')
        .eq('escenario_id', escenario.id)
        .eq('tipo', 'logistico')
        .in('ruta_id', rutaIds)

      if (error) throw error

      const resultado = new Map<string, InfoDiaCiclo[]>()

      for (const plan of planificaciones || []) {
        if (!plan.costos_por_dia || !Array.isArray(plan.costos_por_dia)) continue

        const costos = plan.costos_por_dia as CostoPorDia[]
        const infoDias: InfoDiaCiclo[] = costos.map((costo, index) => ({
          diaCiclo: index + 1,
          diaNombre: costo.dia,
          tienePernocta: (costo.pernocta || 0) > 0,
        }))

        resultado.set(plan.ruta_id, infoDias)
      }

      return resultado
    },
    enabled: rutaIds.length > 0 && !!escenario?.id,
    staleTime: 10 * 60 * 1000,
  })
}

// Hook para obtener todas las rutas logísticas del escenario
export function useRutasLogisticas() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['rutas-logisticas', escenario?.id],
    queryFn: async (): Promise<RutaLogistica[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('rutas_logisticas')
        .select('*')
        .eq('escenario_id', escenario.id)
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      return (data || []) as RutaLogistica[]
    },
    enabled: !!escenario?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}
