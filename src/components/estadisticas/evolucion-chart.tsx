'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCOP } from '@/lib/utils/formatters'
import type { DatosEvolucion } from '@/lib/utils/estadisticas-calcs'

interface EvolucionChartProps {
  data: DatosEvolucion[] | undefined
  isLoading: boolean
}

// Skeleton
function EvolucionChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolucion Temporal</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  )
}

// Componente para tooltip personalizado
interface TooltipPayload {
  name: string
  value: number
  color: string
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => {
        let displayValue: string
        if (entry.dataKey === 'totalPagado') {
          displayValue = formatCOP(entry.value)
        } else if (entry.dataKey === 'costoPorViaje') {
          displayValue = formatCOP(entry.value)
        } else {
          displayValue = entry.value.toString()
        }

        return (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {displayValue}
          </p>
        )
      })}
    </div>
  )
}

export function EvolucionChart({ data, isLoading }: EvolucionChartProps) {
  const [showTotalPagado, setShowTotalPagado] = useState(true)
  const [showCostoPorViaje, setShowCostoPorViaje] = useState(true)
  const [showViajes, setShowViajes] = useState(true)

  if (isLoading) {
    return <EvolucionChartSkeleton />
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolucion Temporal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            No hay datos para mostrar
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evolucion Temporal</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-total"
              checked={showTotalPagado}
              onCheckedChange={setShowTotalPagado}
            />
            <Label htmlFor="show-total" className="text-xs">Total</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-costo"
              checked={showCostoPorViaje}
              onCheckedChange={setShowCostoPorViaje}
            />
            <Label htmlFor="show-costo" className="text-xs">$/Viaje</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-viajes"
              checked={showViajes}
              onCheckedChange={setShowViajes}
            />
            <Label htmlFor="show-viajes" className="text-xs">Viajes</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="quincenaLabel"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                return value.toString()
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {showTotalPagado && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalPagado"
                name="Total Pagado"
                fill="#3b82f6"
                fillOpacity={0.3}
                stroke="#3b82f6"
                strokeWidth={2}
              />
            )}

            {showCostoPorViaje && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="costoPorViaje"
                name="Costo/Viaje"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}

            {showViajes && (
              <>
                <Bar
                  yAxisId="right"
                  dataKey="viajesEjecutados"
                  name="Ejecutados"
                  fill="#22c55e"
                  stackId="viajes"
                />
                <Bar
                  yAxisId="right"
                  dataKey="viajesVariacion"
                  name="Variacion"
                  fill="#f59e0b"
                  stackId="viajes"
                />
                <Bar
                  yAxisId="right"
                  dataKey="viajesNoEjecutados"
                  name="No Ejecutados"
                  fill="#ef4444"
                  stackId="viajes"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
