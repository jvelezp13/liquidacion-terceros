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
import {
  ordenarContratistasPorPago,
  calcularPromedioCostoPorViaje,
} from '@/lib/utils/estadisticas-calcs'
import type { DatosContratista } from '@/lib/utils/estadisticas-calcs'

interface ContratistasRankingProps {
  data: DatosContratista[] | undefined
  isLoading: boolean
}

function ContratistasRankingSkeleton() {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Ranking Contratistas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-[250px] w-full" />
      </CardContent>
    </Card>
  )
}

export function ContratistasRanking({ data, isLoading }: ContratistasRankingProps) {
  const contratistasOrdenados = useMemo(() => {
    if (!data) return []
    return ordenarContratistasPorPago(data)
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
        <CardHeader className="py-3">
          <CardTitle className="text-base">Ranking Contratistas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
            No hay datos de contratistas
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Ranking Contratistas</CardTitle>
          <span className="text-xs text-muted-foreground">
            Prom. $/viaje: {formatCOP(promedioCostoPorViaje)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-1.5 px-2 text-xs">Contratista</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Veh.</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Viajes</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">Total</TableHead>
                <TableHead className="py-1.5 px-2 text-xs text-right">$/Viaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratistasOrdenados.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  <TableCell className="py-1.5 px-2 text-sm font-medium">{c.nombre}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{c.totalVehiculos}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{c.totalViajes}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(c.totalPagado)}</TableCell>
                  <TableCell className="py-1.5 px-2 text-sm text-right">{formatCOP(c.costoPorViaje)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-right">
          {data.length} contratistas activos
        </div>
      </CardContent>
    </Card>
  )
}
