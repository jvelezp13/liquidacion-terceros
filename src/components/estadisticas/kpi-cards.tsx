'use client'

import { TrendingUp, TrendingDown, DollarSign, Truck, Target, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCOP } from '@/lib/utils/formatters'
import {
  calcularCostoPorViaje,
  calcularVariacionPorcentual,
} from '@/lib/utils/estadisticas-calcs'
import type { DatosResumen, DatosEvolucion } from '@/lib/utils/estadisticas-calcs'

interface KPICardsProps {
  resumen: DatosResumen | null | undefined
  evolucion: DatosEvolucion[] | undefined
  isLoading: boolean
}

function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="h-6 w-24 mt-1.5" />
        <Skeleton className="h-2.5 w-14 mt-1" />
      </CardContent>
    </Card>
  )
}

export function KPICards({ resumen, evolucion, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!resumen) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No hay datos disponibles. Genera liquidaciones para ver estadisticas.
      </div>
    )
  }

  // Calcular metricas derivadas
  const viajesRealizados = resumen.viajesEjecutados + resumen.viajesVariacion
  const costoPorViaje = calcularCostoPorViaje(resumen.totalPagado, viajesRealizados)

  // Calcular promedio mensual
  const mesesConDatos = resumen.totalQuincenas > 0 ? Math.ceil(resumen.totalQuincenas / 2) : 1
  const promedioMensual = Math.round(resumen.totalPagado / mesesConDatos)

  // Calcular variacion vs periodo anterior
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
      label: 'Prom. Mensual',
      value: formatCOP(promedioMensual),
      icon: Calendar,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtext: `${mesesConDatos} meses`,
    },
    {
      label: 'Viajes',
      value: viajesRealizados,
      icon: Truck,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtext: 'realizados',
    },
    {
      label: '$/Viaje',
      value: formatCOP(costoPorViaje),
      icon: Target,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      subtext: 'promedio',
      highlight: true,
    },
    {
      label: 'Variacion',
      value: `${variacion >= 0 ? '+' : ''}${variacion}%`,
      icon: variacion >= 0 ? TrendingUp : TrendingDown,
      iconBg: variacion >= 0 ? 'bg-red-100' : 'bg-green-100',
      iconColor: variacion >= 0 ? 'text-red-600' : 'text-green-600',
      subtext: 'vs anterior',
    },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className={kpi.highlight ? 'ring-1 ring-blue-200' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
              <div className={`p-1.5 rounded-full ${kpi.iconBg}`}>
                <kpi.icon className={`h-3 w-3 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="text-xl font-bold mt-1">{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
