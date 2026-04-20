'use client'

import { Suspense, useMemo, useState } from 'react'
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
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuincenasPorEstado, useQuincena, formatearQuincena } from '@/lib/hooks/use-quincenas'
import { useLiquidacionesQuincena } from '@/lib/hooks/use-liquidaciones'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import { agruparPorContratista } from '@/lib/utils/generar-comprobante'
import {
  generarFilasPayana,
  generarXLSXPayana,
  descargarXLSX,
  calcularTotalesPayana,
  validarFilas,
  CAMPOS_POR_MEDIO,
  NOMBRES_MEDIOS,
  type FilaPayana,
  type MedioPago,
} from '@/lib/utils/exportar-pagos'
import type { LiqQuincena } from '@/types'

const MEDIOS_DISPONIBLES: MedioPago[] = ['payana']

export default function ExportarPagosPage() {
  return (
    <Suspense fallback={
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    }>
      <ExportarPagosContent />
    </Suspense>
  )
}

function ExportarPagosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quincenaParam = searchParams.get('quincena')

  const [selectedQuincenaId, setSelectedQuincenaId] = useState<string>(quincenaParam || '')
  const [medioPago, setMedioPago] = useState<MedioPago>('payana')
  const [descargando, setDescargando] = useState(false)

  const { data: quincenasLiquidadas, isLoading: loadingQuincenas } = useQuincenasPorEstado('liquidado')
  const { data: quincena } = useQuincena(selectedQuincenaId || undefined)
  const { data: liquidaciones, isLoading: loadingLiquidaciones } = useLiquidacionesQuincena(
    selectedQuincenaId || undefined
  )

  const { filasPayana, totales, advertencias, advertenciasPorIndice } = useMemo(() => {
    const consolidados = liquidaciones ? agruparPorContratista(liquidaciones) : []
    const filas = quincena ? generarFilasPayana(consolidados, quincena) : []
    const advs = validarFilas(filas)
    return {
      filasPayana: filas,
      totales: calcularTotalesPayana(filas),
      advertencias: advs,
      advertenciasPorIndice: new Map(advs.map((a) => [a.indice, a])),
    }
  }, [liquidaciones, quincena])

  const handleDescargar = async () => {
    if (!quincena || filasPayana.length === 0) return
    setDescargando(true)
    try {
      const buffer = await generarXLSXPayana(filasPayana)
      const nombreArchivo = `${medioPago}-${quincena.año}-P${String(quincena.numero_periodo).padStart(2, '0')}.xlsx`
      descargarXLSX(buffer, nombreArchivo)
      toast.success(`Archivo ${NOMBRES_MEDIOS[medioPago]} exportado`)
    } catch (error) {
      console.error(error)
      toast.error('Error al generar el archivo')
    } finally {
      setDescargando(false)
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Exportar Pagos</h1>
          <p className="text-muted-foreground">
            Genera el archivo de pagos consolidados por contratista
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecciona Quincena</CardTitle>
          <CardDescription>Elige el periodo para exportar</CardDescription>
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

      {selectedQuincenaId && quincena && (
        <>
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
                  {advertencias.length === 0 ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      Listo
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-6 w-6 text-amber-500" />
                      <span className="text-base">{advertencias.length} con datos incompletos</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {advertencias.length > 0 && (
            <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Datos bancarios incompletos
                </CardTitle>
                <CardDescription>
                  Payana requiere estos campos si es el primer pago al proveedor. Se pueden completar luego en Payana, pero si faltan, se va a pedir al cargar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {advertencias.map((a) => (
                    <li key={a.indice}>
                      <span className="font-medium">{a.nombre}</span>
                      <span className="text-muted-foreground"> — falta: {a.faltantes.join(', ')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Vista Previa</CardTitle>
                <CardDescription>Datos que se incluiran en el archivo</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Medio de pago:</span>
                  <Select value={medioPago} onValueChange={(v) => setMedioPago(v as MedioPago)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIOS_DISPONIBLES.map((medio) => (
                        <SelectItem key={medio} value={medio}>
                          {NOMBRES_MEDIOS[medio]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleDescargar} disabled={filasPayana.length === 0 || descargando}>
                  <Download className="mr-2 h-4 w-4" />
                  {descargando ? 'Generando…' : 'Descargar XLSX'}
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
                        <TableHead>Doc</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Comprobante</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filasPayana.map((fila: FilaPayana, index: number) => {
                        const adv = advertenciasPorIndice.get(index)
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant="outline">
                                {fila.tipoIdentificacion} {fila.numeroIdentificacion}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{fila.nombre}</TableCell>
                            <TableCell className="text-xs font-mono">{fila.numeroComprobante}</TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {formatCOP(fila.monto)}
                            </TableCell>
                            <TableCell className="text-sm">{fila.nombreBanco || <span className="text-amber-600">—</span>}</TableCell>
                            <TableCell className="text-sm">
                              {fila.tipoCuentaBancaria && fila.numeroCuentaBancaria
                                ? `${fila.tipoCuentaBancaria} ${fila.numeroCuentaBancaria}`
                                : <span className="text-amber-600">—</span>}
                            </TableCell>
                            <TableCell className="text-sm">{fila.correoElectronico || <span className="text-amber-600">—</span>}</TableCell>
                            <TableCell>
                              {adv ? (
                                <Badge variant="outline" className="border-amber-500 text-amber-700">
                                  Incompleto
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-700">
                                  OK
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formato de Exportación — {NOMBRES_MEDIOS[medioPago]}</CardTitle>
              <CardDescription>
                15 columnas según el template oficial de Payana (Facturas.xlsx)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {CAMPOS_POR_MEDIO[medioPago].map((campo, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                    <span>{campo}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
