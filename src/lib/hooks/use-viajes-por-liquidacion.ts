'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RutaLogistica, LiqViajeEjecutado } from '@/types'

// Tipo para viaje con ruta incluida
interface ViajeConRuta extends LiqViajeEjecutado {
  ruta?: RutaLogistica | null
  ruta_variacion?: RutaLogistica | null
}

// Tipo para el desglose por ruta
export interface DesgloseRuta {
  rutaId: string
  rutaNombre: string
  viajesCount: number
  totalKm: number
  totalCombustible: number
  totalPeajes: number
  totalAdicionales: number
  totalPernocta: number
  nochesPernocta: number
  subtotal: number
  viajes: ViajeConRuta[]
}

// Tipo de retorno del hook
export interface ViajesPorLiquidacion {
  desgloseRutas: DesgloseRuta[]
  totales: {
    viajesEjecutados: number
    viajesVariacion: number
    totalCombustible: number
    totalPeajes: number
    totalAdicionales: number
    totalPernocta: number
    nochesPernocta: number
  }
  viajesManuales: ViajeConRuta[] // Viajes sin ruta (manuales)
}

// Hook para obtener viajes agrupados por ruta para una liquidacion
export function useViajesPorLiquidacion(
  quincenaId: string | undefined,
  vehiculoTerceroId: string | undefined
) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-por-liquidacion', quincenaId, vehiculoTerceroId],
    queryFn: async (): Promise<ViajesPorLiquidacion> => {
      if (!quincenaId || !vehiculoTerceroId) {
        return {
          desgloseRutas: [],
          totales: {
            viajesEjecutados: 0,
            viajesVariacion: 0,
            totalCombustible: 0,
            totalPeajes: 0,
            totalAdicionales: 0,
            totalPernocta: 0,
            nochesPernocta: 0,
          },
          viajesManuales: [],
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener viajes del vehiculo en la quincena (solo ejecutados y variacion)
      const { data: viajes, error } = await sb
        .from('liq_viajes_ejecutados')
        .select('*')
        .eq('quincena_id', quincenaId)
        .eq('vehiculo_tercero_id', vehiculoTerceroId)
        .in('estado', ['ejecutado', 'variacion'])
        .order('fecha')

      if (error) throw error
      if (!viajes || viajes.length === 0) {
        return {
          desgloseRutas: [],
          totales: {
            viajesEjecutados: 0,
            viajesVariacion: 0,
            totalCombustible: 0,
            totalPeajes: 0,
            totalAdicionales: 0,
            totalPernocta: 0,
            nochesPernocta: 0,
          },
          viajesManuales: [],
        }
      }

      // Obtener IDs unicos de rutas (programadas y variaciones)
      const rutaIds = new Set<string>()
      for (const v of viajes as LiqViajeEjecutado[]) {
        if (v.ruta_programada_id) rutaIds.add(v.ruta_programada_id)
        if (v.ruta_variacion_id) rutaIds.add(v.ruta_variacion_id)
      }

      // Obtener datos de rutas
      const rutasMap = new Map<string, RutaLogistica>()
      if (rutaIds.size > 0) {
        const { data: rutas } = await sb
          .from('rutas_logisticas')
          .select('*')
          .in('id', Array.from(rutaIds))

        if (rutas) {
          for (const ruta of rutas as RutaLogistica[]) {
            rutasMap.set(ruta.id, ruta)
          }
        }
      }

      // Enriquecer viajes con sus rutas
      const viajesConRutas: ViajeConRuta[] = (viajes as LiqViajeEjecutado[]).map((v) => ({
        ...v,
        ruta: v.ruta_programada_id ? rutasMap.get(v.ruta_programada_id) || null : null,
        ruta_variacion: v.ruta_variacion_id ? rutasMap.get(v.ruta_variacion_id) || null : null,
      }))

      // Agrupar viajes por ruta efectiva (la ruta que realmente se ejecuto)
      const viajesPorRuta = new Map<string, ViajeConRuta[]>()
      const viajesManuales: ViajeConRuta[] = []

      for (const viaje of viajesConRutas) {
        // Determinar la ruta efectiva: variacion si existe, sino la programada
        const rutaEfectivaId = viaje.estado === 'variacion' && viaje.ruta_variacion_id
          ? viaje.ruta_variacion_id
          : viaje.ruta_programada_id

        if (rutaEfectivaId) {
          if (!viajesPorRuta.has(rutaEfectivaId)) {
            viajesPorRuta.set(rutaEfectivaId, [])
          }
          viajesPorRuta.get(rutaEfectivaId)!.push(viaje)
        } else {
          // Viaje manual sin ruta
          viajesManuales.push(viaje)
        }
      }

      // Construir desglose por ruta
      const desgloseRutas: DesgloseRuta[] = []

      for (const [rutaId, viajesRuta] of viajesPorRuta.entries()) {
        const ruta = rutasMap.get(rutaId)

        const totales = viajesRuta.reduce(
          (acc, v) => ({
            km: acc.km + ((v as LiqViajeEjecutado & { km_recorridos?: number }).km_recorridos || 0),
            combustible: acc.combustible + (v.costo_combustible || 0),
            peajes: acc.peajes + (v.costo_peajes || 0),
            adicionales: acc.adicionales + (v.costo_flete_adicional || 0),
            pernocta: acc.pernocta + (v.costo_pernocta || 0),
            nochesPernocta: acc.nochesPernocta + (v.noches_pernocta || 0),
          }),
          { km: 0, combustible: 0, peajes: 0, adicionales: 0, pernocta: 0, nochesPernocta: 0 }
        )

        desgloseRutas.push({
          rutaId,
          rutaNombre: ruta?.nombre || 'Ruta desconocida',
          viajesCount: viajesRuta.length,
          totalKm: totales.km,
          totalCombustible: totales.combustible,
          totalPeajes: totales.peajes,
          totalAdicionales: totales.adicionales,
          totalPernocta: totales.pernocta,
          nochesPernocta: totales.nochesPernocta,
          subtotal: totales.combustible + totales.peajes + totales.adicionales + totales.pernocta,
          viajes: viajesRuta,
        })
      }

      // Ordenar por cantidad de viajes (descendente)
      desgloseRutas.sort((a, b) => b.viajesCount - a.viajesCount)

      // Calcular totales globales
      const totalesGlobales = viajesConRutas.reduce(
        (acc, v) => ({
          ejecutados: acc.ejecutados + (v.estado === 'ejecutado' ? 1 : 0),
          variacion: acc.variacion + (v.estado === 'variacion' ? 1 : 0),
          combustible: acc.combustible + (v.costo_combustible || 0),
          peajes: acc.peajes + (v.costo_peajes || 0),
          adicionales: acc.adicionales + (v.costo_flete_adicional || 0),
          pernocta: acc.pernocta + (v.costo_pernocta || 0),
          nochesPernocta: acc.nochesPernocta + (v.noches_pernocta || 0),
        }),
        { ejecutados: 0, variacion: 0, combustible: 0, peajes: 0, adicionales: 0, pernocta: 0, nochesPernocta: 0 }
      )

      return {
        desgloseRutas,
        totales: {
          viajesEjecutados: totalesGlobales.ejecutados,
          viajesVariacion: totalesGlobales.variacion,
          totalCombustible: totalesGlobales.combustible,
          totalPeajes: totalesGlobales.peajes,
          totalAdicionales: totalesGlobales.adicionales,
          totalPernocta: totalesGlobales.pernocta,
          nochesPernocta: totalesGlobales.nochesPernocta,
        },
        viajesManuales,
      }
    },
    enabled: !!quincenaId && !!vehiculoTerceroId,
  })
}

