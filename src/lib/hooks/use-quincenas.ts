'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type { LiqQuincena, EstadoQuincena } from '@/types/database.types'

// Tipo para crear una quincena
export interface CreateQuincenaInput {
  año: number
  mes: number
  quincena: 1 | 2
  fecha_inicio: string
  fecha_fin: string
  notas?: string
}

// Hook para obtener todas las quincenas del escenario activo
export function useQuincenas() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['quincenas', escenario?.id],
    queryFn: async (): Promise<LiqQuincena[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_quincenas')
        .select('*')
        .eq('escenario_id', escenario.id)
        .order('año', { ascending: false })
        .order('mes', { ascending: false })
        .order('quincena', { ascending: false })

      if (error) throw error
      return (data || []) as LiqQuincena[]
    },
    enabled: !!escenario?.id,
  })
}

// Hook para obtener quincenas por estado
export function useQuincenasPorEstado(estado: EstadoQuincena) {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['quincenas', escenario?.id, 'estado', estado],
    queryFn: async (): Promise<LiqQuincena[]> => {
      if (!escenario?.id) return []

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_quincenas')
        .select('*')
        .eq('escenario_id', escenario.id)
        .eq('estado', estado)
        .order('año', { ascending: false })
        .order('mes', { ascending: false })
        .order('quincena', { ascending: false })

      if (error) throw error
      return (data || []) as LiqQuincena[]
    },
    enabled: !!escenario?.id,
  })
}

// Hook para obtener la quincena actual o más reciente en borrador
export function useQuincenaActual() {
  const supabase = createClient()
  const { data: escenario } = useEscenarioActivo()

  return useQuery({
    queryKey: ['quincena-actual', escenario?.id],
    queryFn: async (): Promise<LiqQuincena | null> => {
      if (!escenario?.id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_quincenas')
        .select('*')
        .eq('escenario_id', escenario.id)
        .in('estado', ['borrador', 'validado'])
        .order('año', { ascending: false })
        .order('mes', { ascending: false })
        .order('quincena', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return data as LiqQuincena
    },
    enabled: !!escenario?.id,
  })
}

// Hook para obtener una quincena por ID
export function useQuincena(id: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['quincena', id],
    queryFn: async (): Promise<LiqQuincena | null> => {
      if (!id) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_quincenas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as LiqQuincena
    },
    enabled: !!id,
  })
}

// Hook para crear una quincena
export function useCreateQuincena() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { data: escenario } = useEscenarioActivo()

  return useMutation({
    mutationFn: async (input: CreateQuincenaInput): Promise<LiqQuincena> => {
      if (!escenario?.id) {
        throw new Error('No hay escenario activo')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_quincenas')
        .insert({
          ...input,
          escenario_id: escenario.id,
          estado: 'borrador',
        })
        .select()
        .single()

      if (error) throw error
      return data as LiqQuincena
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quincenas'] })
      queryClient.invalidateQueries({ queryKey: ['quincena-actual'] })
    },
  })
}

// Hook para cambiar el estado de una quincena
export function useUpdateEstadoQuincena() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
    }: {
      id: string
      estado: EstadoQuincena
    }): Promise<LiqQuincena> => {
      const updateData: Record<string, unknown> = { estado }

      // Agregar timestamp según el estado
      switch (estado) {
        case 'validado':
          updateData.fecha_validacion = new Date().toISOString()
          break
        case 'liquidado':
          updateData.fecha_liquidacion = new Date().toISOString()
          break
        case 'pagado':
          updateData.fecha_pago = new Date().toISOString()
          break
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('liq_quincenas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LiqQuincena
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quincenas'] })
      queryClient.invalidateQueries({ queryKey: ['quincena', data.id] })
      queryClient.invalidateQueries({ queryKey: ['quincena-actual'] })
    },
  })
}

// Hook para eliminar una quincena (solo en borrador)
export function useDeleteQuincena() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Verificar que la quincena esté en borrador
      const { data: quincena, error: fetchError } = await sb
        .from('liq_quincenas')
        .select('estado')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if ((quincena as { estado: string }).estado !== 'borrador') {
        throw new Error('Solo se pueden eliminar quincenas en estado borrador')
      }

      const { error } = await sb
        .from('liq_quincenas')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quincenas'] })
      queryClient.invalidateQueries({ queryKey: ['quincena-actual'] })
    },
  })
}

// Utilidad para calcular fechas de quincena
export function calcularFechasQuincena(año: number, mes: number, quincena: 1 | 2) {
  if (quincena === 1) {
    return {
      fecha_inicio: `${año}-${String(mes).padStart(2, '0')}-01`,
      fecha_fin: `${año}-${String(mes).padStart(2, '0')}-15`,
    }
  } else {
    // Último día del mes
    const ultimoDia = new Date(año, mes, 0).getDate()
    return {
      fecha_inicio: `${año}-${String(mes).padStart(2, '0')}-16`,
      fecha_fin: `${año}-${String(mes).padStart(2, '0')}-${ultimoDia}`,
    }
  }
}

// Utilidad para obtener el nombre del mes
export function getNombreMes(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || ''
}

// Utilidad para formatear el nombre de una quincena
export function formatearQuincena(quincena: LiqQuincena): string {
  const nombreMes = getNombreMes(quincena.mes)
  const sufijo = quincena.quincena === 1 ? '1ra' : '2da'
  return `${sufijo} Quincena ${nombreMes} ${quincena.año}`
}
