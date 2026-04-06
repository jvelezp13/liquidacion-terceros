import { describe, it, expect } from 'vitest'
import {
  generarFilasPayana,
  generarCSVPayana,
  calcularTotalesPayana,
  type FilaPayana,
} from '@/lib/utils/exportar-pagos'
import type { ConsolidadoContratista } from '@/lib/utils/generar-comprobante'
import type { LiqQuincena } from '@/types'

describe('exportar-pagos', () => {
  const quincenaMock: LiqQuincena = {
    id: 'q1',
    mes: 5,
    quincena: 1,
    año: 2025,
    fecha_inicio: '2025-05-01',
    fecha_fin: '2025-05-15',
  } as LiqQuincena

  describe('generarFilasPayana', () => {
    it('debe generar filas correctamente desde consolidados', () => {
      const consolidados: ConsolidadoContratista[] = [
        {
          contratista: {
            id: 'c1',
            nombre: 'Juan Perez',
            numero_documento: '12345678',
            tipo_documento: 'CC',
            email: 'juan@test.com',
            telefono: '+57 3001234567',
            banco: 'Bancolombia',
            tipo_cuenta: 'Ahorros',
            numero_cuenta: '123456789',
          },
          liquidaciones: [],
          totalAPagar: 500000,
        } as ConsolidadoContratista,
      ]

      const filas = generarFilasPayana(consolidados, quincenaMock)

      expect(filas).toHaveLength(1)
      expect(filas[0].idProveedor).toBe('12345678')
      expect(filas[0].nombreProveedor).toBe('Juan Perez')
      expect(filas[0].monto).toBe(500000)
      expect(filas[0].concepto).toBeTruthy()
      expect(filas[0].fechaVencimiento).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(filas[0].etiquetas).toBe('')
    })

    it('debe generar filas para multiples consolidados', () => {
      const consolidados: ConsolidadoContratista[] = [
        {
          contratista: {
            id: 'c1',
            nombre: 'Contratista 1',
            numero_documento: '111',
            tipo_documento: 'CC',
          },
          liquidaciones: [],
          totalAPagar: 100000,
        } as ConsolidadoContratista,
        {
          contratista: {
            id: 'c2',
            nombre: 'Contratista 2',
            numero_documento: '222',
            tipo_documento: 'CC',
          },
          liquidaciones: [],
          totalAPagar: 200000,
        } as ConsolidadoContratista,
      ]

      const filas = generarFilasPayana(consolidados, quincenaMock)

      expect(filas).toHaveLength(2)
      expect(filas[0].idProveedor).toBe('111')
      expect(filas[1].idProveedor).toBe('222')
      expect(filas[0].monto).toBe(100000)
      expect(filas[1].monto).toBe(200000)
    })
  })

  describe('generarCSVPayana', () => {
    it('debe generar CSV con headers correctos del template 2026', () => {
      const filas: FilaPayana[] = [
        {
          idProveedor: '12345678',
          nombreProveedor: 'Juan Perez',
          monto: 500000,
          fechaVencimiento: '22/01/2025',
          concepto: 'Q1 Mayo 2025',
          etiquetas: '',
        },
      ]

      const csv = generarCSVPayana(filas)
      const lineas = csv.split('\n')

      expect(lineas[0]).toBe('ID PROVEEDOR,NOMBRE PROVEEDOR,MONTO,FECHA DE VTO,CONCEPTO,ETIQUETAS')
      expect(lineas.length).toBe(2) // Header + 1 fila
    })

    it('debe escapar campos con comas correctamente', () => {
      const filas: FilaPayana[] = [
        {
          idProveedor: '123',
          nombreProveedor: 'Perez, Juan',
          monto: 100000,
          fechaVencimiento: '01/01/2025',
          concepto: 'Test',
          etiquetas: '',
        },
      ]

      const csv = generarCSVPayana(filas)

      expect(csv).toContain('"Perez, Juan"')
    })

    it('debe generar CSV con multiples filas', () => {
      const filas: FilaPayana[] = [
        {
          idProveedor: '111',
          nombreProveedor: 'Persona 1',
          monto: 100000,
          fechaVencimiento: '01/01/2025',
          concepto: 'Test',
          etiquetas: '',
        },
        {
          idProveedor: '222',
          nombreProveedor: 'Persona 2',
          monto: 200000,
          fechaVencimiento: '01/01/2025',
          concepto: 'Test',
          etiquetas: '',
        },
      ]

      const csv = generarCSVPayana(filas)
      const lineas = csv.split('\n')

      expect(lineas.length).toBe(3) // Header + 2 filas
      expect(lineas[1]).toContain('111')
      expect(lineas[2]).toContain('222')
    })
  })

  describe('calcularTotalesPayana', () => {
    it('debe calcular totales correctamente', () => {
      const filas: FilaPayana[] = [
        {
          idProveedor: '111',
          nombreProveedor: 'P1',
          monto: 100000,
          fechaVencimiento: '01/01/2025',
          concepto: 'Test',
          etiquetas: '',
        },
        {
          idProveedor: '222',
          nombreProveedor: 'P2',
          monto: 250000,
          fechaVencimiento: '01/01/2025',
          concepto: 'Test',
          etiquetas: '',
        },
      ]

      const totales = calcularTotalesPayana(filas)

      expect(totales.totalContratistas).toBe(2)
      expect(totales.totalMonto).toBe(350000)
    })

    it('debe retornar ceros para array vacio', () => {
      const totales = calcularTotalesPayana([])

      expect(totales.totalContratistas).toBe(0)
      expect(totales.totalMonto).toBe(0)
    })
  })
})
