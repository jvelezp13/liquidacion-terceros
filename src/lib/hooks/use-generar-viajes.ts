'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LiqViajeEjecutado, LiqVehiculoTercero } from '@/types'

// Tipo para costos de un día desde planificacion_lejanias
interface CostoDiaPlanificacion {
  dia: string // 'lunes', 'martes', etc.
  semana: number
  km_total: number
  combustible: number
  adicionales: number
  peajes?: number
  pernocta: number
}

// Tipo para almacenar datos de planificación de una ruta
interface DatosRutaPlanificacion {
  costos: CostoDiaPlanificacion[]
  peajesCiclo: number
  frecuencia: string
}

// Mapeo de día ISO (1-7) a nombre de día
const DIAS_NOMBRE: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
  7: 'domingo',
}

// Hook para generar viajes desde rutas programadas
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
      escenarioId?: string // Necesario para obtener costos de planificación
    }): Promise<LiqViajeEjecutado[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener todos los vehículos terceros activos
      const { data: vehiculos, error: vehiculosError } = await sb
        .from('liq_vehiculos_terceros')
        .select('*')
        .eq('activo', true)

      if (vehiculosError) throw vehiculosError
      if (!vehiculos || vehiculos.length === 0) return []

      // Paso 1: Recolectar todas las rutas únicas que se van a usar
      const rutasUnicas = new Set<string>()
      const vehiculosConRutas: Array<{
        vehiculo: LiqVehiculoTercero
        rutasPorDia: Map<number, string>
      }> = []

      for (const vehiculo of vehiculos as LiqVehiculoTercero[]) {
        const { data: rutasProgramadas } = await sb
          .from('liq_vehiculo_rutas_programadas')
          .select('*')
          .eq('vehiculo_tercero_id', vehiculo.id)
          .eq('activo', true)

        if (!rutasProgramadas || rutasProgramadas.length === 0) continue

        const rutasPorDia = new Map<number, string>()
        for (const rp of rutasProgramadas) {
          rutasPorDia.set(rp.dia_semana, rp.ruta_id)
          rutasUnicas.add(rp.ruta_id)
        }

        vehiculosConRutas.push({ vehiculo, rutasPorDia })
      }

      // Paso 2: Obtener costos de planificación para todas las rutas
      // Incluye peajes_ciclo y frecuencia para cálculos correctos
      const datosPorRuta = new Map<string, DatosRutaPlanificacion>()

      if (escenarioId && rutasUnicas.size > 0) {
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
      }

      // Paso 3: Generar viajes con costos asignados
      const viajesCreados: LiqViajeEjecutado[] = []

      // Determinar número de semana dentro de la quincena (1 o 2)
      const getSemanaQuincena = (fecha: Date, fechaInicioQuincena: Date): number => {
        const diffDias = Math.floor(
          (fecha.getTime() - fechaInicioQuincena.getTime()) / (1000 * 60 * 60 * 24)
        )
        return diffDias < 7 ? 1 : 2
      }

      const fechaInicioDate = new Date(fechaInicio + 'T00:00:00')

      for (const { vehiculo, rutasPorDia } of vehiculosConRutas) {
        const inicio = new Date(fechaInicio + 'T00:00:00')
        const fin = new Date(fechaFin + 'T00:00:00')

        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
          // Convertir día de JS (0=Dom) a día ISO (1=Lun, 7=Dom)
          const diaJS = fecha.getDay()
          const diaISO = diaJS === 0 ? 7 : diaJS

          // Verificar si hay ruta para este día
          const rutaProgramadaId = rutasPorDia.get(diaISO)
          if (!rutaProgramadaId) continue

          // Formatear fecha como YYYY-MM-DD
          const fechaStr = fecha.toISOString().split('T')[0]

          // Verificar si ya existe viaje para esta fecha y vehículo
          const { data: existente } = await sb
            .from('liq_viajes_ejecutados')
            .select('id')
            .eq('quincena_id', quincenaId)
            .eq('vehiculo_tercero_id', vehiculo.id)
            .eq('fecha', fechaStr)
            .single()

          if (existente) continue // Ya existe, saltar

          // Buscar costos del día desde la planificación
          let costoCombustible = 0
          let costoPeajes = 0
          let costoAdicionales = 0 // Se asignará como flete_adicional
          let costoPernocta = 0
          let requierePernocta = false
          let nochesPernocta = 0
          let kmRecorridos = 0

          const datosRuta = datosPorRuta.get(rutaProgramadaId)
          if (datosRuta) {
            const diaNombre = DIAS_NOMBRE[diaISO]

            // FIX 1: Para frecuencia semanal, ignorar número de semana
            // El ciclo se repite cada semana, así que buscamos solo por día
            const costoDia = datosRuta.costos.find((c) => c.dia === diaNombre)

            if (costoDia) {
              // FIX 5: Guardar km recorridos
              kmRecorridos = costoDia.km_total || 0

              costoCombustible = costoDia.combustible || 0
              costoAdicionales = costoDia.adicionales || 0

              // FIX 4: Pernocta al 50% (solo el conductor, el copiloto no va con terceros)
              costoPernocta = Math.round((costoDia.pernocta || 0) / 2)
              requierePernocta = costoPernocta > 0
              nochesPernocta = requierePernocta ? 1 : 0

              // FIX 2: Peajes distribuidos proporcionalmente entre días del ciclo
              // peajes_ciclo es el total del ciclo, lo dividimos entre la cantidad de días
              const diasCiclo = datosRuta.costos.length || 1
              costoPeajes = Math.round(datosRuta.peajesCiclo / diasCiclo)
            }
          }

          const costoTotal = costoCombustible + costoPeajes + costoAdicionales + costoPernocta

          // Crear viaje con costos asignados
          const { data: nuevoViaje, error: insertError } = await sb
            .from('liq_viajes_ejecutados')
            .insert({
              quincena_id: quincenaId,
              vehiculo_tercero_id: vehiculo.id,
              fecha: fechaStr,
              ruta_programada_id: rutaProgramadaId,
              estado: 'pendiente',
              costo_combustible: costoCombustible,
              costo_peajes: costoPeajes,
              costo_flete_adicional: costoAdicionales,
              costo_pernocta: costoPernocta,
              requiere_pernocta: requierePernocta,
              noches_pernocta: nochesPernocta,
              km_recorridos: kmRecorridos,
              costo_total: costoTotal,
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error al crear viaje:', insertError)
            continue
          }

          viajesCreados.push(nuevoViaje as LiqViajeEjecutado)
        }
      }

      return viajesCreados
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['viajes-ejecutados', variables.quincenaId] })
    },
  })
}
