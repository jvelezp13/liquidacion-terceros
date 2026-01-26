'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEscenarioActivo } from './use-escenario-activo'
import type { LiqQuincena, EstadoQuincena } from '@/types'

// Tipo para crear un periodo (solo año y fechas, numero_periodo se autogenera)
export interface CreateQuincenaInput {
  año: number
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
        .order('numero_periodo', { ascending: false })

      if (error) throw error
      return (data || []) as LiqQuincena[]
    },
    enabled: !!escenario?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
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
        .order('numero_periodo', { ascending: false })

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
        .order('numero_periodo', { ascending: false })
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

// Hook para crear un periodo (numero_periodo se autogenera via trigger)
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
          año: input.año,
          fecha_inicio: input.fecha_inicio,
          fecha_fin: input.fecha_fin,
          notas: input.notas,
          escenario_id: escenario.id,
          estado: 'borrador',
          // numero_periodo se autogenera via trigger
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any

      // Obtener estado actual de la quincena
      const { data: quincenaActual, error: fetchError } = await sb
        .from('liq_quincenas')
        .select('estado, fecha_inicio')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const estadoAnterior = (quincenaActual as { estado: EstadoQuincena; fecha_inicio: string }).estado
      // Derivar mes de fecha_inicio
      const fechaInicio = new Date((quincenaActual as { fecha_inicio: string }).fecha_inicio + 'T00:00:00')
      const mesNumero = fechaInicio.getMonth() + 1

      const updateData: Record<string, unknown> = { estado }

      // Manejar transiciones de estado
      if (estadoAnterior === 'validado' && estado === 'borrador') {
        // REVERSION: Validado -> Borrador
        // Limpiar fecha_validacion y eliminar liquidaciones
        updateData.fecha_validacion = null

        // Eliminar liquidaciones existentes
        const { error: deleteLiqError } = await sb
          .from('liq_liquidaciones')
          .delete()
          .eq('quincena_id', id)

        if (deleteLiqError) {
          console.error('Error eliminando liquidaciones:', deleteLiqError)
        }

      } else if (estadoAnterior === 'liquidado' && estado === 'validado') {
        // REVERSION: Liquidado -> Validado
        // Limpiar fecha_liquidacion, poner liquidaciones en borrador, revertir sincronizacion
        updateData.fecha_liquidacion = null

        // Cambiar liquidaciones a estado borrador
        const { error: updateLiqError } = await sb
          .from('liq_liquidaciones')
          .update({ estado: 'borrador' })
          .eq('quincena_id', id)

        if (updateLiqError) {
          console.error('Error actualizando liquidaciones:', updateLiqError)
        }

        // Revertir sincronizacion con ejecucion_rubros
        // Obtener los vehiculos de las liquidaciones para saber qué eliminar
        const { data: liquidaciones } = await sb
          .from('liq_liquidaciones')
          .select(`
            vehiculo_tercero_id,
            liq_vehiculos_terceros!inner(vehiculo_id)
          `)
          .eq('quincena_id', id)

        if (liquidaciones && liquidaciones.length > 0) {
          // Obtener el escenario_id del primer vehiculo
          const primerVehiculoId = (liquidaciones[0] as { liq_vehiculos_terceros: { vehiculo_id: string } }).liq_vehiculos_terceros.vehiculo_id

          const { data: vehiculoData } = await sb
            .from('vehiculos')
            .select('escenario_id')
            .eq('id', primerVehiculoId)
            .single()

          if (vehiculoData) {
            const escenarioId = (vehiculoData as { escenario_id: string }).escenario_id

            // Obtener todos los vehiculo_id para eliminar sus registros
            const vehiculoIds = liquidaciones.map(
              (l: { liq_vehiculos_terceros: { vehiculo_id: string } }) =>
                l.liq_vehiculos_terceros.vehiculo_id
            )

            // Eliminar registros de ejecucion_rubros para estos vehiculos en este mes
            const { error: deleteEjecError } = await sb
              .from('ejecucion_rubros')
              .delete()
              .eq('escenario_id', escenarioId)
              .eq('mes', mesNumero)
              .eq('tipo_rubro', 'vehiculos')
              .in('item_id', vehiculoIds)

            if (deleteEjecError) {
              console.error('Error eliminando ejecucion_rubros:', deleteEjecError)
            }
          }
        }

      } else {
        // Transiciones hacia adelante: agregar timestamps
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
      }

      // Actualizar estado de la quincena
      const { data, error } = await sb
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
      queryClient.invalidateQueries({ queryKey: ['liquidaciones'] })
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

// Función para verificar si hay traslape de fechas con periodos existentes
export async function verificarTraslape(
  escenarioId: string,
  fechaInicio: string,
  fechaFin: string,
  excluirId?: string // Para edición: excluir el periodo actual
): Promise<{ hayTraslape: boolean; periodoConflicto?: string }> {
  const supabase = createClient()

  // Buscar periodos que se traslapen
  // Traslape: nueva_fecha_inicio <= existente.fecha_fin AND nueva_fecha_fin >= existente.fecha_inicio
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('liq_quincenas')
    .select('id, fecha_inicio, fecha_fin, año, numero_periodo')
    .eq('escenario_id', escenarioId)
    .lte('fecha_inicio', fechaFin)
    .gte('fecha_fin', fechaInicio)

  // Si estamos editando, excluir el periodo actual
  if (excluirId) {
    query = query.neq('id', excluirId)
  }

  const { data, error } = await query.limit(1)

  if (error) {
    console.error('Error verificando traslape:', error)
    throw error
  }

  if (data && data.length > 0) {
    const conflicto = data[0] as {
      fecha_inicio: string
      fecha_fin: string
      año: number
      numero_periodo: number
    }
    return {
      hayTraslape: true,
      periodoConflicto: `Periodo ${conflicto.numero_periodo}/${conflicto.año} (${conflicto.fecha_inicio} al ${conflicto.fecha_fin})`,
    }
  }

  return { hayTraslape: false }
}

// Utilidad para obtener el nombre del mes
export function getNombreMes(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || ''
}

// Utilidad para formatear el nombre de un periodo
export function formatearQuincena(quincena: LiqQuincena): string {
  return `Periodo ${quincena.numero_periodo} - ${quincena.año}`
}

// Utilidad para obtener fechas por defecto (hoy + 13 dias = 2 semanas)
export function calcularFechasPeriodo(): { fecha_inicio: string; fecha_fin: string } {
  const hoy = new Date()
  const fin = new Date(hoy)
  fin.setDate(fin.getDate() + 13) // 14 dias total (hoy + 13)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  return {
    fecha_inicio: formatDate(hoy),
    fecha_fin: formatDate(fin),
  }
}

// Utilidad para calcular duracion en dias
export function calcularDuracionPeriodo(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio + 'T00:00:00')
  const fin = new Date(fechaFin + 'T00:00:00')
  const diffTime = Math.abs(fin.getTime() - inicio.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 para incluir ambos dias
}

// Utilidad para obtener el mes desde una quincena (derivado de fecha_inicio)
export function getMesDesdeQuincena(quincena: LiqQuincena): number {
  const fechaInicio = new Date(quincena.fecha_inicio + 'T00:00:00')
  return fechaInicio.getMonth() + 1
}
