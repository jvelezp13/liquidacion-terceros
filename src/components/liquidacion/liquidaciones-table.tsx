'use client'

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Truck } from 'lucide-react'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import type { LiquidacionConDeducciones } from '@/lib/hooks/use-liquidaciones'
import { LiquidacionRowExpandible } from './liquidacion-row-expandible'

interface LiquidacionesTableProps {
  liquidaciones: LiquidacionConDeducciones[]
  quincenaId: string
  isLoading?: boolean
  esEditable?: boolean
}

export function LiquidacionesTable({
  liquidaciones,
  quincenaId,
  isLoading = false,
  esEditable = true,
}: LiquidacionesTableProps) {
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
              <TableHead className="w-8"></TableHead>
              <TableHead>Vehiculo</TableHead>
              <TableHead>Contratista</TableHead>
              <TableHead className="text-right">Viajes</TableHead>
              <TableHead className="text-right">Flete</TableHead>
              <TableHead className="text-right">Otros</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidaciones.map((liq) => (
              <LiquidacionRowExpandible
                key={liq.id}
                liquidacion={liq}
                quincenaId={quincenaId}
                esEditable={esEditable}
                isLoading={isLoading}
              />
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
