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
} from '@/types/database.types'

// Tipo para crear vínculo vehículo-contratista
export interface CreateVehiculoTerceroInput {
  vehiculo_id: string
  contratista_id: string
  placa: string
  conductor_nombre?: string
  conductor_telefono?: string
  conductor_documento?: string
  notas?: string
}

// Tipo para actualizar vínculo
export interface UpdateVehiculoTerceroInput extends Partial<Omit<CreateVehiculoTerceroInput, 'vehiculo_id'>> {
  activo?: boolean
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

      // Obtener vehículos con esquema 'tercero'
      const { data: vehiculos, error: vehiculosError } = await sb
        .from('vehiculos')
        .select('*')
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

      // Filtrar solo los no vinculados
      const sinVincular = ((vehiculos || []) as Vehiculo[]).filter((v) => !vinculadosIds.has(v.id))

      // Obtener costos de cada vehículo
      const result = await Promise.all(
        sinVincular.map(async (vehiculo) => {
          const { data: costos } = await sb
            .from('vehiculos_costos')
            .select('*')
            .eq('vehiculo_id', vehiculo.id)
            .single()

          return { ...vehiculo, costos: (costos || null) as VehiculoCostos | null }
        })
      )

      return result
    },
    enabled: !!escenario?.id,
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

      // Obtener vehículos terceros vinculados
      const { data: vinculados, error: vinculadosError } = await sb
        .from('liq_vehiculos_terceros')
        .select('*')
        .eq('activo', true)

      if (vinculadosError) throw vinculadosError

      if (!vinculados || vinculados.length === 0) return []

      // Obtener detalles de cada vehículo
      const result = await Promise.all(
        (vinculados as LiqVehiculoTercero[]).map(async (vt) => {
          // Obtener vehículo de Planeación
          const { data: vehiculo } = await sb
            .from('vehiculos')
            .select('*')
            .eq('id', vt.vehiculo_id)
            .eq('escenario_id', escenario.id)
            .single()

          if (!vehiculo) return null

          // Obtener contratista
          const { data: contratista } = await sb
            .from('liq_contratistas')
            .select('*')
            .eq('id', vt.contratista_id)
            .single()

          if (!contratista) return null

          // Obtener costos del vehículo
          const { data: costos } = await sb
            .from('vehiculos_costos')
            .select('*')
            .eq('vehiculo_id', vt.vehiculo_id)
            .single()

          return {
            ...vt,
            vehiculo: vehiculo as Vehiculo,
            contratista: contratista as LiqContratista,
            vehiculo_costos: (costos || undefined) as VehiculoCostos | undefined,
          } as LiqVehiculoTerceroConDetalles
        })
      )

      return result.filter((v): v is LiqVehiculoTerceroConDetalles => v !== null)
    },
    enabled: !!escenario?.id,
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

      const { data: vt, error } = await sb
        .from('liq_vehiculos_terceros')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Obtener detalles
      const { data: vehiculo } = await sb
        .from('vehiculos')
        .select('*')
        .eq('id', (vt as LiqVehiculoTercero).vehiculo_id)
        .single()

      const { data: contratista } = await sb
        .from('liq_contratistas')
        .select('*')
        .eq('id', (vt as LiqVehiculoTercero).contratista_id)
        .single()

      const { data: costos } = await sb
        .from('vehiculos_costos')
        .select('*')
        .eq('vehiculo_id', (vt as LiqVehiculoTercero).vehiculo_id)
        .single()

      return {
        ...(vt as LiqVehiculoTercero),
        vehiculo: vehiculo as Vehiculo,
        contratista: contratista as LiqContratista,
        vehiculo_costos: (costos || undefined) as VehiculoCostos | undefined,
      }
    },
    enabled: !!id,
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

      const { data: vinculados, error } = await sb
        .from('liq_vehiculos_terceros')
        .select('*')
        .eq('contratista_id', contratistaId)
        .eq('activo', true)

      if (error) throw error

      if (!vinculados || vinculados.length === 0) return []

      const result = await Promise.all(
        (vinculados as LiqVehiculoTercero[]).map(async (vt) => {
          const { data: vehiculo } = await sb
            .from('vehiculos')
            .select('*')
            .eq('id', vt.vehiculo_id)
            .single()

          const { data: contratista } = await sb
            .from('liq_contratistas')
            .select('*')
            .eq('id', vt.contratista_id)
            .single()

          const { data: costos } = await sb
            .from('vehiculos_costos')
            .select('*')
            .eq('vehiculo_id', vt.vehiculo_id)
            .single()

          return {
            ...vt,
            vehiculo: vehiculo as Vehiculo,
            contratista: contratista as LiqContratista,
            vehiculo_costos: (costos || undefined) as VehiculoCostos | undefined,
          } as LiqVehiculoTerceroConDetalles
        })
      )

      return result
    },
    enabled: !!contratistaId,
  })
}