// Tipo de retorno para viajes de quincena completa (indexados por vehiculo_tercero_id)
export type ViajesQuincenaMap = Map<string, ViajesPorLiquidacion>

// Hook para cargar todos los viajes de una quincena, indexados por vehiculo_tercero_id
export function useViajesQuincenaCompleta(quincenaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-quincena-completa', quincenaId],
    queryFn: async (): Promise<ViajesQuincenaMap> => {
      if (!quincenaId) {
        return new Map()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener todos los viajes de la quincena (ejecutados y variacion)
      const { data: viajes, error } = await sb
        .from('liq_viajes_ejecutados')
        .select('*')
        .eq('quincena_id', quincenaId)
        .in('estado', ['ejecutado', 'variacion'])
        .order('fecha')

      if (error) throw error
      if (!viajes || viajes.length === 0) {
        return new Map()
      }

      // Obtener IDs unicos de rutas
      const rutaIds = new Set<string>()
      for (const v of viajes as LiqViajeEjecutado[]) {
        if (v.ruta_programada_id) rutaIds.add(v.ruta_programada_id)
        if (v.ruta_variacion_id) rutaIds.add(v.ruta_variacion_id)
      }

      // Obtener datos de rutas
      const rutasMap = new Map<string, RutaLogistica>()
      if (rutaIds.size > 0) {
        const { data: rutas } = await sb
          .from('rutas_logisticas')
          .select('*')
          .in('id', Array.from(rutaIds))

        if (rutas) {
          for (const ruta of rutas as RutaLogistica[]) {
            rutasMap.set(ruta.id, ruta)
          }
        }
      }

      // Agrupar viajes por vehiculo_tercero_id
      const viajesPorVehiculo = new Map<string, ViajeConRuta[]>()
      for (const v of viajes as LiqViajeEjecutado[]) {
        const vtId = v.vehiculo_tercero_id
        if (!viajesPorVehiculo.has(vtId)) {
          viajesPorVehiculo.set(vtId, [])
        }
        const viajeConRuta: ViajeConRuta = {
          ...v,
          ruta: v.ruta_programada_id ? rutasMap.get(v.ruta_programada_id) || null : null,
          ruta_variacion: v.ruta_variacion_id ? rutasMap.get(v.ruta_variacion_id) || null : null,
        }
        viajesPorVehiculo.get(vtId)!.push(viajeConRuta)
      }

      // Procesar cada vehiculo para generar su ViajesPorLiquidacion
      const resultado: ViajesQuincenaMap = new Map()

      for (const [vtId, viajesVehiculo] of viajesPorVehiculo.entries()) {
        // Agrupar por ruta efectiva
        const viajesPorRuta = new Map<string, ViajeConRuta[]>()
        const viajesManuales: ViajeConRuta[] = []

        for (const viaje of viajesVehiculo) {
          const rutaEfectivaId = viaje.estado === 'variacion' && viaje.ruta_variacion_id
            ? viaje.ruta_variacion_id
            : viaje.ruta_programada_id

          if (rutaEfectivaId) {
            if (!viajesPorRuta.has(rutaEfectivaId)) {
              viajesPorRuta.set(rutaEfectivaId, [])
            }
            viajesPorRuta.get(rutaEfectivaId)!.push(viaje)
          } else {
            viajesManuales.push(viaje)
          }
        }

        // Construir desglose por ruta
        const desgloseRutas: DesgloseRuta[] = []
        for (const [rutaId, viajesRuta] of viajesPorRuta.entries()) {
          const ruta = rutasMap.get(rutaId)
          const totales = viajesRuta.reduce(
            (acc, v) => ({
              km: acc.km + ((v as LiqViajeEjecutado & { km_recorridos?: number }).km_recorridos || 0),
              combustible: acc.combustible + (v.costo_combustible || 0),
              peajes: acc.peajes + (v.costo_peajes || 0),
              adicionales: acc.adicionales + (v.costo_flete_adicional || 0),
              pernocta: acc.pernocta + (v.costo_pernocta || 0),
              nochesPernocta: acc.nochesPernocta + (v.noches_pernocta || 0),
            }),
            { km: 0, combustible: 0, peajes: 0, adicionales: 0, pernocta: 0, nochesPernocta: 0 }
          )

          desgloseRutas.push({
            rutaId,
            rutaNombre: ruta?.nombre || 'Ruta desconocida',
            viajesCount: viajesRuta.length,
            totalKm: totales.km,
            totalCombustible: totales.combustible,
            totalPeajes: totales.peajes,
            totalAdicionales: totales.adicionales,
            totalPernocta: totales.pernocta,
            nochesPernocta: totales.nochesPernocta,
            subtotal: totales.combustible + totales.peajes + totales.adicionales + totales.pernocta,
            viajes: viajesRuta,
          })
        }

        desgloseRutas.sort((a, b) => b.viajesCount - a.viajesCount)

        // Calcular totales globales
        const totalesGlobales = viajesVehiculo.reduce(
          (acc, v) => ({
            ejecutados: acc.ejecutados + (v.estado === 'ejecutado' ? 1 : 0),
            variacion: acc.variacion + (v.estado === 'variacion' ? 1 : 0),
            combustible: acc.combustible + (v.costo_combustible || 0),
            peajes: acc.peajes + (v.costo_peajes || 0),
            adicionales: acc.adicionales + (v.costo_flete_adicional || 0),
            pernocta: acc.pernocta + (v.costo_pernocta || 0),
            nochesPernocta: acc.nochesPernocta + (v.noches_pernocta || 0),
          }),
          { ejecutados: 0, variacion: 0, combustible: 0, peajes: 0, adicionales: 0, pernocta: 0, nochesPernocta: 0 }
        )

        resultado.set(vtId, {
          desgloseRutas,
          totales: {
            viajesEjecutados: totalesGlobales.ejecutados,
            viajesVariacion: totalesGlobales.variacion,
            totalCombustible: totalesGlobales.combustible,
            totalPeajes: totalesGlobales.peajes,
            totalAdicionales: totalesGlobales.adicionales,
            totalPernocta: totalesGlobales.pernocta,
            nochesPernocta: totalesGlobales.nochesPernocta,
          },
          viajesManuales,
        })
      }

      return resultado
    },
    enabled: !!quincenaId,
  })
}
