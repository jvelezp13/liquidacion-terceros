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

// Skeleton
function VehiculosAnalysisSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis por Vehiculo</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[400px] w-full" />
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
        <CardHeader>
          <CardTitle>Analisis por Vehiculo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2">
            <span>No hay datos de vehiculos</span>
            <span className="text-sm">
              Los vehiculos aparecen aqui cuando tienen quincenas liquidadas o pagadas
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis por Vehiculo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[450px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Contratista</TableHead>
                <TableHead className="text-right">Viajes</TableHead>
                <TableHead className="text-right">Total Pagado</TableHead>
                <TableHead className="text-right">Costo/Viaje</TableHead>
                <TableHead className="text-right">vs Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehiculosOrdenados.map((v) => {
                const diferencia = v.costoPorViaje - promedioCostoPorViaje
                const porcentajeDif = promedioCostoPorViaje > 0
                  ? Math.round((diferencia / promedioCostoPorViaje) * 100)
                  : 0

                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono font-medium">{v.placa}</TableCell>
                    <TableCell>{v.contratistaNombre}</TableCell>
                    <TableCell className="text-right">{v.totalViajes}</TableCell>
                    <TableCell className="text-right">{formatCOP(v.totalPagado)}</TableCell>
                    <TableCell className="text-right">{formatCOP(v.costoPorViaje)}</TableCell>
                    <TableCell className="text-right">
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
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>{data.length} vehiculos activos</span>
          <span>Promedio costo/viaje: {formatCOP(promedioCostoPorViaje)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
