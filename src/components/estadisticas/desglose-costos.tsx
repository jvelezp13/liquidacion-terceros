'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCOP } from '@/lib/utils/formatters'
import {
  calcularPorcentajeDesglose,
  coloresCostos,
  type DesgloseCostos,
} from '@/lib/utils/estadisticas-calcs'

interface DesgloseCostosProps {
  data: DesgloseCostos | null | undefined
  isLoading: boolean
}

function DesgloseCostosSkeleton() {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Distribucion de Costos</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-8 w-full mb-3" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  )
}

export function DesgloseCostosComponent({ data, isLoading }: DesgloseCostosProps) {
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
        <CardHeader className="py-3">
          <CardTitle className="text-base">Distribucion de Costos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
            No hay datos de costos
          </div>
        </CardContent>
      </Card>
    )
  }

  // Categorias para la barra (sin deducciones)
  const categoriasBarra = [
    { key: 'fleteBases', label: 'Flete', color: coloresCostos.fleteBases },
    { key: 'combustible', label: 'Combustible', color: coloresCostos.combustible },
    { key: 'peajes', label: 'Peajes', color: coloresCostos.peajes },
    { key: 'pernocta', label: 'Pernocta', color: coloresCostos.pernocta },
    { key: 'fletesAdicionales', label: 'Adicionales', color: coloresCostos.fletesAdicionales },
  ] as const

  // Calcular ancho de cada segmento
  const segmentos = categoriasBarra.map(cat => ({
    ...cat,
    valor: data[cat.key],
    porcentaje: porcentajes?.[cat.key] || 0,
    width: data.total > 0 ? (data[cat.key] / data.total) * 100 : 0,
  })).filter(s => s.valor > 0)

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Distribucion de Costos</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Bruto: <span className="font-medium text-foreground">{formatCOP(data.total)}</span>
            </span>
            <span className="text-green-600 font-medium">
              Neto: {formatCOP(data.total - data.deducciones)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Barra horizontal apilada */}
        <div className="h-6 w-full rounded-md overflow-hidden flex" title="Distribucion de costos">
          {segmentos.map((seg) => (
            <div
              key={seg.key}
              className="h-full transition-all relative group"
              style={{
                width: `${seg.width}%`,
                backgroundColor: seg.color,
                minWidth: seg.width > 0 ? '2px' : '0',
              }}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
                {seg.label}: {formatCOP(seg.valor)} ({seg.porcentaje}%)
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda compacta en grid */}
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
          {segmentos.map((seg) => (
            <div key={seg.key} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-muted-foreground truncate">{seg.label}</span>
              </div>
              <span className="font-medium ml-1">{seg.porcentaje}%</span>
            </div>
          ))}
          {/* Deducciones si existen */}
          {data.deducciones > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: coloresCostos.deducciones }}
                />
                <span className="text-muted-foreground truncate">Deducciones</span>
              </div>
              <span className="font-medium text-red-600 ml-1">-{formatCOP(data.deducciones)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
