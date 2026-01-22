'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuincenasPorEstado, useQuincena, formatearQuincena } from '@/lib/hooks/use-quincenas'
import { useLiquidacionesQuincena } from '@/lib/hooks/use-liquidaciones'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import { agruparPorContratista } from '@/lib/utils/generar-comprobante'
import {
  generarFilasPayana,
  generarCSVPayana,
  generarCSVSimplificado,
  descargarCSV,
  calcularTotalesPayana,
  type FilaPayana,
} from '@/lib/utils/exportar-payana'
import type { LiqQuincena } from '@/types'

// Wrapper con Suspense para useSearchParams
export default function ExportarPayanaPage() {
  return (
    <Suspense fallback={
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    }>
      <ExportarPayanaContent />
    </Suspense>
  )
}

function ExportarPayanaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quincenaParam = searchParams.get('quincena')

  const [selectedQuincenaId, setSelectedQuincenaId] = useState<string>(quincenaParam || '')

  const { data: quincenasLiquidadas, isLoading: loadingQuincenas } = useQuincenasPorEstado('liquidado')
  const { data: quincena } = useQuincena(selectedQuincenaId || undefined)
  const { data: liquidaciones, isLoading: loadingLiquidaciones } = useLiquidacionesQuincena(
    selectedQuincenaId || undefined
  )

  // Actualizar si viene por URL
  useEffect(() => {
    if (quincenaParam) {
      setSelectedQuincenaId(quincenaParam)
    }
  }, [quincenaParam])

  const consolidados = liquidaciones ? agruparPorContratista(liquidaciones) : []
  const filasPayana = quincena ? generarFilasPayana(consolidados, quincena) : []
  const totales = calcularTotalesPayana(filasPayana)

  const handleExportarCompleto = () => {
    if (!quincena || filasPayana.length === 0) return
    const csv = generarCSVPayana(filasPayana)
    const nombreArchivo = `payana-${quincena.año}-${quincena.mes}-Q${quincena.quincena}.csv`
    descargarCSV(csv, nombreArchivo)
    toast.success('Archivo exportado')
  }

  const handleExportarSimplificado = () => {
    if (!quincena || filasPayana.length === 0) return
    const csv = generarCSVSimplificado(filasPayana)
    const nombreArchivo = `pagos-${quincena.año}-${quincena.mes}-Q${quincena.quincena}.csv`
    descargarCSV(csv, nombreArchivo)
    toast.success('Archivo exportado')
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/pagos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exportar para Payana</h1>
          <p className="text-muted-foreground">
            Genera el archivo de pagos consolidados por contratista
          </p>
        </div>
      </div>

      {/* Selector de quincena */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona Quincena</CardTitle>
          <CardDescription>
            Elige el periodo para exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!quincenasLiquidadas || quincenasLiquidadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay quincenas liquidadas disponibles para exportar.</p>
              <p className="text-sm mt-1">
                Completa el proceso de liquidacion primero.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/liquidacion')}
              >
                Ir a Liquidacion
              </Button>
            </div>
          ) : (
            <Select value={selectedQuincenaId} onValueChange={setSelectedQuincenaId}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Selecciona una quincena" />
              </SelectTrigger>
              <SelectContent>
                {quincenasLiquidadas.map((q: LiqQuincena) => (
                  <SelectItem key={q.id} value={q.id}>
                    {formatearQuincena(q)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Vista previa y exportación */}
      {selectedQuincenaId && quincena && (
        <>
          {/* Resumen */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Contratistas</CardDescription>
                <CardTitle className="text-2xl">{totales.totalContratistas}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total a Pagar</CardDescription>
                <CardTitle className="text-2xl font-mono">{formatCOP(totales.totalMonto)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Estado</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Listo
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Vista previa */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>
                  Datos que se incluiran en el archivo
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportarSimplificado}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV Simple
                </Button>
                <Button onClick={handleExportarCompleto}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  CSV Completo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLiquidaciones ? (
                <Skeleton className="h-64" />
              ) : filasPayana.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos para exportar
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Documento</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead>Tipo Cuenta</TableHead>
                        <TableHead>Numero Cuenta</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Descripcion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filasPayana.map((fila: FilaPayana, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Badge variant="outline">
                              {fila.tipoDocumento} {fila.numeroDocumento}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{fila.nombre}</TableCell>
                          <TableCell>{fila.banco || '-'}</TableCell>
                          <TableCell>{fila.tipoCuenta || '-'}</TableCell>
                          <TableCell className="font-mono">{fila.numeroCuenta || '-'}</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {formatCOP(fila.monto)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fila.descripcion}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formato de exportación */}
          <Card>
            <CardHeader>
              <CardTitle>Formato de Exportacion</CardTitle>
              <CardDescription>
                Campos incluidos en cada version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">CSV Completo</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Tipo de documento</li>
                    <li>Numero de documento</li>
                    <li>Nombre del contratista</li>
                    <li>Banco</li>
                    <li>Tipo de cuenta</li>
                    <li>Numero de cuenta</li>
                    <li>Monto</li>
                    <li>Descripcion</li>
                    <li>Email</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">CSV Simple</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Documento (tipo + numero)</li>
                    <li>Nombre</li>
                    <li>Cuenta (banco + tipo + numero)</li>
                    <li>Monto</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
