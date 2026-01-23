'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { LiqViajeEjecutado, LiqVehiculoTercero } from '@/types'
import {
  calcularCostosViaje,
  convertirDiaJSaISO,
  type CostoDiaPlanificacion,
  type DatosRutaPlanificacion,
} from '@/lib/utils/generar-viajes'

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

      for (const { vehiculo, rutasPorDia } of vehiculosConRutas) {
        const inicio = new Date(fechaInicio + 'T00:00:00')
        const fin = new Date(fechaFin + 'T00:00:00')

        for (let fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
          // Convertir día de JS (0=Dom) a día ISO (1=Lun, 7=Dom)
          const diaISO = convertirDiaJSaISO(fecha.getDay())

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

          // Calcular costos usando función pura
          const datosRuta = datosPorRuta.get(rutaProgramadaId)
          const costos = calcularCostosViaje(datosRuta, diaISO)

          // Crear viaje con costos asignados
          const { data: nuevoViaje, error: insertError } = await sb
            .from('liq_viajes_ejecutados')
            .insert({
              quincena_id: quincenaId,
              vehiculo_tercero_id: vehiculo.id,
              fecha: fechaStr,
              ruta_programada_id: rutaProgramadaId,
              estado: 'pendiente',
              costo_combustible: costos.costoCombustible,
              costo_peajes: costos.costoPeajes,
              costo_flete_adicional: costos.costoAdicionales,
              costo_pernocta: costos.costoPernocta,
              requiere_pernocta: costos.requierePernocta,
              noches_pernocta: costos.nochesPernocta,
              km_recorridos: costos.kmRecorridos,
              costo_total: costos.costoTotal,
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
