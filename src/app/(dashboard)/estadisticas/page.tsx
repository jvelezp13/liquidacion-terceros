'use client'

import { useState } from 'react'
import {
  useEstadisticasResumen,
  useEstadisticasEvolucion,
  useEstadisticasContratistas,
  useEstadisticasVehiculos,
  useEstadisticasCostos,
  type EstadisticasFilters,
} from '@/lib/hooks/use-estadisticas'
import {
  FiltrosEstadisticas,
  KPICards,
  EvolucionChart,
  ContratistasRanking,
  VehiculosAnalysis,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estadisticas</h1>
          <p className="text-muted-foreground">
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

      {/* Seccion 3: Contratistas */}
      <section>
        <ContratistasRanking
          data={contratistas.data}
          isLoading={contratistas.isLoading}
        />
      </section>

      {/* Seccion 4: Vehiculos */}
      <section>
        <VehiculosAnalysis
          data={vehiculos.data}
          isLoading={vehiculos.isLoading}
        />
      </section>

      {/* Seccion 5: Desglose de costos */}
      <section>
        <DesgloseCostosComponent
          data={costos.data}
          isLoading={costos.isLoading}
        />
      </section>
    </div>
  )
}
