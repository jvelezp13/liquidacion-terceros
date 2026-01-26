export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      descuentos_config: {
        Row: {
          activo: boolean | null
          cesantia_comercial_activo: boolean | null
          created_at: string | null
          descuento_financiero_activo: boolean | null
          descuento_financiero_porcentaje: number | null
          escenario_id: string
          id: string
          marca_id: string
          otros_incentivos_descripcion: string | null
          otros_incentivos_porcentaje: number | null
          rebate_porcentaje: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          cesantia_comercial_activo?: boolean | null
          created_at?: string | null
          descuento_financiero_activo?: boolean | null
          descuento_financiero_porcentaje?: number | null
          escenario_id: string
          id?: string
          marca_id: string
          otros_incentivos_descripcion?: string | null
          otros_incentivos_porcentaje?: number | null
          rebate_porcentaje?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          cesantia_comercial_activo?: boolean | null
          created_at?: string | null
          descuento_financiero_activo?: boolean | null
          descuento_financiero_porcentaje?: number | null
          escenario_id?: string
          id?: string
          marca_id?: string
          otros_incentivos_descripcion?: string | null
          otros_incentivos_porcentaje?: number | null
          rebate_porcentaje?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "descuentos_config_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "descuentos_config_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      descuentos_mensuales: {
        Row: {
          abril: number | null
          agosto: number | null
          created_at: string | null
          descuento_config_id: string
          diciembre: number | null
          enero: number | null
          febrero: number | null
          id: string
          julio: number | null
          junio: number | null
          marzo: number | null
          mayo: number | null
          noviembre: number | null
          octubre: number | null
          septiembre: number | null
          updated_at: string | null
        }
        Insert: {
          abril?: number | null
          agosto?: number | null
          created_at?: string | null
          descuento_config_id: string
          diciembre?: number | null
          enero?: number | null
          febrero?: number | null
          id?: string
          julio?: number | null
          junio?: number | null
          marzo?: number | null
          mayo?: number | null
          noviembre?: number | null
          octubre?: number | null
          septiembre?: number | null
          updated_at?: string | null
        }
        Update: {
          abril?: number | null
          agosto?: number | null
          created_at?: string | null
          descuento_config_id?: string
          diciembre?: number | null
          enero?: number | null
          febrero?: number | null
          id?: string
          julio?: number | null
          junio?: number | null
          marzo?: number | null
          mayo?: number | null
          noviembre?: number | null
          octubre?: number | null
          septiembre?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "descuentos_mensuales_descuento_config_id_fkey"
            columns: ["descuento_config_id"]
            isOneToOne: true
            referencedRelation: "descuentos_config"
            referencedColumns: ["id"]
          },
        ]
      }
      ejecucion_gastos_no_planeados: {
        Row: {
          asignaciones: Json
          created_at: string
          descripcion: string | null
          escenario_id: string
          id: string
          mes: string
          monto: number
          nombre: string
          tipo: string
          updated_at: string
        }
        Insert: {
          asignaciones?: Json
          created_at?: string
          descripcion?: string | null
          escenario_id: string
          id?: string
          mes: string
          monto: number
          nombre: string
          tipo: string
          updated_at?: string
        }
        Update: {
          asignaciones?: Json
          created_at?: string
          descripcion?: string | null
          escenario_id?: string
          id?: string
          mes?: string
          monto?: number
          nombre?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejecucion_gastos_no_planeados_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ejecucion_meses: {
        Row: {
          cerrado_at: string | null
          created_at: string
          escenario_id: string
          estado: string
          id: string
          mes: string
          notas: string | null
          updated_at: string
        }
        Insert: {
          cerrado_at?: string | null
          created_at?: string
          escenario_id: string
          estado?: string
          id?: string
          mes: string
          notas?: string | null
          updated_at?: string
        }
        Update: {
          cerrado_at?: string | null
          created_at?: string
          escenario_id?: string
          estado?: string
          id?: string
          mes?: string
          notas?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejecucion_meses_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ejecucion_prestaciones: {
        Row: {
          created_at: string
          ejecutado_at: string | null
          escenario_id: string
          id: string
          mes: string
          monto_ejecutado: number
          monto_provisionado: number
          notas: string | null
          tipo_prestacion: string
        }
        Insert: {
          created_at?: string
          ejecutado_at?: string | null
          escenario_id: string
          id?: string
          mes: string
          monto_ejecutado?: number
          monto_provisionado?: number
          notas?: string | null
          tipo_prestacion: string
        }
        Update: {
          created_at?: string
          ejecutado_at?: string | null
          escenario_id?: string
          id?: string
          mes?: string
          monto_ejecutado?: number
          monto_provisionado?: number
          notas?: string | null
          tipo_prestacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejecucion_prestaciones_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ejecucion_provisiones: {
        Row: {
          created_at: string
          ejecutado_at: string | null
          escenario_id: string
          id: string
          mes: string
          monto_ejecutado: number
          monto_provisionado: number
          notas: string | null
          provision_config_id: string
        }
        Insert: {
          created_at?: string
          ejecutado_at?: string | null
          escenario_id: string
          id?: string
          mes: string
          monto_ejecutado?: number
          monto_provisionado?: number
          notas?: string | null
          provision_config_id: string
        }
        Update: {
          created_at?: string
          ejecutado_at?: string | null
          escenario_id?: string
          id?: string
          mes?: string
          monto_ejecutado?: number
          monto_provisionado?: number
          notas?: string | null
          provision_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejecucion_provisiones_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ejecucion_provisiones_provision_config_id_fkey"
            columns: ["provision_config_id"]
            isOneToOne: false
            referencedRelation: "provisiones_config"
            referencedColumns: ["id"]
          },
        ]
      }
      ejecucion_rubros: {
        Row: {
          created_at: string
          descuento_pie_factura_real: number | null
          escenario_id: string
          id: string
          item_id: string | null
          item_tipo: string | null
          marca_id: string | null
          mes: string
          notas: string | null
          rebate_porcentaje_real: number | null
          tipo_rubro: string
          updated_at: string
          valor_planeado: number | null
          valor_real: number
        }
        Insert: {
          created_at?: string
          descuento_pie_factura_real?: number | null
          escenario_id: string
          id?: string
          item_id?: string | null
          item_tipo?: string | null
          marca_id?: string | null
          mes: string
          notas?: string | null
          rebate_porcentaje_real?: number | null
          tipo_rubro: string
          updated_at?: string
          valor_planeado?: number | null
          valor_real: number
        }
        Update: {
          created_at?: string
          descuento_pie_factura_real?: number | null
          escenario_id?: string
          id?: string
          item_id?: string | null
          item_tipo?: string | null
          marca_id?: string | null
          mes?: string
          notas?: string | null
          rebate_porcentaje_real?: number | null
          tipo_rubro?: string
          updated_at?: string
          valor_planeado?: number | null
          valor_real?: number
        }
        Relationships: [
          {
            foreignKeyName: "ejecucion_rubros_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ejecucion_rubros_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      escenario_compartido: {
        Row: {
          access_count: number | null
          created_at: string | null
          created_by: string | null
          escenario_id: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          marca_agua: string | null
          marca_ids: string[] | null
          nombre: string | null
          nota_interna: string | null
          operacion_ids: string[] | null
          revoked_at: string | null
          secciones: string[] | null
          snapshot: Json
          token: string
          zona_ids: string[] | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string | null
          escenario_id: string
          expires_at: string
          id?: string
          last_accessed_at?: string | null
          marca_agua?: string | null
          marca_ids?: string[] | null
          nombre?: string | null
          nota_interna?: string | null
          operacion_ids?: string[] | null
          revoked_at?: string | null
          secciones?: string[] | null
          snapshot: Json
          token: string
          zona_ids?: string[] | null
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          created_by?: string | null
          escenario_id?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          marca_agua?: string | null
          marca_ids?: string[] | null
          nombre?: string | null
          nota_interna?: string | null
          operacion_ids?: string[] | null
          revoked_at?: string | null
          secciones?: string[] | null
          snapshot?: Json
          token?: string
          zona_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "escenario_compartido_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      escenarios: {
        Row: {
          activo: boolean | null
          año: number
          created_at: string | null
          descripcion: string | null
          es_base: boolean | null
          es_produccion: boolean | null
          id: string
          mes_inicio: string
          nombre: string
          tenant_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          año: number
          created_at?: string | null
          descripcion?: string | null
          es_base?: boolean | null
          es_produccion?: boolean | null
          id?: string
          mes_inicio?: string
          nombre: string
          tenant_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          año?: number
          created_at?: string | null
          descripcion?: string | null
          es_base?: boolean | null
          es_produccion?: boolean | null
          id?: string
          mes_inicio?: string
          nombre?: string
          tenant_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escenarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      factores_prestacionales: {
        Row: {
          activo: boolean | null
          arl_clase: string | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          factores: Json
          id: string
          nombre: string
          orden: number | null
          perfil: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          arl_clase?: string | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          factores?: Json
          id?: string
          nombre: string
          orden?: number | null
          perfil?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          arl_clase?: string | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          factores?: Json
          id?: string
          nombre?: string
          orden?: number | null
          perfil?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      facturas_cedidas: {
        Row: {
          costo_transaccion: number
          created_at: string
          descontar_renta: boolean
          descripcion: string | null
          escenario_id: string
          id: string
          iva: number
          mes: number
          monto_base: number
          updated_at: string
        }
        Insert: {
          costo_transaccion?: number
          created_at?: string
          descontar_renta?: boolean
          descripcion?: string | null
          escenario_id: string
          id?: string
          iva: number
          mes: number
          monto_base: number
          updated_at?: string
        }
        Update: {
          costo_transaccion?: number
          created_at?: string
          descontar_renta?: boolean
          descripcion?: string | null
          escenario_id?: string
          id?: string
          iva?: number
          mes?: number
          monto_base?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cedidas_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          activo: boolean
          asignaciones: Json
          categoria: string
          created_at: string
          escenario_id: string
          id: string
          monto_mensual: number
          nombre: string
          tipo: string
          tipo_incremento: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          asignaciones?: Json
          categoria: string
          created_at?: string
          escenario_id: string
          id?: string
          monto_mensual: number
          nombre: string
          tipo?: string
          tipo_incremento?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          asignaciones?: Json
          categoria?: string
          created_at?: string
          escenario_id?: string
          id?: string
          monto_mensual?: number
          nombre?: string
          tipo?: string
          tipo_incremento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      impuestos_config: {
        Row: {
          created_at: string | null
          escenario_id: string
          id: string
          iva_porcentaje: number | null
          renta_porcentaje: number | null
          retefuente_porcentaje: number | null
          reteica_porcentaje: number | null
          reteiva_porcentaje: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escenario_id: string
          id?: string
          iva_porcentaje?: number | null
          renta_porcentaje?: number | null
          retefuente_porcentaje?: number | null
          reteica_porcentaje?: number | null
          reteiva_porcentaje?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escenario_id?: string
          id?: string
          iva_porcentaje?: number | null
          renta_porcentaje?: number | null
          retefuente_porcentaje?: number | null
          reteica_porcentaje?: number | null
          reteiva_porcentaje?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impuestos_config_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: true
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lejanias_config: {
        Row: {
          consumo_automovil_km_galon: number | null
          consumo_camion_km_galon: number | null
          consumo_moto_km_galon: number | null
          costo_adicional_km_automovil: number | null
          costo_adicional_km_camion: number | null
          costo_adicional_km_moto: number | null
          costo_pernocta_auxiliar: number | null
          created_at: string | null
          escenario_id: string
          id: string
          pernocta_auxiliares_incluida: boolean | null
          pernocta_comercial_noche: number | null
          pernocta_logistica_noche: number | null
          precio_galon_acpm: number | null
          precio_galon_gasolina: number | null
          umbral_comercial_km: number | null
          umbral_logistico_km: number | null
          updated_at: string | null
        }
        Insert: {
          consumo_automovil_km_galon?: number | null
          consumo_camion_km_galon?: number | null
          consumo_moto_km_galon?: number | null
          costo_adicional_km_automovil?: number | null
          costo_adicional_km_camion?: number | null
          costo_adicional_km_moto?: number | null
          costo_pernocta_auxiliar?: number | null
          created_at?: string | null
          escenario_id: string
          id?: string
          pernocta_auxiliares_incluida?: boolean | null
          pernocta_comercial_noche?: number | null
          pernocta_logistica_noche?: number | null
          precio_galon_acpm?: number | null
          precio_galon_gasolina?: number | null
          umbral_comercial_km?: number | null
          umbral_logistico_km?: number | null
          updated_at?: string | null
        }
        Update: {
          consumo_automovil_km_galon?: number | null
          consumo_camion_km_galon?: number | null
          consumo_moto_km_galon?: number | null
          costo_adicional_km_automovil?: number | null
          costo_adicional_km_camion?: number | null
          costo_adicional_km_moto?: number | null
          costo_pernocta_auxiliar?: number | null
          created_at?: string | null
          escenario_id?: string
          id?: string
          pernocta_auxiliares_incluida?: boolean | null
          pernocta_comercial_noche?: number | null
          pernocta_logistica_noche?: number | null
          precio_galon_acpm?: number | null
          precio_galon_gasolina?: number | null
          umbral_comercial_km?: number | null
          umbral_logistico_km?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lejanias_config_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: true
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_contratistas: {
        Row: {
          activo: boolean
          banco: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          numero_cuenta: string | null
          numero_documento: string
          telefono: string | null
          tenant_id: string
          tipo_cuenta: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          banco?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          numero_cuenta?: string | null
          numero_documento: string
          telefono?: string | null
          tenant_id: string
          tipo_cuenta?: string | null
          tipo_documento: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          banco?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          numero_cuenta?: string | null
          numero_documento?: string
          telefono?: string | null
          tenant_id?: string
          tipo_cuenta?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liq_contratistas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_historial_pagos: {
        Row: {
          comprobante_url: string | null
          contratista_id: string
          created_at: string
          fecha_pago: string
          id: string
          metodo_pago: string | null
          monto_total: number
          notas: string | null
          quincena_id: string
          referencia_pago: string | null
          updated_at: string
        }
        Insert: {
          comprobante_url?: string | null
          contratista_id: string
          created_at?: string
          fecha_pago: string
          id?: string
          metodo_pago?: string | null
          monto_total: number
          notas?: string | null
          quincena_id: string
          referencia_pago?: string | null
          updated_at?: string
        }
        Update: {
          comprobante_url?: string | null
          contratista_id?: string
          created_at?: string
          fecha_pago?: string
          id?: string
          metodo_pago?: string | null
          monto_total?: number
          notas?: string | null
          quincena_id?: string
          referencia_pago?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "liq_historial_pagos_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "liq_contratistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_historial_pagos_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "liq_liquidaciones_detalle"
            referencedColumns: ["contratista_id"]
          },
          {
            foreignKeyName: "liq_historial_pagos_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "liq_pagos_contratista_resumen"
            referencedColumns: ["contratista_id"]
          },
          {
            foreignKeyName: "liq_historial_pagos_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_pagos_contratista_resumen"
            referencedColumns: ["quincena_id"]
          },
          {
            foreignKeyName: "liq_historial_pagos_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_quincenas"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_liquidacion_deducciones: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          liquidacion_id: string
          monto: number
          tipo: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          liquidacion_id: string
          monto: number
          tipo: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          liquidacion_id?: string
          monto?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "liq_liquidacion_deducciones_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liq_liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_liquidacion_deducciones_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liq_liquidaciones_detalle"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_liquidaciones: {
        Row: {
          ajuste_descripcion: string | null
          ajuste_monto: number
          created_at: string
          estado: string
          flete_base: number
          id: string
          notas: string | null
          quincena_id: string
          subtotal: number
          total_a_pagar: number
          total_combustible: number
          total_deducciones: number
          total_fletes_adicionales: number
          total_peajes: number
          total_pernocta: number
          updated_at: string
          vehiculo_tercero_id: string
          viajes_ejecutados: number
          viajes_no_ejecutados: number
          viajes_variacion: number | null
        }
        Insert: {
          ajuste_descripcion?: string | null
          ajuste_monto?: number
          created_at?: string
          estado?: string
          flete_base?: number
          id?: string
          notas?: string | null
          quincena_id: string
          subtotal?: number
          total_a_pagar?: number
          total_combustible?: number
          total_deducciones?: number
          total_fletes_adicionales?: number
          total_peajes?: number
          total_pernocta?: number
          updated_at?: string
          vehiculo_tercero_id: string
          viajes_ejecutados?: number
          viajes_no_ejecutados?: number
          viajes_variacion?: number | null
        }
        Update: {
          ajuste_descripcion?: string | null
          ajuste_monto?: number
          created_at?: string
          estado?: string
          flete_base?: number
          id?: string
          notas?: string | null
          quincena_id?: string
          subtotal?: number
          total_a_pagar?: number
          total_combustible?: number
          total_deducciones?: number
          total_fletes_adicionales?: number
          total_peajes?: number
          total_pernocta?: number
          updated_at?: string
          vehiculo_tercero_id?: string
          viajes_ejecutados?: number
          viajes_no_ejecutados?: number
          viajes_variacion?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "liq_liquidaciones_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_pagos_contratista_resumen"
            referencedColumns: ["quincena_id"]
          },
          {
            foreignKeyName: "liq_liquidaciones_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_quincenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_liquidaciones_vehiculo_tercero_id_fkey"
            columns: ["vehiculo_tercero_id"]
            isOneToOne: false
            referencedRelation: "liq_vehiculos_terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_quincenas: {
        Row: {
          año: number
          created_at: string
          escenario_id: string
          estado: string
          fecha_fin: string
          fecha_inicio: string
          fecha_liquidacion: string | null
          fecha_pago: string | null
          fecha_validacion: string | null
          id: string
          liquidado_por: string | null
          mes: number | null
          notas: string | null
          numero_periodo: number
          pagado_por: string | null
          quincena: number | null
          updated_at: string
          validado_por: string | null
        }
        Insert: {
          año: number
          created_at?: string
          escenario_id: string
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          fecha_liquidacion?: string | null
          fecha_pago?: string | null
          fecha_validacion?: string | null
          id?: string
          liquidado_por?: string | null
          mes?: number | null
          notas?: string | null
          numero_periodo: number
          pagado_por?: string | null
          quincena?: number | null
          updated_at?: string
          validado_por?: string | null
        }
        Update: {
          año?: number
          created_at?: string
          escenario_id?: string
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          fecha_liquidacion?: string | null
          fecha_pago?: string | null
          fecha_validacion?: string | null
          id?: string
          liquidado_por?: string | null
          mes?: number | null
          notas?: string | null
          numero_periodo?: number
          pagado_por?: string | null
          quincena?: number | null
          updated_at?: string
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liq_quincenas_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_sincronizacion_ejecucion: {
        Row: {
          created_at: string
          ejecucion_rubro_id: string | null
          error_mensaje: string | null
          escenario_id: string
          fecha_sincronizacion: string | null
          id: string
          liquidacion_id: string
          mes: string
          sincronizado: boolean
          valor_sincronizado: number
          vehiculo_id: string
        }
        Insert: {
          created_at?: string
          ejecucion_rubro_id?: string | null
          error_mensaje?: string | null
          escenario_id: string
          fecha_sincronizacion?: string | null
          id?: string
          liquidacion_id: string
          mes: string
          sincronizado?: boolean
          valor_sincronizado: number
          vehiculo_id: string
        }
        Update: {
          created_at?: string
          ejecucion_rubro_id?: string | null
          error_mensaje?: string | null
          escenario_id?: string
          fecha_sincronizacion?: string | null
          id?: string
          liquidacion_id?: string
          mes?: string
          sincronizado?: boolean
          valor_sincronizado?: number
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liq_sincronizacion_ejecucion_ejecucion_rubro_id_fkey"
            columns: ["ejecucion_rubro_id"]
            isOneToOne: false
            referencedRelation: "ejecucion_rubros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_sincronizacion_ejecucion_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liq_liquidaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_sincronizacion_ejecucion_liquidacion_id_fkey"
            columns: ["liquidacion_id"]
            isOneToOne: false
            referencedRelation: "liq_liquidaciones_detalle"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_vehiculo_rutas_programadas: {
        Row: {
          activo: boolean
          created_at: string
          dia_semana: number
          id: string
          ruta_id: string
          vehiculo_tercero_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          dia_semana: number
          id?: string
          ruta_id: string
          vehiculo_tercero_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          dia_semana?: number
          id?: string
          ruta_id?: string
          vehiculo_tercero_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liq_vehiculo_rutas_programadas_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas_logisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_vehiculo_rutas_programadas_vehiculo_tercero_id_fkey"
            columns: ["vehiculo_tercero_id"]
            isOneToOne: false
            referencedRelation: "liq_vehiculos_terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_vehiculos_terceros: {
        Row: {
          activo: boolean
          conductor_documento: string | null
          conductor_nombre: string | null
          conductor_telefono: string | null
          contratista_id: string
          costo_por_viaje: number | null
          created_at: string
          flete_mensual: number | null
          id: string
          modalidad_costo: string | null
          notas: string | null
          placa: string
          updated_at: string
          vehiculo_id: string | null
        }
        Insert: {
          activo?: boolean
          conductor_documento?: string | null
          conductor_nombre?: string | null
          conductor_telefono?: string | null
          contratista_id: string
          costo_por_viaje?: number | null
          created_at?: string
          flete_mensual?: number | null
          id?: string
          modalidad_costo?: string | null
          notas?: string | null
          placa: string
          updated_at?: string
          vehiculo_id?: string | null
        }
        Update: {
          activo?: boolean
          conductor_documento?: string | null
          conductor_nombre?: string | null
          conductor_telefono?: string | null
          contratista_id?: string
          costo_por_viaje?: number | null
          created_at?: string
          flete_mensual?: number | null
          id?: string
          modalidad_costo?: string | null
          notas?: string | null
          placa?: string
          updated_at?: string
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liq_vehiculos_terceros_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "liq_contratistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_vehiculos_terceros_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "liq_liquidaciones_detalle"
            referencedColumns: ["contratista_id"]
          },
          {
            foreignKeyName: "liq_vehiculos_terceros_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "liq_pagos_contratista_resumen"
            referencedColumns: ["contratista_id"]
          },
          {
            foreignKeyName: "liq_vehiculos_terceros_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: true
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_viajes_ejecutados: {
        Row: {
          costo_combustible: number | null
          costo_flete_adicional: number | null
          costo_peajes: number | null
          costo_pernocta: number | null
          costo_total: number | null
          created_at: string
          destino: string | null
          destino_manual: string | null
          dia_ciclo: number | null
          estado: string
          fecha: string
          fecha_validacion: string | null
          id: string
          km_recorridos: number | null
          municipios_variacion: Json | null
          noches_pernocta: number | null
          notas: string | null
          quincena_id: string
          requiere_pernocta: boolean | null
          ruta_programada_id: string | null
          ruta_variacion_id: string | null
          updated_at: string
          validado: boolean
          validado_por: string | null
          vehiculo_tercero_id: string
        }
        Insert: {
          costo_combustible?: number | null
          costo_flete_adicional?: number | null
          costo_peajes?: number | null
          costo_pernocta?: number | null
          costo_total?: number | null
          created_at?: string
          destino?: string | null
          destino_manual?: string | null
          dia_ciclo?: number | null
          estado?: string
          fecha: string
          fecha_validacion?: string | null
          id?: string
          km_recorridos?: number | null
          municipios_variacion?: Json | null
          noches_pernocta?: number | null
          notas?: string | null
          quincena_id: string
          requiere_pernocta?: boolean | null
          ruta_programada_id?: string | null
          ruta_variacion_id?: string | null
          updated_at?: string
          validado?: boolean
          validado_por?: string | null
          vehiculo_tercero_id: string
        }
        Update: {
          costo_combustible?: number | null
          costo_flete_adicional?: number | null
          costo_peajes?: number | null
          costo_pernocta?: number | null
          costo_total?: number | null
          created_at?: string
          destino?: string | null
          destino_manual?: string | null
          dia_ciclo?: number | null
          estado?: string
          fecha?: string
          fecha_validacion?: string | null
          id?: string
          km_recorridos?: number | null
          municipios_variacion?: Json | null
          noches_pernocta?: number | null
          notas?: string | null
          quincena_id?: string
          requiere_pernocta?: boolean | null
          ruta_programada_id?: string | null
          ruta_variacion_id?: string | null
          updated_at?: string
          validado?: boolean
          validado_por?: string | null
          vehiculo_tercero_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liq_viajes_ejecutados_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_pagos_contratista_resumen"
            referencedColumns: ["quincena_id"]
          },
          {
            foreignKeyName: "liq_viajes_ejecutados_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_quincenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_viajes_ejecutados_ruta_programada_id_fkey"
            columns: ["ruta_programada_id"]
            isOneToOne: false
            referencedRelation: "rutas_logisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_viajes_ejecutados_ruta_variacion_id_fkey"
            columns: ["ruta_variacion_id"]
            isOneToOne: false
            referencedRelation: "rutas_logisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_viajes_ejecutados_vehiculo_tercero_id_fkey"
            columns: ["vehiculo_tercero_id"]
            isOneToOne: false
            referencedRelation: "liq_vehiculos_terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          activo: boolean | null
          codigo: string | null
          color: string | null
          created_at: string | null
          descripcion: string | null
          escenario_id: string
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          escenario_id: string
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          escenario_id?: string
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marcas_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      matriz_desplazamientos: {
        Row: {
          created_at: string | null
          destino_id: string
          distancia_km: number
          fecha_actualizacion: string | null
          fuente: string | null
          id: string
          origen_id: string
          peaje_ida: number | null
          tiempo_minutos: number | null
        }
        Insert: {
          created_at?: string | null
          destino_id: string
          distancia_km: number
          fecha_actualizacion?: string | null
          fuente?: string | null
          id?: string
          origen_id: string
          peaje_ida?: number | null
          tiempo_minutos?: number | null
        }
        Update: {
          created_at?: string | null
          destino_id?: string
          distancia_km?: number
          fecha_actualizacion?: string | null
          fuente?: string | null
          id?: string
          origen_id?: string
          peaje_ida?: number | null
          tiempo_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matriz_desplazamientos_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriz_desplazamientos_origen_id_fkey"
            columns: ["origen_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          codigo_dane: string
          created_at: string | null
          departamento: string
          es_corregimiento: boolean
          id: string
          latitud: number | null
          longitud: number | null
          municipio_padre_id: string | null
          nombre: string
          operacion_id: string | null
        }
        Insert: {
          codigo_dane: string
          created_at?: string | null
          departamento: string
          es_corregimiento?: boolean
          id?: string
          latitud?: number | null
          longitud?: number | null
          municipio_padre_id?: string | null
          nombre: string
          operacion_id?: string | null
        }
        Update: {
          codigo_dane?: string
          created_at?: string | null
          departamento?: string
          es_corregimiento?: boolean
          id?: string
          latitud?: number | null
          longitud?: number | null
          municipio_padre_id?: string | null
          nombre?: string
          operacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "municipios_municipio_padre_id_fkey"
            columns: ["municipio_padre_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "municipios_operacion_id_fkey"
            columns: ["operacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      operaciones: {
        Row: {
          activo: boolean | null
          codigo: string | null
          created_at: string | null
          departamento: string | null
          descripcion: string | null
          escenario_id: string
          id: string
          municipio_base: string | null
          municipio_base_id: string | null
          nombre: string
          tasa_ica: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          departamento?: string | null
          descripcion?: string | null
          escenario_id: string
          id?: string
          municipio_base?: string | null
          municipio_base_id?: string | null
          nombre: string
          tasa_ica?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          departamento?: string | null
          descripcion?: string | null
          escenario_id?: string
          id?: string
          municipio_base?: string | null
          municipio_base_id?: string | null
          nombre?: string
          tasa_ica?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operaciones_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operaciones_municipio_base_id_fkey"
            columns: ["municipio_base_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_macro: {
        Row: {
          created_at: string | null
          escenario_id: string
          id: string
          incremento_arriendos: number | null
          incremento_combustible: number | null
          incremento_salario_minimo: number | null
          incremento_salarios: number | null
          ipc: number | null
          ipt: number | null
          rotacion_administrativo: number | null
          rotacion_comercial: number | null
          rotacion_logistico: number | null
          salario_minimo_legal: number
          subsidio_transporte: number
          tope_subsidio_transporte_smlv: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          escenario_id: string
          id?: string
          incremento_arriendos?: number | null
          incremento_combustible?: number | null
          incremento_salario_minimo?: number | null
          incremento_salarios?: number | null
          ipc?: number | null
          ipt?: number | null
          rotacion_administrativo?: number | null
          rotacion_comercial?: number | null
          rotacion_logistico?: number | null
          salario_minimo_legal: number
          subsidio_transporte: number
          tope_subsidio_transporte_smlv?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          escenario_id?: string
          id?: string
          incremento_arriendos?: number | null
          incremento_combustible?: number | null
          incremento_salario_minimo?: number | null
          incremento_salarios?: number | null
          ipc?: number | null
          ipt?: number | null
          rotacion_administrativo?: number | null
          rotacion_comercial?: number | null
          rotacion_logistico?: number | null
          salario_minimo_legal?: number
          subsidio_transporte?: number
          tope_subsidio_transporte_smlv?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametros_macro_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: true
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planificacion_dias: {
        Row: {
          created_at: string | null
          dia: string
          es_quincenal: boolean
          id: string
          municipio_id: string
          orden: number
          pernocta: boolean
          planificacion_id: string
          semana: number
        }
        Insert: {
          created_at?: string | null
          dia: string
          es_quincenal?: boolean
          id?: string
          municipio_id: string
          orden?: number
          pernocta?: boolean
          planificacion_id: string
          semana?: number
        }
        Update: {
          created_at?: string | null
          dia?: string
          es_quincenal?: boolean
          id?: string
          municipio_id?: string
          orden?: number
          pernocta?: boolean
          planificacion_id?: string
          semana?: number
        }
        Relationships: [
          {
            foreignKeyName: "planificacion_dias_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planificacion_dias_planificacion_id_fkey"
            columns: ["planificacion_id"]
            isOneToOne: false
            referencedRelation: "planificacion_lejanias"
            referencedColumns: ["id"]
          },
        ]
      }
      planificacion_lejanias: {
        Row: {
          adicionales_ciclo: number | null
          adicionales_mensual: number | null
          asignaciones: Json
          combustible_ciclo: number | null
          combustible_mensual: number | null
          config_hash: string | null
          costo_pernocta_ciclo: number | null
          costo_pernocta_mensual: number | null
          costos_calculados_at: string | null
          costos_por_dia: Json | null
          created_at: string | null
          escenario_id: string
          frecuencia: string
          id: string
          km_ciclo: number | null
          km_mensual: number | null
          municipio_origen_id: string
          noches_pernocta_mensual: number | null
          peajes_ciclo: number | null
          peajes_mensual: number | null
          pernoctas_ciclo: number | null
          ruta_id: string | null
          tipo: string
          tipo_vehiculo: string
          total_ciclo: number | null
          total_mensual: number | null
          updated_at: string | null
          zona_id: string | null
        }
        Insert: {
          adicionales_ciclo?: number | null
          adicionales_mensual?: number | null
          asignaciones?: Json
          combustible_ciclo?: number | null
          combustible_mensual?: number | null
          config_hash?: string | null
          costo_pernocta_ciclo?: number | null
          costo_pernocta_mensual?: number | null
          costos_calculados_at?: string | null
          costos_por_dia?: Json | null
          created_at?: string | null
          escenario_id: string
          frecuencia?: string
          id?: string
          km_ciclo?: number | null
          km_mensual?: number | null
          municipio_origen_id: string
          noches_pernocta_mensual?: number | null
          peajes_ciclo?: number | null
          peajes_mensual?: number | null
          pernoctas_ciclo?: number | null
          ruta_id?: string | null
          tipo: string
          tipo_vehiculo?: string
          total_ciclo?: number | null
          total_mensual?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Update: {
          adicionales_ciclo?: number | null
          adicionales_mensual?: number | null
          asignaciones?: Json
          combustible_ciclo?: number | null
          combustible_mensual?: number | null
          config_hash?: string | null
          costo_pernocta_ciclo?: number | null
          costo_pernocta_mensual?: number | null
          costos_calculados_at?: string | null
          costos_por_dia?: Json | null
          created_at?: string | null
          escenario_id?: string
          frecuencia?: string
          id?: string
          km_ciclo?: number | null
          km_mensual?: number | null
          municipio_origen_id?: string
          noches_pernocta_mensual?: number | null
          peajes_ciclo?: number | null
          peajes_mensual?: number | null
          pernoctas_ciclo?: number | null
          ruta_id?: string | null
          tipo?: string
          tipo_vehiculo?: string
          total_ciclo?: number | null
          total_mensual?: number | null
          updated_at?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planificacion_lejanias_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planificacion_lejanias_municipio_origen_id_fkey"
            columns: ["municipio_origen_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planificacion_lejanias_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "rutas_logisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planificacion_lejanias_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      provisiones_config: {
        Row: {
          activo: boolean | null
          aplica_a: Json
          aplica_hasta_smlv: number | null
          created_at: string | null
          descripcion: string | null
          escenario_id: string
          frecuencia: string
          id: string
          meses_aplica: number[] | null
          monto_fijo: number | null
          monto_porcentaje_salario: number | null
          nombre: string
          saldo_inicial: number | null
          tipo: string
          tipo_incremento: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          aplica_a?: Json
          aplica_hasta_smlv?: number | null
          created_at?: string | null
          descripcion?: string | null
          escenario_id: string
          frecuencia: string
          id?: string
          meses_aplica?: number[] | null
          monto_fijo?: number | null
          monto_porcentaje_salario?: number | null
          nombre: string
          saldo_inicial?: number | null
          tipo: string
          tipo_incremento?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          aplica_a?: Json
          aplica_hasta_smlv?: number | null
          created_at?: string | null
          descripcion?: string | null
          escenario_id?: string
          frecuencia?: string
          id?: string
          meses_aplica?: number[] | null
          monto_fijo?: number | null
          monto_porcentaje_salario?: number | null
          nombre?: string
          saldo_inicial?: number | null
          tipo?: string
          tipo_incremento?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provisiones_config_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      proyeccion_manual: {
        Row: {
          abril: number | null
          agosto: number | null
          config_id: string
          created_at: string | null
          diciembre: number | null
          enero: number | null
          febrero: number | null
          id: string
          julio: number | null
          junio: number | null
          marzo: number | null
          mayo: number | null
          noviembre: number | null
          octubre: number | null
          septiembre: number | null
          updated_at: string | null
        }
        Insert: {
          abril?: number | null
          agosto?: number | null
          config_id: string
          created_at?: string | null
          diciembre?: number | null
          enero?: number | null
          febrero?: number | null
          id?: string
          julio?: number | null
          junio?: number | null
          marzo?: number | null
          mayo?: number | null
          noviembre?: number | null
          octubre?: number | null
          septiembre?: number | null
          updated_at?: string | null
        }
        Update: {
          abril?: number | null
          agosto?: number | null
          config_id?: string
          created_at?: string | null
          diciembre?: number | null
          enero?: number | null
          febrero?: number | null
          id?: string
          julio?: number | null
          junio?: number | null
          marzo?: number | null
          mayo?: number | null
          noviembre?: number | null
          octubre?: number | null
          septiembre?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyeccion_manual_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: true
            referencedRelation: "proyeccion_ventas_config"
            referencedColumns: ["id"]
          },
        ]
      }
      proyeccion_ventas_config: {
        Row: {
          asignaciones: Json | null
          created_at: string | null
          escenario_id: string
          id: string
          marca_id: string
          modo: string
          updated_at: string | null
        }
        Insert: {
          asignaciones?: Json | null
          created_at?: string | null
          escenario_id: string
          id?: string
          marca_id: string
          modo: string
          updated_at?: string | null
        }
        Update: {
          asignaciones?: Json | null
          created_at?: string | null
          escenario_id?: string
          id?: string
          marca_id?: string
          modo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyeccion_ventas_config_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyeccion_ventas_config_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          activo: boolean | null
          asignaciones: Json
          auxilios_detalle: Json | null
          auxilios_no_prestacionales: number | null
          categoria: string | null
          costo_mensual: number
          created_at: string | null
          escenario_id: string
          factor_prestacional_id: string | null
          id: string
          nombre: string
          subtipo: string | null
          tipo: string
          tipo_incremento: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          asignaciones?: Json
          auxilios_detalle?: Json | null
          auxilios_no_prestacionales?: number | null
          categoria?: string | null
          costo_mensual: number
          created_at?: string | null
          escenario_id: string
          factor_prestacional_id?: string | null
          id?: string
          nombre: string
          subtipo?: string | null
          tipo: string
          tipo_incremento?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          asignaciones?: Json
          auxilios_detalle?: Json | null
          auxilios_no_prestacionales?: number | null
          categoria?: string | null
          costo_mensual?: number
          created_at?: string | null
          escenario_id?: string
          factor_prestacional_id?: string | null
          id?: string
          nombre?: string
          subtipo?: string | null
          tipo?: string
          tipo_incremento?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_factor_prestacional_id_fkey"
            columns: ["factor_prestacional_id"]
            isOneToOne: false
            referencedRelation: "factores_prestacionales"
            referencedColumns: ["id"]
          },
        ]
      }
      rutas_logisticas: {
        Row: {
          activo: boolean | null
          codigo: string | null
          created_at: string | null
          escenario_id: string
          id: string
          nombre: string
          operacion_id: string | null
          updated_at: string | null
          vehiculo_id: string
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          escenario_id: string
          id?: string
          nombre: string
          operacion_id?: string | null
          updated_at?: string | null
          vehiculo_id: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          escenario_id?: string
          id?: string
          nombre?: string
          operacion_id?: string | null
          updated_at?: string | null
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rutas_logisticas_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rutas_logisticas_operacion_id_fkey"
            columns: ["operacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rutas_logisticas_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string | null
          id: string
          rol: string
          tenant_activo: boolean | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rol?: string
          tenant_activo?: boolean | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rol?: string
          tenant_activo?: boolean | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          created_at: string | null
          departamento: string | null
          direccion: string | null
          email_contacto: string | null
          id: string
          logo_url: string | null
          nit: string | null
          nombre: string
          razon_social: string | null
          representante_legal: string | null
          slug: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          email_contacto?: string | null
          id?: string
          logo_url?: string | null
          nit?: string | null
          nombre: string
          razon_social?: string | null
          representante_legal?: string | null
          slug: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          email_contacto?: string | null
          id?: string
          logo_url?: string | null
          nit?: string | null
          nombre?: string
          razon_social?: string | null
          representante_legal?: string | null
          slug?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipologias_proyeccion: {
        Row: {
          activo: boolean | null
          clientes_base: number
          config_id: string
          created_at: string | null
          crecimiento_clientes: number | null
          crecimiento_efectividad: number | null
          crecimiento_ticket: number | null
          efectividad_porcentaje: number
          id: string
          nombre: string
          orden: number | null
          ticket_promedio: number
          updated_at: string | null
          visitas_mes: number
        }
        Insert: {
          activo?: boolean | null
          clientes_base?: number
          config_id: string
          created_at?: string | null
          crecimiento_clientes?: number | null
          crecimiento_efectividad?: number | null
          crecimiento_ticket?: number | null
          efectividad_porcentaje?: number
          id?: string
          nombre: string
          orden?: number | null
          ticket_promedio?: number
          updated_at?: string | null
          visitas_mes?: number
        }
        Update: {
          activo?: boolean | null
          clientes_base?: number
          config_id?: string
          created_at?: string | null
          crecimiento_clientes?: number | null
          crecimiento_efectividad?: number | null
          crecimiento_ticket?: number | null
          efectividad_porcentaje?: number
          id?: string
          nombre?: string
          orden?: number | null
          ticket_promedio?: number
          updated_at?: string | null
          visitas_mes?: number
        }
        Relationships: [
          {
            foreignKeyName: "tipologias_proyeccion_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "proyeccion_ventas_config"
            referencedColumns: ["id"]
          },
        ]
      }
      tramos_descuento: {
        Row: {
          created_at: string | null
          descuento_config_id: string
          id: string
          orden: number
          porcentaje_descuento: number
          porcentaje_ventas: number
        }
        Insert: {
          created_at?: string | null
          descuento_config_id: string
          id?: string
          orden: number
          porcentaje_descuento: number
          porcentaje_ventas: number
        }
        Update: {
          created_at?: string | null
          descuento_config_id?: string
          id?: string
          orden?: number
          porcentaje_descuento?: number
          porcentaje_ventas?: number
        }
        Relationships: [
          {
            foreignKeyName: "tramos_descuento_descuento_config_id_fkey"
            columns: ["descuento_config_id"]
            isOneToOne: false
            referencedRelation: "descuentos_config"
            referencedColumns: ["id"]
          },
        ]
      }
      tramos_iva: {
        Row: {
          created_at: string | null
          descuento_config_id: string
          id: string
          orden: number
          porcentaje_ventas: number
          tasa_iva: number
        }
        Insert: {
          created_at?: string | null
          descuento_config_id: string
          id?: string
          orden: number
          porcentaje_ventas: number
          tasa_iva: number
        }
        Update: {
          created_at?: string | null
          descuento_config_id?: string
          id?: string
          orden?: number
          porcentaje_ventas?: number
          tasa_iva?: number
        }
        Relationships: [
          {
            foreignKeyName: "tramos_iva_descuento_config_id_fkey"
            columns: ["descuento_config_id"]
            isOneToOne: false
            referencedRelation: "descuentos_config"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          activo: boolean | null
          asignaciones: Json
          created_at: string | null
          escenario_id: string
          esquema: string
          id: string
          nombre: string
          notas: string | null
          tipo_combustible: string | null
          tipo_incremento: string | null
          tipo_vehiculo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          asignaciones?: Json
          created_at?: string | null
          escenario_id: string
          esquema: string
          id?: string
          nombre: string
          notas?: string | null
          tipo_combustible?: string | null
          tipo_incremento?: string | null
          tipo_vehiculo: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          asignaciones?: Json
          created_at?: string | null
          escenario_id?: string
          esquema?: string
          id?: string
          nombre?: string
          notas?: string | null
          tipo_combustible?: string | null
          tipo_incremento?: string | null
          tipo_vehiculo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos_costos: {
        Row: {
          cajilla_mensual: number | null
          canon_mensual: number | null
          costo_por_viaje: number | null
          created_at: string | null
          cuota_financiacion: number | null
          estado_pago: string | null
          flete_mensual: number | null
          fumigacion_mensual: number | null
          gps_mensual: number | null
          id: string
          incluye_cajilla: boolean | null
          incluye_fumigacion: boolean | null
          incluye_gps: boolean | null
          incluye_lavado: boolean | null
          incluye_mantenimiento: boolean | null
          incluye_seguro_mercancias: boolean | null
          incluye_seguro_vehiculo: boolean | null
          incluye_soat: boolean | null
          lavado_mensual: number | null
          mantenimiento_mensual: number | null
          modalidad_tercero: string | null
          otros_descripcion: string | null
          otros_mensual: number | null
          seguro_mercancias_mensual: number | null
          seguro_vehiculo_mensual: number | null
          soat_mensual: number | null
          tipo_arrendamiento: string | null
          updated_at: string | null
          vehiculo_id: string
          viajes_estimados_mes: number | null
        }
        Insert: {
          cajilla_mensual?: number | null
          canon_mensual?: number | null
          costo_por_viaje?: number | null
          created_at?: string | null
          cuota_financiacion?: number | null
          estado_pago?: string | null
          flete_mensual?: number | null
          fumigacion_mensual?: number | null
          gps_mensual?: number | null
          id?: string
          incluye_cajilla?: boolean | null
          incluye_fumigacion?: boolean | null
          incluye_gps?: boolean | null
          incluye_lavado?: boolean | null
          incluye_mantenimiento?: boolean | null
          incluye_seguro_mercancias?: boolean | null
          incluye_seguro_vehiculo?: boolean | null
          incluye_soat?: boolean | null
          lavado_mensual?: number | null
          mantenimiento_mensual?: number | null
          modalidad_tercero?: string | null
          otros_descripcion?: string | null
          otros_mensual?: number | null
          seguro_mercancias_mensual?: number | null
          seguro_vehiculo_mensual?: number | null
          soat_mensual?: number | null
          tipo_arrendamiento?: string | null
          updated_at?: string | null
          vehiculo_id: string
          viajes_estimados_mes?: number | null
        }
        Update: {
          cajilla_mensual?: number | null
          canon_mensual?: number | null
          costo_por_viaje?: number | null
          created_at?: string | null
          cuota_financiacion?: number | null
          estado_pago?: string | null
          flete_mensual?: number | null
          fumigacion_mensual?: number | null
          gps_mensual?: number | null
          id?: string
          incluye_cajilla?: boolean | null
          incluye_fumigacion?: boolean | null
          incluye_gps?: boolean | null
          incluye_lavado?: boolean | null
          incluye_mantenimiento?: boolean | null
          incluye_seguro_mercancias?: boolean | null
          incluye_seguro_vehiculo?: boolean | null
          incluye_soat?: boolean | null
          lavado_mensual?: number | null
          mantenimiento_mensual?: number | null
          modalidad_tercero?: string | null
          otros_descripcion?: string | null
          otros_mensual?: number | null
          seguro_mercancias_mensual?: number | null
          seguro_vehiculo_mensual?: number | null
          soat_mensual?: number | null
          tipo_arrendamiento?: string | null
          updated_at?: string | null
          vehiculo_id?: string
          viajes_estimados_mes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_costos_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: true
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas: {
        Row: {
          activo: boolean | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          escenario_id: string
          id: string
          nombre: string
          operacion_id: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          escenario_id: string
          id?: string
          nombre: string
          operacion_id: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          escenario_id?: string
          id?: string
          nombre?: string
          operacion_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zonas_escenario_id_fkey"
            columns: ["escenario_id"]
            isOneToOne: false
            referencedRelation: "escenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zonas_operacion_id_fkey"
            columns: ["operacion_id"]
            isOneToOne: false
            referencedRelation: "operaciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      liq_liquidaciones_detalle: {
        Row: {
          ajuste_descripcion: string | null
          ajuste_monto: number | null
          año: number | null
          banco: string | null
          conductor_nombre: string | null
          contratista_documento: string | null
          contratista_id: string | null
          contratista_nombre: string | null
          created_at: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          flete_base: number | null
          id: string | null
          mes: number | null
          notas: string | null
          numero_cuenta: string | null
          numero_periodo: number | null
          placa: string | null
          quincena: number | null
          quincena_id: string | null
          subtotal: number | null
          tipo_cuenta: string | null
          tipo_vehiculo: string | null
          total_a_pagar: number | null
          total_combustible: number | null
          total_deducciones: number | null
          total_fletes_adicionales: number | null
          total_peajes: number | null
          total_pernocta: number | null
          updated_at: string | null
          vehiculo_nombre: string | null
          vehiculo_tercero_id: string | null
          viajes_ejecutados: number | null
          viajes_no_ejecutados: number | null
          viajes_variacion: number | null
        }
        Relationships: [
          {
            foreignKeyName: "liq_liquidaciones_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_pagos_contratista_resumen"
            referencedColumns: ["quincena_id"]
          },
          {
            foreignKeyName: "liq_liquidaciones_quincena_id_fkey"
            columns: ["quincena_id"]
            isOneToOne: false
            referencedRelation: "liq_quincenas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liq_liquidaciones_vehiculo_tercero_id_fkey"
            columns: ["vehiculo_tercero_id"]
            isOneToOne: false
            referencedRelation: "liq_vehiculos_terceros"
            referencedColumns: ["id"]
          },
        ]
      }
      liq_pagos_contratista_resumen: {
        Row: {
          año: number | null
          banco: string | null
          cantidad_vehiculos: number | null
          contratista_id: string | null
          contratista_nombre: string | null
          fecha_pago: string | null
          mes: number | null
          metodo_pago: string | null
          numero_cuenta: string | null
          numero_documento: string | null
          numero_periodo: number | null
          quincena: number | null
          quincena_id: string | null
          referencia_pago: string | null
          total_bruto: number | null
          total_deducciones: number | null
          total_neto: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_descuento_ponderado: {
        Args: { p_descuento_config_id: string }
        Returns: number
      }
      calcular_iva_ponderado: {
        Args: { p_descuento_config_id: string }
        Returns: number
      }
      check_escenario_access: {
        Args: { p_escenario_id: string }
        Returns: boolean
      }
      escenario_belongs_to_active_tenant: {
        Args: { p_escenario_id: string }
        Returns: boolean
      }
      get_active_tenant_id: { Args: never; Returns: string }
      get_escenario_compartido_by_token: {
        Args: { p_token: string }
        Returns: {
          escenario_id: string
          expires_at: string
          id: string
          marca_agua: string
          nombre: string
          revoked_at: string
          secciones: string[]
          snapshot: Json
        }[]
      }
      get_next_periodo_number: {
        Args: { p_año: number; p_escenario_id: string }
        Returns: number
      }
      is_tenant_admin: { Args: never; Returns: boolean }
      marcar_quincena_pagada: {
        Args: { p_metodo_pago?: string; p_pagos: Json; p_quincena_id: string }
        Returns: {
          año: number
          created_at: string
          escenario_id: string
          estado: string
          fecha_fin: string
          fecha_inicio: string
          fecha_liquidacion: string | null
          fecha_pago: string | null
          fecha_validacion: string | null
          id: string
          liquidado_por: string | null
          mes: number | null
          notas: string | null
          numero_periodo: number
          pagado_por: string | null
          quincena: number | null
          updated_at: string
          validado_por: string | null
        }
        SetofOptions: {
          from: "*"
          to: "liq_quincenas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      obtener_descuento_mes: {
        Args: { p_descuento_config_id: string; p_mes: string }
        Returns: number
      }
      user_has_tenant_access: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
