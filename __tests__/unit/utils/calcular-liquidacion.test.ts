import { describe, it, expect } from 'vitest'
import {
  calcularDeduccion1Porciento,
  formatCOP,
  calcularPorcentajeEjecucion,
  calcularTotalesViajes,
  calcularLiquidacionVehiculo,
  determinarModalidadPago,
} from '@/lib/utils/calcular-liquidacion'
import type { LiqViajeEjecutado, LiqVehiculoTerceroConDetalles } from '@/types'

describe('calcular-liquidacion', () => {
  describe('calcularDeduccion1Porciento', () => {
    it('debe calcular el 1% de retención correctamente', () => {
      expect(calcularDeduccion1Porciento(100000)).toBe(1000)
      expect(calcularDeduccion1Porciento(250000)).toBe(2500)
      expect(calcularDeduccion1Porciento(0)).toBe(0)
    })

    it('debe redondear correctamente', () => {
      expect(calcularDeduccion1Porciento(12345)).toBe(123) // 123.45 -> 123
      expect(calcularDeduccion1Porciento(12567)).toBe(126) // 125.67 -> 126
    })
  })

  describe('formatCOP', () => {
    it('debe formatear moneda colombiana correctamente', () => {
      // Nota: Intl.NumberFormat usa non-breaking space (\u00A0) después del símbolo $
      expect(formatCOP(100000)).toBe('$\u00A0100.000')
      expect(formatCOP(1000000)).toBe('$\u00A01.000.000')
      expect(formatCOP(0)).toBe('$\u00A00')
    })

    it('no debe mostrar decimales', () => {
      expect(formatCOP(100000.99)).toBe('$\u00A0100.001')
    })
  })

  describe('calcularPorcentajeEjecucion', () => {
    it('debe calcular porcentaje correctamente', () => {
      expect(calcularPorcentajeEjecucion(8, 2, 10)).toBe(100) // 8 + 2 = 10/10 = 100%
      expect(calcularPorcentajeEjecucion(5, 0, 10)).toBe(50) // 5/10 = 50%
      expect(calcularPorcentajeEjecucion(3, 2, 10)).toBe(50) // 3 + 2 = 5/10 = 50%
    })

    it('debe retornar 0 si no hay viajes totales', () => {
      expect(calcularPorcentajeEjecucion(0, 0, 0)).toBe(0)
    })

    it('debe redondear correctamente', () => {
      expect(calcularPorcentajeEjecucion(2, 0, 3)).toBe(67) // 66.66... -> 67
      expect(calcularPorcentajeEjecucion(1, 0, 3)).toBe(33) // 33.33... -> 33
    })
  })

  describe('calcularTotalesViajes', () => {
    it('debe calcular totales de viajes ejecutados correctamente', () => {
      const viajes: LiqViajeEjecutado[] = [
        {
          id: '1',
          quincena_id: 'q1',
          vehiculo_tercero_id: 'v1',
          fecha: '2025-01-01',
          estado: 'ejecutado',
          costo_combustible: 50000,
          costo_peajes: 10000,
          costo_flete_adicional: 5000,
          costo_pernocta: 15000,
          created_at: '',
          updated_at: '',
        } as LiqViajeEjecutado,
        {
          id: '2',
          quincena_id: 'q1',
          vehiculo_tercero_id: 'v1',
          fecha: '2025-01-02',
          estado: 'ejecutado',
          costo_combustible: 60000,
          costo_peajes: 12000,
          costo_flete_adicional: 0,
          costo_pernocta: 0,
          created_at: '',
          updated_at: '',
        } as LiqViajeEjecutado,
      ]

      const totales = calcularTotalesViajes(viajes)

      expect(totales.viajesEjecutados).toBe(2)
      expect(totales.viajesVariacion).toBe(0)
      expect(totales.viajesNoEjecutados).toBe(0)
      expect(totales.totalCombustible).toBe(110000)
      expect(totales.totalPeajes).toBe(22000)
      expect(totales.totalFletesAdicionales).toBe(5000)
      expect(totales.totalPernocta).toBe(15000)
    })

    it('debe contar viajes por estado correctamente', () => {
      const viajes: LiqViajeEjecutado[] = [
        { id: '1', estado: 'ejecutado', costo_combustible: 50000 } as LiqViajeEjecutado,
        { id: '2', estado: 'variacion', costo_combustible: 60000 } as LiqViajeEjecutado,
        { id: '3', estado: 'no_ejecutado' } as LiqViajeEjecutado,
        { id: '4', estado: 'pendiente' } as LiqViajeEjecutado,
      ]

      const totales = calcularTotalesViajes(viajes)

      expect(totales.viajesEjecutados).toBe(1)
      expect(totales.viajesVariacion).toBe(1)
      expect(totales.viajesNoEjecutados).toBe(1)
      // Pendiente no se cuenta
    })

    it('debe retornar ceros si no hay viajes', () => {
      const totales = calcularTotalesViajes([])

      expect(totales.viajesEjecutados).toBe(0)
      expect(totales.viajesVariacion).toBe(0)
      expect(totales.viajesNoEjecutados).toBe(0)
      expect(totales.totalCombustible).toBe(0)
      expect(totales.totalPeajes).toBe(0)
    })
  })

  describe('determinarModalidadPago', () => {
    it('debe detectar modalidad por_viaje en vehículo esporádico', () => {
      const vehiculo = {
        vehiculo_id: null,
        modalidad_costo: 'por_viaje',
      }

      expect(determinarModalidadPago(vehiculo)).toBe('por_viaje')
    })

    it('debe detectar modalidad flete_fijo en vehículo esporádico', () => {
      const vehiculo = {
        vehiculo_id: null,
        modalidad_costo: 'flete_fijo',
      }

      expect(determinarModalidadPago(vehiculo)).toBe('flete_fijo')
    })

    it('debe detectar modalidad por_viaje en vehículo normal', () => {
      const vehiculo = {
        vehiculo_id: 'vh123',
        modalidad_costo: null,
      }
      const costos = {
        modalidad_tercero: 'por_viaje',
      }

      expect(determinarModalidadPago(vehiculo, costos)).toBe('por_viaje')
    })

    it('debe detectar modalidad flete_fijo en vehículo normal', () => {
      const vehiculo = {
        vehiculo_id: 'vh123',
      }
      const costos = {
        modalidad_tercero: 'flete_fijo',
      }

      expect(determinarModalidadPago(vehiculo, costos)).toBe('flete_fijo')
    })

    it('debe retornar null si no hay modalidad definida', () => {
      const vehiculo = {
        vehiculo_id: null,
        modalidad_costo: null,
      }

      expect(determinarModalidadPago(vehiculo)).toBeNull()
    })
  })

  describe('calcularLiquidacionVehiculo', () => {
    it('debe calcular liquidación para vehículo esporádico con modalidad por_viaje', () => {
      const viajes: LiqViajeEjecutado[] = [
        {
          id: '1',
          estado: 'ejecutado',
          costo_combustible: 50000,
          costo_peajes: 10000,
          costo_flete_adicional: 5000,
          costo_pernocta: 15000,
        } as LiqViajeEjecutado,
        {
          id: '2',
          estado: 'ejecutado',
          costo_combustible: 60000,
          costo_peajes: 12000,
          costo_flete_adicional: 0,
          costo_pernocta: 0,
        } as LiqViajeEjecutado,
      ]

      const vehiculo: LiqVehiculoTerceroConDetalles = {
        id: 'v1',
        vehiculo_id: null, // Esporádico
        modalidad_costo: 'por_viaje',
        costo_por_viaje: 100000,
        placa: 'ABC123',
        conductor_nombre: 'Test',
      } as LiqVehiculoTerceroConDetalles

      const resultado = calcularLiquidacionVehiculo(viajes, vehiculo)

      expect(resultado.viajes_ejecutados).toBe(2)
      expect(resultado.viajes_variacion).toBe(0)
      expect(resultado.flete_base).toBe(200000) // 2 viajes * 100000
      expect(resultado.total_combustible).toBe(110000)
      expect(resultado.total_peajes).toBe(22000)
      expect(resultado.total_fletes_adicionales).toBe(5000)
      expect(resultado.total_pernocta).toBe(15000)
      expect(resultado.subtotal).toBe(352000)
      expect(resultado.retencion_1_porciento).toBe(3520)
    })

    it('debe calcular liquidación para vehículo normal con flete_fijo', () => {
      const viajes: LiqViajeEjecutado[] = [
        {
          id: '1',
          estado: 'ejecutado',
          costo_combustible: 50000,
          costo_peajes: 10000,
          costo_flete_adicional: 0,
          costo_pernocta: 0,
        } as LiqViajeEjecutado,
      ]

      const vehiculo: LiqVehiculoTerceroConDetalles = {
        id: 'v1',
        vehiculo_id: 'vh123', // Normal (no esporádico)
        placa: 'ABC123',
        conductor_nombre: 'Test',
        vehiculo_costos: {
          modalidad_tercero: 'flete_fijo',
          flete_mensual: 2000000,
        },
      } as LiqVehiculoTerceroConDetalles

      const resultado = calcularLiquidacionVehiculo(viajes, vehiculo)

      expect(resultado.viajes_ejecutados).toBe(1)
      expect(resultado.flete_base).toBe(1000000) // 2000000 / 2 (quincenal)
      expect(resultado.subtotal).toBe(1060000)
      expect(resultado.retencion_1_porciento).toBe(10600)
    })

    it('debe contar viajes de variación como ejecutados', () => {
      const viajes: LiqViajeEjecutado[] = [
        { id: '1', estado: 'ejecutado', costo_combustible: 50000 } as LiqViajeEjecutado,
        { id: '2', estado: 'variacion', costo_combustible: 60000 } as LiqViajeEjecutado,
        { id: '3', estado: 'no_ejecutado' } as LiqViajeEjecutado,
      ]

      const vehiculo: LiqVehiculoTerceroConDetalles = {
        id: 'v1',
        vehiculo_id: null,
        modalidad_costo: 'por_viaje',
        costo_por_viaje: 100000,
        placa: 'ABC123',
        conductor_nombre: 'Test',
      } as LiqVehiculoTerceroConDetalles

      const resultado = calcularLiquidacionVehiculo(viajes, vehiculo)

      expect(resultado.viajes_ejecutados).toBe(1)
      expect(resultado.viajes_variacion).toBe(1)
      expect(resultado.viajes_no_ejecutados).toBe(1)
      expect(resultado.flete_base).toBe(200000) // 2 viajes pagados * 100000
      expect(resultado.total_combustible).toBe(110000) // Ambos suman
    })
  })
})
