import { describe, it, expect } from 'vitest'
import {
  generarFilasPayana,
  generarXLSXPayana,
  calcularTotalesPayana,
  validarFilas,
  type FilaPayana,
} from '@/lib/utils/exportar-pagos'
import type { ConsolidadoContratista } from '@/lib/utils/generar-comprobante'
import type { LiqQuincena } from '@/types'
import ExcelJS from 'exceljs'

const quincenaMock: LiqQuincena = {
  id: 'q1',
  mes: 5,
  quincena: 1,
  año: 2026,
  numero_periodo: 7,
  fecha_inicio: '2026-05-01',
  fecha_fin: '2026-05-15',
} as LiqQuincena

const contratistaCompleto = {
  id: 'c1',
  nombre: 'Juan Perez',
  numero_documento: '12345678',
  tipo_documento: 'CC',
  email: 'juan@test.com',
  telefono: '+57 3001234567',
  banco: 'BANCOLOMBIA',
  tipo_cuenta: 'ahorros',
  numero_cuenta: '123456789',
}

describe('generarFilasPayana', () => {
  it('mapea los 15 campos del template Payana', () => {
    const consolidados: ConsolidadoContratista[] = [
      { contratista: contratistaCompleto, liquidaciones: [], totalAPagar: 500000 } as unknown as ConsolidadoContratista,
    ]

    const [fila] = generarFilasPayana(consolidados, quincenaMock)

    expect(fila.numeroIdentificacion).toBe('12345678')
    expect(fila.nombre).toBe('Juan Perez')
    expect(fila.monto).toBe(500000)
    expect(fila.tipoIdentificacion).toBe('CC')
    expect(fila.nombreBanco).toBe('BANCOLOMBIA')
    expect(fila.numeroCuentaBancaria).toBe('123456789')
    expect(fila.correoElectronico).toBe('juan@test.com')
    expect(fila.fechaVencimiento).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(fila.fechaEmision).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(fila.etiqueta).toBe('')
  })

  it('normaliza tipo_cuenta en minusculas a capitalizado', () => {
    const consolidados: ConsolidadoContratista[] = [
      { contratista: { ...contratistaCompleto, tipo_cuenta: 'ahorros' }, liquidaciones: [], totalAPagar: 100 } as unknown as ConsolidadoContratista,
      { contratista: { ...contratistaCompleto, id: 'c2', tipo_cuenta: 'CORRIENTE' }, liquidaciones: [], totalAPagar: 200 } as unknown as ConsolidadoContratista,
    ]

    const filas = generarFilasPayana(consolidados, quincenaMock)
    expect(filas[0].tipoCuentaBancaria).toBe('Ahorros')
    expect(filas[1].tipoCuentaBancaria).toBe('Corriente')
  })

  it('parsea telefono con prefijo +57 y lo mapea al formato de la lista Payana', () => {
    const consolidados: ConsolidadoContratista[] = [
      { contratista: { ...contratistaCompleto, telefono: '+57 3001234567' }, liquidaciones: [], totalAPagar: 100 } as unknown as ConsolidadoContratista,
    ]

    const [fila] = generarFilasPayana(consolidados, quincenaMock)
    expect(fila.prefijoWhatsApp).toBe('(+57) Colombia')
    expect(fila.numeroWhatsApp).toBe('3001234567')
  })

  it('deja prefijo y numero vacios si no hay telefono', () => {
    const consolidados: ConsolidadoContratista[] = [
      { contratista: { ...contratistaCompleto, telefono: null }, liquidaciones: [], totalAPagar: 100 } as unknown as ConsolidadoContratista,
    ]

    const [fila] = generarFilasPayana(consolidados, quincenaMock)
    expect(fila.prefijoWhatsApp).toBe('')
    expect(fila.numeroWhatsApp).toBe('')
  })

  it('genera numero de comprobante secuencial con año, mes y numero_periodo', () => {
    const consolidados: ConsolidadoContratista[] = [
      { contratista: contratistaCompleto, liquidaciones: [], totalAPagar: 100 } as unknown as ConsolidadoContratista,
      { contratista: { ...contratistaCompleto, id: 'c2' }, liquidaciones: [], totalAPagar: 200 } as unknown as ConsolidadoContratista,
    ]

    const filas = generarFilasPayana(consolidados, quincenaMock)
    expect(filas[0].numeroComprobante).toBe('202605P07-001')
    expect(filas[1].numeroComprobante).toBe('202605P07-002')
  })
})

