'use client'

import { useState } from 'react'
import {
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import {
  type LiquidacionConDeducciones,
  useUpdateEstadoLiquidacion,
  useDeleteDeduccion,
  tiposDeduccion,
} from '@/lib/hooks/use-liquidaciones'
import { useViajesPorLiquidacion } from '@/lib/hooks/use-viajes-por-liquidacion'
import { PopoverAjuste } from './popover-ajuste'
import { PopoverDeduccion } from './popover-deduccion'

interface LiquidacionRowExpandibleProps {
  liquidacion: LiquidacionConDeducciones
  quincenaId: string
  esEditable?: boolean
  isLoading?: boolean
}

export function LiquidacionRowExpandible({
  liquidacion,
  quincenaId,
  esEditable = true,
  isLoading = false,
}: LiquidacionRowExpandibleProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateEstadoMutation = useUpdateEstadoLiquidacion()
  const deleteDeduccionMutation = useDeleteDeduccion()

  // Obtener desglose de viajes por ruta
  const { data: viajesData, isLoading: loadingViajes } = useViajesPorLiquidacion(
    isOpen ? quincenaId : undefined,
    isOpen ? liquidacion.vehiculo_tercero_id : undefined
  )

  const liq = liquidacion
  const vt = liq.vehiculo_tercero

  // Badge variant segun estado
  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'borrador':
        return 'secondary'
      case 'aprobado':
        return 'default'
      case 'pagado':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  // Handlers
  const handleAprobar = () => {
    updateEstadoMutation.mutate(
      {
        id: liq.id,
        estado: 'aprobado',
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Liquidacion aprobada')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleRechazar = () => {
    updateEstadoMutation.mutate(
      {
        id: liq.id,
        estado: 'borrador',
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Liquidacion rechazada')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleEliminarDeduccion = (deduccionId: string) => {
    deleteDeduccionMutation.mutate(
      {
        id: deduccionId,
        liquidacionId: liq.id,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Deduccion eliminada')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  // Calcular totales de "Otros" (combustible + peajes + adicionales + pernocta + ajuste)
  const totalOtros =
    liq.total_combustible +
    liq.total_peajes +
    liq.total_fletes_adicionales +
    liq.total_pernocta +
    liq.ajuste_monto

  const puedeEditar = esEditable && liq.estado === 'borrador'

  return (
    <>
      {/* Fila principal */}
      <TableRow
        className="group cursor-pointer hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell className="w-8">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          <div>
            <p className="font-medium">{vt?.placa || 'Sin placa'}</p>
            <p className="text-xs text-muted-foreground">
              {vt?.vehiculo?.nombre || ''}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <p className="text-sm">{vt?.contratista?.nombre || 'Sin contratista'}</p>
        </TableCell>
        <TableCell className="text-right">
          <div className="text-sm">
            <span className="text-green-600">{liq.viajes_ejecutados}</span>
            {(liq.viajes_variacion ?? 0) > 0 && (
              <span className="text-blue-600"> + {liq.viajes_variacion}v</span>
            )}
            {(liq.viajes_no_ejecutados ?? 0) > 0 && (
              <span className="text-red-600"> - {liq.viajes_no_ejecutados}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right font-mono text-sm">
          {formatCOP(liq.flete_base)}
        </TableCell>
        <TableCell className="text-right font-mono text-sm">
          {formatCOP(totalOtros)}
        </TableCell>
        <TableCell className="text-right font-mono text-sm font-bold">
          {formatCOP(liq.total_a_pagar)}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Badge variant={getBadgeVariant(liq.estado)}>
            {liq.estado.charAt(0).toUpperCase() + liq.estado.slice(1)}
          </Badge>
        </TableCell>
      </TableRow>

      {/* Contenido expandido */}
      {isOpen && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={8} className="p-0">
              <div className="p-4 space-y-4">
                {/* Desglose por ruta */}
                <div className="rounded-lg border bg-background p-3">
                  <h4 className="font-medium text-sm mb-3">Desglose por Ruta</h4>

                  {loadingViajes ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : viajesData && viajesData.desgloseRutas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-1.5 font-medium">Ruta</th>
                            <th className="text-right py-1.5 font-medium">Viajes</th>
                            <th className="text-right py-1.5 font-medium">Combustible</th>
                            <th className="text-right py-1.5 font-medium">Peajes</th>
                            <th className="text-right py-1.5 font-medium">Adicionales</th>
                            <th className="text-right py-1.5 font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viajesData.desgloseRutas.map((ruta) => (
                            <tr key={ruta.rutaId} className="border-b border-dashed">
                              <td className="py-1.5">{ruta.rutaNombre}</td>
                              <td className="text-right py-1.5 font-mono">{ruta.viajesCount}</td>
                              <td className="text-right py-1.5 font-mono">{formatCOP(ruta.totalCombustible)}</td>
                              <td className="text-right py-1.5 font-mono">{formatCOP(ruta.totalPeajes)}</td>
                              <td className="text-right py-1.5 font-mono">{formatCOP(ruta.totalAdicionales)}</td>
                              <td className="text-right py-1.5 font-mono font-medium">{formatCOP(ruta.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No hay viajes ejecutados
                    </p>
                  )}
                </div>

                {/* Pernoctas, Ajuste y Deducciones */}
                <div className="grid gap-3 md:grid-cols-3">
                  {/* Pernoctas */}
                  <div className="rounded-lg border bg-background p-3">
                    <h4 className="font-medium text-sm mb-2">Pernoctas</h4>
                    {viajesData && viajesData.totales.nochesPernocta > 0 ? (
                      <p className="text-sm">
                        <span className="font-mono">{viajesData.totales.nochesPernocta}</span> noches ={' '}
                        <span className="font-mono font-medium">
                          {formatCOP(liq.total_pernocta)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin pernoctas</p>
                    )}
                  </div>

                  {/* Ajuste */}
                  <div className="rounded-lg border bg-background p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">Ajuste</h4>
                      {puedeEditar && (
                        <PopoverAjuste
                          liquidacionId={liq.id}
                          quincenaId={quincenaId}
                          ajusteActual={liq.ajuste_monto}
                          descripcionActual={liq.ajuste_descripcion}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                    {liq.ajuste_monto !== 0 ? (
                      <div>
                        <p className={`text-sm font-mono ${liq.ajuste_monto > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {liq.ajuste_monto > 0 ? '+' : ''}{formatCOP(liq.ajuste_monto)}
                        </p>
                        {liq.ajuste_descripcion && (
                          <p className="text-xs text-muted-foreground">{liq.ajuste_descripcion}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin ajuste</p>
                    )}
                  </div>

                  {/* Deducciones */}
                  <div className="rounded-lg border bg-background p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">Deducciones</h4>
                      {puedeEditar && (
                        <PopoverDeduccion
                          liquidacionId={liq.id}
                          quincenaId={quincenaId}
                          subtotal={liq.subtotal}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                    {liq.deducciones.length > 0 ? (
                      <div className="space-y-1">
                        {liq.deducciones.map((ded) => (
                          <div key={ded.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] h-5">
                                {tiposDeduccion.find((t) => t.value === ded.tipo)?.label || ded.tipo}
                              </Badge>
                              {ded.descripcion && (
                                <span className="text-xs text-muted-foreground truncate max-w-24">
                                  {ded.descripcion}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-red-600">-{formatCOP(ded.monto)}</span>
                              {puedeEditar && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleEliminarDeduccion(ded.id)}
                                  disabled={deleteDeduccionMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="pt-1 border-t flex justify-between text-sm font-medium text-red-600">
                          <span>Total:</span>
                          <span className="font-mono">-{formatCOP(liq.total_deducciones)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin deducciones</p>
                    )}
                  </div>
                </div>

                {/* Total y acciones */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Total a pagar:</span>
                    <span className="text-xl font-bold font-mono">{formatCOP(liq.total_a_pagar)}</span>
                  </div>

                  {esEditable && (
                    <div className="flex items-center gap-2">
                      {liq.estado === 'borrador' && (
                        <Button
                          size="sm"
                          onClick={handleAprobar}
                          disabled={updateEstadoMutation.isPending || isLoading}
                        >
                          {updateEstadoMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Aprobar
                        </Button>
                      )}
                      {liq.estado === 'aprobado' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRechazar}
                          disabled={updateEstadoMutation.isPending || isLoading}
                        >
                          {updateEstadoMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Rechazar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
          </TableRow>
      )}
    </>
  )
}
