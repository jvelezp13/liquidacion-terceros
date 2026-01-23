'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LiqLiquidacion } from '@/types'

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
