import type { LiquidacionConDeducciones } from '@/lib/hooks/use-liquidaciones'
import type { LiqQuincena, LiqContratista } from '@/types'
import { formatCOP } from './calcular-liquidacion'
import { formatearQuincena } from '@/lib/hooks/use-quincenas'

// Generar HTML de comprobante individual por vehiculo
export function generarComprobanteHTML(
  liquidacion: LiquidacionConDeducciones,
  quincena: LiqQuincena
): string {
  const vt = liquidacion.vehiculo_tercero
  const contratista = vt?.contratista
  const vehiculo = vt?.vehiculo

  const fechaGeneracion = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Liquidacion - ${vt?.placa || 'Sin placa'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 14px;
      font-weight: normal;
      color: #666;
      margin-top: 5px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .info-box {
      flex: 1;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 5px;
      margin: 0 5px;
    }
    .info-box:first-child {
      margin-left: 0;
    }
    .info-box:last-child {
      margin-right: 0;
    }
    .info-box h3 {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 5px;
    }
    .info-box p {
      font-size: 14px;
      font-weight: bold;
    }
    .info-box span {
      font-size: 11px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }
    td.number {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    .subtotal-row {
      background: #f9f9f9;
      font-weight: 600;
    }
    .deduccion-row {
      color: #c00;
    }
    .total-row {
      background: #333;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .total-row td {
      border-bottom: none;
    }
    .deducciones-section {
      margin-top: 20px;
    }
    .deducciones-section h3 {
      font-size: 14px;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #ccc;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 50px;
      padding-top: 5px;
    }
    .meta-info {
      margin-top: 20px;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Comprobante de Liquidacion</h1>
    <h2>${formatearQuincena(quincena)}</h2>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>Vehiculo</h3>
      <p>${vt?.placa || 'Sin placa'}</p>
      <span>${vehiculo?.nombre || ''}</span>
    </div>
    <div class="info-box">
      <h3>Contratista</h3>
      <p>${contratista?.nombre || 'Sin contratista'}</p>
      <span>${contratista?.tipo_documento || ''} ${contratista?.numero_documento || ''}</span>
    </div>
    <div class="info-box">
      <h3>Conductor</h3>
      <p>${vt?.conductor_nombre || 'No asignado'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th style="text-align: right">Valor</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Flete base</strong><br>
          <span style="color: #666; font-size: 11px;">
            ${liquidacion.viajes_ejecutados} viajes ejecutados
            ${(liquidacion.viajes_variacion ?? 0) > 0 ? ` + ${liquidacion.viajes_variacion} otra ruta` : ''}
            ${(liquidacion.viajes_no_ejecutados ?? 0) > 0 ? ` - ${liquidacion.viajes_no_ejecutados} no ejecutados` : ''}
          </span>
        </td>
        <td class="number">${formatCOP(liquidacion.flete_base)}</td>
      </tr>
      ${liquidacion.total_combustible > 0 ? `
      <tr>
        <td>Combustible</td>
        <td class="number">${formatCOP(liquidacion.total_combustible)}</td>
      </tr>
      ` : ''}
      ${liquidacion.total_peajes > 0 ? `
      <tr>
        <td>Peajes</td>
        <td class="number">${formatCOP(liquidacion.total_peajes)}</td>
      </tr>
      ` : ''}
      ${liquidacion.total_fletes_adicionales > 0 ? `
      <tr>
        <td>Fletes adicionales</td>
        <td class="number">${formatCOP(liquidacion.total_fletes_adicionales)}</td>
      </tr>
      ` : ''}
      ${liquidacion.total_pernocta > 0 ? `
      <tr>
        <td>Pernocta</td>
        <td class="number">${formatCOP(liquidacion.total_pernocta)}</td>
      </tr>
      ` : ''}
      ${liquidacion.ajuste_monto !== 0 ? `
      <tr>
        <td>Ajuste${liquidacion.ajuste_descripcion ? ` (${liquidacion.ajuste_descripcion})` : ''}</td>
        <td class="number" style="color: ${liquidacion.ajuste_monto < 0 ? '#c00' : '#090'}">
          ${liquidacion.ajuste_monto > 0 ? '+' : ''}${formatCOP(liquidacion.ajuste_monto)}
        </td>
      </tr>
      ` : ''}
      <tr class="subtotal-row">
        <td>Subtotal</td>
        <td class="number">${formatCOP(liquidacion.subtotal)}</td>
      </tr>
      ${liquidacion.deducciones.map((ded) => `
      <tr class="deduccion-row">
        <td>
          ${ded.tipo === 'retencion_1_porciento' ? 'Retencion 1%' : ded.tipo === 'anticipo' ? 'Anticipo' : 'Otro'}
          ${ded.descripcion ? ` - ${ded.descripcion}` : ''}
        </td>
        <td class="number">-${formatCOP(ded.monto)}</td>
      </tr>
      `).join('')}
      <tr class="total-row">
        <td>TOTAL A PAGAR</td>
        <td class="number">${formatCOP(liquidacion.total_a_pagar)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div class="signature-box">
      <div class="signature-line">
        Empresa
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        Contratista
      </div>
    </div>
  </div>

  <div class="meta-info">
    <p>Comprobante generado el ${fechaGeneracion}</p>
    <p>Periodo: ${new Date(quincena.fecha_inicio).toLocaleDateString('es-CO')} - ${new Date(quincena.fecha_fin).toLocaleDateString('es-CO')}</p>
  </div>
</body>
</html>
  `.trim()
}

// Generar consolidado por contratista
export interface ConsolidadoContratista {
  contratista: LiqContratista
  liquidaciones: LiquidacionConDeducciones[]
  totalSubtotal: number
  totalDeducciones: number
  totalAPagar: number
}

export function agruparPorContratista(
  liquidaciones: LiquidacionConDeducciones[]
): ConsolidadoContratista[] {
  const grupos = new Map<string, ConsolidadoContratista>()

  for (const liq of liquidaciones) {
    const contratista = liq.vehiculo_tercero?.contratista
    if (!contratista) continue

    const existing = grupos.get(contratista.id)
    if (existing) {
      existing.liquidaciones.push(liq)
      existing.totalSubtotal += liq.subtotal
      existing.totalDeducciones += liq.total_deducciones
      existing.totalAPagar += liq.total_a_pagar
    } else {
      grupos.set(contratista.id, {
        contratista,
        liquidaciones: [liq],
        totalSubtotal: liq.subtotal,
        totalDeducciones: liq.total_deducciones,
        totalAPagar: liq.total_a_pagar,
      })
    }
  }

  return Array.from(grupos.values()).sort((a, b) =>
    a.contratista.nombre.localeCompare(b.contratista.nombre)
  )
}

// Generar HTML de resumen consolidado por contratista
export function generarResumenConsolidadoHTML(
  consolidados: ConsolidadoContratista[],
  quincena: LiqQuincena
): string {
  const fechaGeneracion = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const totalGeneral = consolidados.reduce(
    (acc, c) => ({
      subtotal: acc.subtotal + c.totalSubtotal,
      deducciones: acc.deducciones + c.totalDeducciones,
      aPagar: acc.aPagar + c.totalAPagar,
    }),
    { subtotal: 0, deducciones: 0, aPagar: 0 }
  )

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumen de Liquidacion - ${formatearQuincena(quincena)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header h2 {
      font-size: 14px;
      font-weight: normal;
      color: #666;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background: #333;
      color: white;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }
    td.number {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .total-row {
      background: #333 !important;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .total-row td {
      border-bottom: none;
    }
    .contratista-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .contratista-header {
      background: #f0f0f0;
      padding: 10px 15px;
      border-radius: 5px 5px 0 0;
      border: 1px solid #ddd;
      border-bottom: none;
    }
    .contratista-header h3 {
      font-size: 14px;
    }
    .contratista-header span {
      font-size: 11px;
      color: #666;
    }
    .contratista-table {
      border: 1px solid #ddd;
      border-radius: 0 0 5px 5px;
    }
    .contratista-total {
      background: #e0e0e0 !important;
      font-weight: bold;
    }
    .meta-info {
      margin-top: 20px;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Resumen de Liquidacion</h1>
    <h2>${formatearQuincena(quincena)}</h2>
  </div>

  <!-- Resumen general -->
  <table>
    <thead>
      <tr>
        <th>Contratista</th>
        <th style="text-align: center">Vehiculos</th>
        <th style="text-align: right">Subtotal</th>
        <th style="text-align: right">Deducciones</th>
        <th style="text-align: right">Total a Pagar</th>
      </tr>
    </thead>
    <tbody>
      ${consolidados.map((c) => `
      <tr>
        <td>
          <strong>${c.contratista.nombre}</strong><br>
          <span style="color: #666; font-size: 11px;">${c.contratista.tipo_documento} ${c.contratista.numero_documento}</span>
        </td>
        <td style="text-align: center">${c.liquidaciones.length}</td>
        <td class="number">${formatCOP(c.totalSubtotal)}</td>
        <td class="number" style="color: #c00">-${formatCOP(c.totalDeducciones)}</td>
        <td class="number"><strong>${formatCOP(c.totalAPagar)}</strong></td>
      </tr>
      `).join('')}
      <tr class="total-row">
        <td>TOTAL GENERAL</td>
        <td style="text-align: center">${consolidados.reduce((sum, c) => sum + c.liquidaciones.length, 0)}</td>
        <td class="number">${formatCOP(totalGeneral.subtotal)}</td>
        <td class="number">-${formatCOP(totalGeneral.deducciones)}</td>
        <td class="number">${formatCOP(totalGeneral.aPagar)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Detalle por contratista -->
  <h2 style="margin: 30px 0 15px; font-size: 16px;">Detalle por Contratista</h2>

  ${consolidados.map((c) => `
  <div class="contratista-section">
    <div class="contratista-header">
      <h3>${c.contratista.nombre}</h3>
      <span>${c.contratista.tipo_documento} ${c.contratista.numero_documento}</span>
      ${c.contratista.banco ? `<span> | Banco: ${c.contratista.banco} - ${c.contratista.tipo_cuenta} ${c.contratista.numero_cuenta}</span>` : ''}
    </div>
    <table class="contratista-table">
      <thead>
        <tr>
          <th>Placa</th>
          <th style="text-align: center">Viajes</th>
          <th style="text-align: right">Flete</th>
          <th style="text-align: right">Otros</th>
          <th style="text-align: right">Deducciones</th>
          <th style="text-align: right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${c.liquidaciones.map((liq) => `
        <tr>
          <td>${liq.vehiculo_tercero?.placa || 'Sin placa'}</td>
          <td style="text-align: center">${liq.viajes_ejecutados}${(liq.viajes_variacion ?? 0) > 0 ? `+${liq.viajes_variacion}v` : ''}</td>
          <td class="number">${formatCOP(liq.flete_base)}</td>
          <td class="number">${formatCOP(liq.total_combustible + liq.total_peajes + liq.total_fletes_adicionales + liq.total_pernocta + liq.ajuste_monto)}</td>
          <td class="number" style="color: #c00">${liq.total_deducciones > 0 ? `-${formatCOP(liq.total_deducciones)}` : '-'}</td>
          <td class="number"><strong>${formatCOP(liq.total_a_pagar)}</strong></td>
        </tr>
        `).join('')}
        <tr class="contratista-total">
          <td colspan="5">Total ${c.contratista.nombre}</td>
          <td class="number">${formatCOP(c.totalAPagar)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  `).join('')}

  <div class="meta-info">
    <p>Resumen generado el ${fechaGeneracion}</p>
    <p>Periodo: ${new Date(quincena.fecha_inicio).toLocaleDateString('es-CO')} - ${new Date(quincena.fecha_fin).toLocaleDateString('es-CO')}</p>
  </div>
</body>
</html>
  `.trim()
}

// Descargar HTML como archivo
export function descargarHTML(html: string, nombreArchivo: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Abrir HTML en nueva ventana para imprimir
export function imprimirHTML(html: string) {
  const ventana = window.open('', '_blank')
  if (ventana) {
    ventana.document.write(html)
    ventana.document.close()
    ventana.focus()
    ventana.print()
  }
}
