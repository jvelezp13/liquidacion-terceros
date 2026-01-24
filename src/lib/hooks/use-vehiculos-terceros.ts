'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type {
  LiqVehiculoTercero,
  LiqVehiculoTerceroConDetalles,
  Vehiculo,
  VehiculoCostos,
  LiqContratista
} from '@/types'

// Tipo para crear vínculo vehículo-contratista
export interface CreateVehiculoTerceroInput {
  vehiculo_id?: string | null  // Opcional para vehículos esporádicos
  contratista_id: string
  placa: string
  conductor_nombre?: string
  conductor_telefono?: string
  conductor_documento?: string
  notas?: string
  // Campos para vehículos esporádicos
  modalidad_costo?: 'flete_fijo' | 'por_viaje'
  flete_mensual?: number
  costo_por_viaje?: number
}

// Tipo para actualizar vínculo
export interface UpdateVehiculoTerceroInput extends Partial<Omit<CreateVehiculoTerceroInput, 'vehiculo_id'>> {
  activo?: boolean
  modalidad_costo?: 'flete_fijo' | 'por_viaje'
  flete_mensual?: number
  costo_por_viaje?: number
}

// Hook para obtener vehículos de Planeación con esquema 'tercero' (sin vincular)
export function useVehiculosTercerosSinVincular() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['vehiculos-terceros-sin-vincular', escenario?.id],
    queryFn: async (): Promise<(Vehiculo & { costos: VehiculoCostos | null })[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener vehículos con esquema 'tercero' y sus costos en una sola query
      const { data: vehiculos, error: vehiculosError } = await sb
        .from('vehiculos')
        .select('*, costos:vehiculos_costos(*)')
        .eq('escenario_id', escenario.id)
        .eq('esquema', 'tercero')
        .eq('activo', true)
        .order('nombre')

      if (vehiculosError) throw vehiculosError

      // Obtener vehículos ya vinculados
      const { data: vinculados, error: vinculadosError } = await sb
        .from('liq_vehiculos_terceros')
        .select('vehiculo_id')

      if (vinculadosError) throw vinculadosError

      const vinculadosIds = new Set((vinculados || []).map((v: { vehiculo_id: string }) => v.vehiculo_id))

      // Filtrar solo los no vinculados y mapear costos
      type VehiculoConCostos = Vehiculo & { costos: VehiculoCostos[] | null }
      const result = ((vehiculos || []) as VehiculoConCostos[])
        .filter((v) => !vinculadosIds.has(v.id))
        .map((v) => ({
          ...v,
          costos: (v.costos?.[0] || null) as VehiculoCostos | null,
        }))

      return result
    },
    enabled: !!escenario?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para obtener todos los vehículos terceros vinculados con detalles
export function useVehiculosTerceros() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['vehiculos-terceros', escenario?.id],
    queryFn: async (): Promise<LiqVehiculoTerceroConDetalles[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener vehículos terceros con todos los detalles en una sola query usando joins
      const { data: vinculados, error: vinculadosError } = await sb
        .from('liq_vehiculos_terceros')
        .select(`
          *,
          contratista:liq_contratistas(*),
          vehiculo:vehiculos(*, costos:vehiculos_costos(*))
        `)
        .eq('activo', true)

      if (vinculadosError) throw vinculadosError

      if (!vinculados || vinculados.length === 0) return []

      // Mapear resultados al tipo esperado
      type VinculadoConJoins = LiqVehiculoTercero & {
        contratista: LiqContratista | null
        vehiculo: (Vehiculo & { costos: VehiculoCostos[] | null }) | null
      }

      const result = (vinculados as VinculadoConJoins[])
        .filter((vt) => vt.contratista !== null)
        .filter((vt) => {
          // Para vehículos normales, verificar que pertenezcan al escenario
          if (vt.vehiculo_id && vt.vehiculo) {
            return vt.vehiculo.escenario_id === escenario.id
          }
          // Vehículos esporádicos (sin vehiculo_id) siempre pasan
          return true
        })
        .map((vt) => ({
          ...vt,
          vehiculo: vt.vehiculo as Vehiculo | null,
          contratista: vt.contratista as LiqContratista,
          vehiculo_costos: (vt.vehiculo?.costos?.[0] || null) as VehiculoCostos | null,
        }))

      return result
    },
    enabled: !!escenario?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para obtener un vehículo tercero por ID
export function useVehiculoTercero(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['vehiculo-tercero', id],
    queryFn: async (): Promise<LiqVehiculoTerceroConDetalles | null> => {
      if (!id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener todo en una sola query con joins
      const { data: vt, error } = await sb
        .from('liq_vehiculos_terceros')
        .select(`
          *,
          contratista:liq_contratistas(*),
          vehiculo:vehiculos(*, costos:vehiculos_costos(*))
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      type VinculadoConJoins = LiqVehiculoTercero & {
        contratista: LiqContratista | null
        vehiculo: (Vehiculo & { costos: VehiculoCostos[] | null }) | null
      }

      const data = vt as VinculadoConJoins

      return {
        ...data,
        vehiculo: data.vehiculo as Vehiculo | null,
        contratista: data.contratista as LiqContratista,
        vehiculo_costos: (data.vehiculo?.costos?.[0] || undefined) as VehiculoCostos | undefined,
      }
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para vincular un vehículo a un contratista
export function useCreateVehiculoTercero() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateVehiculoTerceroInput): Promise<LiqVehiculoTercero> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_vehiculos_terceros')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as LiqVehiculoTercero
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos-terceros'] })
      queryClient.invalidateQueries({ queryKey: ['vehiculos-terceros-sin-vincular'] })
    },
  })
}

// Hook para actualizar un vehículo tercero
export function useUpdateVehiculoTercero() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: UpdateVehiculoTerceroInput & { id: string }): Promise<LiqVehiculoTercero> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_vehiculos_terceros')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqVehiculoTercero
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos-terceros'] })
      queryClient.invalidateQueries({ queryKey: ['vehiculo-tercero', data.id] })
    },
  })
}

// Hook para desvincular un vehículo
export function useDeleteVehiculoTercero() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('liq_vehiculos_terceros')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehiculos-terceros'] })
      queryClient.invalidateQueries({ queryKey: ['vehiculos-terceros-sin-vincular'] })
    },
  })
}

// Hook para obtener vehículos de un contratista específico
export function useVehiculosPorContratista(contratistaId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['vehiculos-por-contratista', contratistaId],
    queryFn: async (): Promise<LiqVehiculoTerceroConDetalles[]> => {
      if (!contratistaId) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener todo en una sola query con joins
      const { data: vinculados, error } = await sb
        .from('liq_vehiculos_terceros')
        .select(`
          *,
          contratista:liq_contratistas(*),
          vehiculo:vehiculos(*, costos:vehiculos_costos(*))
        `)
        .eq('contratista_id', contratistaId)
        .eq('activo', true)

      if (error) throw error

      if (!vinculados || vinculados.length === 0) return []

      // Mapear resultados al tipo esperado
      type VinculadoConJoins = LiqVehiculoTercero & {
        contratista: LiqContratista | null
        vehiculo: (Vehiculo & { costos: VehiculoCostos[] | null }) | null
      }

      const result = (vinculados as VinculadoConJoins[]).map((vt) => ({
        ...vt,
        vehiculo: vt.vehiculo as Vehiculo | null,
        contratista: vt.contratista as LiqContratista,
        vehiculo_costos: (vt.vehiculo?.costos?.[0] || undefined) as VehiculoCostos | undefined,
      }))

      return result
    },
    enabled: !!contratistaId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}
