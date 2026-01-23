'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  LiqLiquidacion,
  LiqLiquidacionDeduccion,
  LiqVehiculoTerceroConDetalles,
  EstadoLiquidacion,
} from '@/types'

// Tipo extendido con deducciones
export interface LiquidacionConDeducciones extends LiqLiquidacion {
  deducciones: LiqLiquidacionDeduccion[]
  vehiculo_tercero?: LiqVehiculoTerceroConDetalles
}

// Tipo para crear/actualizar liquidación
export interface UpsertLiquidacionInput {
  quincena_id: string
  vehiculo_tercero_id: string
  viajes_ejecutados: number
  viajes_variacion: number
  viajes_no_ejecutados: number
  flete_base: number
  total_combustible: number
  total_peajes: number
  total_fletes_adicionales: number
  total_pernocta: number
  ajuste_monto?: number
  ajuste_descripcion?: string
  notas?: string
}

// Tipo para deducción
export interface CreateDeduccionInput {
  liquidacion_id: string
  tipo: 'retencion_1_porciento' | 'anticipo' | 'otro'
  monto: number
  descripcion?: string
}

// Tipos de deducción con labels
export const tiposDeduccion = [
  { value: 'retencion_1_porciento', label: 'Retención 1%' },
  { value: 'anticipo', label: 'Anticipo' },
  { value: 'otro', label: 'Otro' },
]

// Hook para obtener liquidaciones de una quincena (optimizado con joins)
export function useLiquidacionesQuincena(quincenaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['liquidaciones', quincenaId],
    queryFn: async (): Promise<LiquidacionConDeducciones[]> => {
      if (!quincenaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener liquidaciones con joins - 1 query en lugar de N+1
      const { data: liquidaciones, error } = await sb
        .from('liq_liquidaciones')
        .select(`
          *,
          deducciones:liq_liquidacion_deducciones(*),
          vehiculo_tercero:liq_vehiculos_terceros!inner(
            *,
            vehiculo:vehiculos(*),
            contratista:liq_contratistas(*),
            vehiculo_costos:vehiculos_costos(*)
          )
        `)
        .eq('quincena_id', quincenaId)
        .order('created_at')

      if (error) throw error
      if (!liquidaciones || liquidaciones.length === 0) return []

      // Transformar datos al formato esperado
      return liquidaciones.map((liq: any) => ({
        ...liq,
        deducciones: (liq.deducciones || []) as LiqLiquidacionDeduccion[],
        vehiculo_tercero: liq.vehiculo_tercero
          ? {
              ...liq.vehiculo_tercero,
              vehiculo: liq.vehiculo_tercero.vehiculo,
              contratista: liq.vehiculo_tercero.contratista,
              vehiculo_costos: liq.vehiculo_tercero.vehiculo_costos || undefined,
            }
          : undefined,
      }))
    },
    enabled: !!quincenaId,
  })
}

// Hook para obtener una liquidación por ID
export function useLiquidacion(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['liquidacion', id],
    queryFn: async (): Promise<LiquidacionConDeducciones | null> => {
      if (!id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      const { data: liq, error } = await sb
        .from('liq_liquidaciones')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Obtener deducciones
      const { data: deducciones } = await sb
        .from('liq_liquidacion_deducciones')
        .select('*')
        .eq('liquidacion_id', id)
        .order('created_at')

      return {
        ...(liq as LiqLiquidacion),
        deducciones: (deducciones || []) as LiqLiquidacionDeduccion[],
      }
    },
    enabled: !!id,
  })
}

// Hook para crear o actualizar liquidación
export function useUpsertLiquidacion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpsertLiquidacionInput): Promise<LiqLiquidacion> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Calcular subtotal y total
      const subtotal =
        input.flete_base +
        input.total_combustible +
        input.total_peajes +
        input.total_fletes_adicionales +
        input.total_pernocta +
        (input.ajuste_monto || 0)

      // Buscar si ya existe
      const { data: existente } = await sb
        .from('liq_liquidaciones')
        .select('id, total_deducciones')
        .eq('quincena_id', input.quincena_id)
        .eq('vehiculo_tercero_id', input.vehiculo_tercero_id)
        .single()

      const totalDeducciones = existente?.total_deducciones || 0
      const totalAPagar = subtotal - totalDeducciones

      if (existente) {
        // Actualizar
        const { data, error } = await sb
          .from('liq_liquidaciones')
          .update({
            ...input,
            subtotal,
            total_a_pagar: totalAPagar,
          })
          .eq('id', existente.id)
          .select()
          .single()

        if (error) throw error
        return data as LiqLiquidacion
      } else {
        // Insertar
        const { data, error } = await sb
          .from('liq_liquidaciones')
          .insert({
            ...input,
            subtotal,
            total_deducciones: 0,
            total_a_pagar: subtotal,
            estado: 'borrador',
          })
          .select()
          .single()

        if (error) throw error
        return data as LiqLiquidacion
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', data.quincena_id] })
      queryClient.invalidateQueries({ queryKey: ['liquidacion', data.id] })
    },
  })
}

