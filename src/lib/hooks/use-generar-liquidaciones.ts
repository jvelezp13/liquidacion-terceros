'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LiqLiquidacion, LiqViajeEjecutado } from '@/types'
import {
  calcularTotalesViajes,
  calcularDeduccion1Porciento,
} from '@/lib/utils/calcular-liquidacion'

// Tipos para las queries batch
interface VehiculoTercero {
  id: string
  vehiculo_id: string | null
  modalidad_costo: string | null
  costo_por_viaje: number | null
  flete_mensual: number | null
}

interface VehiculoCostos {
  vehiculo_id: string
  modalidad_tercero: string | null
  costo_por_viaje: number | null
  flete_mensual: number | null
}

interface LiquidacionExistente {
  id: string
  vehiculo_tercero_id: string
}

interface DeduccionExistente {
  id: string
  liquidacion_id: string
  tipo: string
}

/**
 * Hook optimizado para generar liquidaciones automáticamente desde viajes.
 * Reduce de ~6N queries a ~7 queries usando batch operations.
 */
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

      // ========================================
      // QUERY 1: Obtener todos los vehículos terceros activos
      // ========================================
      const { data: vehiculos, error: vehiculosError } = await sb
        .from('liq_vehiculos_terceros')
        .select('id, vehiculo_id, modalidad_costo, costo_por_viaje, flete_mensual')
        .eq('activo', true)

      if (vehiculosError) throw vehiculosError
      if (!vehiculos || vehiculos.length === 0) return []

      const vehiculosTyped = vehiculos as VehiculoTercero[]
      const vehiculoIds = vehiculosTyped.map((v) => v.id)
      const vehiculoIdsConVehiculo = vehiculosTyped
        .filter((v) => v.vehiculo_id)
        .map((v) => v.vehiculo_id as string)

      // Crear Map para O(1) lookup de vehículos
      const vehiculosMap = new Map<string, VehiculoTercero>()
      for (const v of vehiculosTyped) {
        vehiculosMap.set(v.id, v)
      }

      // ========================================
      // QUERY 2: Obtener TODOS los viajes de la quincena (batch)
      // ========================================
      const { data: todosViajes, error: viajesError } = await sb
        .from('liq_viajes_ejecutados')
        .select('*')
        .eq('quincena_id', quincenaId)
        .in('vehiculo_tercero_id', vehiculoIds)

      if (viajesError) throw viajesError

      // Organizar viajes por vehículo
      const viajesPorVehiculo = new Map<string, LiqViajeEjecutado[]>()
      if (todosViajes) {
        for (const viaje of todosViajes as LiqViajeEjecutado[]) {
          const lista = viajesPorVehiculo.get(viaje.vehiculo_tercero_id) || []
          lista.push(viaje)
          viajesPorVehiculo.set(viaje.vehiculo_tercero_id, lista)
        }
      }

      // ========================================
      // QUERY 3: Obtener TODOS los costos de vehículos (batch)
      // ========================================
      const costosMap = new Map<string, VehiculoCostos>()
      if (vehiculoIdsConVehiculo.length > 0) {
        const { data: costos } = await sb
          .from('vehiculos_costos')
          .select('vehiculo_id, modalidad_tercero, costo_por_viaje, flete_mensual')
          .in('vehiculo_id', vehiculoIdsConVehiculo)

        if (costos) {
          for (const c of costos as VehiculoCostos[]) {
            costosMap.set(c.vehiculo_id, c)
          }
        }
      }

      // ========================================
      // QUERY 4: Obtener TODAS las liquidaciones existentes de la quincena (batch)
      // ========================================
      const { data: liquidacionesExistentes } = await sb
        .from('liq_liquidaciones')
        .select('id, vehiculo_tercero_id')
        .eq('quincena_id', quincenaId)
        .in('vehiculo_tercero_id', vehiculoIds)

      // Map de vehículo -> liquidación existente
      const liquidacionesMap = new Map<string, string>()
      if (liquidacionesExistentes) {
        for (const liq of liquidacionesExistentes as LiquidacionExistente[]) {
          liquidacionesMap.set(liq.vehiculo_tercero_id, liq.id)
        }
      }

      // ========================================
      // QUERY 5: Obtener TODAS las deducciones existentes (batch)
      // ========================================
      const liquidacionIds = liquidacionesExistentes
        ? (liquidacionesExistentes as LiquidacionExistente[]).map((l) => l.id)
        : []

      const deduccionesMap = new Map<string, string>() // liquidacion_id -> deduccion_id
      if (liquidacionIds.length > 0) {
        const { data: deducciones } = await sb
          .from('liq_liquidacion_deducciones')
          .select('id, liquidacion_id, tipo')
          .in('liquidacion_id', liquidacionIds)
          .eq('tipo', 'retencion_1_porciento')

        if (deducciones) {
          for (const d of deducciones as DeduccionExistente[]) {
            deduccionesMap.set(d.liquidacion_id, d.id)
          }
        }
      }

      // ========================================
      // PASO 6: Calcular liquidaciones en memoria
      // ========================================
      const liquidacionesAInsertar: Array<{
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
        subtotal: number
        total_deducciones: number
        total_a_pagar: number
        estado: string
      }> = []

      const liquidacionesAActualizar: Array<{
        id: string
        viajes_ejecutados: number
        viajes_variacion: number
        viajes_no_ejecutados: number
        flete_base: number
        total_combustible: number
        total_peajes: number
        total_fletes_adicionales: number
        total_pernocta: number
        subtotal: number
        total_deducciones: number
        total_a_pagar: number
      }> = []

      // Para rastrear las retenciones a crear/actualizar
      const retencionesData: Array<{
        vehiculoId: string
        liquidacionIdExistente: string | null
        monto: number
      }> = []

      for (const vehiculo of vehiculosTyped) {
        const viajes = viajesPorVehiculo.get(vehiculo.id)
        if (!viajes || viajes.length === 0) continue

        // Calcular totales usando función utils
        const totales = calcularTotalesViajes(viajes)
        const viajesPagados = totales.viajesEjecutados + totales.viajesVariacion

        // Calcular flete base
        const esEsporadico = !vehiculo.vehiculo_id
        let fleteBase = 0

        if (esEsporadico) {
          if (vehiculo.modalidad_costo === 'por_viaje' && vehiculo.costo_por_viaje) {
            fleteBase = vehiculo.costo_por_viaje * viajesPagados
          } else if (vehiculo.modalidad_costo === 'flete_fijo' && vehiculo.flete_mensual) {
            if (viajesPagados > 0) {
              fleteBase = vehiculo.flete_mensual / 2
            }
          }
        } else {
          const costos = costosMap.get(vehiculo.vehiculo_id!)
          if (costos) {
            if (costos.modalidad_tercero === 'por_viaje' && costos.costo_por_viaje) {
              fleteBase = costos.costo_por_viaje * viajesPagados
            } else if (costos.modalidad_tercero === 'flete_fijo' && costos.flete_mensual) {
              if (viajesPagados > 0) {
                fleteBase = costos.flete_mensual / 2
              }
            }
          }
        }

        const subtotal =
          fleteBase +
          totales.totalCombustible +
          totales.totalPeajes +
          totales.totalFletesAdicionales +
          totales.totalPernocta

        const retencion1Porciento = calcularDeduccion1Porciento(subtotal)
        const totalDeducciones = retencion1Porciento
        const totalAPagar = Math.round(subtotal) - totalDeducciones

        const liquidacionExistenteId = liquidacionesMap.get(vehiculo.id)

        const datosLiquidacion = {
          viajes_ejecutados: totales.viajesEjecutados,
          viajes_variacion: totales.viajesVariacion,
          viajes_no_ejecutados: totales.viajesNoEjecutados,
          flete_base: Math.round(fleteBase),
          total_combustible: Math.round(totales.totalCombustible),
          total_peajes: Math.round(totales.totalPeajes),
          total_fletes_adicionales: Math.round(totales.totalFletesAdicionales),
          total_pernocta: Math.round(totales.totalPernocta),
          subtotal: Math.round(subtotal),
          total_deducciones: totalDeducciones,
          total_a_pagar: totalAPagar,
        }

        if (liquidacionExistenteId) {
          liquidacionesAActualizar.push({
            id: liquidacionExistenteId,
            ...datosLiquidacion,
          })
        } else {
          liquidacionesAInsertar.push({
            quincena_id: quincenaId,
            vehiculo_tercero_id: vehiculo.id,
            ...datosLiquidacion,
            estado: 'borrador',
          })
        }

        // Guardar datos de retención para después
        if (retencion1Porciento > 0) {
          retencionesData.push({
            vehiculoId: vehiculo.id,
            liquidacionIdExistente: liquidacionExistenteId || null,
            monto: retencion1Porciento,
          })
        }
      }

      // ========================================
      // QUERY 6: INSERT/UPDATE batch de liquidaciones
      // ========================================
      const liquidacionesCreadas: LiqLiquidacion[] = []

      // Insertar nuevas liquidaciones
      if (liquidacionesAInsertar.length > 0) {
        const { data: insertadas, error: insertError } = await sb
          .from('liq_liquidaciones')
          .insert(liquidacionesAInsertar)
          .select()

        if (insertError) throw insertError
        if (insertadas) {
          liquidacionesCreadas.push(...(insertadas as LiqLiquidacion[]))
        }
      }

      // Actualizar liquidaciones existentes (batch con Promise.all para mejor rendimiento)
      if (liquidacionesAActualizar.length > 0) {
        const updatePromises = liquidacionesAActualizar.map((liq) =>
          sb
            .from('liq_liquidaciones')
            .update({
              viajes_ejecutados: liq.viajes_ejecutados,
              viajes_variacion: liq.viajes_variacion,
              viajes_no_ejecutados: liq.viajes_no_ejecutados,
              flete_base: liq.flete_base,
              total_combustible: liq.total_combustible,
              total_peajes: liq.total_peajes,
              total_fletes_adicionales: liq.total_fletes_adicionales,
              total_pernocta: liq.total_pernocta,
              subtotal: liq.subtotal,
              total_deducciones: liq.total_deducciones,
              total_a_pagar: liq.total_a_pagar,
            })
            .eq('id', liq.id)
            .select()
            .single()
        )

        const results = await Promise.all(updatePromises)
        for (const result of results) {
          if (result.data) {
            liquidacionesCreadas.push(result.data as LiqLiquidacion)
          }
        }
      }

      // ========================================
      // QUERY 7: INSERT/UPDATE batch de deducciones (retención 1%)
      // ========================================
      // Crear map de vehiculo -> nueva liquidación id
      const nuevasLiquidacionesMap = new Map<string, string>()
      for (const liq of liquidacionesCreadas) {
        nuevasLiquidacionesMap.set(liq.vehiculo_tercero_id, liq.id)
      }

      const deduccionesAInsertar: Array<{
        liquidacion_id: string
        tipo: string
        monto: number
        descripcion: string
      }> = []

      const deduccionesAActualizar: Array<{
        id: string
        monto: number
      }> = []

      for (const retencion of retencionesData) {
        const liquidacionId =
          retencion.liquidacionIdExistente || nuevasLiquidacionesMap.get(retencion.vehiculoId)

        if (!liquidacionId) continue

        const deduccionExistenteId = deduccionesMap.get(liquidacionId)

        if (deduccionExistenteId) {
          deduccionesAActualizar.push({
            id: deduccionExistenteId,
            monto: retencion.monto,
          })
        } else {
          deduccionesAInsertar.push({
            liquidacion_id: liquidacionId,
            tipo: 'retencion_1_porciento',
            monto: retencion.monto,
            descripcion: 'Retención 1% (automática)',
          })
        }
      }

      // Insertar nuevas deducciones
      if (deduccionesAInsertar.length > 0) {
        await sb.from('liq_liquidacion_deducciones').insert(deduccionesAInsertar)
      }

      // Actualizar deducciones existentes (batch con Promise.all)
      if (deduccionesAActualizar.length > 0) {
        const updateDeduccionesPromises = deduccionesAActualizar.map((d) =>
          sb
            .from('liq_liquidacion_deducciones')
            .update({ monto: d.monto })
            .eq('id', d.id)
        )
        await Promise.all(updateDeduccionesPromises)
      }

      return liquidacionesCreadas
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['liquidaciones', variables.quincenaId] })
    },
  })
}