describe('validarFilas', () => {
  it('detecta filas con datos bancarios incompletos', () => {
    const filas = generarFilasPayana(
      [
        { contratista: contratistaCompleto, liquidaciones: [], totalAPagar: 100 } as unknown as ConsolidadoContratista,
        { contratista: { ...contratistaCompleto, id: 'c2', nombre: 'Sin banco', banco: null }, liquidaciones: [], totalAPagar: 200 } as unknown as ConsolidadoContratista,
      ],
      quincenaMock
    )

    const advertencias = validarFilas(filas)
    expect(advertencias).toHaveLength(1)
    expect(advertencias[0].nombre).toBe('Sin banco')
    expect(advertencias[0].faltantes).toContain('Nombre banco')
  })

  it('retorna array vacio cuando todas las filas estan completas', () => {
    const filas = generarFilasPayana(
      [{ contratista: contratistaCompleto, liquidaciones: [], totalAPagar: 100 } as unknown as ConsolidadoContratista],
      quincenaMock
    )

    expect(validarFilas(filas)).toHaveLength(0)
  })
})

describe('generarXLSXPayana', () => {
  it('genera un XLSX con header de 15 columnas y una fila por consolidado', async () => {
    const filas: FilaPayana[] = generarFilasPayana(
      [{ contratista: contratistaCompleto, liquidaciones: [], totalAPagar: 500000 } as unknown as ConsolidadoContratista],
      quincenaMock
    )

    const buffer = await generarXLSXPayana(filas)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const ws = wb.getWorksheet('Facturas')
    expect(ws).toBeDefined()
    expect(ws!.columnCount).toBe(15)
    expect(ws!.rowCount).toBeGreaterThanOrEqual(2)

    const headerCell = ws!.getRow(1).getCell(1).value as string
    expect(headerCell).toContain('PROVEEDOR')
    expect(headerCell).toContain('Nro. identificacion')

    const dataRow = ws!.getRow(2)
    expect(dataRow.getCell(1).value).toBe('12345678')
    expect(dataRow.getCell(2).value).toBe('Juan Perez')
    expect(dataRow.getCell(4).value).toBe(500000)
    // Orden real que Payana parsea (no el del template): col 10 = email, col 13 = tipo cuenta
    expect(dataRow.getCell(10).value).toBe('juan@test.com')
    expect(dataRow.getCell(12).value).toBe('BANCOLOMBIA')
    expect(dataRow.getCell(13).value).toBe('Ahorros')
  })
})

describe('calcularTotalesPayana', () => {
  it('suma montos y cuenta contratistas', () => {
    const filas = generarFilasPayana(
      [
        { contratista: contratistaCompleto, liquidaciones: [], totalAPagar: 100000 } as unknown as ConsolidadoContratista,
        { contratista: { ...contratistaCompleto, id: 'c2' }, liquidaciones: [], totalAPagar: 250000 } as unknown as ConsolidadoContratista,
      ],
      quincenaMock
    )

    const totales = calcularTotalesPayana(filas)
    expect(totales.totalContratistas).toBe(2)
    expect(totales.totalMonto).toBe(350000)
  })

  it('retorna ceros con array vacio', () => {
    const totales = calcularTotalesPayana([])
    expect(totales.totalContratistas).toBe(0)
    expect(totales.totalMonto).toBe(0)
  })
})
