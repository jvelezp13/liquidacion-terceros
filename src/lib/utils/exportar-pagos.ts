import ExcelJS from 'exceljs'
import type { ConsolidadoContratista } from './generar-comprobante'
import type { LiqQuincena } from '@/types'
import { formatearQuincena } from '@/lib/hooks/use-quincenas'
import { formatFechaDDMMYYYY } from './formatters'

export type MedioPago = 'payana'

export interface FilaPayana {
  numeroIdentificacion: string
  nombre: string
  numeroComprobante: string
  monto: number
  concepto: string
  fechaEmision: string
  fechaVencimiento: string
  etiqueta: string
  tipoIdentificacion: string
  tipoCuentaBancaria: string
  numeroCuentaBancaria: string
  nombreBanco: string
  correoElectronico: string
  prefijoWhatsApp: string
  numeroWhatsApp: string
}

const PREFIJOS_PAYANA: Record<string, string> = {
  '57': '(+57) Colombia',
  '1': '(+1) Estados Unidos',
  '507': '(+507) Panamá',
  '52': '(+52) México',
  '54': '(+54) Argentina',
}

function parsearTelefono(telefono: string | null | undefined): { prefijo: string; numero: string } {
  if (!telefono) return { prefijo: '', numero: '' }

  const tel = telefono.trim()
  let prefijoNum = ''
  let numero = ''

  if (tel.startsWith('+')) {
    const match = tel.match(/^\+(\d{1,3})\s*(.*)$/)
    if (match) {
      prefijoNum = match[1]
      numero = match[2].replace(/\s/g, '')
    }
  } else if (tel.startsWith('57') && tel.length > 10) {
    prefijoNum = '57'
    numero = tel.substring(2).replace(/\s/g, '')
  } else {
    prefijoNum = '57'
    numero = tel.replace(/\s/g, '')
  }

  return {
    prefijo: PREFIJOS_PAYANA[prefijoNum] || '',
    numero,
  }
}

function normalizarTipoCuenta(tipo: string | null | undefined): string {
  if (!tipo) return ''
  const t = tipo.trim().toLowerCase()
  if (t === 'ahorros') return 'Ahorros'
  if (t === 'corriente') return 'Corriente'
  return ''
}

function generarNumeroComprobante(quincena: LiqQuincena, indice: number): string {
  const mes = String(quincena.mes).padStart(2, '0')
  const periodo = String(quincena.numero_periodo).padStart(2, '0')
  const secuencial = String(indice + 1).padStart(3, '0')
  return `${quincena.año}${mes}P${periodo}-${secuencial}`
}

export function generarFilasPayana(
  consolidados: ConsolidadoContratista[],
  quincena: LiqQuincena
): FilaPayana[] {
  const hoy = formatFechaDDMMYYYY(new Date())
  const concepto = formatearQuincena(quincena)

  return consolidados.map((c, index) => {
    const { prefijo, numero } = parsearTelefono(c.contratista.telefono)

    return {
      numeroIdentificacion: c.contratista.numero_documento,
      nombre: c.contratista.nombre,
      numeroComprobante: generarNumeroComprobante(quincena, index),
      monto: c.totalAPagar,
      concepto,
      fechaEmision: hoy,
      fechaVencimiento: hoy,
      etiqueta: '',
      tipoIdentificacion: c.contratista.tipo_documento,
      tipoCuentaBancaria: normalizarTipoCuenta(c.contratista.tipo_cuenta),
      numeroCuentaBancaria: c.contratista.numero_cuenta || '',
      nombreBanco: c.contratista.banco || '',
      correoElectronico: c.contratista.email || '',
      prefijoWhatsApp: prefijo,
      numeroWhatsApp: numero,
    }
  })
}

