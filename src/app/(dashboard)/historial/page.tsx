'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  ChevronRight,
  DollarSign,
  FileText,
  History,
} from 'lucide-react'
import { useQuincenasPorEstado, useQuincenas, formatearQuincena } from '@/lib/hooks/use-quincenas'
import { useHistorialPagos, type HistorialPagoConQuincena } from '@/lib/hooks/use-historial-pagos'
import { useContratistas } from '@/lib/hooks/use-contratistas'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import type { LiqQuincena, LiqContratista } from '@/types'

export default function HistorialPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('periodos')

  const { data: quincenasPagadas, isLoading: loadingPagadas } = useQuincenasPorEstado('pagado')
  const { data: quincenas, isLoading: loadingQuincenas } = useQuincenas()
  const { data: historialPagos, isLoading: loadingPagos } = useHistorialPagos()
  const { data: contratistas } = useContratistas()

  // Obtener nombre de contratista
  const getNombreContratista = (contratistaId: string): string => {
    const contratista = contratistas?.find((c: LiqContratista) => c.id === contratistaId)
    return contratista?.nombre || 'Desconocido'
  }

  if (loadingPagadas || loadingQuincenas) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  // Todas las quincenas completadas (liquidadas + pagadas)
  const quincenasCompletadas = quincenas?.filter(
    (q) => q.estado === 'liquidado' || q.estado === 'pagado'
  ) || []

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
        <p className="text-muted-foreground">
          Consulta liquidaciones y pagos anteriores
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="periodos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Periodos
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Periodos */}
        <TabsContent value="periodos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Periodos
              </CardTitle>
              <CardDescription>
                Todos los periodos procesados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quincenasCompletadas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay periodos completados.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Liquidacion</TableHead>
                      <TableHead>Fecha Pago</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quincenasCompletadas.map((quincena: LiqQuincena) => (
                      <TableRow key={quincena.id}>
                        <TableCell className="font-medium">
                          {formatearQuincena(quincena)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(quincena.fecha_inicio).toLocaleDateString('es-CO')} -{' '}
                          {new Date(quincena.fecha_fin).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={quincena.estado === 'pagado' ? 'default' : 'secondary'}
                          >
                            {quincena.estado === 'pagado' ? 'Pagado' : 'Liquidado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {quincena.fecha_liquidacion
                            ? new Date(quincena.fecha_liquidacion).toLocaleDateString('es-CO')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {quincena.fecha_pago
                            ? new Date(quincena.fecha_pago).toLocaleDateString('es-CO')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/liquidacion/${quincena.id}/comprobantes`)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagos */}
        <TabsContent value="pagos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Historial de Pagos
              </CardTitle>
              <CardDescription>
                Todos los pagos registrados a contratistas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPagos ? (
                <Skeleton className="h-64" />
              ) : !historialPagos || historialPagos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay pagos registrados.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Contratista</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Metodo Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialPagos.map((pago: HistorialPagoConQuincena) => (
                      <TableRow key={pago.id}>
                        <TableCell className="text-sm">
                          {new Date(pago.fecha_pago).toLocaleDateString('es-CO')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getNombreContratista(pago.contratista_id)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pago.quincena ? formatearQuincena(pago.quincena) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatCOP(pago.monto_total)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {pago.referencia_pago || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {pago.metodo_pago || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Resumen por año */}
          {historialPagos && historialPagos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Total Pagos</p>
                    <p className="text-2xl font-bold">{historialPagos.length}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Contratistas</p>
                    <p className="text-2xl font-bold">
                      {new Set(historialPagos.map((p) => p.contratista_id)).size}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Monto Total</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCOP(historialPagos.reduce((sum, p) => sum + p.monto_total, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
