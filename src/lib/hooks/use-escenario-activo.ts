'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useActiveTenant } from './use-tenant'
import type { Escenario } from '@/types/database.types'

// Hook para obtener el escenario activo de Planeación Logi
// Filtra por el tenant activo del usuario
export function useEscenarioActivo() {
  const supabase = createClient()
  const { data: tenant, isLoading: loadingTenant } = useActiveTenant()

  return useQuery({
    queryKey: ['escenario-activo', tenant?.id],
    queryFn: async (): Promise<Escenario | null> => {
      if (!tenant?.id) return null

      // Buscar el escenario activo del tenant actual
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('escenarios')
        .select('*')
        .eq('activo', true)
        .eq('tenant_id', tenant.id)
        .single()

      if (error) {
        // Si no hay escenario activo, retornamos null
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
