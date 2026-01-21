'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { ViajeEjecutadoConDetalles } from '@/lib/hooks/use-viajes-ejecutados'

interface CalendarioCompactoProps {
  fechaInicio: string
  fechaFin: string
  viajes: ViajeEjecutadoConDetalles[]
  fechaSeleccionada: string | null
  onSelectFecha: (fecha: string) => void
}

// Nombres cortos de los días
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Tipo de estado del día (simplificado: gestionado = sin pendientes)
type EstadoDia = 'sin-viajes' | 'gestionado' | 'pendiente'

export function CalendarioCompacto({
  fechaInicio,
  fechaFin,
  viajes,
  fechaSeleccionada,
  onSelectFecha,
}: CalendarioCompactoProps) {
  // Generar array de fechas del periodo
  const fechasPeriodo = useMemo(() => {
    const fechas: Date[] = []
    const inicio = new Date(fechaInicio + 'T00:00:00')
    const fin = new Date(fechaFin + 'T00:00:00')

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(new Date(d))
    }

    return fechas
  }, [fechaInicio, fechaFin])

  // Agrupar viajes por fecha
  const viajesPorFecha = useMemo(() => {
    const map = new Map<string, ViajeEjecutadoConDetalles[]>()
    for (const viaje of viajes) {
      const fechaStr = viaje.fecha
      if (!map.has(fechaStr)) {
        map.set(fechaStr, [])
      }
      map.get(fechaStr)!.push(viaje)
    }
    return map
  }, [viajes])

  // Obtener estado del día para colorear (simplificado)
  const getEstadoDia = (fecha: Date): EstadoDia => {
    const fechaStr = fecha.toISOString().split('T')[0]
    const viajesDia = viajesPorFecha.get(fechaStr) || []

    if (viajesDia.length === 0) return 'sin-viajes'

    // Si hay algún pendiente → amarillo, si no → verde
    const algunoPendiente = viajesDia.some((v) => v.estado === 'pendiente')
    return algunoPendiente ? 'pendiente' : 'gestionado'
  }

  // Obtener día de la semana (0=Lunes, 6=Domingo)
  const getDiaSemana = (fecha: Date): number => {
    const dia = fecha.getDay()
    return dia === 0 ? 6 : dia - 1 // Convertir domingo=0 a 6
  }

  // Calcular el offset inicial para alinear con el día de la semana
  const offsetInicial = useMemo(() => {
    if (fechasPeriodo.length === 0) return 0
    return getDiaSemana(fechasPeriodo[0])
  }, [fechasPeriodo])

  // Estilos según estado (simplificado)
  const getEstilosDia = (estado: EstadoDia, seleccionado: boolean) => {
    const base = 'relative flex flex-col items-center justify-center rounded-md p-1 cursor-pointer transition-all text-xs'

    if (seleccionado) {
      return cn(base, 'ring-2 ring-primary ring-offset-1')
    }

    switch (estado) {
      case 'gestionado':
        return cn(base, 'bg-green-100 text-green-800 hover:bg-green-200')
      case 'pendiente':
        return cn(base, 'bg-amber-100 text-amber-800 hover:bg-amber-200')
      default:
        return cn(base, 'bg-muted text-muted-foreground hover:bg-muted/80')
    }
  }

  return (
    <div className="space-y-2">
      {/* Header con días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="text-xs font-medium text-muted-foreground py-1">
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1">
        {/* Espacios vacíos para el offset */}
        {Array.from({ length: offsetInicial }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Días del periodo */}
        {fechasPeriodo.map((fecha) => {
          const fechaStr = fecha.toISOString().split('T')[0]
          const estado = getEstadoDia(fecha)
          const viajesDia = viajesPorFecha.get(fechaStr) || []
          const seleccionado = fechaSeleccionada === fechaStr

          return (
            <button
              key={fechaStr}
              onClick={() => onSelectFecha(fechaStr)}
              className={cn(
                getEstilosDia(estado, seleccionado),
                'aspect-square min-h-[2.5rem]'
              )}
              title={`${fecha.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })} - ${viajesDia.length} viaje(s)`}
            >
              <span className="font-semibold">{fecha.getDate()}</span>
              {viajesDia.length > 0 && (
                <span className="text-[10px] leading-none opacity-75">
                  {viajesDia.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 pt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span className="text-muted-foreground">Gestionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          <span className="text-muted-foreground">Pendiente</span>
        </div>
      </div>
    </div>
  )
}
