import { createClient } from '@/lib/supabase/client'
import type { LiquidacionConDeducciones } from '@/lib/hooks/use-liquidaciones'
import type { LiqQuincena } from '@/types'

// Tipo para resultado de sincronizacion
interface ResultadoSincronizacion {
  success: boolean
  message: string
  vehiculos: number
  lejanias: number
  omitidos: number
}

// Nombres de meses para el campo mes en ejecucion_rubros
const NOMBRES_MESES = [
  '', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

// Obtener el mes desde una quincena (derivado de fecha_inicio)
export function getMesDesdeQuincena(quincena: LiqQuincena): number {
  const fechaInicio = new Date(quincena.fecha_inicio + 'T00:00:00')
  return fechaInicio.getMonth() + 1
}

// Convertir numero de mes a nombre
export function getMesNombre(mesNumero: number): string {
  return NOMBRES_MESES[mesNumero] || 'enero'
}

// Verificar si una liquidacion ya fue sincronizada
async function yaFueSincronizada(
  sb: ReturnType<typeof createClient>,
  liquidacionId: string
): Promise<boolean> {
  const { data } = await (sb as any)
    .from('liq_sincronizacion_ejecucion')
    .select('id')
    .eq('liquidacion_id', liquidacionId)
    .eq('sincronizado', true)
    .single()

  return !!data
}

// Registrar sincronizacion exitosa
async function registrarSincronizacion(
  sb: ReturnType<typeof createClient>,
  params: {
    liquidacionId: string
    ejecucionRubroId: string | null
    vehiculoId: string
    escenarioId: string
    mes: string
    valorSincronizado: number
  }
): Promise<void> {
  await (sb as any)
    .from('liq_sincronizacion_ejecucion')
    .insert({
      liquidacion_id: params.liquidacionId,
      ejecucion_rubro_id: params.ejecucionRubroId,
      vehiculo_id: params.vehiculoId,
      escenario_id: params.escenarioId,
      mes: params.mes,
      valor_sincronizado: params.valorSincronizado,
      sincronizado: true,
      fecha_sincronizacion: new Date().toISOString(),
    })
}

// Sincronizar liquidacion con seguimiento de PlaneacionLogi
// Separa fletes (por vehiculo) de lejanias (agregado)
// Valida duplicados usando liq_sincronizacion_ejecucion
export async function sincronizarConSeguimiento(
  liquidaciones: LiquidacionConDeducciones[],
  quincena: LiqQuincena
): Promise<ResultadoSincronizacion> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const mes = getMesNombre(getMesDesdeQuincena(quincena))
  let vehiculosCount = 0
  let omitidosCount = 0
  let totalLejanias = 0
  let escenarioIdGlobal: string | null = null

  try {
    // 1. Sincronizar VEHICULOS (flete_base por cada vehiculo)
    for (const liq of liquidaciones) {
      const vehiculo = liq.vehiculo_tercero
      if (!vehiculo) continue

      // Verificar si esta liquidacion ya fue sincronizada
      const yaSincronizada = await yaFueSincronizada(sb, liq.id)
      if (yaSincronizada) {
        omitidosCount++
        continue
      }

      // Obtener el escenario_id del vehiculo original
      const { data: vehiculoOriginal, error: vehiculoError } = await sb
        .from('vehiculos')
        .select('escenario_id')
        .eq('id', vehiculo.vehiculo_id)
        .single()

      if (vehiculoError || !vehiculoOriginal) continue

      const escenarioId = vehiculoOriginal.escenario_id
      if (!escenarioIdGlobal) escenarioIdGlobal = escenarioId

      // Verificar si ya existe un registro para este vehiculo/mes
      const { data: existente } = await sb
        .from('ejecucion_rubros')
        .select('id, valor_real')
        .eq('escenario_id', escenarioId)
        .eq('mes', mes)
        .eq('tipo_rubro', 'vehiculos')
        .eq('item_id', vehiculo.vehiculo_id)
        .single()

      const notas = `Flete P${quincena.numero_periodo}/${quincena.año} - ${vehiculo.placa}`
      let ejecucionRubroId: string | null = null

      if (existente) {
        // Siempre sumar al valor existente
        const nuevoValor = existente.valor_real + liq.flete_base

        const { error: updateError } = await sb
          .from('ejecucion_rubros')
          .update({
            valor_real: nuevoValor,
            notas: `Acum. ${notas}`,
          })
          .eq('id', existente.id)

        if (!updateError) {
          vehiculosCount++
          ejecucionRubroId = existente.id
        }
      } else {
        // Insertar nuevo registro
        const { data: inserted, error: insertError } = await sb
          .from('ejecucion_rubros')
          .insert({
            escenario_id: escenarioId,
            mes,
            tipo_rubro: 'vehiculos',
            item_id: vehiculo.vehiculo_id,
            item_tipo: 'vehiculo',
            valor_real: liq.flete_base,
            notas,
          })
          .select('id')
          .single()

        if (!insertError && inserted) {
          vehiculosCount++
          ejecucionRubroId = inserted.id
        }
      }

      // Registrar sincronizacion para evitar duplicados futuros
      if ((ejecucionRubroId || existente) && vehiculo.vehiculo_id) {
        await registrarSincronizacion(sb, {
          liquidacionId: liq.id,
          ejecucionRubroId: ejecucionRubroId || existente?.id || null,
          vehiculoId: vehiculo.vehiculo_id,
          escenarioId,
          mes,
          valorSincronizado: liq.flete_base,
        })
      }

      // Acumular lejanias de esta liquidacion
      totalLejanias +=
        liq.total_combustible +
        liq.total_peajes +
        liq.total_pernocta +
        liq.total_fletes_adicionales
    }

    // 2. Sincronizar LEJANIAS LOGISTICAS (agregado)
    let lejaniasCount = 0
    if (totalLejanias > 0 && escenarioIdGlobal) {
      // Verificar si ya existe registro de lejanias para este mes
      const { data: existenteLejanias } = await sb
        .from('ejecucion_rubros')
        .select('id, valor_real')
        .eq('escenario_id', escenarioIdGlobal)
        .eq('mes', mes)
        .eq('tipo_rubro', 'lejanias_logisticas')
        .is('item_id', null)
        .single()

      const notasLejanias = `Lejanias terceros P${quincena.numero_periodo}/${quincena.año}`

      if (existenteLejanias) {
        // Siempre sumar al valor existente
        const nuevoValor = existenteLejanias.valor_real + totalLejanias

        const { error: updateError } = await sb
          .from('ejecucion_rubros')
          .update({
            valor_real: nuevoValor,
            notas: `Acum. ${notasLejanias}`,
          })
          .eq('id', existenteLejanias.id)

        if (!updateError) lejaniasCount = 1
      } else {
        // Insertar nuevo registro agregado
        const { error: insertError } = await sb
          .from('ejecucion_rubros')
          .insert({
            escenario_id: escenarioIdGlobal,
            mes,
            tipo_rubro: 'lejanias_logisticas',
            item_id: null,
            item_tipo: null,
            valor_real: totalLejanias,
            notas: notasLejanias,
          })

        if (!insertError) lejaniasCount = 1
      }
    }

    const omitidosMsg = omitidosCount > 0 ? ` (${omitidosCount} ya sincronizados)` : ''
    return {
      success: true,
      message: `Sincronizados ${vehiculosCount} vehiculos y ${lejaniasCount > 0 ? 'lejanias' : 'sin lejanias'}${omitidosMsg}`,
      vehiculos: vehiculosCount,
      lejanias: lejaniasCount,
      omitidos: omitidosCount,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
      vehiculos: 0,
      lejanias: 0,
      omitidos: 0,
    }
  }
}

// Verificar estado de sincronizacion
export async function verificarSincronizacion(
  liquidaciones: LiquidacionConDeducciones[],
  quincena: LiqQuincena
): Promise<{ sincronizados: number; pendientes: number }> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  const mes = getMesNombre(getMesDesdeQuincena(quincena))
  let sincronizados = 0
  let pendientes = 0

  for (const liq of liquidaciones) {
    const vehiculo = liq.vehiculo_tercero
    if (!vehiculo) continue

    // Verificar en tabla de sincronizacion
    const yaSincronizada = await yaFueSincronizada(sb, liq.id)
    if (yaSincronizada) {
      sincronizados++
      continue
    }

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

// Hook para sincronizacion
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
