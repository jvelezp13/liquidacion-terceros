'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type { RutaLogistica, RutaMunicipio, Municipio } from '@/types'

// Tipo extendido con municipios
export interface RutaLogisticaConMunicipios extends RutaLogistica {
  municipios: (RutaMunicipio & { municipio: Municipio })[]
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

      // Obtener rutas del vehículo con municipios en una sola query usando joins
      const { data: rutas, error: rutasError } = await sb
        .from('rutas_logisticas')
        .select(`
          *,
          ruta_municipios:ruta_municipios(
            *,
            municipio:municipios(*)
          )
        `)
        .eq('vehiculo_id', vehiculoId)
        .eq('escenario_id', escenario.id)
        .eq('activo', true)
        .order('nombre')

      if (rutasError) throw rutasError
      if (!rutas || rutas.length === 0) return []

      // Mapear resultados al tipo esperado
      type RutaConJoins = RutaLogistica & {
        ruta_municipios: (RutaMunicipio & { municipio: Municipio })[]
      }

      const rutasConMunicipios = (rutas as RutaConJoins[]).map((ruta) => ({
        ...ruta,
        municipios: (ruta.ruta_municipios || [])
          .sort((a, b) => (a.orden_visita || 0) - (b.orden_visita || 0)),
      }))

      return rutasConMunicipios
    },
    enabled: !!vehiculoId && !!escenario?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
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
