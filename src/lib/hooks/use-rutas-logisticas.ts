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

      // Obtener rutas del vehículo
      const { data: rutas, error: rutasError } = await sb
        .from('rutas_logisticas')
        .select('*')
        .eq('vehiculo_id', vehiculoId)
        .eq('escenario_id', escenario.id)
        .eq('activo', true)
        .order('nombre')

      if (rutasError) throw rutasError
      if (!rutas || rutas.length === 0) return []

      // Obtener municipios de cada ruta
      const rutasConMunicipios = await Promise.all(
        (rutas as RutaLogistica[]).map(async (ruta) => {
          const { data: rutaMunicipios } = await sb
            .from('ruta_municipios')
            .select('*')
            .eq('ruta_id', ruta.id)
            .order('orden_visita')

          if (!rutaMunicipios || rutaMunicipios.length === 0) {
            return { ...ruta, municipios: [] }
          }

          // Obtener detalles de cada municipio
          const municipiosConDetalles = await Promise.all(
            (rutaMunicipios as RutaMunicipio[]).map(async (rm) => {
              const { data: municipio } = await sb
                .from('municipios')
                .select('*')
                .eq('id', rm.municipio_id)
                .single()

              return {
                ...rm,
                municipio: municipio as Municipio,
              }
            })
          )

          return {
            ...ruta,
            municipios: municipiosConDetalles,
          }
        })
      )

      return rutasConMunicipios
    },
    enabled: !!vehiculoId && !!escenario?.id,
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
  })
}
