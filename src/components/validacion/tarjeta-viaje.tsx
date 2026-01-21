'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  CheckCircle,
  XCircle,
  Route,
  Loader2,
  Trash2,
} from 'lucide-react'
import { SelectorRutaVariacion } from './selector-ruta-variacion'
import type { ViajeEjecutadoConDetalles } from '@/lib/hooks/use-viajes-ejecutados'
import type { RutaLogistica, EstadoViaje } from '@/types/database.types'

interface TarjetaViajeProps {
  viaje: ViajeEjecutadoConDetalles
  rutas: RutaLogistica[]
  onCambiarEstado: (estado: EstadoViaje) => void
  onCambiarEstadoConVariacion: (estado: EstadoViaje, rutaVariacionId: string | null) => void
  onEliminar?: () => void
  isUpdating?: boolean
  disabled?: boolean
}

export function TarjetaViaje({
  viaje,
  rutas,
  onCambiarEstado: _onCambiarEstado,
  onCambiarEstadoConVariacion,
  onEliminar,
  isUpdating = false,
  disabled = false,
}: TarjetaViajeProps) {
  const [expandido, setExpandido] = useState(viaje.estado === 'variacion' && !viaje.ruta_variacion_id)
  const [rutaVariacionSeleccionada, setRutaVariacionSeleccionada] = useState<string | null>(
    viaje.ruta_variacion_id || null
  )

  // Colores de fondo según estado
  const getColorFondo = () => {
    switch (viaje.estado) {
      case 'ejecutado':
        return 'bg-green-50/70 border-green-300'
      case 'no_ejecutado':
        return 'bg-red-50/70 border-red-300'
      case 'variacion':
        return 'bg-blue-50/70 border-blue-300'
      default:
        return 'bg-background border-border'
    }
  }

  // Manejador para cambio de estado
  const handleCambiarEstado = (nuevoEstado: EstadoViaje) => {
    if (nuevoEstado === 'variacion') {
      setExpandido(true)
    } else {
      onCambiarEstadoConVariacion(nuevoEstado, null)
      setExpandido(false)
    }
  }

  // Manejador para selección de ruta de variación
  const handleSeleccionarRuta = (rutaId: string | null) => {
    setRutaVariacionSeleccionada(rutaId)
    if (rutaId) {
      onCambiarEstadoConVariacion('variacion', rutaId)
      setExpandido(false)
    }
  }

  // Obtener nombre de ruta o destino
  const obtenerRuta = () => {
    // Si tiene variación, mostrar ruta de variación
    if (viaje.estado === 'variacion' && viaje.ruta_variacion) {
      return viaje.ruta_variacion.nombre
    }
    // Si tiene ruta programada, mostrarla
    if (viaje.ruta) {
      return viaje.ruta.nombre
    }
    // Si tiene destino (viaje manual), mostrarlo
    if (viaje.destino) {
      return viaje.destino
    }
    return 'Sin ruta'
  }

  return (
    <div
      className={cn(
        'rounded-md border px-2.5 py-1.5 transition-colors',
        getColorFondo()
      )}
    >
      {/* Línea principal compacta */}
      <div className="flex items-center gap-2">
        {/* Icono de estado pequeño */}
        <div className="shrink-0">
          {viaje.estado === 'ejecutado' && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {viaje.estado === 'no_ejecutado' && (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          {viaje.estado === 'variacion' && (
            <Route className="h-4 w-4 text-blue-600" />
          )}
          {viaje.estado === 'pendiente' && (
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/50" />
          )}
        </div>

        {/* Placa */}
        <span className="font-bold text-sm shrink-0">
          {viaje.vehiculo_tercero?.placa || 'N/A'}
        </span>

        {/* Conductor */}
        {viaje.vehiculo_tercero?.conductor_nombre && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground shrink-0 max-w-[120px] truncate" title={viaje.vehiculo_tercero.conductor_nombre}>
              {viaje.vehiculo_tercero.conductor_nombre}
            </span>
          </>
        )}

        {/* Contratista */}
        {viaje.vehiculo_tercero?.contratista?.nombre && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground/70 shrink-0 max-w-[150px] truncate" title={viaje.vehiculo_tercero.contratista.nombre}>
              {viaje.vehiculo_tercero.contratista.nombre}
            </span>
          </>
        )}

        {/* Separador */}
        <span className="text-muted-foreground/40">|</span>

        {/* Ruta (truncada) */}
        <span className="text-xs text-muted-foreground truncate flex-1 min-w-0" title={obtenerRuta()}>
          {obtenerRuta()}
        </span>

        {/* Botones de estado compactos */}
        <div className="flex gap-0.5 shrink-0">
          <Button
            size="icon"
            variant={viaje.estado === 'ejecutado' ? 'default' : 'ghost'}
            className={cn(
              'h-7 w-7',
              viaje.estado === 'ejecutado' && 'bg-green-600 hover:bg-green-700'
            )}
            onClick={() => handleCambiarEstado('ejecutado')}
            disabled={disabled || isUpdating}
            title="Ejecutado"
          >
            {isUpdating && viaje.estado !== 'ejecutado' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant={viaje.estado === 'no_ejecutado' ? 'default' : 'ghost'}
            className={cn(
              'h-7 w-7',
              viaje.estado === 'no_ejecutado' && 'bg-red-600 hover:bg-red-700'
            )}
            onClick={() => handleCambiarEstado('no_ejecutado')}
            disabled={disabled || isUpdating}
            title="No salió"
          >
            <XCircle className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant={viaje.estado === 'variacion' ? 'default' : 'ghost'}
            className={cn(
              'h-7 w-7',
              viaje.estado === 'variacion' && 'bg-blue-600 hover:bg-blue-700'
            )}
            onClick={() => handleCambiarEstado('variacion')}
            disabled={disabled || isUpdating}
            title="Otra ruta"
          >
            <Route className="h-3.5 w-3.5" />
          </Button>
          {onEliminar && (
            <>
              <div className="w-px h-5 bg-border mx-0.5" />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={onEliminar}
                disabled={disabled || isUpdating}
                title="Eliminar viaje"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Panel expandible para seleccionar ruta de variación */}
      <Collapsible open={expandido} onOpenChange={setExpandido}>
        <CollapsibleContent className="mt-2 pt-2 border-t border-dashed">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Ruta ejecutada:</span>
            <div className="flex-1">
              <SelectorRutaVariacion
                rutas={rutas}
                rutaSeleccionada={rutaVariacionSeleccionada}
                onSelect={handleSeleccionarRuta}
                disabled={disabled || isUpdating}
                placeholder="Seleccionar ruta..."
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
