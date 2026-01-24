'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  Users,
} from 'lucide-react'
import { useQuincena, formatearQuincena } from '@/lib/hooks/use-quincenas'
import { useLiquidacionesQuincena, type LiquidacionConDeducciones } from '@/lib/hooks/use-liquidaciones'
import { useViajesQuincenaCompleta } from '@/lib/hooks/use-viajes-por-liquidacion'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import {
  generarComprobanteHTML,
  generarResumenConsolidadoHTML,
  agruparPorContratista,
  descargarHTML,
  imprimirHTML,
  descargarComprobantesZIP,
  type ConsolidadoContratista,
} from '@/lib/utils/generar-comprobante'

export default function ComprobantesPage() {
  const params = useParams()
  const router = useRouter()
  const quincenaId = params.id as string

  const [activeTab, setActiveTab] = useState('vehiculos')

  const { data: quincena, isLoading: loadingQuincena } = useQuincena(quincenaId)
  const { data: liquidaciones, isLoading: loadingLiquidaciones } = useLiquidacionesQuincena(quincenaId)
  const { data: viajesMap } = useViajesQuincenaCompleta(quincenaId)

  // Memo para evitar recalcular en cada render
  const consolidados = useMemo(
    () => (liquidaciones ? agruparPorContratista(liquidaciones) : []),
    [liquidaciones]
  )

  // Helper para obtener viajes de una liquidacion
  const getViajesLiquidacion = (liquidacion: LiquidacionConDeducciones) => {
    const vtId = liquidacion.vehiculo_tercero?.id
    if (!vtId || !viajesMap) return undefined
    return viajesMap.get(vtId)
  }

  const handleDescargarComprobante = (liquidacion: LiquidacionConDeducciones) => {
    if (!quincena) return
    const viajesData = getViajesLiquidacion(liquidacion)
    const html = generarComprobanteHTML(liquidacion, quincena, viajesData)
    const placa = liquidacion.vehiculo_tercero?.placa || 'sin-placa'
    const nombreArchivo = `comprobante-${placa}-${quincena.año}-${quincena.mes}-Q${quincena.quincena}.html`
    descargarHTML(html, nombreArchivo)
  }

  const handleImprimirComprobante = (liquidacion: LiquidacionConDeducciones) => {
    if (!quincena) return
    const viajesData = getViajesLiquidacion(liquidacion)
    const html = generarComprobanteHTML(liquidacion, quincena, viajesData)
    imprimirHTML(html)
  }

  const handleDescargarResumen = () => {
    if (!quincena || consolidados.length === 0) return
    const html = generarResumenConsolidadoHTML(consolidados, quincena)
    const nombreArchivo = `resumen-liquidacion-${quincena.año}-${quincena.mes}-Q${quincena.quincena}.html`
    descargarHTML(html, nombreArchivo)
  }

  const handleImprimirResumen = () => {
    if (!quincena || consolidados.length === 0) return
    const html = generarResumenConsolidadoHTML(consolidados, quincena)
    imprimirHTML(html)
  }

  const handleDescargarTodos = async () => {
    if (!quincena || !liquidaciones) return

    // Generar todos los comprobantes
    const archivos = liquidaciones.map((liq) => {
      const viajesData = getViajesLiquidacion(liq)
      const html = generarComprobanteHTML(liq, quincena, viajesData)
      const placa = liq.vehiculo_tercero?.placa || 'sin-placa'
      return {
        nombre: `comprobante-${placa}.html`,
        contenido: html,
      }
    })

    // Descargar como ZIP (1 archivo en lugar de N)
    const nombreZip = `comprobantes-${quincena.año}-${quincena.mes}-Q${quincena.quincena}.zip`
    await descargarComprobantesZIP(archivos, nombreZip)
  }

  if (loadingQuincena || loadingLiquidaciones) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!quincena) {
    return (
      <div className="container py-6">
        <div className="text-center text-muted-foreground">
          Quincena no encontrada
          <Button variant="link" onClick={() => router.push('/liquidacion')}>
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/liquidacion/${quincenaId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Comprobantes</h1>
            <p className="text-muted-foreground">{formatearQuincena(quincena)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDescargarResumen}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Resumen
          </Button>
          <Button variant="outline" onClick={handleImprimirResumen}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Resumen
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vehiculos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Por Vehiculo
          </TabsTrigger>
          <TabsTrigger value="contratistas" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Por Contratista
          </TabsTrigger>
        </TabsList>

        {/* Tab: Por Vehículo */}
        <TabsContent value="vehiculos" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comprobantes por Vehiculo</CardTitle>
                <CardDescription>
                  Un comprobante por cada vehiculo liquidado
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleDescargarTodos}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Todos
              </Button>
            </CardHeader>
            <CardContent>
              {!liquidaciones || liquidaciones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay liquidaciones para generar comprobantes
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>Contratista</TableHead>
                      <TableHead className="text-right">Total a Pagar</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liquidaciones.map((liq: LiquidacionConDeducciones) => (
                      <TableRow key={liq.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {liq.vehiculo_tercero?.placa || 'Sin placa'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {liq.vehiculo_tercero?.vehiculo?.nombre || ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {liq.vehiculo_tercero?.contratista?.nombre || 'Sin contratista'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatCOP(liq.total_a_pagar)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={liq.estado === 'aprobado' ? 'default' : 'secondary'}
                            className={liq.estado === 'aprobado' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            {liq.estado.charAt(0).toUpperCase() + liq.estado.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleImprimirComprobante(liq)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDescargarComprobante(liq)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Por Contratista */}
        <TabsContent value="contratistas" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consolidado por Contratista</CardTitle>
              <CardDescription>
                Totales agrupados para realizar pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consolidados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay liquidaciones para consolidar
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contratista</TableHead>
                      <TableHead className="text-center">Vehiculos</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Deducciones</TableHead>
                      <TableHead className="text-right">Total a Pagar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidados.map((c: ConsolidadoContratista) => (
                      <TableRow key={c.contratista.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.contratista.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.contratista.tipo_documento} {c.contratista.numero_documento}
                            </p>
                            {c.contratista.banco && (
                              <p className="text-xs text-muted-foreground">
                                {c.contratista.banco} - {c.contratista.tipo_cuenta}{' '}
                                {c.contratista.numero_cuenta}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {c.liquidaciones.length}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCOP(c.totalSubtotal)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          -{formatCOP(c.totalDeducciones)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatCOP(c.totalAPagar)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Detalle por cada contratista */}
          {consolidados.map((c: ConsolidadoContratista) => (
            <Card key={c.contratista.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{c.contratista.nombre}</CardTitle>
                    <CardDescription>
                      {c.liquidaciones.length} vehiculos - Total:{' '}
                      <span className="font-mono font-bold">
                        {formatCOP(c.totalAPagar)}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead className="text-center">Viajes</TableHead>
                      <TableHead className="text-right">Flete</TableHead>
                      <TableHead className="text-right">Otros</TableHead>
                      <TableHead className="text-right">Deducciones</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.liquidaciones.map((liq) => (
                      <TableRow key={liq.id}>
                        <TableCell className="font-medium">
                          {liq.vehiculo_tercero?.placa || 'Sin placa'}
                        </TableCell>
                        <TableCell className="text-center">
                          {liq.viajes_ejecutados}
                          {(liq.viajes_variacion ?? 0) > 0 && `+${liq.viajes_variacion}v`}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCOP(liq.flete_base)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCOP(
                            liq.total_combustible +
                              liq.total_peajes +
                              liq.total_fletes_adicionales +
                              liq.total_pernocta +
                              liq.ajuste_monto
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {liq.total_deducciones > 0
                            ? `-${formatCOP(liq.total_deducciones)}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatCOP(liq.total_a_pagar)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
