'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Loader2,
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Truck,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuincena, useUpdateEstadoQuincena, formatearQuincena } from '@/lib/hooks/use-quincenas'
import {
  useViajesQuincena,
  useUpdateEstadoViaje,
  useGenerarViajesDesdeRutas,
  estadosViaje,
  getEstadoViajeLabel,
} from '@/lib/hooks/use-viajes-ejecutados'
import { useVehiculosTerceros } from '@/lib/hooks/use-vehiculos-terceros'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import type { EstadoViaje, LiqViajeEjecutado } from '@/types/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ValidacionQuincenaPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [confirmValidar, setConfirmValidar] = useState(false)

  const { data: escenario, isLoading: escenarioLoading } = useEscenarioActivo()
  const { data: quincena, isLoading: quincenaLoading } = useQuincena(resolvedParams.id)
  const { data: viajes = [], isLoading: viajesLoading, refetch: refetchViajes } = useViajesQuincena(resolvedParams.id)
  const { data: vehiculosTerceros = [] } = useVehiculosTerceros()

  const updateEstadoViajeMutation = useUpdateEstadoViaje()
  const generarViajesMutation = useGenerarViajesDesdeRutas()
  const updateEstadoQuincenaMutation = useUpdateEstadoQuincena()

  const isLoading = escenarioLoading || quincenaLoading || viajesLoading

  // Generar array de fechas del periodo
  const fechasPeriodo = useMemo(() => {
    if (!quincena) return []

    const fechas: Date[] = []
    const inicio = new Date(quincena.fecha_inicio + 'T00:00:00')
    const fin = new Date(quincena.fecha_fin + 'T00:00:00')

    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(new Date(d))
    }

    return fechas
  }, [quincena])

  // Agrupar viajes por fecha
  const viajesPorFecha = useMemo(() => {
    const map = new Map<string, typeof viajes>()
    for (const viaje of viajes) {
      const fechaStr = viaje.fecha
      if (!map.has(fechaStr)) {
        map.set(fechaStr, [])
      }
      map.get(fechaStr)!.push(viaje)
    }
    return map
  }, [viajes])

  // Viajes de la fecha seleccionada
  const viajesFechaSeleccionada = fechaSeleccionada
    ? viajesPorFecha.get(fechaSeleccionada) || []
    : []

  // Estadísticas
  const estadisticas = useMemo(() => {
    const stats = {
      total: viajes.length,
      ejecutados: 0,
      parciales: 0,
      noEjecutados: 0,
      pendientes: 0,
    }

    for (const v of viajes) {
      if (v.estado === 'ejecutado') stats.ejecutados++
      else if (v.estado === 'parcial') stats.parciales++
      else if (v.estado === 'no_ejecutado') stats.noEjecutados++
      else stats.pendientes++
    }

    return stats
  }, [viajes])

  // Obtener estado del día (para colorear el calendario)
  const getEstadoDia = (fecha: Date) => {
    const fechaStr = fecha.toISOString().split('T')[0]
    const viajesDia = viajesPorFecha.get(fechaStr) || []

    if (viajesDia.length === 0) return 'sin-viajes'

    const todosEjecutados = viajesDia.every((v) => v.estado === 'ejecutado')
    const algunoPendiente = viajesDia.some((v) => v.estado === 'pendiente')
    const algunoNoEjecutado = viajesDia.some((v) => v.estado === 'no_ejecutado')

    if (todosEjecutados) return 'completo'
    if (algunoPendiente) return 'pendiente'
    if (algunoNoEjecutado) return 'con-problemas'
    return 'parcial'
  }

  // Formatear nombre del día
  const getNombreDia = (fecha: Date) => {
    return fecha.toLocaleDateString('es-CO', { weekday: 'short' })
  }

  // Generar viajes desde rutas programadas
  const handleGenerarViajes = () => {
    if (!quincena) return

    generarViajesMutation.mutate(
      {
        quincenaId: quincena.id,
        fechaInicio: quincena.fecha_inicio,
        fechaFin: quincena.fecha_fin,
      },
      {
        onSuccess: (viajesCreados) => {
          toast.success(`${viajesCreados.length} viajes generados`)
          refetchViajes()
        },
        onError: (error) => {
          toast.error('Error al generar viajes: ' + error.message)
        },
      }
    )
  }

  // Cambiar estado de viaje
  const handleCambiarEstadoViaje = (viaje: LiqViajeEjecutado, nuevoEstado: EstadoViaje) => {
    updateEstadoViajeMutation.mutate(
      {
        id: viaje.id,
        estado: nuevoEstado,
        quincenaId: resolvedParams.id,
      },
      {
        onSuccess: () => {
          toast.success('Estado actualizado')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  // Marcar quincena como validada
  const handleValidarQuincena = () => {
    updateEstadoQuincenaMutation.mutate(
      { id: resolvedParams.id, estado: 'validado' },
      {
        onSuccess: () => {
          toast.success('Quincena marcada como validada')
          setConfirmValidar(false)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  // Icono de estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ejecutado':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'no_ejecutado':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'parcial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!escenario && !escenarioLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">No hay escenario activo</p>
          <p className="text-muted-foreground">
            Activa un escenario en Planeacion Logi para continuar
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!quincena) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Quincena no encontrada</p>
        <Button asChild variant="outline">
          <Link href="/validacion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>
    )
  }

  const esEditable = quincena.estado === 'borrador'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/validacion">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{formatearQuincena(quincena)}</h1>
          <p className="text-muted-foreground">
            {quincena.fecha_inicio} al {quincena.fecha_fin}
          </p>
        </div>
        <Badge variant={quincena.estado === 'borrador' ? 'secondary' : 'default'}>
          {quincena.estado.charAt(0).toUpperCase() + quincena.estado.slice(1)}
        </Badge>
      </div>

      {/* Acciones */}
      {esEditable && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerarViajes}
            disabled={generarViajesMutation.isPending}
          >
            {generarViajesMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generar viajes desde rutas
          </Button>
          {estadisticas.pendientes === 0 && estadisticas.total > 0 && (
            <Button onClick={() => setConfirmValidar(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como validado
            </Button>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-sm text-muted-foreground">Viajes programados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{estadisticas.ejecutados}</div>
            <p className="text-sm text-muted-foreground">Ejecutados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500">{estadisticas.parciales}</div>
            <p className="text-sm text-muted-foreground">Parciales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-muted-foreground">{estadisticas.pendientes}</div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendario de días */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dias del periodo
            </CardTitle>
            <CardDescription>
              Selecciona un dia para ver y validar los viajes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fechasPeriodo.length === 0 ? (
              <p className="text-muted-foreground">No hay fechas en el periodo</p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {fechasPeriodo.map((fecha) => {
                  const fechaStr = fecha.toISOString().split('T')[0]
                  const estadoDia = getEstadoDia(fecha)
                  const viajesDia = viajesPorFecha.get(fechaStr) || []
                  const esSeleccionado = fechaSeleccionada === fechaStr

                  return (
                    <button
                      key={fechaStr}
                      onClick={() => setFechaSeleccionada(fechaStr)}
                      className={`rounded-lg border p-2 text-center transition-colors ${
                        esSeleccionado
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-muted'
                      } ${
                        estadoDia === 'completo'
                          ? 'border-green-200 bg-green-50'
                          : estadoDia === 'con-problemas'
                          ? 'border-red-200 bg-red-50'
                          : estadoDia === 'parcial'
                          ? 'border-yellow-200 bg-yellow-50'
                          : ''
                      }`}
                    >
                      <div className="text-xs text-muted-foreground">
                        {getNombreDia(fecha)}
                      </div>
                      <div className="text-lg font-medium">{fecha.getDate()}</div>
                      <div className="text-xs text-muted-foreground">
                        {viajesDia.length} viaje(s)
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de viajes del día seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Viajes del dia
            </CardTitle>
            <CardDescription>
              {fechaSeleccionada
                ? new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Selecciona un dia para ver los viajes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!fechaSeleccionada ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Selecciona un dia en el calendario
              </div>
            ) : viajesFechaSeleccionada.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                <Truck className="h-8 w-8" />
                <p>No hay viajes programados para este dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {viajesFechaSeleccionada.map((viaje) => (
                  <div
                    key={viaje.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {getEstadoIcon(viaje.estado)}
                      <div>
                        <p className="font-medium">
                          {viaje.vehiculo_tercero?.placa || 'Sin placa'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {viaje.ruta?.nombre || 'Ruta no definida'}
                        </p>
                      </div>
                    </div>
                    {esEditable ? (
                      <Select
                        value={viaje.estado}
                        onValueChange={(v) =>
                          handleCambiarEstadoViaje(viaje, v as EstadoViaje)
                        }
                        disabled={updateEstadoViajeMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosViaje.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{getEstadoViajeLabel(viaje.estado)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmación de validar */}
      <AlertDialog open={confirmValidar} onOpenChange={setConfirmValidar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Validar quincena</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de marcar esta quincena como validada? Una vez validada,
              podras proceder a la liquidacion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleValidarQuincena}
              disabled={updateEstadoQuincenaMutation.isPending}
            >
              {updateEstadoQuincenaMutation.isPending ? 'Validando...' : 'Validar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
