'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import { obtenerInfoDiasCiclo, type DatosRutaPlanificacion, type CostoDiaPlanificacion } from '@/lib/utils/generar-viajes'

// Tipo para información de un día del ciclo
export interface InfoDiaCiclo {
  diaCiclo: number
  diaNombre: string
  tienePernocta: boolean
}

// Mapa de ruta_id -> array de info de días del ciclo
export type MapaInfoDiasCiclo = Map<string, InfoDiaCiclo[]>

/**
 * Hook para obtener información de días del ciclo de todas las rutas
 * Útil para mostrar el selector de día del ciclo en viajes
 */
export function useInfoDiasCicloRutas(rutaIds: string[]) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['info-dias-ciclo-rutas', escenario?.id, rutaIds.sort().join(',')],
    queryFn: async (): Promise<MapaInfoDiasCiclo> => {
      const resultado = new Map<string, InfoDiaCiclo[]>()
      if (!escenario?.id || rutaIds.length === 0) return resultado

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planificaciones, error } = await (supabase as any)
        .from('planificacion_lejanias')
        .select('ruta_id, costos_por_dia, peajes_ciclo, frecuencia')
        .eq('escenario_id', escenario.id)
        .eq('tipo', 'logistico')
        .in('ruta_id', rutaIds)

      if (error || !planificaciones) {
        return resultado
      }

      for (const plan of planificaciones) {
        if (!plan.ruta_id || !plan.costos_por_dia) continue

        const datosRuta: DatosRutaPlanificacion = {
          costos: plan.costos_por_dia as CostoDiaPlanificacion[],
          peajesCiclo: plan.peajes_ciclo || 0,
          frecuencia: plan.frecuencia || 'quincenal',
        }

        const infoDias = obtenerInfoDiasCiclo(datosRuta)
        if (infoDias.length > 0) {
          resultado.set(plan.ruta_id, infoDias)
        }
      }

      return resultado
    },
    enabled: !!escenario?.id && rutaIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })
}

/**
 * Hook para obtener información de días del ciclo de una ruta específica
 */
export function useInfoDiasCicloRuta(rutaId: string | undefined) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['info-dias-ciclo-ruta', escenario?.id, rutaId],
    queryFn: async (): Promise<InfoDiaCiclo[]> => {
      if (!escenario?.id || !rutaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planificacion, error } = await (supabase as any)
        .from('planificacion_lejanias')
        .select('costos_por_dia, peajes_ciclo, frecuencia')
        .eq('escenario_id', escenario.id)
        .eq('ruta_id', rutaId)
        .eq('tipo', 'logistico')
        .single()

      if (error || !planificacion?.costos_por_dia) {
        return []
      }

      const datosRuta: DatosRutaPlanificacion = {
        costos: planificacion.costos_por_dia as CostoDiaPlanificacion[],
        peajesCiclo: planificacion.peajes_ciclo || 0,
        frecuencia: planificacion.frecuencia || 'quincenal',
      }

      return obtenerInfoDiasCiclo(datosRuta)
    },
    enabled: !!escenario?.id && !!rutaId,
    staleTime: 5 * 60 * 1000,
  })
}
