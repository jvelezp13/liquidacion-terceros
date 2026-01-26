'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
  Calendar,
} from 'lucide-react'
import { SelectorRutaVariacion } from './selector-ruta-variacion'
import type { ViajeEjecutadoConDetalles } from '@/lib/hooks/use-viajes-ejecutados'
import type { RutaLogistica, EstadoViaje } from '@/types'

// Tipo para información de días del ciclo
interface InfoDiaCiclo {
  diaCiclo: number
  diaNombre: string
  tienePernocta: boolean
}

// Mapa de ruta_id -> info de días del ciclo
type MapaInfoDiasCiclo = Map<string, InfoDiaCiclo[]>

// Mapeo de día de semana para fallback
const DIAS_NOMBRES_FALLBACK: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
  7: 'domingo',
}

/**
 * Calcula el día del ciclo basándose en el día de la semana del viaje.
 * Fallback para viajes existentes que no tienen dia_ciclo guardado.
 */
function calcularDiaCicloFallback(
  fecha: string,
  infoDiasCiclo: InfoDiaCiclo[]
): number {
  const fechaDate = new Date(fecha + 'T00:00:00')
  const diaSemana = fechaDate.getDay() // 0=dom, 1=lun...
  const diaISO = diaSemana === 0 ? 7 : diaSemana
  const diaNombre = DIAS_NOMBRES_FALLBACK[diaISO]

  const index = infoDiasCiclo.findIndex((d) => d.diaNombre === diaNombre)
  return index >= 0 ? index + 1 : 1
}

interface TarjetaViajeProps {
  viaje: ViajeEjecutadoConDetalles
  rutas: RutaLogistica[]
  onCambiarEstado: (estado: EstadoViaje) => void
  onCambiarEstadoConVariacion: (estado: EstadoViaje, rutaVariacionId: string | null, diaCiclo?: number | null) => void
  onEliminar?: () => void
  isUpdating?: boolean
  disabled?: boolean
  infoDiasCiclo?: InfoDiaCiclo[] // Info de días del ciclo de la ruta actual del viaje (para mostrar badge)
  infoDiasCicloMap?: MapaInfoDiasCiclo // Mapa completo para verificar rutas al seleccionar variación
}

