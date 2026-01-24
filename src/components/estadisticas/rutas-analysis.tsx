'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCOP } from '@/lib/utils/formatters'
import type { DatosRuta } from '@/lib/utils/estadisticas-calcs'

interface RutasAnalysisProps {
  data: DatosRuta[] | undefined
  isLoading: boolean
}

function RutasAnalysisSkeleton() {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Analisis por Ruta</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  )
}

export function RutasAnalysis({ data, isLoading }: RutasAnalysisProps) {
  // Calcular totales
  const totales = useMemo(() => {
    if (!data || data.length === 0) return null
    return {
      viajes: data.reduce((sum, r) => sum + r.totalViajes, 0),
      km: data.reduce((sum, r) => sum + r.kmTotal, 0),
      combustible: data.reduce((sum, r) => sum + r.combustible, 0),
      peajes: data.reduce((sum, r) => sum + r.peajes, 0),
      total: data.reduce((sum, r) => sum + r.total, 0),
    }
  }, [data])

  if (isLoading) {
    return <RutasAnalysisSkeleton />
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Analisis por Ruta</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground gap-1 text-sm">
            <span>No hay datos de rutas</span>
            <span className="text-xs">
              Las rutas aparecen cuando tienen viajes ejecutados
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Analisis por Ruta</CardTitle>
          <span className="text-xs text-muted-foreground">
            {data.length} rutas | {totales?.viajes || 0} viajes totales
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-1.5 px-2 text-xs">Ruta</TableHead>
                <TableHead className="py-1.5 px-2 text-xs">Codigo</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Viajes</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Km</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Combustible</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Peajes</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Total</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">$/Viaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell className="py-1.5 px-2 text-sm font-medium max-w-[150px] truncate" title={r.nombre}>
                    {r.nombre}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-sm font-mono text-muted-foreground">
                    {r.codigo || '-'}
                  </TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{r.totalViajes}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{r.kmTotal.toLocaleString()}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(r.combustible)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(r.peajes)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right font-medium">{formatCOP(r.total)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(r.costoPorViaje)}</TableCell>
                </TableRow>
              ))}
              {/* Fila de totales */}
              {totales && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell className="py-1.5 px-2 text-sm" colSpan={2}>TOTAL</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{totales.viajes}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{totales.km.toLocaleString()}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(totales.combustible)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(totales.peajes)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(totales.total)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">
                    {formatCOP(Math.round(totales.total / totales.viajes))}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
