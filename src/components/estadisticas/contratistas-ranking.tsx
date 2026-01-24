'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
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
import { Badge } from '@/components/ui/badge'
import { formatCOP } from '@/lib/utils/formatters'
import {
  ordenarContratistasPorPago,
  getTopContratistas,
  calcularPromedioCostoPorViaje,
} from '@/lib/utils/estadisticas-calcs'
import type { DatosContratista } from '@/lib/utils/estadisticas-calcs'

interface ContratistasRankingProps {
  data: DatosContratista[] | undefined
  isLoading: boolean
}

// Skeleton
function ContratistasRankingSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ranking por Contratista</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Contratistas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export function ContratistasRanking({ data, isLoading }: ContratistasRankingProps) {
  // Ordenar y calcular promedio
  const contratistasOrdenados = useMemo(() => {
    if (!data) return []
    return ordenarContratistasPorPago(data)
  }, [data])

  const topContratistas = useMemo(() => {
    if (!data) return []
    return getTopContratistas(data, 5)
  }, [data])

  const promedioCostoPorViaje = useMemo(() => {
    if (!data) return 0
    return calcularPromedioCostoPorViaje(data)
  }, [data])

  if (isLoading) {
    return <ContratistasRankingSkeleton />
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking por Contratista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de contratistas
          </div>
        </CardContent>
      </Card>
    )
  }

  // Colores gradiente para barras
  const colors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef']

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Tabla de ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking por Contratista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[350px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contratista</TableHead>
                  <TableHead className="text-right">Vehiculos</TableHead>
                  <TableHead className="text-right">Viajes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">$/Viaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratistasOrdenados.map((c) => {
                  const esSobrePromedio = c.costoPorViaje > promedioCostoPorViaje
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell className="text-right">{c.totalVehiculos}</TableCell>
                      <TableCell className="text-right">{c.totalViajes}</TableCell>
                      <TableCell className="text-right">{formatCOP(c.totalPagado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {formatCOP(c.costoPorViaje)}
                          {esSobrePromedio ? (
                            <Badge variant="destructive" className="text-xs">Alto</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">OK</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Promedio costo/viaje: {formatCOP(promedioCostoPorViaje)}
          </p>
        </CardContent>
      </Card>

      {/* Grafico de barras horizontales */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 por Monto Total</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              layout="vertical"
              data={topContratistas}
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                  return value.toString()
                }}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11 }}
                width={100}
              />
              <Tooltip
                formatter={(value) => formatCOP(Number(value))}
                labelFormatter={(label) => `Contratista: ${label}`}
              />
              <ReferenceLine
                x={data.reduce((sum, c) => sum + c.totalPagado, 0) / data.length}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'Promedio', position: 'top', fontSize: 10 }}
              />
              <Bar dataKey="totalPagado" name="Total Pagado" radius={[0, 4, 4, 0]}>
                {topContratistas.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
