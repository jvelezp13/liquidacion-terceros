'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Calculator,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuincena, useUpdateEstadoQuincena, formatearQuincena } from '@/lib/hooks/use-quincenas'
import {
  useLiquidacionesQuincena,
  useGenerarLiquidaciones,
} from '@/lib/hooks/use-liquidaciones'
import { LiquidacionesTable } from '@/components/liquidacion'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'

// Variante de badge por estado
const getBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'borrador':
      return 'secondary'
    case 'validado':
      return 'default'
    case 'liquidado':
      return 'outline'
    case 'pagado':
      return 'outline'
    default:
      return 'secondary'
  }
}

// Traducir estado
const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case 'borrador':
      return 'Borrador'
    case 'validado':
      return 'Validado'
    case 'liquidado':
      return 'Liquidado'
    case 'pagado':
      return 'Pagado'
    default:
      return estado
  }
}

export default function LiquidacionDetallePage() {
  const params = useParams()
  const router = useRouter()
  const quincenaId = params.id as string

  const [showCerrarDialog, setShowCerrarDialog] = useState(false)

  const { data: quincena, isLoading: loadingQuincena } = useQuincena(quincenaId)
  const { data: liquidaciones, isLoading: loadingLiquidaciones } = useLiquidacionesQuincena(quincenaId)

  const generarMutation = useGenerarLiquidaciones()
  const updateEstadoQuincenaMutation = useUpdateEstadoQuincena()

  // Verificar si todas las liquidaciones estan aprobadas
  const todasAprobadas = liquidaciones?.every((liq) => liq.estado === 'aprobado') || false
  const algunaBorrador = liquidaciones?.some((liq) => liq.estado === 'borrador') || false

  // Calcular totales
  const totales = liquidaciones?.reduce(
    (acc, liq) => ({
      subtotal: acc.subtotal + liq.subtotal,
      deducciones: acc.deducciones + liq.total_deducciones,
      aPagar: acc.aPagar + liq.total_a_pagar,
    }),
    { subtotal: 0, deducciones: 0, aPagar: 0 }
  ) || { subtotal: 0, deducciones: 0, aPagar: 0 }

  const handleGenerarLiquidaciones = () => {
    generarMutation.mutate(
      { quincenaId },
      {
        onSuccess: (result) => {
          toast.success(`Se generaron/actualizaron ${result.length} liquidaciones`)
        },
        onError: (error) => {
          toast.error('Error al generar liquidaciones: ' + error.message)
        },
      }
    )
  }

  const handleCerrarLiquidacion = () => {
    updateEstadoQuincenaMutation.mutate(
      {
        id: quincenaId,
        estado: 'liquidado',
      },
      {
        onSuccess: () => {
          toast.success('Quincena marcada como liquidada')
          setShowCerrarDialog(false)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  if (loadingQuincena || loadingLiquidaciones) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
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

  const esEditable = quincena.estado === 'validado'

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/liquidacion')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{formatearQuincena(quincena)}</h1>
              <Badge variant={getBadgeVariant(quincena.estado)}>
                {getEstadoLabel(quincena.estado)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {new Date(quincena.fecha_inicio).toLocaleDateString('es-CO')} -{' '}
              {new Date(quincena.fecha_fin).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {esEditable && (
            <>
              <Button
                variant="outline"
                onClick={handleGenerarLiquidaciones}
                disabled={generarMutation.isPending}
              >
                {generarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generar Liquidaciones
              </Button>
              {liquidaciones && liquidaciones.length > 0 && todasAprobadas && (
                <Button onClick={() => setShowCerrarDialog(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Cerrar Liquidacion
                </Button>
              )}
            </>
          )}
          {quincena.estado === 'liquidado' && (
            <Button onClick={() => router.push(`/liquidacion/${quincenaId}/comprobantes`)}>
              <FileText className="mr-2 h-4 w-4" />
              Ver Comprobantes
            </Button>
          )}
        </div>
      </div>

      {/* Resumen */}
      {liquidaciones && liquidaciones.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Liquidaciones</CardDescription>
              <CardTitle className="text-2xl">{liquidaciones.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Subtotal</CardDescription>
              <CardTitle className="text-2xl font-mono">{formatCOP(totales.subtotal)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Deducciones</CardDescription>
              <CardTitle className="text-2xl font-mono text-red-600">
                -{formatCOP(totales.deducciones)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-primary">
            <CardHeader className="pb-2">
              <CardDescription>Total a Pagar</CardDescription>
              <CardTitle className="text-2xl font-mono">{formatCOP(totales.aPagar)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Instrucciones o warnings */}
      {esEditable && algunaBorrador && liquidaciones && liquidaciones.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <Calculator className="h-5 w-5" />
              <span>
                Hay liquidaciones en borrador. Expande cada fila para revisar el desglose,
                agregar deducciones y aprobar.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de liquidaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Liquidaciones por Vehiculo</CardTitle>
          <CardDescription>
            {liquidaciones?.length || 0} vehiculos en esta quincena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LiquidacionesTable
            liquidaciones={liquidaciones || []}
            quincenaId={quincenaId}
            isLoading={generarMutation.isPending}
            esEditable={esEditable}
          />
        </CardContent>
      </Card>

      {/* Dialog para confirmar cierre */}
      <AlertDialog open={showCerrarDialog} onOpenChange={setShowCerrarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar Liquidacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esto marcara la quincena como liquidada. Ya no podras editar las liquidaciones
              ni agregar deducciones. Asegurate de que todas las liquidaciones estan correctas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span>Total a pagar:</span>
                <span className="font-bold font-mono">{formatCOP(totales.aPagar)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Vehiculos:</span>
                <span>{liquidaciones?.length}</span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCerrarLiquidacion}
              disabled={updateEstadoQuincenaMutation.isPending}
            >
              {updateEstadoQuincenaMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
