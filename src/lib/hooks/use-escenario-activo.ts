'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useActiveTenant } from './use-tenant'
import type { Escenario } from '@/types'

/**
 * Hook para obtener el escenario de PRODUCCION del tenant
 * Este es el escenario que se usa para operaciones reales (liquidaciones, seguimiento)
 * Separado del escenario "activo" que es para navegacion en PlaneacionLogi
 */
export function useEscenarioProduccion() {
  const supabase = createClient()
  const { data: tenant, isLoading: loadingTenant } = useActiveTenant()

  return useQuery({
    queryKey: ['escenario-produccion', tenant?.id],
    queryFn: async (): Promise<Escenario | null> => {
      if (!tenant?.id) return null

      // Buscar el escenario de PRODUCCION del tenant actual
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('escenarios')
        .select('*')
        .eq('es_produccion', true)
        .eq('tenant_id', tenant.id)
        .single()

      if (error) {
        // Si no hay escenario de produccion, retornamos null
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data as Escenario
    },
    // Solo ejecutar cuando tengamos el tenant
    enabled: !loadingTenant && !!tenant?.id,
  })
}

/**
 * @deprecated Usar useEscenarioProduccion para operaciones de liquidacion
 * Mantener solo para compatibilidad
 */
export function useEscenarioActivo() {
  // Redirige al hook de produccion
  return useEscenarioProduccion()
}

// Hook para obtener un escenario específico por ID
export function useEscenario(escenarioId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['escenario', escenarioId],
    queryFn: async (): Promise<Escenario | null> => {
      if (!escenarioId) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('escenarios')
        .select('*')
        .eq('id', escenarioId)
        .single()

      if (error) throw error
      return data as Escenario
    },
    enabled: !!escenarioId,
  })
}