// Hook para actualizar ajuste de liquidación
export function useUpdateAjusteLiquidacion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ajuste_monto,
      ajuste_descripcion,
      quincenaId,
    }: {
      id: string
      ajuste_monto: number
      ajuste_descripcion?: string
      quincenaId: string
    }): Promise<LiqLiquidacion> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener liquidación actual para recalcular
      const { data: liq } = await sb
        .from('liq_liquidaciones')
        .select('*')
        .eq('id', id)
        .single()

      if (!liq) throw new Error('Liquidación no encontrada')

      const subtotal =
        (liq as LiqLiquidacion).flete_base +
        (liq as LiqLiquidacion).total_combustible +
        (liq as LiqLiquidacion).total_peajes +
        (liq as LiqLiquidacion).total_fletes_adicionales +
        (liq as LiqLiquidacion).total_pernocta +
        ajuste_monto

      const totalAPagar = subtotal - (liq as LiqLiquidacion).total_deducciones

      const { data, error } = await sb
        .from('liq_liquidaciones')
        .update({
          ajuste_monto,
          ajuste_descripcion,
          subtotal,
          total_a_pagar: totalAPagar,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqLiquidacion
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', variables.quincenaId] })
      queryClient.invalidateQueries({ queryKey: ['liquidacion', variables.id] })
    },
  })
}

// Hook para agregar deducción
export function useAddDeduccion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateDeduccionInput & { quincenaId: string }): Promise<LiqLiquidacionDeduccion> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Insertar deducción
      const { data: deduccion, error: deduccionError } = await sb
        .from('liq_liquidacion_deducciones')
        .insert({
          liquidacion_id: input.liquidacion_id,
          tipo: input.tipo,
          monto: input.monto,
          descripcion: input.descripcion,
        })
        .select()
        .single()

      if (deduccionError) throw deduccionError

      // Actualizar total deducciones en liquidación
      const { data: deducciones } = await sb
        .from('liq_liquidacion_deducciones')
        .select('monto')
        .eq('liquidacion_id', input.liquidacion_id)

      const totalDeducciones = (deducciones || []).reduce(
        (sum: number, d: { monto: number }) => sum + d.monto,
        0
      )

      // Obtener subtotal actual
      const { data: liq } = await sb
        .from('liq_liquidaciones')
        .select('subtotal')
        .eq('id', input.liquidacion_id)
        .single()

      const totalAPagar = ((liq as { subtotal: number })?.subtotal || 0) - totalDeducciones

      await sb
        .from('liq_liquidaciones')
        .update({
          total_deducciones: totalDeducciones,
          total_a_pagar: totalAPagar,
        })
        .eq('id', input.liquidacion_id)

      return deduccion as LiqLiquidacionDeduccion
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', variables.quincenaId] })
      queryClient.invalidateQueries({ queryKey: ['liquidacion', variables.liquidacion_id] })
    },
  })
}

// Hook para eliminar deducción
export function useDeleteDeduccion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      liquidacionId,
      quincenaId,
    }: {
      id: string
      liquidacionId: string
      quincenaId: string
    }): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Eliminar deducción
      const { error } = await sb
        .from('liq_liquidacion_deducciones')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Recalcular total deducciones
      const { data: deducciones } = await sb
        .from('liq_liquidacion_deducciones')
        .select('monto')
        .eq('liquidacion_id', liquidacionId)

      const totalDeducciones = (deducciones || []).reduce(
        (sum: number, d: { monto: number }) => sum + d.monto,
        0
      )

      const { data: liq } = await sb
        .from('liq_liquidaciones')
        .select('subtotal')
        .eq('id', liquidacionId)
        .single()

      const totalAPagar = ((liq as { subtotal: number })?.subtotal || 0) - totalDeducciones

      await sb
        .from('liq_liquidaciones')
        .update({
          total_deducciones: totalDeducciones,
          total_a_pagar: totalAPagar,
        })
        .eq('id', liquidacionId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', variables.quincenaId] })
      queryClient.invalidateQueries({ queryKey: ['liquidacion', variables.liquidacionId] })
    },
  })
}

// Re-export para mantener compatibilidad
export { useGenerarLiquidaciones } from './use-generar-liquidaciones'

// Hook para cambiar estado de liquidación
export function useUpdateEstadoLiquidacion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
      quincenaId,
    }: {
      id: string
      estado: EstadoLiquidacion
      quincenaId: string
    }): Promise<LiqLiquidacion> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_liquidaciones')
        .update({ estado })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqLiquidacion
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', variables.quincenaId] })
      queryClient.invalidateQueries({ queryKey: ['liquidacion', variables.id] })
    },
  })
}
