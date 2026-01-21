'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  FileText,
  Edit,
  CheckCircle,
  Truck,
} from 'lucide-react'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import type { LiquidacionConDeducciones } from '@/lib/hooks/use-liquidaciones'

interface LiquidacionesTableProps {
  liquidaciones: LiquidacionConDeducciones[]
  onVerDetalle: (liquidacion: LiquidacionConDeducciones) => void
  onEditarAjuste: (liquidacion: LiquidacionConDeducciones) => void
  onAprobar: (liquidacion: LiquidacionConDeducciones) => void
  isLoading?: boolean
  esEditable?: boolean
}

export function LiquidacionesTable({
  liquidaciones,
  onVerDetalle,
  onEditarAjuste,
  onAprobar,
  isLoading = false,
  esEditable = true,
}: LiquidacionesTableProps) {
  // Obtener variante de badge según estado
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

  if (liquidaciones.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Truck className="h-8 w-8" />
        <p>No hay liquidaciones generadas.</p>
        <p className="text-sm">Genera las liquidaciones desde los viajes validados.</p>
      </div>
    )
  }

  // Calcular totales
  const totales = liquidaciones.reduce(
    (acc, liq) => ({
      subtotal: acc.subtotal + liq.subtotal,
      deducciones: acc.deducciones + liq.total_deducciones,
      aPagar: acc.aPagar + liq.total_a_pagar,
    }),
    { subtotal: 0, deducciones: 0, aPagar: 0 }
  )

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehiculo</TableHead>
              <TableHead>Contratista</TableHead>
              <TableHead className="text-right">Viajes</TableHead>
              <TableHead className="text-right">Flete</TableHead>
              <TableHead className="text-right">Otros</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Deducciones</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidaciones.map((liq) => (
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
                  <p className="text-sm">
                    {liq.vehiculo_tercero?.contratista?.nombre || 'Sin contratista'}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm">
                    <span className="text-green-600">{liq.viajes_ejecutados}</span>
                    {liq.viajes_variacion > 0 && (
                      <span className="text-blue-600"> + {liq.viajes_variacion}v</span>
                    )}
                    {liq.viajes_no_ejecutados > 0 && (
                      <span className="text-red-600"> - {liq.viajes_no_ejecutados}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCOP(liq.flete_base)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCOP(
                    liq.total_combustible +
                      liq.total_peajes +
                      liq.total_fletes_adicionales +
                      liq.total_pernocta +
                      liq.ajuste_monto
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatCOP(liq.subtotal)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-red-600">
                  {liq.total_deducciones > 0 ? `-${formatCOP(liq.total_deducciones)}` : '-'}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold">
                  {formatCOP(liq.total_a_pagar)}
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(liq.estado)}>
                    {liq.estado.charAt(0).toUpperCase() + liq.estado.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onVerDetalle(liq)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      {esEditable && liq.estado === 'borrador' && (
                        <>
                          <DropdownMenuItem onClick={() => onEditarAjuste(liq)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar ajustes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onAprobar(liq)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totales */}
      <div className="flex justify-end">
        <div className="rounded-lg border bg-muted/50 p-4 w-80">
          <h4 className="font-medium mb-2">Resumen</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCOP(totales.subtotal)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Deducciones:</span>
              <span className="font-mono">-{formatCOP(totales.deducciones)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t">
              <span>Total a pagar:</span>
              <span className="font-mono">{formatCOP(totales.aPagar)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
