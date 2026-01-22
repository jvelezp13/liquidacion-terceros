'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, CheckCircle, XCircle, Route, Clock } from 'lucide-react'
import { TarjetaViaje } from './tarjeta-viaje'
import type { ViajeEjecutadoConDetalles } from '@/lib/hooks/use-viajes-ejecutados'
import type { RutaLogistica, EstadoViaje } from '@/types'

interface VehiculoStats {
  id: string
  placa: string
  conductorNombre: string | null
  contratistaNombre: string | null
  totalViajes: number
  ejecutados: number
  noEjecutados: number
  variacion: number
  pendientes: number
}

interface VistaPorVehiculoProps {
  viajes: ViajeEjecutadoConDetalles[]
  rutas: RutaLogistica[]
  onCambiarEstado: (viajeId: string, estado: EstadoViaje, quincenaId: string) => void
  onCambiarEstadoConVariacion: (
    viajeId: string,
    estado: EstadoViaje,
    rutaVariacionId: string | null,
    quincenaId: string
  ) => void
  onEliminar?: (viajeId: string) => void
  isUpdating?: boolean
  disabled?: boolean
  quincenaId: string
}

export function VistaPorVehiculo({
  viajes,
  rutas,
  onCambiarEstado,
  onCambiarEstadoConVariacion,
  onEliminar,
  isUpdating = false,
  disabled = false,
  quincenaId,
}: VistaPorVehiculoProps) {
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<string | null>(null)

  // Agrupar viajes por vehículo y calcular estadísticas
  const vehiculosConStats = useMemo(() => {
    const map = new Map<string, VehiculoStats & { viajes: ViajeEjecutadoConDetalles[] }>()

    for (const viaje of viajes) {
      const vehiculoId = viaje.vehiculo_tercero_id

      if (!map.has(vehiculoId)) {
        map.set(vehiculoId, {
          id: vehiculoId,
          placa: viaje.vehiculo_tercero?.placa || 'Sin placa',
          conductorNombre: viaje.vehiculo_tercero?.conductor_nombre || null,
          contratistaNombre: viaje.vehiculo_tercero?.contratista?.nombre || null,
          totalViajes: 0,
          ejecutados: 0,
          noEjecutados: 0,
          variacion: 0,
          pendientes: 0,
          viajes: [],
        })
      }

      const vehiculo = map.get(vehiculoId)!
      vehiculo.viajes.push(viaje)
      vehiculo.totalViajes++

      switch (viaje.estado) {
        case 'ejecutado':
          vehiculo.ejecutados++
          break
        case 'no_ejecutado':
          vehiculo.noEjecutados++
          break
        case 'variacion':
          vehiculo.variacion++
          break
        default:
          vehiculo.pendientes++
      }
    }

    // Ordenar por placa
    return Array.from(map.values()).sort((a, b) => a.placa.localeCompare(b.placa))
  }, [viajes])

  // Obtener viajes del vehículo seleccionado ordenados por fecha
  const viajesVehiculoSeleccionado = useMemo(() => {
    if (!vehiculoSeleccionado) return []
    const vehiculo = vehiculosConStats.find((v) => v.id === vehiculoSeleccionado)
    if (!vehiculo) return []
    return [...vehiculo.viajes].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )
  }, [vehiculoSeleccionado, vehiculosConStats])

  // Auto-seleccionar primer vehículo si no hay ninguno seleccionado
  if (!vehiculoSeleccionado && vehiculosConStats.length > 0) {
    setVehiculoSeleccionado(vehiculosConStats[0].id)
  }

  // Obtener datos del vehículo seleccionado
  const vehiculoActual = useMemo(() => {
    return vehiculosConStats.find((v) => v.id === vehiculoSeleccionado)
  }, [vehiculoSeleccionado, vehiculosConStats])

  return (
    <div className="grid gap-4 lg:grid-cols-[35fr_65fr]">
      {/* Panel izquierdo: Lista de vehículos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Vehículos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-2 space-y-1">
              {vehiculosConStats.map((vehiculo) => (
                <button
                  key={vehiculo.id}
                  onClick={() => setVehiculoSeleccionado(vehiculo.id)}
                  className={cn(
                    'w-full text-left rounded-lg p-3 transition-colors',
                    vehiculoSeleccionado === vehiculo.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{vehiculo.placa}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {vehiculo.ejecutados > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-xs px-1">
                          {vehiculo.ejecutados}
                        </Badge>
                      )}
                      {vehiculo.variacion > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs px-1">
                          {vehiculo.variacion}
                        </Badge>
                      )}
                      {vehiculo.noEjecutados > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 text-xs px-1">
                          {vehiculo.noEjecutados}
                        </Badge>
                      )}
                      {vehiculo.pendientes > 0 && (
                        <Badge variant="outline" className="text-xs px-1">
                          {vehiculo.pendientes}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {vehiculo.contratistaNombre && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {vehiculo.contratistaNombre}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Panel derecho: Viajes del vehículo seleccionado */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Viajes de {vehiculoActual?.placa || 'Selecciona un vehículo'}
            </CardTitle>
            {vehiculoActual && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {vehiculoActual.ejecutados}
                </span>
                <span className="flex items-center gap-1">
                  <Route className="h-3 w-3 text-blue-600" />
                  {vehiculoActual.variacion}
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  {vehiculoActual.noEjecutados}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {vehiculoActual.pendientes}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[460px] pr-4">
            {viajesVehiculoSeleccionado.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Truck className="h-8 w-8 mb-2" />
                <p className="text-sm">
                  {vehiculoSeleccionado
                    ? 'No hay viajes para este vehículo'
                    : 'Selecciona un vehículo'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {viajesVehiculoSeleccionado.map((viaje) => (
                  <div key={viaje.id}>
                    {/* Encabezado de fecha */}
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(viaje.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                    <TarjetaViaje
                      viaje={viaje}
                      rutas={rutas}
                      onCambiarEstado={(estado) => onCambiarEstado(viaje.id, estado, quincenaId)}
                      onCambiarEstadoConVariacion={(estado, rutaVariacionId) =>
                        onCambiarEstadoConVariacion(viaje.id, estado, rutaVariacionId, quincenaId)
                      }
                      onEliminar={onEliminar ? () => onEliminar(viaje.id) : undefined}
                      isUpdating={isUpdating}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
