// Re-exportar tipos base de Supabase
export * from './database.types'
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database.types'

import type { Tables } from './database.types'

// Aliases para tablas de liquidacion
export type LiqContratista = Tables<'liq_contratistas'>
export type LiqQuincena = Tables<'liq_quincenas'>
export type LiqVehiculoTercero = Tables<'liq_vehiculos_terceros'>
export type LiqViajeEjecutado = Tables<'liq_viajes_ejecutados'>
export type LiqLiquidacion = Tables<'liq_liquidaciones'>
export type LiqLiquidacionDeduccion = Tables<'liq_liquidacion_deducciones'>
export type LiqVehiculoRutaProgramada = Tables<'liq_vehiculo_rutas_programadas'>
export type LiqHistorialPago = Tables<'liq_historial_pagos'>
export type LiqSincronizacionEjecucion = Tables<'liq_sincronizacion_ejecucion'>

// Aliases para tablas de PlaneacionLogi (compartidas)
export type Escenario = Tables<'escenarios'>
export type RutaLogistica = Tables<'rutas_logisticas'>
export type Vehiculo = Tables<'vehiculos'>
export type VehiculoCostos = Tables<'vehiculos_costos'>
export type Municipio = Tables<'municipios'>

// Tipo para la relacion ruta-municipio (tabla intermedia)
export interface RutaMunicipio {
  id: string
  ruta_id: string
  municipio_id: string
  orden_visita: number
  created_at?: string
}

// Tipo compuesto: vehiculo tercero con todos sus detalles relacionados
export interface LiqVehiculoTerceroConDetalles extends LiqVehiculoTercero {
  vehiculo: Vehiculo | null
  contratista: LiqContratista
  vehiculo_costos: VehiculoCostos | null | undefined
}

// Estados posibles de una quincena
export type EstadoQuincena = 'borrador' | 'pendiente' | 'validado' | 'liquidado' | 'pagado'

// Estados posibles de un viaje ejecutado
export type EstadoViaje = 'pendiente' | 'ejecutado' | 'no_ejecutado' | 'variacion'

// Estados posibles de una liquidacion
export type EstadoLiquidacion = 'borrador' | 'aprobado'
