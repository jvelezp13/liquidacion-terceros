import type { ConsolidadoContratista } from './generar-comprobante'
import type { LiqQuincena } from '@/types'
import { formatearQuincena } from '@/lib/hooks/use-quincenas'

export type MedioPago = 'payana'

// Campos segun template Payana 2026
export interface FilaPayana {
  idProveedor: string
  nombreProveedor: string
  monto: number
  fechaVencimiento: string
  concepto: string
  etiquetas: string
}

function formatearFechaDDMMYYYY(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

export function generarFilasPayana(
  consolidados: ConsolidadoContratista[],
  quincena: LiqQuincena
): FilaPayana[] {
  const hoy = formatearFechaDDMMYYYY(new Date())
  const concepto = formatearQuincena(quincena)

  return consolidados.map((c) => ({
    idProveedor: c.contratista.numero_documento,
    nombreProveedor: c.contratista.nombre,
    monto: c.totalAPagar,
    fechaVencimiento: hoy,
    concepto,
    etiquetas: '',
  }))
}

const HEADERS_PAYANA = [
  'ID PROVEEDOR',
  'NOMBRE PROVEEDOR',
  'MONTO',
  'FECHA DE VTO',
  'CONCEPTO',
  'ETIQUETAS',
]

function escaparCampo(campo: string): string {
  if (campo.includes(',') || campo.includes('"') || campo.includes('\n')) {
    return `"${campo.replace(/"/g, '""')}"`
  }
  return campo
}

export function generarCSVPayana(filas: FilaPayana[]): string {
  const rows = filas.map((f) => [
    f.idProveedor,
    f.nombreProveedor,
    f.monto.toString(),
    f.fechaVencimiento,
    f.concepto,
    f.etiquetas,
  ])

  const lineas = [
    HEADERS_PAYANA.map(escaparCampo).join(','),
    ...rows.map((row) => row.map(escaparCampo).join(',')),
  ]

  return lineas.join('\n')
}

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

export function calcularTotalesPayana(filas: FilaPayana[]) {
  return {
    totalContratistas: filas.length,
    totalMonto: filas.reduce((sum, f) => sum + f.monto, 0),
  }
}

export const CAMPOS_POR_MEDIO: Record<MedioPago, string[]> = {
  payana: HEADERS_PAYANA,
}

export const NOMBRES_MEDIOS: Record<MedioPago, string> = {
  payana: 'Payana',
}
