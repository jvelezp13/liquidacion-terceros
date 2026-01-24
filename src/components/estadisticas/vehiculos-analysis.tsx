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
import type { DatosVehiculo } from '@/lib/utils/estadisticas-calcs'

interface VehiculosAnalysisProps {
  data: DatosVehiculo[] | undefined
  isLoading: boolean
}

function VehiculosAnalysisSkeleton() {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Analisis por Vehiculo</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  )
}

export function VehiculosAnalysis({ data, isLoading }: VehiculosAnalysisProps) {
  // Ordenar vehiculos por total pagado
  const vehiculosOrdenados = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => b.totalPagado - a.totalPagado)
  }, [data])

  // Calcular promedio
  const promedioCostoPorViaje = useMemo(() => {
    if (!data || data.length === 0) return 0
    const totalCosto = data.reduce((sum, v) => sum + v.totalPagado, 0)
    const totalViajes = data.reduce((sum, v) => sum + v.totalViajes, 0)
    if (totalViajes === 0) return 0
    return Math.round(totalCosto / totalViajes)
  }, [data])

  if (isLoading) {
    return <VehiculosAnalysisSkeleton />
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Analisis por Vehiculo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground gap-1 text-sm">
            <span>No hay datos de vehiculos</span>
            <span className="text-xs">
              Los vehiculos aparecen cuando tienen quincenas liquidadas
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
          <CardTitle className="text-base">Analisis por Vehiculo</CardTitle>
          <span className="text-xs text-muted-foreground">
            {data.length} vehiculos | Prom: {formatCOP(promedioCostoPorViaje)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-1.5 px-2 text-xs">Placa</TableHead>
                <TableHead className="py-1.5 px-2 text-xs">Contratista</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Viajes</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Total</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">$/Viaje</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">vs Prom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiculosOrdenados.map((v) => {
                const diferencia = v.costoPorViaje - promedioCostoPorViaje
                const porcentajeDif = promedioCostoPorViaje > 0
                  ? Math.round((diferencia / promedioCostoPorViaje) * 100)
                  : 0

                return (
                  <TableRow key={v.id} className="hover:bg-muted/50">
                    <TableCell className="py-1.5 px-2 text-sm font-mono font-medium">{v.placa}</TableCell>
                    <TableCell className="py-1.5 px-2 text-sm">{v.contratistaNombre}</TableCell>
                    <TableCell className="py-1.5 px-2 text-sm text-right">{v.totalViajes}</TableCell>
                    <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(v.totalPagado)}</TableCell>
                    <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(v.costoPorViaje)}</TableCell>
                    <TableCell className="py-1.5 px-2 text-sm text-right">
                      <span className={
                        porcentajeDif > 10 ? 'text-red-600' :
                        porcentajeDif < -10 ? 'text-green-600' :
                        'text-muted-foreground'
                      }>
                        {porcentajeDif >= 0 ? '+' : ''}{porcentajeDif}%
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
