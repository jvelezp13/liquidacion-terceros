'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  CheckCircle,
  XCircle,
  Route,
  ChevronDown,
  Truck,
  User,
  Building,
  MapPin,
  Loader2,
} from 'lucide-react'
import { SelectorRutaVariacion } from './selector-ruta-variacion'
import type { ViajeEjecutadoConDetalles } from '@/lib/hooks/use-viajes-ejecutados'
import type { RutaLogistica, EstadoViaje } from '@/types/database.types'

interface TarjetaViajeProps {
  viaje: ViajeEjecutadoConDetalles
  rutas: RutaLogistica[]
  onCambiarEstado: (estado: EstadoViaje) => void
  onCambiarEstadoConVariacion: (estado: EstadoViaje, rutaVariacionId: string | null) => void
  isUpdating?: boolean
  disabled?: boolean
}

export function TarjetaViaje({
  viaje,
  rutas,
  onCambiarEstado: _onCambiarEstado, // Se usa onCambiarEstadoConVariacion para todos los casos
  onCambiarEstadoConVariacion,
  isUpdating = false,
  disabled = false,
}: TarjetaViajeProps) {
  const [expandido, setExpandido] = useState(viaje.estado === 'variacion')
  const [rutaVariacionSeleccionada, setRutaVariacionSeleccionada] = useState<string | null>(
    viaje.ruta_variacion_id || null
  )

  // Colores de fondo según estado
  const getColorFondo = () => {
    switch (viaje.estado) {
      case 'ejecutado':
        return 'bg-green-50 border-green-200'
      case 'no_ejecutado':
        return 'bg-red-50 border-red-200'
      case 'variacion':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-muted/30 border-border'
    }
  }

  // Manejador para cambio de estado
  const handleCambiarEstado = (nuevoEstado: EstadoViaje) => {
    if (nuevoEstado === 'variacion') {
      // Expandir para seleccionar ruta
      setExpandido(true)
    } else {
      // Cambiar estado directamente y limpiar ruta de variación
      onCambiarEstadoConVariacion(nuevoEstado, null)
      setExpandido(false)
    }
  }

  // Manejador para selección de ruta de variación
  const handleSeleccionarRuta = (rutaId: string | null) => {
    setRutaVariacionSeleccionada(rutaId)
    if (rutaId) {
      onCambiarEstadoConVariacion('variacion', rutaId)
    }
  }

  // Obtener nombres de municipios de la ruta
  const obtenerMunicipios = () => {
    const ruta = viaje.estado === 'variacion' ? viaje.ruta_variacion : viaje.ruta
    if (!ruta) return 'Ruta no definida'
    return ruta.nombre
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        getColorFondo()
      )}
    >
      {/* Información principal */}
      <div className="flex items-start gap-3">
        {/* Icono de estado */}
        <div className="mt-0.5">
          {viaje.estado === 'ejecutado' && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {viaje.estado === 'no_ejecutado' && (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          {viaje.estado === 'variacion' && (
            <Route className="h-5 w-5 text-blue-600" />
          )}
          {viaje.estado === 'pendiente' && (
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Primera línea: Placa y Conductor */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-sm">
                {viaje.vehiculo_tercero?.placa || 'Sin placa'}
              </span>
            </div>
            {viaje.vehiculo_tercero?.conductor_nombre && (
              <Badge variant="secondary" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                {viaje.vehiculo_tercero.conductor_nombre}
              </Badge>
            )}
          </div>

          {/* Segunda línea: Contratista */}
          {viaje.vehiculo_tercero?.contratista && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Building className="h-3 w-3" />
              {viaje.vehiculo_tercero.contratista.nombre}
            </div>
          )}

          {/* Tercera línea: Ruta */}
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{obtenerMunicipios()}</span>
            {viaje.estado === 'variacion' && viaje.ruta && (
              <span className="text-blue-600 ml-1">
                (Original: {viaje.ruta.nombre})
              </span>
            )}
          </div>
        </div>

        {/* Botones de estado */}
        <div className="flex gap-1 shrink-0">
          <Button
            size="sm"
            variant={viaje.estado === 'ejecutado' ? 'default' : 'outline'}
            className={cn(
              'h-8 px-2',
              viaje.estado === 'ejecutado' && 'bg-green-600 hover:bg-green-700'
            )}
            onClick={() => handleCambiarEstado('ejecutado')}
            disabled={disabled || isUpdating}
            title="Marcar como ejecutado"
          >
            {isUpdating && viaje.estado !== 'ejecutado' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant={viaje.estado === 'no_ejecutado' ? 'default' : 'outline'}
            className={cn(
              'h-8 px-2',
              viaje.estado === 'no_ejecutado' && 'bg-red-600 hover:bg-red-700'
            )}
            onClick={() => handleCambiarEstado('no_ejecutado')}
            disabled={disabled || isUpdating}
            title="Marcar como no salió"
          >
            <XCircle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viaje.estado === 'variacion' ? 'default' : 'outline'}
            className={cn(
              'h-8 px-2',
              viaje.estado === 'variacion' && 'bg-blue-600 hover:bg-blue-700'
            )}
            onClick={() => handleCambiarEstado('variacion')}
            disabled={disabled || isUpdating}
            title="Otra ruta"
          >
            <Route className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panel expandible para seleccionar ruta de variación */}
      <Collapsible open={expandido} onOpenChange={setExpandido}>
        <CollapsibleContent className="mt-3 pt-3 border-t">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Seleccionar la ruta que se ejecutó:
            </label>
            <SelectorRutaVariacion
              rutas={rutas}
              rutaSeleccionada={rutaVariacionSeleccionada}
              onSelect={handleSeleccionarRuta}
              disabled={disabled || isUpdating}
              placeholder="Buscar ruta..."
            />
            {!rutaVariacionSeleccionada && viaje.estado === 'variacion' && (
              <p className="text-xs text-amber-600">
                Selecciona la ruta que realmente se ejecutó
              </p>
            )}
          </div>
        </CollapsibleContent>
        {viaje.estado === 'variacion' && !expandido && (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Cambiar ruta de variación
            </Button>
          </CollapsibleTrigger>
        )}
      </Collapsible>
    </div>
  )
}
