import type { ConsolidadoContratista } from './generar-comprobante'
import type { LiqQuincena } from '@/types'
import { formatearQuincena } from '@/lib/hooks/use-quincenas'

// Formato de fila para exportación Payana
export interface FilaPayana {
  tipoDocumento: string
  numeroDocumento: string
  nombre: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  monto: number
  descripcion: string
  email: string
}

// Generar filas para Payana desde consolidados
export function generarFilasPayana(
  consolidados: ConsolidadoContratista[],
  quincena: LiqQuincena
): FilaPayana[] {
  return consolidados.map((c) => ({
    tipoDocumento: c.contratista.tipo_documento,
    numeroDocumento: c.contratista.numero_documento,
    nombre: c.contratista.nombre,
    banco: c.contratista.banco || '',
    tipoCuenta: c.contratista.tipo_cuenta || '',
    numeroCuenta: c.contratista.numero_cuenta || '',
    monto: c.totalAPagar,
    descripcion: `Pago ${formatearQuincena(quincena)}`,
    email: c.contratista.email || '',
  }))
}

// Generar CSV para Payana
export function generarCSVPayana(filas: FilaPayana[]): string {
  const headers = [
    'Tipo Documento',
    'Numero Documento',
    'Nombre',
    'Banco',
    'Tipo Cuenta',
    'Numero Cuenta',
    'Monto',
    'Descripcion',
    'Email',
  ]

  const rows = filas.map((f) => [
    f.tipoDocumento,
    f.numeroDocumento,
    f.nombre,
    f.banco,
    f.tipoCuenta,
    f.numeroCuenta,
    f.monto.toString(),
    f.descripcion,
    f.email,
  ])

  // Escapar campos con comas o comillas
  const escaparCampo = (campo: string): string => {
    if (campo.includes(',') || campo.includes('"') || campo.includes('\n')) {
      return `"${campo.replace(/"/g, '""')}"`
    }
    return campo
  }

  const lineas = [
    headers.map(escaparCampo).join(','),
    ...rows.map((row) => row.map(escaparCampo).join(',')),
  ]

  return lineas.join('\n')
}

// Generar CSV con formato simplificado (solo lo esencial)
export function generarCSVSimplificado(filas: FilaPayana[]): string {
  const headers = [
    'Documento',
    'Nombre',
    'Cuenta',
    'Monto',
  ]

  const rows = filas.map((f) => [
    `${f.tipoDocumento} ${f.numeroDocumento}`,
    f.nombre,
    `${f.banco} ${f.tipoCuenta} ${f.numeroCuenta}`,
    f.monto.toString(),
  ])

  const escaparCampo = (campo: string): string => {
    if (campo.includes(',') || campo.includes('"') || campo.includes('\n')) {
      return `"${campo.replace(/"/g, '""')}"`
    }
    return campo
  }

  const lineas = [
    headers.map(escaparCampo).join(','),
    ...rows.map((row) => row.map(escaparCampo).join(',')),
  ]

  return lineas.join('\n')
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
