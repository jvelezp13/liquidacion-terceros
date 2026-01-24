'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import {
  calcularCostoPorViaje,
  calcularTasaCumplimiento,
  generarQuincenaLabel,
  type DatosResumen,
  type DatosEvolucion,
  type DatosContratista,
  type DatosVehiculo,
  type DesgloseCostos,
} from '@/lib/utils/estadisticas-calcs'

// Tipos para filtros
export interface EstadisticasFilters {
  añoDesde?: number
  mesDesde?: number
  quincenaDesde?: number
  añoHasta?: number
  mesHasta?: number
  quincenaHasta?: number
  contratistaId?: string
  vehiculoId?: string
}

// Tipo para preset de rango
export type RangoPreset = 'este-mes' | 'ultimo-trimestre' | 'este-año' | 'todo'

// Hook para resumen general (KPIs)
export function useEstadisticasResumen(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-resumen', escenario?.id, filters],
    queryFn: async (): Promise<DatosResumen | null> => {
      if (!escenario?.id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener quincenas con estado liquidado o pagado
      let quincenasQuery = sb
        .from('liq_quincenas')
        .select('id, año, mes, quincena')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])

      // Aplicar filtros de rango si existen
      if (filters.añoDesde) {
        quincenasQuery = quincenasQuery.gte('año', filters.añoDesde)
      }
      if (filters.añoHasta) {
        quincenasQuery = quincenasQuery.lte('año', filters.añoHasta)
      }

      const { data: quincenas, error: quincenasError } = await quincenasQuery

      if (quincenasError) throw quincenasError
      if (!quincenas || quincenas.length === 0) {
        return {
          totalPagado: 0,
          totalQuincenas: 0,
          viajesEjecutados: 0,
          viajesVariacion: 0,
          viajesNoEjecutados: 0,
          totalViajes: 0,
        }
      }

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // Obtener total pagado de historial
      const { data: pagos, error: pagosError } = await sb
        .from('liq_historial_pagos')
        .select('monto_total')
        .in('quincena_id', quincenaIds)

      if (pagosError) throw pagosError

      const totalPagado = (pagos || []).reduce(
        (sum: number, p: { monto_total: number }) => sum + (p.monto_total || 0),
        0
      )

      // Obtener estadisticas de viajes
      let viajesQuery = sb
        .from('liq_viajes_ejecutados')
        .select('estado')
        .in('quincena_id', quincenaIds)

      if (filters.contratistaId || filters.vehiculoId) {
        // Necesitamos filtrar por vehiculo tercero
        const { data: vehiculosTerceros } = await sb
          .from('liq_vehiculos_terceros')
          .select('id')
          .match(
            filters.contratistaId
              ? { contratista_id: filters.contratistaId }
              : {}
          )

        if (vehiculosTerceros) {
          const vtIds = vehiculosTerceros.map((vt: { id: string }) => vt.id)
          viajesQuery = viajesQuery.in('vehiculo_tercero_id', vtIds)
        }
      }

      const { data: viajes, error: viajesError } = await viajesQuery

      if (viajesError) throw viajesError

      const viajesEjecutados = (viajes || []).filter(
        (v: { estado: string }) => v.estado === 'ejecutado'
      ).length
      const viajesVariacion = (viajes || []).filter(
        (v: { estado: string }) => v.estado === 'variacion'
      ).length
      const viajesNoEjecutados = (viajes || []).filter(
        (v: { estado: string }) => v.estado === 'no_ejecutado'
      ).length

      return {
        totalPagado,
        totalQuincenas: quincenas.length,
        viajesEjecutados,
        viajesVariacion,
        viajesNoEjecutados,
        totalViajes: viajes?.length || 0,
      }
    },
    enabled: !!escenario?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  })
}

