'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  LiqLiquidacion,
  LiqLiquidacionDeduccion,
  LiqVehiculoTerceroConDetalles,
  EstadoLiquidacion,
} from '@/types/database.types'

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

// Hook para obtener liquidaciones de una quincena
export function useLiquidacionesQuincena(quincenaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['liquidaciones', quincenaId],
    queryFn: async (): Promise<LiquidacionConDeducciones[]> => {
      if (!quincenaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener liquidaciones
      const { data: liquidaciones, error } = await sb
        .from('liq_liquidaciones')
        .select('*')
        .eq('quincena_id', quincenaId)
        .order('created_at')

      if (error) throw error
      if (!liquidaciones || liquidaciones.length === 0) return []

      // Obtener deducciones y detalles de cada liquidación
      const result = await Promise.all(
        (liquidaciones as LiqLiquidacion[]).map(async (liq) => {
          // Obtener deducciones
          const { data: deducciones } = await sb
            .from('liq_liquidacion_deducciones')
            .select('*')
            .eq('liquidacion_id', liq.id)
            .order('created_at')

          // Obtener vehículo tercero con detalles
          const { data: vehiculoTercero } = await sb
            .from('liq_vehiculos_terceros')
            .select('*')
            .eq('id', liq.vehiculo_tercero_id)
            .single()

          let vehiculoConDetalles: LiqVehiculoTerceroConDetalles | undefined

          if (vehiculoTercero) {
            const { data: vehiculo } = await sb
              .from('vehiculos')
              .select('*')
              .eq('id', vehiculoTercero.vehiculo_id)
              .single()

            const { data: contratista } = await sb
              .from('liq_contratistas')
              .select('*')
              .eq('id', vehiculoTercero.contratista_id)
              .single()

            const { data: costos } = await sb
              .from('vehiculos_costos')
              .select('*')
              .eq('vehiculo_id', vehiculoTercero.vehiculo_id)
              .single()

            if (vehiculo && contratista) {
              vehiculoConDetalles = {
                ...vehiculoTercero,
                vehiculo,
                contratista,
                vehiculo_costos: costos || undefined,
              }
            }
          }

          return {
            ...liq,
            deducciones: (deducciones || []) as LiqLiquidacionDeduccion[],
            vehiculo_tercero: vehiculoConDetalles,
          }
        })
      )

      return result
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

// Hook para generar liquidaciones automáticamente desde viajes
export function useGenerarLiquidaciones() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      quincenaId,
    }: {
      quincenaId: string
    }): Promise<LiqLiquidacion[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener todos los vehículos terceros activos
      const { data: vehiculos, error: vehiculosError } = await sb
        .from('liq_vehiculos_terceros')
        .select('*')
        .eq('activo', true)

      if (vehiculosError) throw vehiculosError
      if (!vehiculos || vehiculos.length === 0) return []

      const liquidacionesCreadas: LiqLiquidacion[] = []

      for (const vehiculo of vehiculos) {
        // Obtener viajes del vehículo en esta quincena
        const { data: viajes } = await sb
          .from('liq_viajes_ejecutados')
          .select('*')
          .eq('quincena_id', quincenaId)
          .eq('vehiculo_tercero_id', vehiculo.id)

        if (!viajes || viajes.length === 0) continue

        // Obtener costos del vehículo (solo si no es esporádico)
        const esEsporadico = !vehiculo.vehiculo_id
        let costos = null
        if (!esEsporadico) {
          const { data } = await sb
            .from('vehiculos_costos')
            .select('*')
            .eq('vehiculo_id', vehiculo.vehiculo_id)
            .single()
          costos = data
        }

        // Calcular totales
        let viajesEjecutados = 0
        let viajesVariacion = 0
        let viajesNoEjecutados = 0
        let totalCombustible = 0
        let totalPeajes = 0
        let totalFletesAdicionales = 0
        let totalPernocta = 0

        for (const viaje of viajes) {
          if (viaje.estado === 'ejecutado') {
            viajesEjecutados++
            totalCombustible += viaje.costo_combustible || 0
            totalPeajes += viaje.costo_peajes || 0
            totalFletesAdicionales += viaje.costo_flete_adicional || 0
            totalPernocta += viaje.costo_pernocta || 0
          } else if (viaje.estado === 'variacion') {
            // Variación paga 100% igual que ejecutado
            viajesVariacion++
            totalCombustible += viaje.costo_combustible || 0
            totalPeajes += viaje.costo_peajes || 0
            totalFletesAdicionales += viaje.costo_flete_adicional || 0
            totalPernocta += viaje.costo_pernocta || 0
          } else if (viaje.estado === 'no_ejecutado') {
            viajesNoEjecutados++
          }
        }

        // Total de viajes que se pagan
        const viajesPagados = viajesEjecutados + viajesVariacion

        // Calcular flete base
        let fleteBase = 0
        if (esEsporadico) {
          // Vehículo esporádico: usar costos propios
          if (vehiculo.modalidad_costo === 'por_viaje' && vehiculo.costo_por_viaje) {
            fleteBase = vehiculo.costo_por_viaje * viajesPagados
          } else if (vehiculo.modalidad_costo === 'flete_fijo' && vehiculo.flete_mensual) {
            if (viajesPagados > 0) {
              fleteBase = vehiculo.flete_mensual / 2
            }
          }
        } else if (costos) {
          // Vehículo normal: usar costos de PlaneacionLogi
          if (costos.modalidad_tercero === 'por_viaje' && costos.costo_por_viaje) {
            fleteBase = costos.costo_por_viaje * viajesPagados
          } else if (costos.modalidad_tercero === 'flete_fijo' && costos.flete_mensual) {
            if (viajesPagados > 0) {
              fleteBase = costos.flete_mensual / 2
            }
          }
        }

        const subtotal =
          fleteBase +
          totalCombustible +
          totalPeajes +
          totalFletesAdicionales +
          totalPernocta

        // Calcular retención 1% automática
        const retencion1Porciento = Math.round(subtotal * 0.01)
        const totalDeducciones = retencion1Porciento
        const totalAPagar = Math.round(subtotal) - totalDeducciones

        // Verificar si ya existe liquidación
        const { data: existente } = await sb
          .from('liq_liquidaciones')
          .select('id')
          .eq('quincena_id', quincenaId)
          .eq('vehiculo_tercero_id', vehiculo.id)
          .single()

        let liquidacionId: string | null = null

        if (existente) {
          // Actualizar liquidación
          const { data: updated, error: updateError } = await sb
            .from('liq_liquidaciones')
            .update({
              viajes_ejecutados: viajesEjecutados,
              viajes_variacion: viajesVariacion,
              viajes_no_ejecutados: viajesNoEjecutados,
              flete_base: Math.round(fleteBase),
              total_combustible: Math.round(totalCombustible),
              total_peajes: Math.round(totalPeajes),
              total_fletes_adicionales: Math.round(totalFletesAdicionales),
              total_pernocta: Math.round(totalPernocta),
              subtotal: Math.round(subtotal),
              total_deducciones: totalDeducciones,
              total_a_pagar: totalAPagar,
            })
            .eq('id', existente.id)
            .select()
            .single()

          if (!updateError && updated) {
            liquidacionesCreadas.push(updated as LiqLiquidacion)
            liquidacionId = existente.id
          }
        } else {
          // Insertar nueva liquidación
          const { data: inserted, error: insertError } = await sb
            .from('liq_liquidaciones')
            .insert({
              quincena_id: quincenaId,
              vehiculo_tercero_id: vehiculo.id,
              viajes_ejecutados: viajesEjecutados,
              viajes_variacion: viajesVariacion,
              viajes_no_ejecutados: viajesNoEjecutados,
              flete_base: Math.round(fleteBase),
              total_combustible: Math.round(totalCombustible),
              total_peajes: Math.round(totalPeajes),
              total_fletes_adicionales: Math.round(totalFletesAdicionales),
              total_pernocta: Math.round(totalPernocta),
              subtotal: Math.round(subtotal),
              total_deducciones: totalDeducciones,
              total_a_pagar: totalAPagar,
              estado: 'borrador',
            })
            .select()
            .single()

          if (!insertError && inserted) {
            liquidacionesCreadas.push(inserted as LiqLiquidacion)
            liquidacionId = (inserted as LiqLiquidacion).id
          }
        }

        // Crear o actualizar deducción de retención 1% automática
        if (liquidacionId && retencion1Porciento > 0) {
          // Verificar si ya existe la deducción de retención
          const { data: deduccionExistente } = await sb
            .from('liq_liquidacion_deducciones')
            .select('id')
            .eq('liquidacion_id', liquidacionId)
            .eq('tipo', 'retencion_1_porciento')
            .single()

          if (deduccionExistente) {
            // Actualizar monto de retención
            await sb
              .from('liq_liquidacion_deducciones')
              .update({ monto: retencion1Porciento })
              .eq('id', deduccionExistente.id)
          } else {
            // Crear nueva deducción de retención
            await sb
              .from('liq_liquidacion_deducciones')
              .insert({
                liquidacion_id: liquidacionId,
                tipo: 'retencion_1_porciento',
                monto: retencion1Porciento,
                descripcion: 'Retención 1% (automática)',
              })
          }
        }
      }

      return liquidacionesCreadas
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', variables.quincenaId] })
    },
  })
}

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