// NOTA: Payana ignora los headers y parsea por posición.
// Orden real del parser (bug de su template oficial, contrastado 2026-04-20):
// col 10 = correo electrónico, col 13 = tipo cuenta bancaria.
const HEADERS_PAYANA: { key: keyof FilaPayana; header: string; width: number }[] = [
  { key: 'numeroIdentificacion', header: 'PROVEEDOR\nNro. identificacion\nCampo obligatorio', width: 20 },
  { key: 'nombre', header: 'PROVEEDOR\nNombre\nCampo obligatorio', width: 35 },
  { key: 'numeroComprobante', header: 'Número de comprobante\nCampo obligatorio', width: 22 },
  { key: 'monto', header: 'Monto\nCampo obligatorio', width: 15 },
  { key: 'concepto', header: 'Concepto\nCampo opcional', width: 25 },
  { key: 'fechaEmision', header: 'Fecha emisión\nCampo opcional', width: 15 },
  { key: 'fechaVencimiento', header: 'Fecha vencimiento\nCampo opcional', width: 18 },
  { key: 'etiqueta', header: 'Etiqueta\nCampo opcional\n(Inserta una etiqueta para asignarle al documento)', width: 18 },
  { key: 'tipoIdentificacion', header: 'PROVEEDOR\nTipo identificacion\nCampo obligatorio primer pago\n[Seleccione de la lista]', width: 20 },
  { key: 'correoElectronico', header: 'PROVEEDOR\nCorreo electrónico\nCampo obligatorio primer pago', width: 28 },
  { key: 'numeroCuentaBancaria', header: 'PROVEEDOR\nNumero cuenta bancaria\nCampo obligatorio primer pago\n[Seleccione de la lista]', width: 22 },
  { key: 'nombreBanco', header: 'PROVEEDOR\nNombre banco\nCampo obligatorio primer pago\n[Seleccione de la lista]', width: 30 },
  { key: 'tipoCuentaBancaria', header: 'PROVEEDOR\nTipo cuenta bancaria\nCampo obligatorio primer pago\n[Seleccione de la lista]', width: 22 },
  { key: 'prefijoWhatsApp', header: 'PROVEEDOR\nPrefijo\nCampo opcional\n[Seleccione de la lista]', width: 20 },
  { key: 'numeroWhatsApp', header: 'PROVEEDOR\nNumero WhatsApp\n(omitir prefijo pais)\nCampo opcional', width: 20 },
]

export async function generarXLSXPayana(filas: FilaPayana[]): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Facturas')

  ws.columns = HEADERS_PAYANA.map((h) => ({
    header: h.header,
    key: h.key,
    width: h.width,
  }))

  const headerRow = ws.getRow(1)
  headerRow.height = 90
  headerRow.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }
  headerRow.font = { bold: true }

  filas.forEach((fila) => {
    ws.addRow(fila)
  })

  return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>
}

export function descargarXLSX(buffer: ArrayBuffer, nombreArchivo: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function calcularTotalesPayana(filas: FilaPayana[]) {
  return {
    totalContratistas: filas.length,
    totalMonto: filas.reduce((sum, f) => sum + f.monto, 0),
  }
}

export interface AdvertenciaFila {
  indice: number
  nombre: string
  faltantes: string[]
}

export function validarFilas(filas: FilaPayana[]): AdvertenciaFila[] {
  const advertencias: AdvertenciaFila[] = []

  filas.forEach((f, idx) => {
    const faltantes: string[] = []
    if (!f.tipoIdentificacion) faltantes.push('Tipo identificación')
    if (!f.tipoCuentaBancaria) faltantes.push('Tipo cuenta bancaria')
    if (!f.numeroCuentaBancaria) faltantes.push('Número cuenta bancaria')
    if (!f.nombreBanco) faltantes.push('Nombre banco')
    if (!f.correoElectronico) faltantes.push('Correo electrónico')

    if (faltantes.length > 0) {
      advertencias.push({ indice: idx, nombre: f.nombre, faltantes })
    }
  })

  return advertencias
}

const CAMPOS_PAYANA = HEADERS_PAYANA.map((h) => {
  const [principal, detalle] = h.header.split('\n')
  return detalle ? `${principal} — ${detalle}` : principal
})

export const CAMPOS_POR_MEDIO: Record<MedioPago, string[]> = {
  payana: CAMPOS_PAYANA,
}

export const NOMBRES_MEDIOS: Record<MedioPago, string> = {
  payana: 'Payana',
}
