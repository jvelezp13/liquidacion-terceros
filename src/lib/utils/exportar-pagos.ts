import type { ConsolidadoContratista } from './generar-comprobante'
import type { LiqQuincena } from '@/types'
import { formatearQuincena } from '@/lib/hooks/use-quincenas'

// Tipos de medios de pago soportados (expandible en el futuro)
export type MedioPago = 'payana'

// Formato de fila para exportacion Payana (15 campos segun template real)
export interface FilaPayana {
  // Obligatorios
  numeroIdentificacion: string
  nombre: string
  numeroComprobante: string
  monto: number
  // Obligatorios primer pago
  tipoIdentificacion: string
  tipoCuentaBancaria: string
  numeroCuentaBancaria: string
  nombreBanco: string
  correoElectronico: string
  // Opcionales
  concepto: string
  fechaEmision: string
  fechaVencimiento: string
  etiqueta: string
  prefijoWhatsApp: string
  numeroWhatsApp: string
}

// Parsear telefono para extraer prefijo y numero
function parsearTelefono(telefono: string | null | undefined): { prefijo: string; numero: string } {
  if (!telefono) {
    return { prefijo: '', numero: '' }
  }

  // Limpiar espacios extras
  const tel = telefono.trim()

  // Formato esperado: "+57 3001234567" o "573001234567" o "3001234567"
  if (tel.startsWith('+')) {
    // Tiene prefijo con +
    const match = tel.match(/^\+(\d{1,3})\s*(.*)$/)
    if (match) {
      return { prefijo: match[1], numero: match[2].replace(/\s/g, '') }
    }
  } else if (tel.startsWith('57') && tel.length > 10) {
    // Comienza con 57 y tiene mas de 10 digitos
    return { prefijo: '57', numero: tel.substring(2).replace(/\s/g, '') }
  }

  // Sin prefijo, asumir Colombia
  return { prefijo: '57', numero: tel.replace(/\s/g, '') }
}

// Generar numero de comprobante unico
function generarNumeroComprobante(
  quincena: LiqQuincena,
  indice: number
): string {
  // Formato: {año}P{numero_periodo}-{secuencial}
  const secuencial = String(indice + 1).padStart(3, '0')
  return `${quincena.año}P${String(quincena.numero_periodo).padStart(2, '0')}-${secuencial}`
}

// Formatear fecha a DD/MM/YYYY (formato requerido por Payana)
function formatearFechaDDMMYYYY(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

// Generar filas para Payana desde consolidados
export function generarFilasPayana(
  consolidados: ConsolidadoContratista[],
  quincena: LiqQuincena
): FilaPayana[] {
  const hoy = formatearFechaDDMMYYYY(new Date())
  const concepto = formatearQuincena(quincena)

  return consolidados.map((c, index) => {
    const { prefijo, numero } = parsearTelefono(c.contratista.telefono)

    return {
      numeroIdentificacion: c.contratista.numero_documento,
      nombre: c.contratista.nombre,
      numeroComprobante: generarNumeroComprobante(quincena, index),
      monto: c.totalAPagar,
      tipoIdentificacion: c.contratista.tipo_documento,
      tipoCuentaBancaria: c.contratista.tipo_cuenta || '',
      numeroCuentaBancaria: c.contratista.numero_cuenta || '',
      nombreBanco: c.contratista.banco || '',
      correoElectronico: c.contratista.email || '',
      concepto: concepto,
      fechaEmision: hoy,
      fechaVencimiento: hoy, // Mismo dia que emision
      etiqueta: '',
      prefijoWhatsApp: prefijo,
      numeroWhatsApp: numero,
    }
  })
}

// Headers exactos segun template Payana
const HEADERS_PAYANA = [
  'PROVEEDOR Nro. identificacion',
  'PROVEEDOR Nombre',
  'Número de comprobante',
  'Monto',
  'Concepto',
  'Fecha emisión',
  'Fecha vencimiento',
  'Etiqueta',
  'PROVEEDOR Tipo identificacion',
  'PROVEEDOR Tipo cuenta bancaria',
  'PROVEEDOR Numero cuenta bancaria',
  'PROVEEDOR Nombre banco',
  'PROVEEDOR Correo electrónico',
  'PROVEEDOR Prefijo',
  'PROVEEDOR Numero WhatsApp',
]

// Escapar campo para CSV
function escaparCampo(campo: string): string {
  if (campo.includes(',') || campo.includes('"') || campo.includes('\n')) {
    return `"${campo.replace(/"/g, '""')}"`
  }
  return campo
}

// Generar CSV para Payana con 15 columnas
export function generarCSVPayana(filas: FilaPayana[]): string {
  const rows = filas.map((f) => [
    f.numeroIdentificacion,
    f.nombre,
    f.numeroComprobante,
    f.monto.toString(),
    f.concepto,
    f.fechaEmision,
    f.fechaVencimiento,
    f.etiqueta,
    f.tipoIdentificacion,
    f.tipoCuentaBancaria,
    f.numeroCuentaBancaria,
    f.nombreBanco,
    f.correoElectronico,
    f.prefijoWhatsApp,
    f.numeroWhatsApp,
  ])

  const lineas = [
    HEADERS_PAYANA.map(escaparCampo).join(','),
    ...rows.map((row) => row.map(escaparCampo).join(',')),
  ]

  return lineas.join('\n')
}

// Funcion generica para generar CSV segun medio de pago
export function generarCSV(medio: MedioPago, filas: FilaPayana[]): string {
  switch (medio) {
    case 'payana':
      return generarCSVPayana(filas)
    default:
      return generarCSVPayana(filas)
  }
}

// Descargar CSV
export function descargarCSV(csv: string, nombreArchivo: string) {
  // Agregar BOM para Excel
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Calcular totales
export function calcularTotalesPayana(filas: FilaPayana[]) {
  return {
    totalContratistas: filas.length,
    totalMonto: filas.reduce((sum, f) => sum + f.monto, 0),
  }
}

// Informacion de campos por medio de pago (para mostrar en UI)
export const CAMPOS_POR_MEDIO: Record<MedioPago, string[]> = {
  payana: HEADERS_PAYANA,
}

// Nombre legible de cada medio
export const NOMBRES_MEDIOS: Record<MedioPago, string> = {
  payana: 'Payana',
}
