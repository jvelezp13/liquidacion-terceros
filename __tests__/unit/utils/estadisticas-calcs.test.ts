import { describe, it, expect } from 'vitest'
import {
  calcularCostoPorViaje,
  calcularTasaCumplimiento,
  calcularPromedioMensual,
  calcularVariacionPorcentual,
  generarQuincenaLabel,
  calcularPorcentajeDesglose,
  ordenarContratistasPorPago,
  getTopContratistas,
  calcularPromedioCostoPorViaje,
  getColorIntensidad,
  calcularMesesTranscurridos,
  type DatosContratista,
  type DesgloseCostos,
} from '@/lib/utils/estadisticas-calcs'

describe('estadisticas-calcs', () => {
  describe('calcularCostoPorViaje', () => {
    it('calcula correctamente el costo por viaje', () => {
      expect(calcularCostoPorViaje(1000000, 10)).toBe(100000)
    })

    it('retorna 0 si no hay viajes', () => {
      expect(calcularCostoPorViaje(1000000, 0)).toBe(0)
    })

    it('redondea el resultado', () => {
      expect(calcularCostoPorViaje(1000000, 3)).toBe(333333)
    })
  })

  describe('calcularTasaCumplimiento', () => {
    it('calcula correctamente la tasa de cumplimiento', () => {
      expect(calcularTasaCumplimiento(80, 10, 100)).toBe(90)
    })

    it('retorna 0 si no hay viajes totales', () => {
      expect(calcularTasaCumplimiento(0, 0, 0)).toBe(0)
    })

    it('retorna 100 si todos los viajes fueron ejecutados', () => {
      expect(calcularTasaCumplimiento(100, 0, 100)).toBe(100)
    })
  })

  describe('calcularPromedioMensual', () => {
    it('calcula correctamente el promedio mensual', () => {
      expect(calcularPromedioMensual(12000000, 12)).toBe(1000000)
    })

    it('retorna 0 si no hay meses', () => {
      expect(calcularPromedioMensual(12000000, 0)).toBe(0)
    })
  })

  describe('calcularVariacionPorcentual', () => {
    it('calcula aumento porcentual correctamente', () => {
      expect(calcularVariacionPorcentual(120, 100)).toBe(20)
    })

    it('calcula disminucion porcentual correctamente', () => {
      expect(calcularVariacionPorcentual(80, 100)).toBe(-20)
    })

    it('retorna 100 si el valor anterior era 0 y hay valor actual', () => {
      expect(calcularVariacionPorcentual(100, 0)).toBe(100)
    })

    it('retorna 0 si ambos valores son 0', () => {
      expect(calcularVariacionPorcentual(0, 0)).toBe(0)
    })
  })

  describe('generarQuincenaLabel', () => {
    it('genera label para primera quincena de enero', () => {
      expect(generarQuincenaLabel(2025, 1, 1)).toBe('Q1 Ene')
    })

    it('genera label para segunda quincena de diciembre', () => {
      expect(generarQuincenaLabel(2025, 12, 2)).toBe('Q2 Dic')
    })

    it('maneja mes invalido', () => {
      expect(generarQuincenaLabel(2025, 13, 1)).toBe('Q1 N/A')
    })
  })

  describe('calcularPorcentajeDesglose', () => {
    it('calcula porcentajes correctamente', () => {
      const desglose: DesgloseCostos = {
        fleteBases: 500,
        combustible: 200,
        peajes: 100,
        pernocta: 100,
        fletesAdicionales: 100,
        deducciones: 0,
        total: 1000,
      }

      const result = calcularPorcentajeDesglose(desglose)

      expect(result.fleteBases).toBe(50)
      expect(result.combustible).toBe(20)
      expect(result.peajes).toBe(10)
    })

    it('retorna 0 si total es 0', () => {
      const desglose: DesgloseCostos = {
        fleteBases: 0,
        combustible: 0,
        peajes: 0,
        pernocta: 0,
        fletesAdicionales: 0,
        deducciones: 0,
        total: 0,
      }

      const result = calcularPorcentajeDesglose(desglose)

      expect(result.fleteBases).toBe(0)
      expect(result.combustible).toBe(0)
    })
  })

  describe('ordenarContratistasPorPago', () => {
    it('ordena contratistas por total pagado descendente', () => {
      const contratistas: DatosContratista[] = [
        { id: '1', nombre: 'A', totalVehiculos: 1, totalViajes: 10, totalPagado: 100, costoPorViaje: 10, tasaCumplimiento: 100 },
        { id: '2', nombre: 'B', totalVehiculos: 1, totalViajes: 10, totalPagado: 300, costoPorViaje: 30, tasaCumplimiento: 100 },
        { id: '3', nombre: 'C', totalVehiculos: 1, totalViajes: 10, totalPagado: 200, costoPorViaje: 20, tasaCumplimiento: 100 },
      ]

      const result = ordenarContratistasPorPago(contratistas)

      expect(result[0].nombre).toBe('B')
      expect(result[1].nombre).toBe('C')
      expect(result[2].nombre).toBe('A')
    })

    it('no muta el array original', () => {
      const contratistas: DatosContratista[] = [
        { id: '1', nombre: 'A', totalVehiculos: 1, totalViajes: 10, totalPagado: 100, costoPorViaje: 10, tasaCumplimiento: 100 },
        { id: '2', nombre: 'B', totalVehiculos: 1, totalViajes: 10, totalPagado: 300, costoPorViaje: 30, tasaCumplimiento: 100 },
      ]

      ordenarContratistasPorPago(contratistas)

      expect(contratistas[0].nombre).toBe('A')
    })
  })

  describe('getTopContratistas', () => {
    it('retorna los top N contratistas', () => {
      const contratistas: DatosContratista[] = [
        { id: '1', nombre: 'A', totalVehiculos: 1, totalViajes: 10, totalPagado: 100, costoPorViaje: 10, tasaCumplimiento: 100 },
        { id: '2', nombre: 'B', totalVehiculos: 1, totalViajes: 10, totalPagado: 500, costoPorViaje: 50, tasaCumplimiento: 100 },
        { id: '3', nombre: 'C', totalVehiculos: 1, totalViajes: 10, totalPagado: 400, costoPorViaje: 40, tasaCumplimiento: 100 },
        { id: '4', nombre: 'D', totalVehiculos: 1, totalViajes: 10, totalPagado: 300, costoPorViaje: 30, tasaCumplimiento: 100 },
        { id: '5', nombre: 'E', totalVehiculos: 1, totalViajes: 10, totalPagado: 200, costoPorViaje: 20, tasaCumplimiento: 100 },
      ]

      const result = getTopContratistas(contratistas, 3)

      expect(result).toHaveLength(3)
      expect(result[0].nombre).toBe('B')
      expect(result[1].nombre).toBe('C')
      expect(result[2].nombre).toBe('D')
    })

    it('usa default de 5', () => {
      const contratistas: DatosContratista[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        nombre: `C${i}`,
        totalVehiculos: 1,
        totalViajes: 10,
        totalPagado: i * 100,
        costoPorViaje: i * 10,
        tasaCumplimiento: 100,
      }))

      const result = getTopContratistas(contratistas)

      expect(result).toHaveLength(5)
    })
  })

  describe('calcularPromedioCostoPorViaje', () => {
    it('calcula promedio correctamente', () => {
      const contratistas: DatosContratista[] = [
        { id: '1', nombre: 'A', totalVehiculos: 1, totalViajes: 10, totalPagado: 1000, costoPorViaje: 100, tasaCumplimiento: 100 },
        { id: '2', nombre: 'B', totalVehiculos: 1, totalViajes: 10, totalPagado: 2000, costoPorViaje: 200, tasaCumplimiento: 100 },
      ]

      const result = calcularPromedioCostoPorViaje(contratistas)

      // Total: 3000, Viajes: 20, Promedio: 150
      expect(result).toBe(150)
    })

    it('retorna 0 si no hay contratistas', () => {
      expect(calcularPromedioCostoPorViaje([])).toBe(0)
    })
  })

  describe('getColorIntensidad', () => {
    it('retorna slate-100 si max es 0', () => {
      expect(getColorIntensidad(5, 0)).toBe('bg-slate-100')
    })

    it('retorna slate-100 si valor es 0', () => {
      expect(getColorIntensidad(0, 100)).toBe('bg-slate-100')
    })

    it('retorna blue-100 para intensidad baja', () => {
      expect(getColorIntensidad(20, 100)).toBe('bg-blue-100')
    })

    it('retorna blue-400 para intensidad alta', () => {
      expect(getColorIntensidad(80, 100)).toBe('bg-blue-400')
    })
  })

  describe('calcularMesesTranscurridos', () => {
    it('calcula meses en el mismo año', () => {
      const inicio = new Date(2025, 0, 1) // Enero 2025
      const fin = new Date(2025, 5, 1) // Junio 2025

      expect(calcularMesesTranscurridos(inicio, fin)).toBe(6)
    })

    it('calcula meses entre años', () => {
      const inicio = new Date(2024, 10, 1) // Noviembre 2024
      const fin = new Date(2025, 1, 1) // Febrero 2025

      expect(calcularMesesTranscurridos(inicio, fin)).toBe(4)
    })

    it('retorna minimo 1 mes', () => {
      const fecha = new Date(2025, 0, 1)

      expect(calcularMesesTranscurridos(fecha, fecha)).toBe(1)
    })
  })
})
