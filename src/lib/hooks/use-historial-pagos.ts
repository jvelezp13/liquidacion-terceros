'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type { LiqHistorialPago, LiqQuincena } from '@/types'

// Tipo extendido con quincena
export interface HistorialPagoConQuincena extends LiqHistorialPago {
  quincena?: LiqQuincena
}

// Tipo para crear un pago
export interface CreatePagoInput {
  quincena_id: string
  contratista_id: string
  monto_total: number
  referencia_pago?: string
  metodo_pago?: string
  fecha_pago?: string
  notas?: string
}

// Hook para obtener historial de pagos
export function useHistorialPagos() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['historial-pagos', escenario?.id],
    queryFn: async (): Promise<HistorialPagoConQuincena[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener quincenas del escenario
      const { data: quincenas, error: quincenasError } = await sb
        .from('liq_quincenas')
        .select('id')
        .eq('escenario_id', escenario.id)

      if (quincenasError) throw quincenasError
      if (!quincenas || quincenas.length === 0) return []

      const quincenaIds = (quincenas as { id: string }[]).map((q) => q.id)

      // Obtener pagos de esas quincenas
      const { data: pagos, error: pagosError } = await sb
        .from('liq_historial_pagos')
        .select('*')
        .in('quincena_id', quincenaIds)
        .order('fecha_pago', { ascending: false })

      if (pagosError) throw pagosError
      if (!pagos) return []

      // Obtener detalles de quincenas
      const result = await Promise.all(
        (pagos as LiqHistorialPago[]).map(async (pago) => {
          const { data: quincena } = await sb
            .from('liq_quincenas')
            .select('*')
            .eq('id', pago.quincena_id)
            .single()

          return {
            ...pago,
            quincena: quincena as LiqQuincena | undefined,
          }
        })
      )

      return result
    },
    enabled: !!escenario?.id,
  })
}

// Hook para obtener pagos de una quincena específica
export function usePagosQuincena(quincenaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['pagos-quincena', quincenaId],
    queryFn: async (): Promise<LiqHistorialPago[]> => {
      if (!quincenaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_historial_pagos')
        .select('*')
        .eq('quincena_id', quincenaId)
        .order('fecha_pago', { ascending: false })

      if (error) throw error
      return (data || []) as LiqHistorialPago[]
    },
    enabled: !!quincenaId,
  })
}

// Hook para registrar un pago
export function useRegistrarPago() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePagoInput): Promise<LiqHistorialPago> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      const { data, error } = await sb
        .from('liq_historial_pagos')
        .insert({
          quincena_id: input.quincena_id,
          contratista_id: input.contratista_id,
          monto_total: input.monto_total,
          referencia_pago: input.referencia_pago,
          metodo_pago: input.metodo_pago,
          fecha_pago: input.fecha_pago || new Date().toISOString().split('T')[0],
          notas: input.notas,
        })
        .select()
        .single()

      if (error) throw error
      return data as LiqHistorialPago
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['historial-pagos'] })
      queryClient.invalidateQueries({ queryKey: ['pagos-quincena', variables.quincena_id] })
    },
  })
}

// Hook para actualizar un pago
export function useUpdatePago() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CreatePagoInput> & { id: string; quincenaId: string }): Promise<LiqHistorialPago> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_historial_pagos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqHistorialPago
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['historial-pagos'] })
      queryClient.invalidateQueries({ queryKey: ['pagos-quincena', variables.quincenaId] })
    },
  })
}

// Hook para eliminar un pago
export function useDeletePago() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      quincenaId,
    }: {
      id: string
      quincenaId: string
    }): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('liq_historial_pagos')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['historial-pagos'] })
      queryClient.invalidateQueries({ queryKey: ['pagos-quincena', variables.quincenaId] })
    },
  })
}

// Tipo para pagos por contratista al marcar quincena como pagada
export interface PagoContratista {
  contratista_id: string
  monto_total: number
}

// Hook para marcar quincena como pagada (con registro automatico de pagos)
// Usa funcion RPC para garantizar atomicidad (transaccion en PostgreSQL)
export function useMarcarQuincenaPagada() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      quincenaId,
      pagos,
      metodoPago,
    }: {
      quincenaId: string
      pagos: PagoContratista[]
      metodoPago?: string
    }): Promise<LiqQuincena> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Llamar funcion RPC que ejecuta todo en una transaccion atomica
      const { data, error } = await sb.rpc('marcar_quincena_pagada', {
        p_quincena_id: quincenaId,
        p_pagos: pagos,
        p_metodo_pago: metodoPago || 'Transferencia',
      })

      if (error) throw error
      return data as LiqQuincena
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quincenas'] })
      queryClient.invalidateQueries({ queryKey: ['quincena', data.id] })
      queryClient.invalidateQueries({ queryKey: ['historial-pagos'] })
      queryClient.invalidateQueries({ queryKey: ['pagos-quincena', data.id] })
    },
  })
}
