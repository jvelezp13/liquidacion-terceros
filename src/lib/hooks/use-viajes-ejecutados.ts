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
          ruta_programada:rutas_logisticas!liq_viajes_ejecutados_ruta_programada_id_fkey(*),
          ruta_variacion:rutas_logisticas!liq_viajes_ejecutados_ruta_variacion_id_fkey(*)
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
          ruta_programada:rutas_logisticas!liq_viajes_ejecutados_ruta_programada_id_fkey(*),
          ruta_variacion:rutas_logisticas!liq_viajes_ejecutados_ruta_variacion_id_fkey(*)
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

// Re-export para mantener compatibilidad
export { useGenerarViajesDesdeRutas } from './use-generar-viajes'
