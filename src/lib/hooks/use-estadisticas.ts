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
  type DatosRuta,
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

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // Batch query: todos los pagos de todas las quincenas
      const { data: todosPagos } = await sb
        .from('liq_historial_pagos')
        .select('quincena_id, monto_total')
        .in('quincena_id', quincenaIds)

      // Batch query: todos los viajes de todas las quincenas
      const { data: todosViajes } = await sb
        .from('liq_viajes_ejecutados')
        .select('quincena_id, estado')
        .in('quincena_id', quincenaIds)

      // Agrupar pagos por quincena
      const pagosPorQuincena = new Map<string, number>()
      for (const p of (todosPagos || []) as { quincena_id: string; monto_total: number }[]) {
        const actual = pagosPorQuincena.get(p.quincena_id) || 0
        pagosPorQuincena.set(p.quincena_id, actual + (p.monto_total || 0))
      }

      // Agrupar viajes por quincena
      const viajesPorQuincena = new Map<string, { ejecutados: number; variacion: number; noEjecutados: number }>()
      for (const v of (todosViajes || []) as { quincena_id: string; estado: string }[]) {
        const actual = viajesPorQuincena.get(v.quincena_id) || { ejecutados: 0, variacion: 0, noEjecutados: 0 }
        if (v.estado === 'ejecutado') actual.ejecutados++
        else if (v.estado === 'variacion') actual.variacion++
        else if (v.estado === 'no_ejecutado') actual.noEjecutados++
        viajesPorQuincena.set(v.quincena_id, actual)
      }

      // Construir resultados
      const resultados: DatosEvolucion[] = (quincenas as { id: string; año: number; mes: number; quincena: number }[]).map((q) => {
        const totalPagado = pagosPorQuincena.get(q.id) || 0
        const viajes = viajesPorQuincena.get(q.id) || { ejecutados: 0, variacion: 0, noEjecutados: 0 }

        return {
          quincenaLabel: generarQuincenaLabel(q.año, q.mes, q.quincena),
          quincenaId: q.id,
          año: q.año,
          mes: q.mes,
          quincena: q.quincena,
          totalPagado,
          viajesEjecutados: viajes.ejecutados,
          viajesNoEjecutados: viajes.noEjecutados,
          viajesVariacion: viajes.variacion,
          costoPorViaje: calcularCostoPorViaje(totalPagado, viajes.ejecutados + viajes.variacion),
        }
      })

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

      const contratistasList = contratistas as { id: string; nombre: string; vehiculos_terceros: { id: string }[] }[]
      const contratistaIds = contratistasList.map(c => c.id)

      // Batch query: todos los pagos de todos los contratistas
      const { data: todosPagos } = await sb
        .from('liq_historial_pagos')
        .select('contratista_id, monto_total')
        .in('contratista_id', contratistaIds)
        .in('quincena_id', quincenaIds)

      // Agrupar pagos por contratista
      const pagosPorContratista = new Map<string, number>()
      for (const p of (todosPagos || []) as { contratista_id: string; monto_total: number }[]) {
        const actual = pagosPorContratista.get(p.contratista_id) || 0
        pagosPorContratista.set(p.contratista_id, actual + (p.monto_total || 0))
      }

      // Obtener todos los vehiculo_tercero_ids y mapear a contratistas
      const vtIdToContratista = new Map<string, string>()
      const allVtIds: string[] = []
      for (const c of contratistasList) {
        for (const vt of (c.vehiculos_terceros || [])) {
          vtIdToContratista.set(vt.id, c.id)
          allVtIds.push(vt.id)
        }
      }

      // Batch query: todos los viajes de todos los vehiculos
      let viajesPorContratista = new Map<string, { total: number; ejecutados: number; variacion: number }>()
      if (allVtIds.length > 0) {
        const { data: todosViajes } = await sb
          .from('liq_viajes_ejecutados')
          .select('vehiculo_tercero_id, estado')
          .in('vehiculo_tercero_id', allVtIds)
          .in('quincena_id', quincenaIds)

        // Agrupar viajes por contratista
        for (const v of (todosViajes || []) as { vehiculo_tercero_id: string; estado: string }[]) {
          const contratistaId = vtIdToContratista.get(v.vehiculo_tercero_id)
          if (!contratistaId) continue

          const actual = viajesPorContratista.get(contratistaId) || { total: 0, ejecutados: 0, variacion: 0 }
          actual.total++
          if (v.estado === 'ejecutado') actual.ejecutados++
          else if (v.estado === 'variacion') actual.variacion++
          viajesPorContratista.set(contratistaId, actual)
        }
      }

      // Construir resultados
      const resultados: DatosContratista[] = contratistasList.map(c => {
        const totalPagado = pagosPorContratista.get(c.id) || 0
        const viajes = viajesPorContratista.get(c.id) || { total: 0, ejecutados: 0, variacion: 0 }

        return {
          id: c.id,
          nombre: c.nombre,
          totalVehiculos: c.vehiculos_terceros?.length || 0,
          totalViajes: viajes.total,
          totalPagado,
          costoPorViaje: calcularCostoPorViaje(totalPagado, viajes.ejecutados + viajes.variacion),
          tasaCumplimiento: calcularTasaCumplimiento(viajes.ejecutados, viajes.variacion, viajes.total),
        }
      })

      // Solo retornar contratistas con actividad
      return resultados.filter(c => c.totalViajes > 0 || c.totalPagado > 0)
    },
    enabled: !!escenario?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para metricas por vehiculo
