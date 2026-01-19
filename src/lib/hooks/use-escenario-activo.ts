'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Escenario } from '@/types/database.types'

// Hook para obtener el escenario activo de Planeación Logi
export function useEscenarioActivo() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['escenario-activo'],
    queryFn: async (): Promise<Escenario | null> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('escenarios')
        .select('*')
        .eq('activo', true)
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
