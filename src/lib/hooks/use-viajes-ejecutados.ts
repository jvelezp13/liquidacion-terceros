'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  LiqViajeEjecutado,
  LiqVehiculoTercero,
  RutaLogistica,
  EstadoViaje,
} from '@/types'

// Tipo extendido con detalles
export interface ViajeEjecutadoConDetalles extends LiqViajeEjecutado {
  vehiculo_tercero: LiqVehiculoTercero & {
    placa: string
    conductor_nombre: string | null
    contratista?: {
      id: string
      nombre: string
    }
  }
  ruta?: RutaLogistica
  ruta_variacion?: RutaLogistica // Ruta que se ejecutó en lugar de la programada
}

// Tipo para crear/actualizar viaje
export interface UpsertViajeInput {
  quincena_id: string
  vehiculo_tercero_id: string
  fecha: string
  ruta_programada_id?: string | null
  destino?: string | null
  estado?: EstadoViaje
  costo_combustible?: number
  costo_peajes?: number
  costo_flete_adicional?: number
  costo_pernocta?: number
  requiere_pernocta?: boolean
  noches_pernocta?: number
  notas?: string
}

// Estados de viaje con labels (sin 'parcial' - eliminado)
export const estadosViaje = [
  { value: 'pendiente', label: 'Pendiente', color: 'secondary' },
  { value: 'ejecutado', label: 'Ejecutado', color: 'default' },
  { value: 'no_ejecutado', label: 'No salió', color: 'destructive' },
  { value: 'variacion', label: 'Otra ruta', color: 'outline' },
]

export function getEstadoViajeLabel(estado: string) {
  return estadosViaje.find((e) => e.value === estado)?.label || estado
}

// Hook para obtener viajes de una quincena (optimizado con joins)
export function useViajesQuincena(quincenaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-ejecutados', quincenaId],
    queryFn: async (): Promise<ViajeEjecutadoConDetalles[]> => {
      if (!quincenaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener viajes con joins - 1 query en lugar de N+1
      const { data: viajes, error } = await sb
        .from('liq_viajes_ejecutados')
        .select(`
          *,
          vehiculo_tercero:liq_vehiculos_terceros!inner(
            *,
            contratista:liq_contratistas(id, nombre),
            vehiculo:vehiculos(*)
          ),
          ruta_programada:rutas_logisticas(*),
          ruta_variacion:rutas_logisticas(*)
        `)
        .eq('quincena_id', quincenaId)
        .order('fecha')
        .order('vehiculo_tercero_id')

      if (error) throw error
      if (!viajes || viajes.length === 0) return []

      // Transformar datos al formato esperado
      return viajes.map((viaje: any) => ({
        ...viaje,
        vehiculo_tercero: viaje.vehiculo_tercero
          ? {
              ...viaje.vehiculo_tercero,
              contratista: viaje.vehiculo_tercero.contratista || undefined,
            }
          : undefined,
        ruta: viaje.ruta_programada || undefined,
        ruta_variacion: viaje.ruta_variacion || undefined,
      }))
    },
    enabled: !!quincenaId,
  })
}

// Hook para obtener viajes de un vehículo en una quincena
export function useViajesVehiculo(quincenaId: string | undefined, vehiculoTerceroId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-ejecutados', quincenaId, vehiculoTerceroId],
    queryFn: async (): Promise<LiqViajeEjecutado[]> => {
      if (!quincenaId || !vehiculoTerceroId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_viajes_ejecutados')
        .select('*')
        .eq('quincena_id', quincenaId)
        .eq('vehiculo_tercero_id', vehiculoTerceroId)
        .order('fecha')

      if (error) throw error
      return (data || []) as LiqViajeEjecutado[]
    },
    enabled: !!quincenaId && !!vehiculoTerceroId,
  })
}

