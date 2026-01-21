'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  LiqViajeEjecutado,
  LiqVehiculoTercero,
  RutaLogistica,
  EstadoViaje,
} from '@/types/database.types'

// Tipo extendido con detalles
export interface ViajeEjecutadoConDetalles extends LiqViajeEjecutado {
  vehiculo_tercero: LiqVehiculoTercero & {
    placa: string
    conductor_nombre: string | null
  }
  ruta?: RutaLogistica
}

// Tipo para crear/actualizar viaje
export interface UpsertViajeInput {
  quincena_id: string
  vehiculo_tercero_id: string
  fecha: string
  ruta_programada_id?: string | null
  estado?: EstadoViaje
  costo_combustible?: number
  costo_peajes?: number
  costo_flete_adicional?: number
  costo_pernocta?: number
  requiere_pernocta?: boolean
  noches_pernocta?: number
  notas?: string
}

// Estados de viaje con labels
export const estadosViaje = [
  { value: 'pendiente', label: 'Pendiente', color: 'secondary' },
  { value: 'ejecutado', label: 'Ejecutado', color: 'default' },
  { value: 'parcial', label: 'Parcial', color: 'warning' },
  { value: 'no_ejecutado', label: 'No ejecutado', color: 'destructive' },
  { value: 'variacion', label: 'Variación', color: 'outline' },
]

export function getEstadoViajeLabel(estado: string) {
  return estadosViaje.find((e) => e.value === estado)?.label || estado
}

// Hook para obtener viajes de una quincena
export function useViajesQuincena(quincenaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-ejecutados', quincenaId],
    queryFn: async (): Promise<ViajeEjecutadoConDetalles[]> => {
      if (!quincenaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener viajes de la quincena
      const { data: viajes, error } = await sb
        .from('liq_viajes_ejecutados')
        .select('*')
        .eq('quincena_id', quincenaId)
        .order('fecha')
        .order('vehiculo_tercero_id')

      if (error) throw error
      if (!viajes || viajes.length === 0) return []

      // Obtener detalles de cada viaje
      const result = await Promise.all(
        (viajes as LiqViajeEjecutado[]).map(async (viaje) => {
          // Obtener vehículo tercero
          const { data: vehiculoTercero } = await sb
            .from('liq_vehiculos_terceros')
            .select('*')
            .eq('id', viaje.vehiculo_tercero_id)
            .single()

          // Obtener ruta si hay ruta_programada_id (ahora es directamente el ID de rutas_logisticas)
          let ruta = null
          if (viaje.ruta_programada_id) {
            const { data: rutaData } = await sb
              .from('rutas_logisticas')
              .select('*')
              .eq('id', viaje.ruta_programada_id)
              .single()

            ruta = rutaData as RutaLogistica
          }

          return {
            ...viaje,
            vehiculo_tercero: vehiculoTercero as LiqVehiculoTercero & {
              placa: string
              conductor_nombre: string | null
            },
            ruta: ruta || undefined,
          }
        })
      )

      return result
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

// Hook para obtener viajes por fecha
export function useViajesPorFecha(quincenaId: string | undefined, fecha: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['viajes-ejecutados', quincenaId, 'fecha', fecha],
    queryFn: async (): Promise<ViajeEjecutadoConDetalles[]> => {
      if (!quincenaId || !fecha) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      const { data: viajes, error } = await sb
        .from('liq_viajes_ejecutados')
        .select('*')
        .eq('quincena_id', quincenaId)
        .eq('fecha', fecha)
        .order('vehiculo_tercero_id')

      if (error) throw error
      if (!viajes || viajes.length === 0) return []

      // Obtener detalles
      const result = await Promise.all(
        (viajes as LiqViajeEjecutado[]).map(async (viaje) => {
          const { data: vehiculoTercero } = await sb
            .from('liq_vehiculos_terceros')
            .select('*')
            .eq('id', viaje.vehiculo_tercero_id)
            .single()

          let ruta = null
          if (viaje.ruta_programada_id) {
            const { data: rutaData } = await sb
              .from('rutas_logisticas')
              .select('*')
              .eq('id', viaje.ruta_programada_id)
              .single()

            ruta = rutaData as RutaLogistica
          }

          return {
            ...viaje,
            vehiculo_tercero: vehiculoTercero as LiqVehiculoTercero & {
              placa: string
              conductor_nombre: string | null
            },
            ruta: ruta || undefined,
          }
        })
      )

      return result
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['viajes-ejecutados', variables.quincenaId] })
    },
  })
}

// Hook para eliminar viaje
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['viajes-ejecutados', variables.quincenaId] })
    },
  })
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
    }: {
      quincenaId: string
      fechaInicio: string
      fechaFin: string
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

      const viajesCreados: LiqViajeEjecutado[] = []

      // Para cada vehículo, obtener sus rutas programadas y generar viajes
      for (const vehiculo of vehiculos as LiqVehiculoTercero[]) {
        // Obtener rutas programadas del vehículo
        const { data: rutasProgramadas } = await sb
          .from('liq_vehiculo_rutas_programadas')
          .select('*')
          .eq('vehiculo_tercero_id', vehiculo.id)
          .eq('activo', true)

        if (!rutasProgramadas || rutasProgramadas.length === 0) continue

        // Crear mapa de día -> ruta_id (la ruta logística real)
        const rutasPorDia = new Map<number, string>()
        for (const rp of rutasProgramadas) {
          rutasPorDia.set(rp.dia_semana, rp.ruta_id)
        }

        // Iterar por cada día del periodo
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

          // Crear viaje
          const { data: nuevoViaje, error: insertError } = await sb
            .from('liq_viajes_ejecutados')
            .insert({
              quincena_id: quincenaId,
              vehiculo_tercero_id: vehiculo.id,
              fecha: fechaStr,
              ruta_programada_id: rutaProgramadaId,
              estado: 'pendiente',
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