// Hook para evolucion temporal
export function useEstadisticasEvolucion(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-evolucion', escenario?.id, filters],
    queryFn: async (): Promise<DatosEvolucion[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener quincenas ordenadas
      const { data: quincenas, error: quincenasError } = await sb
        .from('liq_quincenas')
        .select('id, año, mes, quincena')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])
        .order('año')
        .order('mes')
        .order('quincena')

      if (quincenasError) throw quincenasError
      if (!quincenas || quincenas.length === 0) return []

      // Para cada quincena, obtener datos
      const resultados: DatosEvolucion[] = []

      for (const q of quincenas as { id: string; año: number; mes: number; quincena: number }[]) {
        // Pagos de la quincena
        const { data: pagos } = await sb
          .from('liq_historial_pagos')
          .select('monto_total')
          .eq('quincena_id', q.id)

        const totalPagado = (pagos || []).reduce(
          (sum: number, p: { monto_total: number }) => sum + (p.monto_total || 0),
          0
        )

        // Viajes de la quincena
        const { data: viajes } = await sb
          .from('liq_viajes_ejecutados')
          .select('estado')
          .eq('quincena_id', q.id)

        const viajesEjecutados = (viajes || []).filter(
          (v: { estado: string }) => v.estado === 'ejecutado'
        ).length
        const viajesVariacion = (viajes || []).filter(
          (v: { estado: string }) => v.estado === 'variacion'
        ).length
        const viajesNoEjecutados = (viajes || []).filter(
          (v: { estado: string }) => v.estado === 'no_ejecutado'
        ).length

        resultados.push({
          quincenaLabel: generarQuincenaLabel(q.año, q.mes, q.quincena),
          quincenaId: q.id,
          año: q.año,
          mes: q.mes,
          quincena: q.quincena,
          totalPagado,
          viajesEjecutados,
          viajesNoEjecutados,
          viajesVariacion,
          costoPorViaje: calcularCostoPorViaje(totalPagado, viajesEjecutados + viajesVariacion),
        })
      }

      return resultados
    },
    enabled: !!escenario?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para metricas por contratista
export function useEstadisticasContratistas(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-contratistas', escenario?.id, filters],
    queryFn: async (): Promise<DatosContratista[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener quincenas del escenario
      const { data: quincenas } = await sb
        .from('liq_quincenas')
        .select('id')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])

      if (!quincenas || quincenas.length === 0) return []

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // Obtener contratistas con sus vehiculos
      const { data: contratistas, error: contratistasError } = await sb
        .from('liq_contratistas')
        .select(`
          id,
          nombre,
          vehiculos_terceros:liq_vehiculos_terceros(id)
        `)

      if (contratistasError) throw contratistasError
      if (!contratistas) return []

      // Para cada contratista, calcular metricas
      const resultados: DatosContratista[] = []

      for (const c of contratistas as { id: string; nombre: string; vehiculos_terceros: { id: string }[] }[]) {
        // Pagos del contratista
        const { data: pagos } = await sb
          .from('liq_historial_pagos')
          .select('monto_total')
          .eq('contratista_id', c.id)
          .in('quincena_id', quincenaIds)

        const totalPagado = (pagos || []).reduce(
          (sum: number, p: { monto_total: number }) => sum + (p.monto_total || 0),
          0
        )

        // Viajes de los vehiculos del contratista
        const vtIds = (c.vehiculos_terceros || []).map((vt) => vt.id)

        if (vtIds.length === 0) {
          resultados.push({
            id: c.id,
            nombre: c.nombre,
            totalVehiculos: 0,
            totalViajes: 0,
            totalPagado,
            costoPorViaje: 0,
            tasaCumplimiento: 0,
          })
          continue
        }

        const { data: viajes } = await sb
          .from('liq_viajes_ejecutados')
          .select('estado')
          .in('vehiculo_tercero_id', vtIds)
          .in('quincena_id', quincenaIds)

        const totalViajes = viajes?.length || 0
        const viajesEjecutados = (viajes || []).filter(
          (v: { estado: string }) => v.estado === 'ejecutado'
        ).length
        const viajesVariacion = (viajes || []).filter(
          (v: { estado: string }) => v.estado === 'variacion'
        ).length

        resultados.push({
          id: c.id,
          nombre: c.nombre,
          totalVehiculos: c.vehiculos_terceros?.length || 0,
          totalViajes,
          totalPagado,
          costoPorViaje: calcularCostoPorViaje(totalPagado, viajesEjecutados + viajesVariacion),
          tasaCumplimiento: calcularTasaCumplimiento(viajesEjecutados, viajesVariacion, totalViajes),
        })
      }

      // Solo retornar contratistas con actividad
      return resultados.filter(c => c.totalViajes > 0 || c.totalPagado > 0)
    },
    enabled: !!escenario?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para metricas por vehiculo
