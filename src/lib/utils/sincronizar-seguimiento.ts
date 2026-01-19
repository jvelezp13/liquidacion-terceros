import { createClient } from '@/lib/supabase/client'
import type { LiquidacionConDeducciones } from '@/lib/hooks/use-liquidaciones'
import type { LiqQuincena } from '@/types/database.types'

// Tipo para ejecución de rubros
interface EjecucionRubro {
  escenario_id: string
  mes: number
  tipo_rubro: string
  item_id: string
  item_tipo: string
  valor_real: number
  notas?: string
}

// Obtener el mes desde una quincena
export function getMesDesdeQuincena(quincena: LiqQuincena): number {
  return quincena.mes
}

// Sincronizar liquidación con seguimiento de PlaneacionLogi
export async function sincronizarConSeguimiento(
  liquidaciones: LiquidacionConDeducciones[],
  quincena: LiqQuincena
): Promise<{ success: boolean; message: string; count: number }> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const mes = getMesDesdeQuincena(quincena)
  const sufijo = quincena.quincena === 1 ? '1ra' : '2da'
  let count = 0

  try {
    for (const liq of liquidaciones) {
      const vehiculo = liq.vehiculo_tercero
      if (!vehiculo) continue

      // Obtener el escenario_id del vehículo original
      const { data: vehiculoOriginal, error: vehiculoError } = await sb
        .from('vehiculos')
        .select('escenario_id')
        .eq('id', vehiculo.vehiculo_id)
        .single()

      if (vehiculoError || !vehiculoOriginal) continue

      const escenarioId = vehiculoOriginal.escenario_id

      // Verificar si ya existe un registro para este vehículo/mes
      const { data: existente } = await sb
        .from('ejecucion_rubros')
        .select('id, valor_real')
        .eq('escenario_id', escenarioId)
        .eq('mes', mes)
        .eq('tipo_rubro', 'vehiculos')
        .eq('item_id', vehiculo.vehiculo_id)
        .single()

      const notas = `Liquidacion ${sufijo} Q ${quincena.mes}/${quincena.año} - ${vehiculo.placa}`

      if (existente) {
        // Si es la primera quincena, reemplazar el valor
        // Si es la segunda quincena, sumar al valor existente
        let nuevoValor = liq.total_a_pagar
        if (quincena.quincena === 2) {
          // Sumar a lo existente (asumiendo que la primera quincena ya se registró)
          nuevoValor = existente.valor_real + liq.total_a_pagar
        }

        const { error: updateError } = await sb
          .from('ejecucion_rubros')
          .update({
            valor_real: nuevoValor,
            notas: `${existente.valor_real > 0 ? 'Acumulado ' : ''}${notas}`,
          })
          .eq('id', existente.id)

        if (!updateError) count++
      } else {
        // Insertar nuevo registro
        const { error: insertError } = await sb
          .from('ejecucion_rubros')
          .insert({
            escenario_id: escenarioId,
            mes,
            tipo_rubro: 'vehiculos',
            item_id: vehiculo.vehiculo_id,
            item_tipo: 'vehiculo',
            valor_real: liq.total_a_pagar,
            notas,
          })

        if (!insertError) count++
      }
    }

    return {
      success: true,
      message: `Sincronizados ${count} registros con seguimiento`,
      count,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
      count: 0,
    }
  }
}

// Verificar estado de sincronización
export async function verificarSincronizacion(
  liquidaciones: LiquidacionConDeducciones[],
  quincena: LiqQuincena
): Promise<{ sincronizados: number; pendientes: number }> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const mes = getMesDesdeQuincena(quincena)
  let sincronizados = 0
  let pendientes = 0

  for (const liq of liquidaciones) {
    const vehiculo = liq.vehiculo_tercero
    if (!vehiculo) continue

    const { data: vehiculoOriginal } = await sb
      .from('vehiculos')
      .select('escenario_id')
      .eq('id', vehiculo.vehiculo_id)
      .single()

    if (!vehiculoOriginal) {
      pendientes++
      continue
    }

    const { data: existente } = await sb
      .from('ejecucion_rubros')
      .select('id')
      .eq('escenario_id', vehiculoOriginal.escenario_id)
      .eq('mes', mes)
      .eq('tipo_rubro', 'vehiculos')
      .eq('item_id', vehiculo.vehiculo_id)
      .single()

    if (existente) {
      sincronizados++
    } else {
      pendientes++
    }
  }

  return { sincronizados, pendientes }
}

// Hook para sincronización
export function useSincronizarSeguimiento() {
  const sincronizar = async (
    liquidaciones: LiquidacionConDeducciones[],
    quincena: LiqQuincena
  ) => {
    return sincronizarConSeguimiento(liquidaciones, quincena)
  }

  const verificar = async (
    liquidaciones: LiquidacionConDeducciones[],
    quincena: LiqQuincena
  ) => {
    return verificarSincronizacion(liquidaciones, quincena)
  }

  return { sincronizar, verificar }
}
