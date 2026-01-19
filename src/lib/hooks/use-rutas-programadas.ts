'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LiqVehiculoRutaProgramada, RutaLogistica } from '@/types/database.types'

// Tipo extendido con detalles de ruta
export interface RutaProgramadaConDetalles extends LiqVehiculoRutaProgramada {
  ruta: RutaLogistica
}

// Tipo para crear ruta programada
export interface CreateRutaProgramadaInput {
  vehiculo_tercero_id: string
  ruta_id: string
  dia_semana: number // 1=Lunes, 7=Domingo
}

// Nombres de días de la semana
export const diasSemana = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
]

// Hook para obtener rutas programadas de un vehículo tercero
export function useRutasProgramadas(vehiculoTerceroId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['rutas-programadas', vehiculoTerceroId],
    queryFn: async (): Promise<RutaProgramadaConDetalles[]> => {
      if (!vehiculoTerceroId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener rutas programadas
      const { data: programadas, error } = await sb
        .from('liq_vehiculo_rutas_programadas')
        .select('*')
        .eq('vehiculo_tercero_id', vehiculoTerceroId)
        .eq('activo', true)
        .order('dia_semana')

      if (error) throw error
      if (!programadas || programadas.length === 0) return []

      // Obtener detalles de cada ruta
      const result = await Promise.all(
        (programadas as LiqVehiculoRutaProgramada[]).map(async (rp) => {
          const { data: ruta } = await sb
            .from('rutas_logisticas')
            .select('*')
            .eq('id', rp.ruta_id)
            .single()

          return {
            ...rp,
            ruta: ruta as RutaLogistica,
          }
        })
      )

      return result
    },
    enabled: !!vehiculoTerceroId,
  })
}

// Hook para crear una ruta programada
export function useCreateRutaProgramada() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRutaProgramadaInput): Promise<LiqVehiculoRutaProgramada> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_vehiculo_rutas_programadas')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as LiqVehiculoRutaProgramada
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rutas-programadas', data.vehiculo_tercero_id] })
    },
  })
}

// Hook para actualizar una ruta programada
export function useUpdateRutaProgramada() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      vehiculoTerceroId,
      ...input
    }: { id: string; vehiculoTerceroId: string; ruta_id?: string; dia_semana?: number; activo?: boolean }): Promise<LiqVehiculoRutaProgramada> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_vehiculo_rutas_programadas')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqVehiculoRutaProgramada
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rutas-programadas', variables.vehiculoTerceroId] })
    },
  })
}

// Hook para eliminar una ruta programada
export function useDeleteRutaProgramada() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, vehiculoTerceroId }: { id: string; vehiculoTerceroId: string }): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('liq_vehiculo_rutas_programadas')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rutas-programadas', variables.vehiculoTerceroId] })
    },
  })
}

// Hook para asignar múltiples rutas de una vez (reemplaza todas las existentes)
export function useSetRutasProgramadas() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      vehiculoTerceroId,
      rutas,
    }: {
      vehiculoTerceroId: string
      rutas: { ruta_id: string; dia_semana: number }[]
    }): Promise<LiqVehiculoRutaProgramada[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Eliminar rutas programadas existentes
      const { error: deleteError } = await sb
        .from('liq_vehiculo_rutas_programadas')
        .delete()
        .eq('vehiculo_tercero_id', vehiculoTerceroId)

      if (deleteError) throw deleteError

      // Si no hay rutas nuevas, retornar vacío
      if (rutas.length === 0) return []

      // Insertar nuevas rutas
      const { data, error: insertError } = await sb
        .from('liq_vehiculo_rutas_programadas')
        .insert(
          rutas.map((r) => ({
            vehiculo_tercero_id: vehiculoTerceroId,
            ruta_id: r.ruta_id,
            dia_semana: r.dia_semana,
          }))
        )
        .select()

      if (insertError) throw insertError
      return (data || []) as LiqVehiculoRutaProgramada[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rutas-programadas', variables.vehiculoTerceroId] })
    },
  })
}