// Hook para obtener viajes por fecha (optimizado con joins)
export function useViajesPorFecha(quincenaId: string | undefined, fecha: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-ejecutados', quincenaId, 'fecha', fecha],
    queryFn: async (): Promise<ViajeEjecutadoConDetalles[]> => {
      if (!quincenaId || !fecha) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener viajes con joins - 1 query en lugar de N+1
      const { data: viajes, error } = await sb
        .from('liq_viajes_ejecutados')
        .select(`
          *,
          vehiculo_tercero:liq_vehiculos_terceros!inner(
            *,
            contratista:liq_contratistas(id, nombre),
            vehiculo:vehiculos(*)
          ),
          ruta_programada:rutas_logisticas(*),
          ruta_variacion:rutas_logisticas(*)
        `)
        .eq('quincena_id', quincenaId)
        .eq('fecha', fecha)
        .order('vehiculo_tercero_id')

      if (error) throw error
      if (!viajes || viajes.length === 0) return []

      // Transformar datos al formato esperado
      return viajes.map((viaje: any) => ({
        ...viaje,
        vehiculo_tercero: viaje.vehiculo_tercero
          ? {
              ...viaje.vehiculo_tercero,
              contratista: viaje.vehiculo_tercero.contratista || undefined,
            }
          : undefined,
        ruta: viaje.ruta_programada || undefined,
        ruta_variacion: viaje.ruta_variacion || undefined,
      }))
    },
    enabled: !!quincenaId && !!fecha,
  })
}

// Hook para crear o actualizar viaje
export function useUpsertViaje() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpsertViajeInput): Promise<LiqViajeEjecutado> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Buscar si ya existe un viaje para esta fecha y vehículo
      const { data: existente } = await sb
        .from('liq_viajes_ejecutados')
        .select('id')
        .eq('quincena_id', input.quincena_id)
        .eq('vehiculo_tercero_id', input.vehiculo_tercero_id)
        .eq('fecha', input.fecha)
        .single()

      if (existente) {
        // Actualizar
        const { data, error } = await sb
          .from('liq_viajes_ejecutados')
          .update({
            ruta_programada_id: input.ruta_programada_id,
            destino: input.destino,
            estado: input.estado || 'pendiente',
            costo_combustible: input.costo_combustible || 0,
            costo_peajes: input.costo_peajes || 0,
            costo_flete_adicional: input.costo_flete_adicional || 0,
            costo_pernocta: input.costo_pernocta || 0,
            requiere_pernocta: input.requiere_pernocta || false,
            noches_pernocta: input.noches_pernocta || 0,
            notas: input.notas,
            costo_total:
              (input.costo_combustible || 0) +
              (input.costo_peajes || 0) +
              (input.costo_flete_adicional || 0) +
              (input.costo_pernocta || 0),
          })
          .eq('id', (existente as { id: string }).id)
          .select()
          .single()

        if (error) throw error
        return data as LiqViajeEjecutado
      } else {
        // Insertar
        const { data, error } = await sb
          .from('liq_viajes_ejecutados')
          .insert({
            ...input,
            estado: input.estado || 'pendiente',
            costo_combustible: input.costo_combustible || 0,
            costo_peajes: input.costo_peajes || 0,
            costo_flete_adicional: input.costo_flete_adicional || 0,
            costo_pernocta: input.costo_pernocta || 0,
            requiere_pernocta: input.requiere_pernocta || false,
            noches_pernocta: input.noches_pernocta || 0,
            costo_total:
              (input.costo_combustible || 0) +
              (input.costo_peajes || 0) +
              (input.costo_flete_adicional || 0) +
              (input.costo_pernocta || 0),
          })
          .select()
          .single()

        if (error) throw error
        return data as LiqViajeEjecutado
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['viajes-ejecutados', data.quincena_id] })
    },
  })
}

