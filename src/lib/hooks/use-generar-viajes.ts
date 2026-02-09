'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LiqViajeEjecutado } from '@/types'
import {
  calcularCostosViaje,
  convertirDiaJSaISO,
  type CostoDiaPlanificacion,
  type DatosRutaPlanificacion,
} from '@/lib/utils/generar-viajes'

// Tipo para ruta programada
interface RutaProgramada {
  vehiculo_tercero_id: string
  ruta_id: string
  dia_semana: number
  dia_ciclo: number | null
}

// Tipo para datos de ruta programada (ruta_id + dia_ciclo)
interface DatosRutaProgramada {
  rutaId: string
  diaCiclo: number | null
}

// Tipo para viaje existente (solo para verificar duplicados)
interface ViajeExistente {
  vehiculo_tercero_id: string
  fecha: string
}

/**
 * Hook optimizado para generar viajes desde rutas programadas.
 * Reduce de ~200 queries a ~5 queries usando batch operations.
 */
export function useGenerarViajesDesdeRutas() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      quincenaId,
      fechaInicio,
      fechaFin,
      escenarioId,
    }: {
      quincenaId: string
      fechaInicio: string
      fechaFin: string
      escenarioId: string // Requerido para cargar costos de planificacion
    }): Promise<LiqViajeEjecutado[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // ========================================
      // QUERY 1: Obtener vehículos terceros activos
      // ========================================
      const { data: vehiculos, error: vehiculosError } = await sb
        .from('liq_vehiculos_terceros')
        .select('id')
        .eq('activo', true)

      if (vehiculosError) throw vehiculosError
      if (!vehiculos || vehiculos.length === 0) return []

      const vehiculoIds = vehiculos.map((v: { id: string }) => v.id)

      // ========================================
      // QUERY 2: Obtener TODAS las rutas programadas (batch)
      // ========================================
      const { data: todasRutasProgramadas, error: rutasError } = await sb
        .from('liq_vehiculo_rutas_programadas')
        .select('vehiculo_tercero_id, ruta_id, dia_semana, dia_ciclo')
        .in('vehiculo_tercero_id', vehiculoIds)
        .eq('activo', true)

      if (rutasError) throw rutasError
      if (!todasRutasProgramadas || todasRutasProgramadas.length === 0) return []

      // Organizar rutas por vehículo (incluyendo dia_ciclo)
      const rutasPorVehiculo = new Map<string, Map<number, DatosRutaProgramada>>()
      const rutasUnicas = new Set<string>()

      for (const rp of todasRutasProgramadas as RutaProgramada[]) {
        if (!rutasPorVehiculo.has(rp.vehiculo_tercero_id)) {
          rutasPorVehiculo.set(rp.vehiculo_tercero_id, new Map())
        }
        rutasPorVehiculo.get(rp.vehiculo_tercero_id)!.set(rp.dia_semana, {
          rutaId: rp.ruta_id,
          diaCiclo: rp.dia_ciclo,
        })
        rutasUnicas.add(rp.ruta_id)
      }

      // ========================================
      // QUERY 3: Obtener costos de planificación (batch)
      // ========================================
      const datosPorRuta = new Map<string, DatosRutaPlanificacion>()

      const { data: planificaciones } = await sb
        .from('planificacion_lejanias')
        .select('ruta_id, costos_por_dia, frecuencia, peajes_ciclo')
        .eq('escenario_id', escenarioId)
        .eq('tipo', 'logistico')
        .in('ruta_id', Array.from(rutasUnicas))

      if (planificaciones) {
        for (const plan of planificaciones) {
          if (plan.ruta_id && plan.costos_por_dia && Array.isArray(plan.costos_por_dia)) {
            datosPorRuta.set(plan.ruta_id, {
              costos: plan.costos_por_dia as CostoDiaPlanificacion[],
              peajesCiclo: plan.peajes_ciclo || 0,
              frecuencia: plan.frecuencia || 'semanal',
            })
          }
        }
      }

      // Validar que se encontraron datos de planificacion
      if (datosPorRuta.size === 0) {
        throw new Error(
          'No se encontraron datos de planificacion para las rutas. Verifica que las rutas tengan costos configurados en PlaneacionLogi.'
        )
      }

      // ========================================
      // QUERY 4: Obtener viajes existentes (batch)
      // ========================================
      const { data: viajesExistentes } = await sb
        .from('liq_viajes_ejecutados')
        .select('vehiculo_tercero_id, fecha')
        .eq('quincena_id', quincenaId)

      // Crear set de claves existentes para O(1) lookup
      const existentesSet = new Set<string>()
      if (viajesExistentes) {
        for (const v of viajesExistentes as ViajeExistente[]) {
          existentesSet.add(`${v.vehiculo_tercero_id}-${v.fecha}`)
        }
      }

      // ========================================
      // PASO 5: Calcular viajes a crear (sin queries)
      // ========================================
      const viajesACrear: Array<{
        quincena_id: string
        vehiculo_tercero_id: string
        fecha: string
        ruta_programada_id: string
        estado: string
        costo_combustible: number
        costo_peajes: number
        costo_flete_adicional: number
        costo_pernocta: number
        requiere_pernocta: boolean
        noches_pernocta: number
        km_recorridos: number
        costo_total: number
        dia_ciclo: number | null
      }> = []

      const inicio = new Date(fechaInicio + 'T00:00:00')
      const fin = new Date(fechaFin + 'T00:00:00')

      // Iterar por cada vehículo con rutas
      for (const [vehiculoId, rutasPorDia] of rutasPorVehiculo) {
        // Iterar por cada día de la quincena
        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
          const diaISO = convertirDiaJSaISO(fecha.getDay())
          const datosRutaProgramada = rutasPorDia.get(diaISO)

          if (!datosRutaProgramada) continue

          const { rutaId, diaCiclo: diaCicloProgramado } = datosRutaProgramada
          const fechaStr = fecha.toISOString().split('T')[0]
          const clave = `${vehiculoId}-${fechaStr}`

          // Verificar duplicado en O(1)
          if (existentesSet.has(clave)) continue

          // Obtener costos de planificación usando el ruta_id
          const datosRuta = datosPorRuta.get(rutaId)

          // Usar dia_ciclo de rutas programadas (ya configurado por el usuario)
          // Solo undefined si es ruta de un solo día
          const diasCiclo = datosRuta?.costos?.length || 0
          const diaCiclo = diasCiclo > 1 ? diaCicloProgramado : null

          const costos = calcularCostosViaje(datosRuta, diaISO, false, diaCiclo ?? undefined)

          viajesACrear.push({
            quincena_id: quincenaId,
            vehiculo_tercero_id: vehiculoId,
            fecha: fechaStr,
            ruta_programada_id: rutaId,
            estado: 'pendiente',
            costo_combustible: costos.costoCombustible,
            costo_peajes: costos.costoPeajes,
            costo_flete_adicional: costos.costoAdicionales,
            costo_pernocta: costos.costoPernocta,
            requiere_pernocta: costos.requierePernocta,
            noches_pernocta: costos.nochesPernocta,
            km_recorridos: costos.kmRecorridos,
            costo_total: costos.costoTotal,
            dia_ciclo: diaCiclo,
          })
        }
      }

      if (viajesACrear.length === 0) return []

      // ========================================
      // QUERY 5: INSERT batch de todos los viajes
      // ========================================
      const { data: viajesCreados, error: insertError } = await sb
        .from('liq_viajes_ejecutados')
        .insert(viajesACrear)
        .select()

      if (insertError) {
        console.error('Error al crear viajes:', insertError)
        throw insertError
      }

      return (viajesCreados || []) as LiqViajeEjecutado[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['viajes-ejecutados', variables.quincenaId] })
    },
  })
}