export function useEstadisticasVehiculos(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-vehiculos', escenario?.id, filters],
    queryFn: async (): Promise<DatosVehiculo[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener quincenas
      const { data: quincenas } = await sb
        .from('liq_quincenas')
        .select('id')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])

      if (!quincenas || quincenas.length === 0) return []

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // Obtener vehiculos terceros con sus relaciones
      let vehiculosQuery = sb
        .from('liq_vehiculos_terceros')
        .select(`
          id,
          vehiculo:vehiculos(placa),
          contratista:liq_contratistas(id, nombre)
        `)

      if (filters.contratistaId) {
        vehiculosQuery = vehiculosQuery.eq('contratista_id', filters.contratistaId)
      }

      const { data: vehiculos, error: vehiculosError } = await vehiculosQuery

      if (vehiculosError) throw vehiculosError
      if (!vehiculos) return []

      // Para cada vehiculo, calcular metricas
      const resultados: DatosVehiculo[] = []

      for (const v of vehiculos as { id: string; vehiculo: { placa: string } | null; contratista: { id: string; nombre: string } }[]) {
        // Liquidaciones del vehiculo
        const { data: liquidaciones } = await sb
          .from('liq_liquidaciones')
          .select('total_a_pagar')
          .eq('vehiculo_tercero_id', v.id)
          .in('quincena_id', quincenaIds)
          .eq('estado', 'aprobado')

        const totalPagado = (liquidaciones || []).reduce(
          (sum: number, l: { total_a_pagar: number }) => sum + (l.total_a_pagar || 0),
          0
        )

        // Viajes del vehiculo
        const { data: viajes } = await sb
          .from('liq_viajes_ejecutados')
          .select('estado')
          .eq('vehiculo_tercero_id', v.id)
          .in('quincena_id', quincenaIds)

        const totalViajes = (viajes || []).filter(
          (vj: { estado: string }) => vj.estado === 'ejecutado' || vj.estado === 'variacion'
        ).length

        if (totalViajes > 0 || totalPagado > 0) {
          resultados.push({
            id: v.id,
            placa: v.vehiculo?.placa || 'N/A',
            contratistaId: v.contratista?.id || '',
            contratistaNombre: v.contratista?.nombre || 'N/A',
            totalViajes,
            totalPagado,
            costoPorViaje: calcularCostoPorViaje(totalPagado, totalViajes),
          })
        }
      }

      return resultados
    },
    enabled: !!escenario?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para desglose de costos
export function useEstadisticasCostos(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-costos', escenario?.id, filters],
    queryFn: async (): Promise<DesgloseCostos | null> => {
      if (!escenario?.id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener quincenas
      const { data: quincenas } = await sb
        .from('liq_quincenas')
        .select('id')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])

      if (!quincenas || quincenas.length === 0) {
        return {
          fleteBases: 0,
          combustible: 0,
          peajes: 0,
          pernocta: 0,
          fletesAdicionales: 0,
          deducciones: 0,
          total: 0,
        }
      }

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // Obtener liquidaciones aprobadas
      let liquidacionesQuery = sb
        .from('liq_liquidaciones')
        .select(`
          flete_base,
          total_combustible,
          total_peajes,
          total_pernocta,
          total_fletes_adicionales,
          total_deducciones
        `)
        .in('quincena_id', quincenaIds)
        .eq('estado', 'aprobado')

      if (filters.vehiculoId) {
        liquidacionesQuery = liquidacionesQuery.eq('vehiculo_tercero_id', filters.vehiculoId)
      }

      const { data: liquidaciones, error } = await liquidacionesQuery

      if (error) throw error
      if (!liquidaciones || liquidaciones.length === 0) {
        return {
          fleteBases: 0,
          combustible: 0,
          peajes: 0,
          pernocta: 0,
          fletesAdicionales: 0,
          deducciones: 0,
          total: 0,
        }
      }

      // Sumar todos los costos
      const desglose = (liquidaciones as {
        flete_base: number
        total_combustible: number
        total_peajes: number
        total_pernocta: number
        total_fletes_adicionales: number
        total_deducciones: number
      }[]).reduce(
        (acc, l) => ({
          fleteBases: acc.fleteBases + (l.flete_base || 0),
          combustible: acc.combustible + (l.total_combustible || 0),
          peajes: acc.peajes + (l.total_peajes || 0),
          pernocta: acc.pernocta + (l.total_pernocta || 0),
          fletesAdicionales: acc.fletesAdicionales + (l.total_fletes_adicionales || 0),
          deducciones: acc.deducciones + (l.total_deducciones || 0),
          total: 0,
        }),
        {
          fleteBases: 0,
          combustible: 0,
          peajes: 0,
          pernocta: 0,
          fletesAdicionales: 0,
          deducciones: 0,
          total: 0,
        }
      )

      // Calcular total (sin restar deducciones, es el bruto)
      desglose.total =
        desglose.fleteBases +
        desglose.combustible +
        desglose.peajes +
        desglose.pernocta +
        desglose.fletesAdicionales

      return desglose
    },
    enabled: !!escenario?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook principal que combina todos los datos
export function useEstadisticas(filters: EstadisticasFilters = {}) {
  const resumen = useEstadisticasResumen(filters)
  const evolucion = useEstadisticasEvolucion(filters)
  const contratistas = useEstadisticasContratistas(filters)
  const vehiculos = useEstadisticasVehiculos(filters)
  const costos = useEstadisticasCostos(filters)

  return {
    resumen,
    evolucion,
    contratistas,
    vehiculos,
    costos,
    isLoading:
      resumen.isLoading ||
      evolucion.isLoading ||
      contratistas.isLoading ||
      vehiculos.isLoading ||
      costos.isLoading,
  }
}
