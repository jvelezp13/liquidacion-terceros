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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  Download,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuincenasPorEstado, formatearQuincena } from '@/lib/hooks/use-quincenas'
import { useLiquidacionesQuincena } from '@/lib/hooks/use-liquidaciones'
import { useContratistas } from '@/lib/hooks/use-contratistas'
import {
  useRegistrarPago,
  useMarcarQuincenaPagada,
} from '@/lib/hooks/use-historial-pagos'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import { agruparPorContratista, type ConsolidadoContratista } from '@/lib/utils/generar-comprobante'
import type { LiqQuincena } from '@/types'

export default function PagosPage() {
  const router = useRouter()
  const [selectedQuincena, setSelectedQuincena] = useState<LiqQuincena | null>(null)
  const [showRegistrarDialog, setShowRegistrarDialog] = useState(false)
  const [showConfirmarPagadaDialog, setShowConfirmarPagadaDialog] = useState(false)
  const [selectedContratista, setSelectedContratista] = useState<ConsolidadoContratista | null>(null)
  const [referenciaPago, setReferenciaPago] = useState('')
  const [bancoOrigen, setBancoOrigen] = useState('')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0])

  const { data: quincenasLiquidadas, isLoading: loadingQuincenas } = useQuincenasPorEstado('liquidado')
  const { data: liquidaciones, isLoading: loadingLiquidaciones } = useLiquidacionesQuincena(
    selectedQuincena?.id
  )
  const { data: contratistas } = useContratistas()

  const registrarPagoMutation = useRegistrarPago()
  const marcarPagadaMutation = useMarcarQuincenaPagada()

  const consolidados = liquidaciones ? agruparPorContratista(liquidaciones) : []

  const handleRegistrarPago = () => {
    if (!selectedQuincena || !selectedContratista) return

    registrarPagoMutation.mutate(
      {
        quincena_id: selectedQuincena.id,
        contratista_id: selectedContratista.contratista.id,
        monto_total: selectedContratista.totalAPagar,
        referencia_pago: referenciaPago || undefined,
        metodo_pago: bancoOrigen || undefined,
        fecha_pago: fechaPago,
      },
      {
        onSuccess: () => {
          toast.success('Pago registrado')
          setShowRegistrarDialog(false)
          setReferenciaPago('')
          setBancoOrigen('')
          setSelectedContratista(null)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleMarcarPagada = () => {
    if (!selectedQuincena) return

    // Preparar datos de pagos desde consolidados
    const pagos = consolidados.map((c) => ({
      contratista_id: c.contratista.id,
      monto_total: c.totalAPagar,
    }))

    marcarPagadaMutation.mutate(
      {
        quincenaId: selectedQuincena.id,
        pagos,
        metodoPago: 'transferencia',
        liquidaciones: liquidaciones || undefined,
        quincena: selectedQuincena,
      },
      {
        onSuccess: (data) => {
          const sincMsg = data.sincronizacion
            ? ` (${data.sincronizacion.vehiculos} vehiculos, ${data.sincronizacion.lejanias} lejanias sincronizados)`
            : ''
          toast.success(`Periodo marcado como pagado${sincMsg}`)
          setShowConfirmarPagadaDialog(false)
          setSelectedQuincena(null)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  if (loadingQuincenas) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
        <p className="text-muted-foreground">
          Registra y gestiona los pagos a contratistas
        </p>
      </div>

      {/* Periodos liquidados pendientes de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Periodos Pendientes de Pago
          </CardTitle>
          <CardDescription>
            Liquidaciones aprobadas listas para procesar pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!quincenasLiquidadas || quincenasLiquidadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay periodos pendientes de pago.</p>
              <p className="text-sm mt-1">
                Los periodos liquidados apareceran aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quincenasLiquidadas.map((quincena: LiqQuincena) => (
                <Card
                  key={quincena.id}
                  className={`cursor-pointer transition-colors ${
                    selectedQuincena?.id === quincena.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedQuincena(quincena)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        {formatearQuincena(quincena)}
                      </CardTitle>
                      <Badge variant="default">Liquidado</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quincena.fecha_liquidacion || '').toLocaleDateString('es-CO')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalle de quincena seleccionada */}
      {selectedQuincena && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Pagos - {formatearQuincena(selectedQuincena)}</CardTitle>
              <CardDescription>
                {consolidados.length} contratistas por pagar
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/pagos/exportar?quincena=${selectedQuincena.id}`)}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button onClick={() => setShowConfirmarPagadaDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar Todo Pagado
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingLiquidaciones ? (
              <Skeleton className="h-64" />
            ) : consolidados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay liquidaciones en esta quincena
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contratista</TableHead>
                    <TableHead className="text-center">Vehiculos</TableHead>
                    <TableHead className="text-right">Total a Pagar</TableHead>
                    <TableHead>Datos Bancarios</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
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
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.liquidaciones.length}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCOP(c.totalAPagar)}
                      </TableCell>
                      <TableCell>
                        {c.contratista.banco ? (
                          <div className="text-sm">
                            <p>{c.contratista.banco}</p>
                            <p className="text-muted-foreground">
                              {c.contratista.tipo_cuenta} {c.contratista.numero_cuenta}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin datos</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedContratista(c)
                            setShowRegistrarDialog(true)
                          }}
                        >
                          Registrar Pago
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para registrar pago */}
      <Dialog open={showRegistrarDialog} onOpenChange={setShowRegistrarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {selectedContratista?.contratista.nombre} - {formatCOP(selectedContratista?.totalAPagar || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha de Pago</Label>
              <Input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Referencia de Pago (opcional)</Label>
              <Input
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Numero de transferencia"
              />
            </div>
            <div className="space-y-2">
              <Label>Metodo de Pago (opcional)</Label>
              <Input
                value={bancoOrigen}
                onChange={(e) => setBancoOrigen(e.target.value)}
                placeholder="Transferencia, consignacion, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegistrarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPago} disabled={registrarPagoMutation.isPending}>
              {registrarPagoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar marcar como pagada */}
      <Dialog open={showConfirmarPagadaDialog} onOpenChange={setShowConfirmarPagadaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pago Completado</DialogTitle>
            <DialogDescription>
              ¿Ya exportaste el archivo de pagos? Una vez marcada como pagada, esta quincena no aparecera en la lista de exportacion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmarPagadaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarPagada} disabled={marcarPagadaMutation.isPending}>
              {marcarPagadaMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Si, marcar como pagada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