// Corregido: ahora obtiene vehiculos desde los viajes del escenario (no todos los del tenant)
export function useEstadisticasVehiculos(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-vehiculos', escenario?.id, filters],
    queryFn: async (): Promise<DatosVehiculo[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // 1. Obtener quincenas del escenario activo
      const { data: quincenas } = await sb
        .from('liq_quincenas')
        .select('id')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])

      if (!quincenas || quincenas.length === 0) return []

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // 2. Obtener vehiculo_tercero_id unicos de viajes en esas quincenas
      const { data: viajesConVehiculos } = await sb
        .from('liq_viajes_ejecutados')
        .select('vehiculo_tercero_id, estado')
        .in('quincena_id', quincenaIds)

      if (!viajesConVehiculos || viajesConVehiculos.length === 0) return []

      // Extraer IDs unicos de vehiculos terceros que tienen viajes
      const vehiculoTerceroIds = [...new Set(
        (viajesConVehiculos as { vehiculo_tercero_id: string }[])
          .map(v => v.vehiculo_tercero_id)
          .filter(Boolean)
      )]

      if (vehiculoTerceroIds.length === 0) return []

      // Agrupar viajes por vehiculo (solo ejecutados y variacion)
      const viajesPorVehiculo = new Map<string, number>()
      for (const v of viajesConVehiculos as { vehiculo_tercero_id: string; estado: string }[]) {
        if (v.estado === 'ejecutado' || v.estado === 'variacion') {
          const actual = viajesPorVehiculo.get(v.vehiculo_tercero_id) || 0
          viajesPorVehiculo.set(v.vehiculo_tercero_id, actual + 1)
        }
      }

      // 3. Obtener detalles de esos vehiculos especificos
      // Nota: placa esta directamente en liq_vehiculos_terceros (no en vehiculos)
      let vehiculosQuery = sb
        .from('liq_vehiculos_terceros')
        .select(`
          id,
          placa,
          contratista_id,
          contratista:liq_contratistas(id, nombre)
        `)
        .in('id', vehiculoTerceroIds)

      if (filters.contratistaId) {
        vehiculosQuery = vehiculosQuery.eq('contratista_id', filters.contratistaId)
      }

      const { data: vehiculos, error: vehiculosError } = await vehiculosQuery

      if (vehiculosError) throw vehiculosError
      if (!vehiculos) return []

      const vehiculosList = vehiculos as {
        id: string
        placa: string
        contratista_id: string
        contratista: { id: string; nombre: string }
      }[]

      // Obtener IDs de contratistas unicos
      const contratistaIds = [...new Set(vehiculosList.map(v => v.contratista_id))]

      // Batch query: pagos por contratista
      const { data: todosPagos } = await sb
        .from('liq_historial_pagos')
        .select('contratista_id, monto_total')
        .in('contratista_id', contratistaIds)
        .in('quincena_id', quincenaIds)

      // Agrupar pagos por contratista
      const pagosPorContratista = new Map<string, number>()
      for (const p of (todosPagos || []) as { contratista_id: string; monto_total: number }[]) {
        const actual = pagosPorContratista.get(p.contratista_id) || 0
        pagosPorContratista.set(p.contratista_id, actual + (p.monto_total || 0))
      }

      // Calcular viajes totales por contratista (para prorrateo)
      const viajesTotalesPorContratista = new Map<string, number>()
      for (const v of vehiculosList) {
        const viajes = viajesPorVehiculo.get(v.id) || 0
        const actual = viajesTotalesPorContratista.get(v.contratista_id) || 0
        viajesTotalesPorContratista.set(v.contratista_id, actual + viajes)
      }

      // Construir resultados con pago prorrateado
      const resultados: DatosVehiculo[] = vehiculosList
        .map(v => {
          const totalViajes = viajesPorVehiculo.get(v.id) || 0
          const pagoContratista = pagosPorContratista.get(v.contratista_id) || 0
          const viajesTotalesContratista = viajesTotalesPorContratista.get(v.contratista_id) || 0

          // Prorratear el pago del contratista entre sus vehiculos segun viajes
          const totalPagado = viajesTotalesContratista > 0
            ? Math.round((totalViajes / viajesTotalesContratista) * pagoContratista)
            : 0

          return {
            id: v.id,
            placa: v.placa || 'N/A',
            contratistaId: v.contratista?.id || '',
            contratistaNombre: v.contratista?.nombre || 'N/A',
            totalViajes,
            totalPagado,
            costoPorViaje: calcularCostoPorViaje(totalPagado, totalViajes),
          }
        })
        .filter(v => v.totalViajes > 0 || v.totalPagado > 0)

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

