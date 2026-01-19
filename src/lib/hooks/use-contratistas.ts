'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type { LiqContratista } from '@/types/database.types'

// Tipo para crear un contratista
export interface CreateContratistaInput {
  nombre: string
  tipo_documento: string
  numero_documento: string
  telefono?: string
  email?: string
  direccion?: string
  banco?: string
  tipo_cuenta?: string
  numero_cuenta?: string
  notas?: string
}

// Tipo para actualizar un contratista
export interface UpdateContratistaInput extends Partial<CreateContratistaInput> {
  activo?: boolean
}

// Hook para obtener todos los contratistas del escenario activo
export function useContratistas() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['contratistas', escenario?.id],
    queryFn: async (): Promise<LiqContratista[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_contratistas')
        .select('*')
        .eq('escenario_id', escenario.id)
        .order('nombre')

      if (error) throw error
      return (data || []) as LiqContratista[]
    },
    enabled: !!escenario?.id,
  })
}

// Hook para obtener contratistas activos
export function useContratistasActivos() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['contratistas', escenario?.id, 'activos'],
    queryFn: async (): Promise<LiqContratista[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_contratistas')
        .select('*')
        .eq('escenario_id', escenario.id)
        .eq('activo', true)
        .order('nombre')

      if (error) throw error
      return (data || []) as LiqContratista[]
    },
    enabled: !!escenario?.id,
  })
}

// Hook para obtener un contratista por ID
export function useContratista(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contratista', id],
    queryFn: async (): Promise<LiqContratista | null> => {
      if (!id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_contratistas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as LiqContratista
    },
    enabled: !!id,
  })
}

// Hook para crear un contratista
export function useCreateContratista() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { data: escenario } = useEscenarioActivo()

  return useMutation({
    mutationFn: async (input: CreateContratistaInput): Promise<LiqContratista> => {
      if (!escenario?.id) {
        throw new Error('No hay escenario activo')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_contratistas')
        .insert({
          ...input,
          escenario_id: escenario.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as LiqContratista
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratistas'] })
    },
  })
}

// Hook para actualizar un contratista
export function useUpdateContratista() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateContratistaInput & { id: string }): Promise<LiqContratista> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_contratistas')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqContratista
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contratistas'] })
      queryClient.invalidateQueries({ queryKey: ['contratista', data.id] })
    },
  })
}

// Hook para eliminar un contratista
export function useDeleteContratista() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('liq_contratistas')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratistas'] })
    },
  })
}

// Hook para toggle activo/inactivo
export function useToggleContratistaActivo() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('liq_contratistas')
        .update({ activo })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratistas'] })
    },
  })
}
