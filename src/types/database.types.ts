// Este archivo se regenerará automáticamente con: npm run db:types
// Por ahora, definimos los tipos manualmente para las tablas liq_* y las referenciadas

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipos de documento para contratistas
export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PASAPORTE'

// Tipos de cuenta bancaria
export type TipoCuenta = 'ahorros' | 'corriente'

// Estados de quincena
export type EstadoQuincena = 'borrador' | 'validado' | 'liquidado' | 'pagado'

// Estados de viaje
export type EstadoViaje = 'pendiente' | 'ejecutado' | 'parcial' | 'no_ejecutado' | 'variacion'

// Estados de liquidación
export type EstadoLiquidacion = 'borrador' | 'aprobado' | 'pagado'

// Tipos de deducción
export type TipoDeduccion = 'retencion_1_porciento' | 'anticipo' | 'otro'

// Métodos de pago
export type MetodoPago = 'transferencia' | 'cheque' | 'efectivo' | 'payana'

// Día de semana (1=Lunes, 7=Domingo)
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7

// ============================================================================
// INTERFACES DE FILAS (Row types)
// ============================================================================

export interface LiqContratista {
  id: string
  tenant_id: string
  nombre: string
  tipo_documento: string
  numero_documento: string
  telefono: string | null
  email: string | null
  direccion: string | null
  banco: string | null
  tipo_cuenta: string | null
  numero_cuenta: string | null
  activo: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

export interface LiqVehiculoTercero {
  id: string
  vehiculo_id: string
  contratista_id: string
  placa: string
  conductor_nombre: string | null
  conductor_telefono: string | null
  conductor_documento: string | null
  activo: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

export interface LiqVehiculoRutaProgramada {
  id: string
  vehiculo_tercero_id: string
  ruta_id: string
  dia_semana: number
  activo: boolean
  created_at: string
}

export interface LiqQuincena {
  id: string
  escenario_id: string
  año: number
  mes: number
  quincena: number
  fecha_inicio: string
  fecha_fin: string
  estado: string
  fecha_validacion: string | null
  fecha_liquidacion: string | null
  fecha_pago: string | null
  validado_por: string | null
  liquidado_por: string | null
  pagado_por: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface MunicipioVariacion {
  municipio_id: string
  orden: number
  flete_adicional?: number
}

export interface LiqViajeEjecutado {
  id: string
  quincena_id: string
  vehiculo_tercero_id: string
  fecha: string
  ruta_programada_id: string | null
  estado: string
  municipios_variacion: Json | null
  costo_combustible: number
  costo_peajes: number
  costo_flete_adicional: number
  costo_pernocta: number
  costo_total: number
  requiere_pernocta: boolean
  noches_pernocta: number
  validado: boolean
  fecha_validacion: string | null
  validado_por: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface LiqLiquidacion {
  id: string
  quincena_id: string
  vehiculo_tercero_id: string
  viajes_ejecutados: number
  viajes_parciales: number
  viajes_no_ejecutados: number
  flete_base: number
  total_combustible: number
  total_peajes: number
  total_fletes_adicionales: number
  total_pernocta: number
  ajuste_monto: number
  ajuste_descripcion: string | null
  subtotal: number
  total_deducciones: number
  total_a_pagar: number
  estado: string
  notas: string | null
  created_at: string
  updated_at: string
}

export interface LiqLiquidacionDeduccion {
  id: string
  liquidacion_id: string
  tipo: string
  monto: number
  descripcion: string | null
  created_at: string
}

export interface LiqHistorialPago {
  id: string
  contratista_id: string
  quincena_id: string
  monto_total: number
  metodo_pago: string | null
  referencia_pago: string | null
  fecha_pago: string
  comprobante_url: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface LiqSincronizacionEjecucion {
  id: string
  liquidacion_id: string
  ejecucion_rubro_id: string | null
  vehiculo_id: string
  escenario_id: string
  mes: string
  valor_sincronizado: number
  sincronizado: boolean
  fecha_sincronizacion: string | null
  error_mensaje: string | null
  created_at: string
}

// ============================================================================
// TABLAS REFERENCIADAS DE PLANEACIÓN LOGI (solo lectura)
// ============================================================================

export interface Escenario {
  id: string
  nombre: string
  año: number
  descripcion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Vehiculo {
  id: string
  escenario_id: string
  nombre: string
  tipo_vehiculo: string
  tipo_combustible: string | null
  esquema: string
  asignaciones: Json
  tipo_incremento: string | null
  activo: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

export interface VehiculoCostos {
  id: string
  vehiculo_id: string
  tipo_arrendamiento: string | null
  canon_mensual: number
  estado_pago: string | null
  cuota_financiacion: number
  modalidad_tercero: string | null
  flete_mensual: number | null
  costo_por_viaje: number | null
  viajes_estimados_mes: number | null
  created_at: string
  updated_at: string
}

export interface RutaLogistica {
  id: string
  escenario_id: string
  nombre: string
  codigo: string | null
  vehiculo_id: string
  frecuencia: string
  viajes_por_periodo: number
  requiere_pernocta: boolean
  noches_pernocta: number
  cantidad_auxiliares: number
  asignaciones: Json
  activo: boolean
  notas: string | null
  created_at: string
  updated_at: string
}

export interface RutaMunicipio {
  id: string
  ruta_id: string
  municipio_id: string
  orden_visita: number
  flete_adicional: number
  created_at: string
}

export interface Municipio {
  id: string
  codigo: string
  nombre: string
  departamento_codigo: string
  created_at: string
}

export interface LejaniasConfig {
  id: string
  escenario_id: string
  umbral_comercial_km: number
  umbral_logistico_km: number
  consumo_moto_km_galon: number
  consumo_automovil_km_galon: number
  consumo_camion_km_galon: number
  precio_galon_gasolina: number
  precio_galon_acpm: number
  costo_adicional_km_moto: number
  costo_adicional_km_automovil: number
  costo_adicional_km_camion: number
  pernocta_comercial_noche: number
  pernocta_logistica_noche: number
  pernocta_auxiliares_incluida: boolean
  costo_pernocta_auxiliar: number
  municipio_bodega_id: string | null
  created_at: string
  updated_at: string
}

export interface MatrizDesplazamiento {
  id: string
  origen_id: string
  destino_id: string
  distancia_km: number
  tiempo_minutos: number | null
  peaje_ida: number
  fuente: string
  fecha_actualizacion: string
  created_at: string
}

// ============================================================================
// TIPOS AUXILIARES PARA VISTAS Y JOINS
// ============================================================================

// Vista: Liquidación con detalles completos
export interface LiqLiquidacionDetalle extends LiqLiquidacion {
  placa: string
  conductor_nombre: string | null
  contratista_id: string
  contratista_nombre: string
  contratista_documento: string
  banco: string | null
  tipo_cuenta: string | null
  numero_cuenta: string | null
  vehiculo_nombre: string
  tipo_vehiculo: string
  año: number
  mes: number
  quincena: number
  fecha_inicio: string
  fecha_fin: string
}

// Vehículo tercero con datos completos
export interface LiqVehiculoTerceroConDetalles extends LiqVehiculoTercero {
  vehiculo: Vehiculo
  contratista: LiqContratista
  vehiculo_costos?: VehiculoCostos
}

// Resumen de pago por contratista
export interface ResumenPagoContratista {
  contratista_id: string
  contratista_nombre: string
  numero_documento: string
  banco: string | null
  numero_cuenta: string | null
  quincena_id: string
  año: number
  mes: number
  quincena: number
  cantidad_vehiculos: number
  total_bruto: number
  total_deducciones: number
  total_neto: number
  referencia_pago: string | null
  fecha_pago: string | null
  metodo_pago: string | null
}

// ============================================================================
// DATABASE TYPE (para Supabase client)
// ============================================================================

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      liq_contratistas: {
        Row: LiqContratista
        Insert: {
          id?: string
          escenario_id: string
          nombre: string
          tipo_documento: string
          numero_documento: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          banco?: string | null
          tipo_cuenta?: string | null
          numero_cuenta?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escenario_id?: string
          nombre?: string
          tipo_documento?: string
          numero_documento?: string
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          banco?: string | null
          tipo_cuenta?: string | null
          numero_cuenta?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      liq_vehiculos_terceros: {
        Row: LiqVehiculoTercero
        Insert: {
          id?: string
          vehiculo_id: string
          contratista_id: string
          placa: string
          conductor_nombre?: string | null
          conductor_telefono?: string | null
          conductor_documento?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehiculo_id?: string
          contratista_id?: string
          placa?: string
          conductor_nombre?: string | null
          conductor_telefono?: string | null
          conductor_documento?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      liq_vehiculo_rutas_programadas: {
        Row: LiqVehiculoRutaProgramada
        Insert: {
          id?: string
          vehiculo_tercero_id: string
          ruta_id: string
          dia_semana: number
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vehiculo_tercero_id?: string
          ruta_id?: string
          dia_semana?: number
          activo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      liq_quincenas: {
        Row: LiqQuincena
        Insert: {
          id?: string
          escenario_id: string
          año: number
          mes: number
          quincena: number
          fecha_inicio: string
          fecha_fin: string
          estado?: string
          fecha_validacion?: string | null
          fecha_liquidacion?: string | null
          fecha_pago?: string | null
          validado_por?: string | null
          liquidado_por?: string | null
          pagado_por?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escenario_id?: string
          año?: number
          mes?: number
          quincena?: number
          fecha_inicio?: string
          fecha_fin?: string
          estado?: string
          fecha_validacion?: string | null
          fecha_liquidacion?: string | null
          fecha_pago?: string | null
          validado_por?: string | null
          liquidado_por?: string | null
          pagado_por?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      liq_viajes_ejecutados: {
        Row: LiqViajeEjecutado
        Insert: {
          id?: string
          quincena_id: string
          vehiculo_tercero_id: string
          fecha: string
          ruta_programada_id?: string | null
          estado?: string
          municipios_variacion?: Json | null
          costo_combustible?: number
          costo_peajes?: number
          costo_flete_adicional?: number
          costo_pernocta?: number
          costo_total?: number
          requiere_pernocta?: boolean
          noches_pernocta?: number
          validado?: boolean
          fecha_validacion?: string | null
          validado_por?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quincena_id?: string
          vehiculo_tercero_id?: string
          fecha?: string
          ruta_programada_id?: string | null
          estado?: string
          municipios_variacion?: Json | null
          costo_combustible?: number
          costo_peajes?: number
          costo_flete_adicional?: number
          costo_pernocta?: number
          costo_total?: number
          requiere_pernocta?: boolean
          noches_pernocta?: number
          validado?: boolean
          fecha_validacion?: string | null
          validado_por?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      liq_liquidaciones: {
        Row: LiqLiquidacion
        Insert: {
          id?: string
          quincena_id: string
          vehiculo_tercero_id: string
          viajes_ejecutados?: number
          viajes_parciales?: number
          viajes_no_ejecutados?: number
          flete_base?: number
          total_combustible?: number
          total_peajes?: number
          total_fletes_adicionales?: number
          total_pernocta?: number
          ajuste_monto?: number
          ajuste_descripcion?: string | null
          subtotal?: number
          total_deducciones?: number
          total_a_pagar?: number
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quincena_id?: string
          vehiculo_tercero_id?: string
          viajes_ejecutados?: number
          viajes_parciales?: number
          viajes_no_ejecutados?: number
          flete_base?: number
          total_combustible?: number
          total_peajes?: number
          total_fletes_adicionales?: number
          total_pernocta?: number
          ajuste_monto?: number
          ajuste_descripcion?: string | null
          subtotal?: number
          total_deducciones?: number
          total_a_pagar?: number
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      liq_liquidacion_deducciones: {
        Row: LiqLiquidacionDeduccion
        Insert: {
          id?: string
          liquidacion_id: string
          tipo: string
          monto: number
          descripcion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          liquidacion_id?: string
          tipo?: string
          monto?: number
          descripcion?: string | null
          created_at?: string
        }
        Relationships: []
      }
      liq_historial_pagos: {
        Row: LiqHistorialPago
        Insert: {
          id?: string
          contratista_id: string
          quincena_id: string
          monto_total: number
          metodo_pago?: string | null
          referencia_pago?: string | null
          fecha_pago: string
          comprobante_url?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contratista_id?: string
          quincena_id?: string
          monto_total?: number
          metodo_pago?: string | null
          referencia_pago?: string | null
          fecha_pago?: string
          comprobante_url?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      liq_sincronizacion_ejecucion: {
        Row: LiqSincronizacionEjecucion
        Insert: {
          id?: string
          liquidacion_id: string
          ejecucion_rubro_id?: string | null
          vehiculo_id: string
          escenario_id: string
          mes: string
          valor_sincronizado: number
          sincronizado?: boolean
          fecha_sincronizacion?: string | null
          error_mensaje?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          liquidacion_id?: string
          ejecucion_rubro_id?: string | null
          vehiculo_id?: string
          escenario_id?: string
          mes?: string
          valor_sincronizado?: number
          sincronizado?: boolean
          fecha_sincronizacion?: string | null
          error_mensaje?: string | null
          created_at?: string
        }
        Relationships: []
      }
      escenarios: {
        Row: Escenario
        Insert: {
          id?: string
          nombre: string
          año: number
          descripcion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          año?: number
          descripcion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehiculos: {
        Row: Vehiculo
        Insert: {
          id?: string
          escenario_id: string
          nombre: string
          tipo_vehiculo: string
          tipo_combustible?: string | null
          esquema: string
          asignaciones?: Json
          tipo_incremento?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escenario_id?: string
          nombre?: string
          tipo_vehiculo?: string
          tipo_combustible?: string | null
          esquema?: string
          asignaciones?: Json
          tipo_incremento?: string | null
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehiculos_costos: {
        Row: VehiculoCostos
        Insert: {
          id?: string
          vehiculo_id: string
          tipo_arrendamiento?: string | null
          canon_mensual?: number
          estado_pago?: string | null
          cuota_financiacion?: number
          modalidad_tercero?: string | null
          flete_mensual?: number | null
          costo_por_viaje?: number | null
          viajes_estimados_mes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehiculo_id?: string
          tipo_arrendamiento?: string | null
          canon_mensual?: number
          estado_pago?: string | null
          cuota_financiacion?: number
          modalidad_tercero?: string | null
          flete_mensual?: number | null
          costo_por_viaje?: number | null
          viajes_estimados_mes?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rutas_logisticas: {
        Row: RutaLogistica
        Insert: {
          id?: string
          escenario_id: string
          nombre: string
          codigo?: string | null
          vehiculo_id: string
          frecuencia: string
          viajes_por_periodo?: number
          requiere_pernocta?: boolean
          noches_pernocta?: number
          cantidad_auxiliares?: number
          asignaciones?: Json
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escenario_id?: string
          nombre?: string
          codigo?: string | null
          vehiculo_id?: string
          frecuencia?: string
          viajes_por_periodo?: number
          requiere_pernocta?: boolean
          noches_pernocta?: number
          cantidad_auxiliares?: number
          asignaciones?: Json
          activo?: boolean
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ruta_municipios: {
        Row: RutaMunicipio
        Insert: {
          id?: string
          ruta_id: string
          municipio_id: string
          orden_visita?: number
          flete_adicional?: number
          created_at?: string
        }
        Update: {
          id?: string
          ruta_id?: string
          municipio_id?: string
          orden_visita?: number
          flete_adicional?: number
          created_at?: string
        }
        Relationships: []
      }
      municipios: {
        Row: Municipio
        Insert: {
          id?: string
          codigo: string
          nombre: string
          departamento_codigo: string
          created_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          departamento_codigo?: string
          created_at?: string
        }
        Relationships: []
      }
      lejanias_config: {
        Row: LejaniasConfig
        Insert: {
          id?: string
          escenario_id: string
          umbral_comercial_km?: number
          umbral_logistico_km?: number
          consumo_moto_km_galon?: number
          consumo_automovil_km_galon?: number
          consumo_camion_km_galon?: number
          precio_galon_gasolina?: number
          precio_galon_acpm?: number
          costo_adicional_km_moto?: number
          costo_adicional_km_automovil?: number
          costo_adicional_km_camion?: number
          pernocta_comercial_noche?: number
          pernocta_logistica_noche?: number
          pernocta_auxiliares_incluida?: boolean
          costo_pernocta_auxiliar?: number
          municipio_bodega_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          escenario_id?: string
          umbral_comercial_km?: number
          umbral_logistico_km?: number
          consumo_moto_km_galon?: number
          consumo_automovil_km_galon?: number
          consumo_camion_km_galon?: number
          precio_galon_gasolina?: number
          precio_galon_acpm?: number
          costo_adicional_km_moto?: number
          costo_adicional_km_automovil?: number
          costo_adicional_km_camion?: number
          pernocta_comercial_noche?: number
          pernocta_logistica_noche?: number
          pernocta_auxiliares_incluida?: boolean
          costo_pernocta_auxiliar?: number
          municipio_bodega_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      matriz_desplazamientos: {
        Row: MatrizDesplazamiento
        Insert: {
          id?: string
          origen_id: string
          destino_id: string
          distancia_km: number
          tiempo_minutos?: number | null
          peaje_ida?: number
          fuente?: string
          fecha_actualizacion?: string
          created_at?: string
        }
        Update: {
          id?: string
          origen_id?: string
          destino_id?: string
          distancia_km?: number
          tiempo_minutos?: number | null
          peaje_ida?: number
          fuente?: string
          fecha_actualizacion?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
