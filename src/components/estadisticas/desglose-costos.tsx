'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCOP } from '@/lib/utils/formatters'
import {
  calcularPorcentajeDesglose,
  coloresCostos,
  labelsCostos,
  type DesgloseCostos,
} from '@/lib/utils/estadisticas-calcs'

interface DesgloseCostosProps {
  data: DesgloseCostos | null | undefined
  isLoading: boolean
}

// Skeleton
function DesgloseCostosSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Distribucion de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DesgloseCostosComponent({ data, isLoading }: DesgloseCostosProps) {
  // Preparar datos para el pie chart
  const chartData = useMemo(() => {
    if (!data) return []

    const items = [
      { name: labelsCostos.fleteBases, value: data.fleteBases, key: 'fleteBases' },
      { name: labelsCostos.combustible, value: data.combustible, key: 'combustible' },
      { name: labelsCostos.peajes, value: data.peajes, key: 'peajes' },
      { name: labelsCostos.pernocta, value: data.pernocta, key: 'pernocta' },
      { name: labelsCostos.fletesAdicionales, value: data.fletesAdicionales, key: 'fletesAdicionales' },
    ]

    // Solo incluir items con valor > 0
    return items.filter(item => item.value > 0)
  }, [data])

  // Calcular porcentajes
  const porcentajes = useMemo(() => {
    if (!data) return null
    return calcularPorcentajeDesglose(data)
  }, [data])

  if (isLoading) {
    return <DesgloseCostosSkeleton />
  }

  if (!data || data.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de costos
          </div>
        </CardContent>
      </Card>
    )
  }

  // Lista de categorias para las cards
  const categorias: { key: keyof Omit<DesgloseCostos, 'total'>; label: string; color: string }[] = [
    { key: 'fleteBases', label: 'Flete Base', color: coloresCostos.fleteBases },
    { key: 'combustible', label: 'Combustible', color: coloresCostos.combustible },
    { key: 'peajes', label: 'Peajes', color: coloresCostos.peajes },
    { key: 'pernocta', label: 'Pernocta', color: coloresCostos.pernocta },
    { key: 'fletesAdicionales', label: 'Fletes Adicionales', color: coloresCostos.fletesAdicionales },
    { key: 'deducciones', label: 'Deducciones', color: coloresCostos.deducciones },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribucion de Costos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={coloresCostos[entry.key as keyof typeof coloresCostos]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCOP(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">Total Bruto</p>
            <p className="text-2xl font-bold">{formatCOP(data.total)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cards de detalle */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categorias.map((cat) => {
              const valor = data[cat.key]
              const porcentaje = porcentajes?.[cat.key] || 0

              return (
                <div
                  key={cat.key}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium">{cat.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCOP(valor)}</p>
                    <p className="text-xs text-muted-foreground">
                      {cat.key === 'deducciones' ? 'Descontado' : `${porcentaje}%`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumen neto */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Neto a Pagar</span>
              <span className="text-xl font-bold text-green-600">
                {formatCOP(data.total - data.deducciones)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
