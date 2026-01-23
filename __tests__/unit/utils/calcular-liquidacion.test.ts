import { describe, it, expect } from 'vitest'
import {
  calcularDeduccion1Porciento,
  formatCOP,
  calcularPorcentajeEjecucion,
} from '@/lib/utils/calcular-liquidacion'

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
})