// Hook para actualizar estado de viaje
export function useUpdateEstadoViaje() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
      quincenaId,
    }: {
      id: string
      estado: EstadoViaje
      quincenaId: string
    }): Promise<LiqViajeEjecutado> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_viajes_ejecutados')
        .update({ estado })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqViajeEjecutado
    },
    onSuccess: (data, variables) => {
      // Actualizar cache inmediatamente para feedback visual instantáneo
      queryClient.setQueryData<ViajeEjecutadoConDetalles[]>(
        ['viajes-ejecutados', variables.quincenaId],
        (oldData) => {
          if (!oldData) return oldData
          return oldData.map((viaje) =>
            viaje.id === variables.id
              ? { ...viaje, estado: data.estado }
              : viaje
          )
        }
      )
    },
  })
}

// Hook para actualizar estado de viaje con ruta de variación
export function useUpdateEstadoViajeConVariacion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
      rutaVariacionId,
      quincenaId,
    }: {
      id: string
      estado: EstadoViaje
      rutaVariacionId: string | null
      quincenaId: string
    }): Promise<LiqViajeEjecutado> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_viajes_ejecutados')
        .update({
          estado,
          ruta_variacion_id: rutaVariacionId,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqViajeEjecutado
    },
    onSuccess: (data, variables) => {
      // Actualizar cache inmediatamente para feedback visual instantáneo
      queryClient.setQueryData<ViajeEjecutadoConDetalles[]>(
        ['viajes-ejecutados', variables.quincenaId],
        (oldData) => {
          if (!oldData) return oldData
          return oldData.map((viaje) =>
            viaje.id === variables.id
              ? {
                  ...viaje,
                  estado: data.estado,
                  ruta_variacion_id: data.ruta_variacion_id,
                }
              : viaje
          )
        }
      )
    },
  })
}

// Hook para confirmar múltiples viajes como ejecutados (batch)
export function useConfirmarViajesBatch() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      viajeIds,
      quincenaId,
    }: {
      viajeIds: string[]
      quincenaId: string
    }): Promise<LiqViajeEjecutado[]> => {
      if (viajeIds.length === 0) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_viajes_ejecutados')
        .update({ estado: 'ejecutado' })
        .in('id', viajeIds)
        .select()

      if (error) throw error
      return data as LiqViajeEjecutado[]
    },
    onSuccess: (data, variables) => {
      // Actualizar cache inmediatamente
      queryClient.setQueryData<ViajeEjecutadoConDetalles[]>(
        ['viajes-ejecutados', variables.quincenaId],
        (oldData) => {
          if (!oldData) return oldData
          const idsActualizados = new Set(variables.viajeIds)
          return oldData.map((viaje) =>
            idsActualizados.has(viaje.id)
              ? { ...viaje, estado: 'ejecutado' as EstadoViaje }
              : viaje
          )
        }
      )
    },
  })
}

// Hook para eliminar viaje (con actualización optimista)
export function useDeleteViaje() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, quincenaId }: { id: string; quincenaId: string }): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('liq_viajes_ejecutados')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    // Actualización optimista: remover inmediatamente del UI
    onMutate: async (variables) => {
      // Cancelar queries en vuelo para evitar que sobreescriban
      await queryClient.cancelQueries({ queryKey: ['viajes-ejecutados', variables.quincenaId] })

      // Guardar estado anterior para rollback si falla
      const previousViajes = queryClient.getQueryData<ViajeEjecutadoConDetalles[]>(
        ['viajes-ejecutados', variables.quincenaId]
      )

      // Remover el viaje del cache inmediatamente
      queryClient.setQueryData<ViajeEjecutadoConDetalles[]>(
        ['viajes-ejecutados', variables.quincenaId],
        (oldData) => oldData?.filter((v) => v.id !== variables.id) || []
      )

      // Retornar contexto para rollback
      return { previousViajes }
    },
    onError: (err, variables, context) => {
      // Rollback: restaurar estado anterior si falla
      if (context?.previousViajes) {
        queryClient.setQueryData(
          ['viajes-ejecutados', variables.quincenaId],
          context.previousViajes
        )
      }
    },
    onSettled: (_, __, variables) => {
      // Sincronizar con servidor al final (por si acaso)
      queryClient.invalidateQueries({ queryKey: ['viajes-ejecutados', variables.quincenaId] })
    },
  })
}

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
