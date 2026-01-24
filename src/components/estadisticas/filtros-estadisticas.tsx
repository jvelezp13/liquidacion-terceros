'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useContratistas } from '@/lib/hooks'
import type { EstadisticasFilters, RangoPreset } from '@/lib/hooks/use-estadisticas'

interface FiltrosEstadisticasProps {
  filters: EstadisticasFilters
  onFiltersChange: (filters: EstadisticasFilters) => void
}

const presets: { value: RangoPreset; label: string }[] = [
  { value: 'este-mes', label: 'Este mes' },
  { value: 'ultimo-trimestre', label: 'Ultimo trimestre' },
  { value: 'este-año', label: 'Este año' },
  { value: 'todo', label: 'Todo' },
]

export function FiltrosEstadisticas({
  filters,
  onFiltersChange,
}: FiltrosEstadisticasProps) {
  const [preset, setPreset] = useState<RangoPreset>('todo')
  const { data: contratistas } = useContratistas()

  // Aplicar preset al cambiar
  useEffect(() => {
    const now = new Date()
    const año = now.getFullYear()
    const mes = now.getMonth() + 1

    let newFilters: EstadisticasFilters = { ...filters }

    switch (preset) {
      case 'este-mes':
        newFilters = {
          ...filters,
          añoDesde: año,
          mesDesde: mes,
          añoHasta: año,
          mesHasta: mes,
        }
        break
      case 'ultimo-trimestre':
        // Ultimos 3 meses
        const mesInicio = mes - 2 <= 0 ? 12 + (mes - 2) : mes - 2
        const añoInicio = mes - 2 <= 0 ? año - 1 : año
        newFilters = {
          ...filters,
          añoDesde: añoInicio,
          mesDesde: mesInicio,
          añoHasta: año,
          mesHasta: mes,
        }
        break
      case 'este-año':
        newFilters = {
          ...filters,
          añoDesde: año,
          añoHasta: año,
          mesDesde: undefined,
          mesHasta: undefined,
        }
        break
      case 'todo':
        newFilters = {
          contratistaId: filters.contratistaId,
          vehiculoId: filters.vehiculoId,
        }
        break
    }

    onFiltersChange(newFilters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset])

  const handleContratistaChange = (value: string) => {
    const contratistaId = value === 'todos' ? undefined : value
    onFiltersChange({
      ...filters,
      contratistaId,
      vehiculoId: undefined, // Reset vehiculo al cambiar contratista
    })
  }

  const handleClearFilters = () => {
    setPreset('todo')
    onFiltersChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Rango temporal */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Periodo:</span>
        <Select value={preset} onValueChange={(v) => setPreset(v as RangoPreset)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por contratista */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Contratista:</span>
        <Select
          value={filters.contratistaId || 'todos'}
          onValueChange={handleContratistaChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {contratistas?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Boton limpiar */}
      {(filters.contratistaId || filters.añoDesde) && (
        <Button variant="outline" size="sm" onClick={handleClearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
