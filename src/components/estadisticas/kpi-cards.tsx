'use client'

import { TrendingUp, TrendingDown, DollarSign, Truck, Target, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCOP } from '@/lib/utils/formatters'
import {
  calcularCostoPorViaje,
  calcularTasaCumplimiento,
  calcularVariacionPorcentual,
} from '@/lib/utils/estadisticas-calcs'
import type { DatosResumen, DatosEvolucion } from '@/lib/utils/estadisticas-calcs'

interface KPICardsProps {
  resumen: DatosResumen | null | undefined
  evolucion: DatosEvolucion[] | undefined
  isLoading: boolean
}

// Skeleton para loading
function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32 mt-2" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  )
}

export function KPICards({ resumen, evolucion, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!resumen) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay datos disponibles. Genera liquidaciones para ver estadisticas.
      </div>
    )
  }

  // Calcular metricas derivadas
  const costoPorViaje = calcularCostoPorViaje(
    resumen.totalPagado,
    resumen.viajesEjecutados + resumen.viajesVariacion
  )

  const tasaCumplimiento = calcularTasaCumplimiento(
    resumen.viajesEjecutados,
    resumen.viajesVariacion,
    resumen.totalViajes
  )

  // Calcular promedio mensual
  const mesesConDatos = resumen.totalQuincenas > 0 ? Math.ceil(resumen.totalQuincenas / 2) : 1
  const promedioMensual = Math.round(resumen.totalPagado / mesesConDatos)

  // Calcular variacion vs periodo anterior (ultimas 2 quincenas vs 2 anteriores)
  let variacion = 0
  if (evolucion && evolucion.length >= 4) {
    const ultimasDos = evolucion.slice(-2)
    const anterioresDos = evolucion.slice(-4, -2)
    const totalUltimas = ultimasDos.reduce((sum, e) => sum + e.totalPagado, 0)
    const totalAnteriores = anterioresDos.reduce((sum, e) => sum + e.totalPagado, 0)
    variacion = calcularVariacionPorcentual(totalUltimas, totalAnteriores)
  }

  const kpis = [
    {
      label: 'Total Pagado',
      value: formatCOP(resumen.totalPagado),
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subtext: `${resumen.totalQuincenas} quincenas`,
    },
    {
      label: 'Promedio Mensual',
      value: formatCOP(promedioMensual),
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtext: `${mesesConDatos} meses`,
    },
    {
      label: 'Viajes Ejecutados',
      value: resumen.viajesEjecutados + resumen.viajesVariacion,
      icon: Truck,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtext: `de ${resumen.totalViajes} totales`,
    },
    {
      label: 'Costo por Viaje',
      value: formatCOP(costoPorViaje),
      icon: Target,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      subtext: 'promedio',
      highlight: true,
    },
    {
      label: 'Cumplimiento',
      value: `${tasaCumplimiento}%`,
      icon: Target,
      iconBg: tasaCumplimiento >= 80 ? 'bg-green-100' : tasaCumplimiento >= 60 ? 'bg-amber-100' : 'bg-red-100',
      iconColor: tasaCumplimiento >= 80 ? 'text-green-600' : tasaCumplimiento >= 60 ? 'text-amber-600' : 'text-red-600',
      subtext: 'viajes completados',
    },
    {
      label: 'Variacion',
      value: `${variacion >= 0 ? '+' : ''}${variacion}%`,
      icon: variacion >= 0 ? TrendingUp : TrendingDown,
      iconBg: variacion >= 0 ? 'bg-red-100' : 'bg-green-100', // Mas gasto = rojo
      iconColor: variacion >= 0 ? 'text-red-600' : 'text-green-600',
      subtext: 'vs periodo anterior',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className={kpi.highlight ? 'ring-2 ring-blue-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <div className={`p-2 rounded-full ${kpi.iconBg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