// Hook para analisis de rutas
export function useEstadisticasRutas(filters: EstadisticasFilters = {}) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['estadisticas-rutas', escenario?.id, filters],
    queryFn: async (): Promise<DatosRuta[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // 1. Obtener quincenas del escenario activo
      const { data: quincenas } = await sb
        .from('liq_quincenas')
        .select('id')
        .eq('escenario_id', escenario.id)
        .in('estado', ['liquidado', 'pagado'])

      if (!quincenas || quincenas.length === 0) return []

      const quincenaIds = quincenas.map((q: { id: string }) => q.id)

      // 2. Obtener viajes con datos de ruta (ruta_programada_id o ruta_variacion_id)
      const { data: viajes } = await sb
        .from('liq_viajes_ejecutados')
        .select(`
          estado,
          ruta_programada_id,
          ruta_variacion_id,
          km_recorridos,
          costo_combustible,
          costo_peajes,
          costo_total
        `)
        .in('quincena_id', quincenaIds)
        .in('estado', ['ejecutado', 'variacion'])

      if (!viajes || viajes.length === 0) return []

      // 3. Agrupar viajes por ruta (usar variacion si existe, sino programada)
      const datosPorRuta = new Map<string, {
        viajes: number
        kmTotal: number
        combustible: number
        peajes: number
        total: number
      }>()

      for (const v of viajes as {
        ruta_programada_id: string | null
        ruta_variacion_id: string | null
        km_recorridos: number | null
        costo_combustible: number | null
        costo_peajes: number | null
        costo_total: number | null
      }[]) {
        // Usar la ruta de variacion si existe, sino la programada
        const rutaId = v.ruta_variacion_id || v.ruta_programada_id
        if (!rutaId) continue

        const actual = datosPorRuta.get(rutaId) || {
          viajes: 0,
          kmTotal: 0,
          combustible: 0,
          peajes: 0,
          total: 0,
        }

        actual.viajes++
        actual.kmTotal += v.km_recorridos || 0
        actual.combustible += v.costo_combustible || 0
        actual.peajes += v.costo_peajes || 0
        actual.total += v.costo_total || 0

        datosPorRuta.set(rutaId, actual)
      }

      if (datosPorRuta.size === 0) return []

      // 4. Obtener nombres de rutas
      const rutaIds = [...datosPorRuta.keys()]
      const { data: rutas } = await sb
        .from('rutas_logisticas')
        .select('id, nombre, codigo')
        .in('id', rutaIds)

      if (!rutas) return []

      // 5. Construir resultados
      const resultados: DatosRuta[] = (rutas as { id: string; nombre: string; codigo: string | null }[])
        .map(r => {
          const datos = datosPorRuta.get(r.id)!
          return {
            id: r.id,
            nombre: r.nombre,
            codigo: r.codigo || '',
            totalViajes: datos.viajes,
            kmTotal: Math.round(datos.kmTotal),
            combustible: Math.round(datos.combustible),
            peajes: Math.round(datos.peajes),
            total: Math.round(datos.total),
            costoPorViaje: calcularCostoPorViaje(datos.total, datos.viajes),
          }
        })
        .sort((a, b) => b.totalViajes - a.totalViajes)

      return resultados
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
  const rutas = useEstadisticasRutas(filters)

  return {
    resumen,
    evolucion,
    contratistas,
    vehiculos,
    costos,
    rutas,
    isLoading:
      resumen.isLoading ||
      evolucion.isLoading ||
      contratistas.isLoading ||
      vehiculos.isLoading ||
      costos.isLoading ||
      rutas.isLoading,
  }
}
