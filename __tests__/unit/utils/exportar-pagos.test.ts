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
      expect(filas[0].numeroIdentificacion).toBe('12345678')
      expect(filas[0].nombre).toBe('Juan Perez')
      expect(filas[0].monto).toBe(500000)
      expect(filas[0].tipoIdentificacion).toBe('CC')
      expect(filas[0].tipoCuentaBancaria).toBe('Ahorros')
      expect(filas[0].numeroCuentaBancaria).toBe('123456789')
      expect(filas[0].nombreBanco).toBe('Bancolombia')
      expect(filas[0].correoElectronico).toBe('juan@test.com')
    })

    it('debe generar números de comprobante secuenciales', () => {
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

      expect(filas[0].numeroComprobante).toBe('202505Q1-001')
      expect(filas[1].numeroComprobante).toBe('202505Q1-002')
    })

    it('debe parsear teléfono con prefijo +57', () => {
      const consolidados: ConsolidadoContratista[] = [
        {
          contratista: {
            id: 'c1',
            nombre: 'Test',
            numero_documento: '123',
            tipo_documento: 'CC',
            telefono: '+57 3001234567',
          },
          liquidaciones: [],
          totalAPagar: 100000,
        } as ConsolidadoContratista,
      ]

      const filas = generarFilasPayana(consolidados, quincenaMock)

      expect(filas[0].prefijoWhatsApp).toBe('57')
      expect(filas[0].numeroWhatsApp).toBe('3001234567')
    })

    it('debe parsear teléfono sin prefijo (asumir +57)', () => {
      const consolidados: ConsolidadoContratista[] = [
        {
          contratista: {
            id: 'c1',
            nombre: 'Test',
            numero_documento: '123',
            tipo_documento: 'CC',
            telefono: '3001234567',
          },
          liquidaciones: [],
          totalAPagar: 100000,
        } as ConsolidadoContratista,
      ]

      const filas = generarFilasPayana(consolidados, quincenaMock)

      expect(filas[0].prefijoWhatsApp).toBe('57')
      expect(filas[0].numeroWhatsApp).toBe('3001234567')
    })

    it('debe parsear teléfono con 57 al inicio', () => {
      const consolidados: ConsolidadoContratista[] = [
        {
          contratista: {
            id: 'c1',
            nombre: 'Test',
            numero_documento: '123',
            tipo_documento: 'CC',
            telefono: '573001234567',
          },
          liquidaciones: [],
          totalAPagar: 100000,
        } as ConsolidadoContratista,
      ]

      const filas = generarFilasPayana(consolidados, quincenaMock)

      expect(filas[0].prefijoWhatsApp).toBe('57')
      expect(filas[0].numeroWhatsApp).toBe('3001234567')
    })

    it('debe manejar campos vacíos correctamente', () => {
      const consolidados: ConsolidadoContratista[] = [
        {
          contratista: {
            id: 'c1',
            nombre: 'Test',
            numero_documento: '123',
            tipo_documento: 'CC',
            email: null,
            telefono: null,
            banco: null,
            tipo_cuenta: null,
            numero_cuenta: null,
          },
          liquidaciones: [],
          totalAPagar: 100000,
        } as ConsolidadoContratista,
      ]

      const filas = generarFilasPayana(consolidados, quincenaMock)

      expect(filas[0].correoElectronico).toBe('')
      expect(filas[0].nombreBanco).toBe('')
      expect(filas[0].tipoCuentaBancaria).toBe('')
      expect(filas[0].numeroCuentaBancaria).toBe('')
      expect(filas[0].prefijoWhatsApp).toBe('')
      expect(filas[0].numeroWhatsApp).toBe('')
    })
  })

  describe('generarCSVPayana', () => {
    it('debe generar CSV con headers correctos', () => {
      const filas: FilaPayana[] = [
        {
          numeroIdentificacion: '12345678',
          nombre: 'Juan Perez',
          numeroComprobante: '202505Q1-001',
          monto: 500000,
          tipoIdentificacion: 'CC',
          tipoCuentaBancaria: 'Ahorros',
          numeroCuentaBancaria: '123456789',
          nombreBanco: 'Bancolombia',
          correoElectronico: 'juan@test.com',
          concepto: 'Q1 Mayo 2025',
          fechaEmision: '22/01/2025',
          fechaVencimiento: '22/01/2025',
          etiqueta: '',
          prefijoWhatsApp: '57',
          numeroWhatsApp: '3001234567',
        },
      ]

      const csv = generarCSVPayana(filas)
      const lineas = csv.split('\n')

      expect(lineas[0]).toContain('PROVEEDOR Nro. identificacion')
      expect(lineas[0]).toContain('PROVEEDOR Nombre')
      expect(lineas[0]).toContain('Monto')
      expect(lineas.length).toBe(2) // Header + 1 fila
    })

    it('debe escapar campos con comas correctamente', () => {
      const filas: FilaPayana[] = [
        {
          numeroIdentificacion: '123',
          nombre: 'Perez, Juan',
          numeroComprobante: '001',
          monto: 100000,
          tipoIdentificacion: 'CC',
          tipoCuentaBancaria: '',
          numeroCuentaBancaria: '',
          nombreBanco: '',
          correoElectronico: '',
          concepto: 'Test',
          fechaEmision: '01/01/2025',
          fechaVencimiento: '01/01/2025',
          etiqueta: '',
          prefijoWhatsApp: '',
          numeroWhatsApp: '',
        },
      ]

      const csv = generarCSVPayana(filas)

      expect(csv).toContain('"Perez, Juan"')
    })

    it('debe generar CSV con múltiples filas', () => {
      const filas: FilaPayana[] = [
        {
          numeroIdentificacion: '111',
          nombre: 'Persona 1',
          numeroComprobante: '001',
          monto: 100000,
          tipoIdentificacion: 'CC',
          tipoCuentaBancaria: '',
          numeroCuentaBancaria: '',
          nombreBanco: '',
          correoElectronico: '',
          concepto: 'Test',
          fechaEmision: '01/01/2025',
          fechaVencimiento: '01/01/2025',
          etiqueta: '',
          prefijoWhatsApp: '',
          numeroWhatsApp: '',
        },
        {
          numeroIdentificacion: '222',
          nombre: 'Persona 2',
          numeroComprobante: '002',
          monto: 200000,
          tipoIdentificacion: 'CC',
          tipoCuentaBancaria: '',
          numeroCuentaBancaria: '',
          nombreBanco: '',
          correoElectronico: '',
          concepto: 'Test',
          fechaEmision: '01/01/2025',
          fechaVencimiento: '01/01/2025',
          etiqueta: '',
          prefijoWhatsApp: '',
          numeroWhatsApp: '',
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
          numeroIdentificacion: '111',
          nombre: 'P1',
          numeroComprobante: '001',
          monto: 100000,
          tipoIdentificacion: 'CC',
          tipoCuentaBancaria: '',
          numeroCuentaBancaria: '',
          nombreBanco: '',
          correoElectronico: '',
          concepto: 'Test',
          fechaEmision: '01/01/2025',
          fechaVencimiento: '01/01/2025',
          etiqueta: '',
          prefijoWhatsApp: '',
          numeroWhatsApp: '',
        },
        {
          numeroIdentificacion: '222',
          nombre: 'P2',
          numeroComprobante: '002',
          monto: 250000,
          tipoIdentificacion: 'CC',
          tipoCuentaBancaria: '',
          numeroCuentaBancaria: '',
          nombreBanco: '',
          correoElectronico: '',
          concepto: 'Test',
          fechaEmision: '01/01/2025',
          fechaVencimiento: '01/01/2025',
          etiqueta: '',
          prefijoWhatsApp: '',
          numeroWhatsApp: '',
        },
      ]

      const totales = calcularTotalesPayana(filas)

      expect(totales.totalContratistas).toBe(2)
      expect(totales.totalMonto).toBe(350000)
    })

    it('debe retornar ceros para array vacío', () => {
      const totales = calcularTotalesPayana([])

      expect(totales.totalContratistas).toBe(0)
      expect(totales.totalMonto).toBe(0)
    })
  })
})