export function TarjetaViaje({
  viaje,
  rutas,
  onCambiarEstado: _onCambiarEstado,
  onCambiarEstadoConVariacion,
  onEliminar,
  isUpdating = false,
  disabled = false,
  infoDiasCiclo = [],
  infoDiasCicloMap = new Map(),
}: TarjetaViajeProps) {
  const [expandido, setExpandido] = useState(viaje.estado === 'variacion' && !viaje.ruta_variacion_id)
  const [rutaVariacionSeleccionada, setRutaVariacionSeleccionada] = useState<string | null>(
    viaje.ruta_variacion_id || null
  )
  const [diaCicloSeleccionado, setDiaCicloSeleccionado] = useState<number | undefined>(
    viaje.dia_ciclo ?? undefined
  )
  // Estado para indicar que se seleccionó una ruta pero falta elegir el día
  const [esperandoDiaCiclo, setEsperandoDiaCiclo] = useState(false)

  // Info de días del ciclo para la ruta ACTUAL del viaje (para badge)
  const tieneMultiplesDias = infoDiasCiclo.length > 1

  // Info de días del ciclo para la ruta SELECCIONADA en el selector (puede ser diferente)
  const infoDiasRutaSeleccionada = rutaVariacionSeleccionada
    ? infoDiasCicloMap.get(rutaVariacionSeleccionada) || []
    : []
  const rutaSeleccionadaTieneMultiplesDias = infoDiasRutaSeleccionada.length > 1

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

    if (!rutaId) return

    // Verificar si la ruta seleccionada tiene múltiples días
    const infoDiasRuta = infoDiasCicloMap.get(rutaId) || []
    const tieneMultiples = infoDiasRuta.length > 1

    if (tieneMultiples) {
      // La ruta tiene múltiples días: NO guardar todavía
      // Mostrar selector de día del ciclo primero
      setEsperandoDiaCiclo(true)
      setDiaCicloSeleccionado(1) // Preseleccionar día 1
      // Mantener panel abierto para que seleccione el día
    } else {
      // Ruta de un solo día: guardar directamente
      setEsperandoDiaCiclo(false)
      onCambiarEstadoConVariacion('variacion', rutaId, undefined)
      setExpandido(false)
    }
  }

  // Manejador para confirmar el día del ciclo (guarda la variación)
  const handleConfirmarDiaCiclo = (diaCiclo: number) => {
    setDiaCicloSeleccionado(diaCiclo)
    if (rutaVariacionSeleccionada) {
      onCambiarEstadoConVariacion('variacion', rutaVariacionSeleccionada, diaCiclo)
      setEsperandoDiaCiclo(false)
      setExpandido(false)
    }
  }

  // Manejador para cambio de día del ciclo (para viajes ya guardados)
  const handleCambiarDiaCiclo = (diaCiclo: number) => {
    setDiaCicloSeleccionado(diaCiclo)
    // Solo actualizar si ya hay un viaje guardado con variación
    if (rutaVariacionSeleccionada && viaje.ruta_variacion_id) {
      onCambiarEstadoConVariacion('variacion', rutaVariacionSeleccionada, diaCiclo)
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

        {/* Badge de día del ciclo (si la ruta tiene múltiples días) */}
        {infoDiasCiclo.length > 1 && (
          <Badge variant="outline" className="shrink-0 text-xs gap-1 px-1.5">
            <Calendar className="h-3 w-3" />
            Día {viaje.dia_ciclo ?? calcularDiaCicloFallback(viaje.fecha, infoDiasCiclo)}/{infoDiasCiclo.length}
          </Badge>
        )}

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
        <CollapsibleContent className="mt-2 pt-2 border-t border-dashed space-y-3">
          {/* Paso 1: Selector de ruta */}
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

          {/* Paso 2: Selector de día del ciclo (si la ruta seleccionada tiene múltiples días) */}
          {esperandoDiaCiclo && rutaSeleccionadaTieneMultiplesDias && (
            <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 space-y-3">
              <div className="text-xs font-medium text-blue-800">
                Esta ruta tiene {infoDiasRutaSeleccionada.length} días. Selecciona cuál corresponde:
              </div>
              <RadioGroup
                value={diaCicloSeleccionado?.toString() ?? '1'}
                onValueChange={(value) => setDiaCicloSeleccionado(parseInt(value, 10))}
                className="flex flex-wrap gap-2"
              >
                {infoDiasRutaSeleccionada.map((info) => (
                  <div key={info.diaCiclo} className="flex items-center">
                    <RadioGroupItem
                      value={info.diaCiclo.toString()}
                      id={`viaje-${viaje.id}-nuevo-dia-${info.diaCiclo}`}
                      className="peer sr-only"
                      disabled={disabled || isUpdating}
                    />
                    <Label
                      htmlFor={`viaje-${viaje.id}-nuevo-dia-${info.diaCiclo}`}
                      className={cn(
                        'flex items-center gap-2 rounded-md border-2 px-3 py-2 text-sm cursor-pointer',
                        'hover:bg-accent hover:text-accent-foreground',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10'
                      )}
                    >
                      <span className="font-medium">Día {info.diaCiclo}</span>
                      <span className="text-xs text-muted-foreground capitalize">({info.diaNombre})</span>
                      {info.tienePernocta && (
                        <Badge variant="secondary" className="text-xs">
                          Con pernocta
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                size="sm"
                onClick={() => handleConfirmarDiaCiclo(diaCicloSeleccionado ?? 1)}
                disabled={disabled || isUpdating}
                className="w-full"
              >
                Confirmar día {diaCicloSeleccionado ?? 1}
              </Button>
            </div>
          )}

          {/* Edición de día del ciclo (para viajes YA guardados con múltiples días) */}
          {!esperandoDiaCiclo && viaje.ruta_variacion_id && tieneMultiplesDias && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Día del ciclo:</span>
              <RadioGroup
                value={diaCicloSeleccionado?.toString() ?? '1'}
                onValueChange={(value) => handleCambiarDiaCiclo(parseInt(value, 10))}
                className="flex flex-wrap gap-1"
              >
                {infoDiasCiclo.map((info) => (
                  <div key={info.diaCiclo} className="flex items-center">
                    <RadioGroupItem
                      value={info.diaCiclo.toString()}
                      id={`viaje-${viaje.id}-dia-${info.diaCiclo}`}
                      className="peer sr-only"
                      disabled={disabled || isUpdating}
                    />
                    <Label
                      htmlFor={`viaje-${viaje.id}-dia-${info.diaCiclo}`}
                      className={cn(
                        'flex items-center gap-1 rounded border px-2 py-1 text-xs cursor-pointer',
                        'hover:bg-accent hover:text-accent-foreground',
                        'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10'
                      )}
                    >
                      <span>Día {info.diaCiclo}</span>
                      {info.tienePernocta && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Pernocta
                        </Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
