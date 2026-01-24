'use client'

import { useState } from 'react'
import {
  useEstadisticasResumen,
  useEstadisticasEvolucion,
  useEstadisticasContratistas,
  useEstadisticasVehiculos,
  useEstadisticasCostos,
  useEstadisticasRutas,
  type EstadisticasFilters,
} from '@/lib/hooks/use-estadisticas'
import {
  FiltrosEstadisticas,
  KPICards,
  EvolucionChart,
  ContratistasRanking,
  VehiculosAnalysis,
  RutasAnalysis,
  DesgloseCostosComponent,
} from '@/components/estadisticas'

export default function EstadisticasPage() {
  const [filters, setFilters] = useState<EstadisticasFilters>({})

  // Queries independientes (se ejecutan en paralelo)
  const resumen = useEstadisticasResumen(filters)
  const evolucion = useEstadisticasEvolucion(filters)
  const contratistas = useEstadisticasContratistas(filters)
  const vehiculos = useEstadisticasVehiculos(filters)
  const costos = useEstadisticasCostos(filters)
  const rutas = useEstadisticasRutas(filters)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold">Estadisticas</h1>
          <p className="text-sm text-muted-foreground">
            Analisis de liquidaciones y costos de terceros
          </p>
        </div>

        {/* Filtros */}
        <FiltrosEstadisticas
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Seccion 1: KPIs */}
      <section>
        <KPICards
          resumen={resumen.data}
          evolucion={evolucion.data}
          isLoading={resumen.isLoading}
        />
      </section>

      {/* Seccion 2: Evolucion temporal */}
      <section>
        <EvolucionChart
          data={evolucion.data}
          isLoading={evolucion.isLoading}
        />
      </section>

      {/* Seccion 3: Grid 2 columnas - Contratistas y Costos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ContratistasRanking
          data={contratistas.data}
          isLoading={contratistas.isLoading}
        />
        <DesgloseCostosComponent
          data={costos.data}
          isLoading={costos.isLoading}
        />
      </section>

      {/* Seccion 4: Vehiculos */}
      <section>
        <VehiculosAnalysis
          data={vehiculos.data}
          isLoading={vehiculos.isLoading}
        />
      </section>

      {/* Seccion 5: Rutas */}
      <section>
        <RutasAnalysis
          data={rutas.data}
          isLoading={rutas.isLoading}
        />
      </section>
    </div>
  )
}
