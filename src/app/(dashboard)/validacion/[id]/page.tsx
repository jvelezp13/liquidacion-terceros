'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Route,
  Clock,
  Truck,
  RefreshCw,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuincena, useUpdateEstadoQuincena, formatearQuincena } from '@/lib/hooks/use-quincenas'
import {
  useViajesQuincena,
  useUpdateEstadoViaje,
  useUpdateEstadoViajeConVariacion,
  useGenerarViajesDesdeRutas,
} from '@/lib/hooks/use-viajes-ejecutados'
import { useRutasLogisticas } from '@/lib/hooks/use-rutas-logisticas'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import {
  CalendarioCompacto,
  TarjetaViaje,
  VistaPorVehiculo,
} from '@/components/validacion'
import type { EstadoViaje } from '@/types/database.types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ValidacionQuincenaPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
  const [confirmValidar, setConfirmValidar] = useState(false)
  const [vistaActiva, setVistaActiva] = useState<'dia' | 'vehiculo'>('dia')

  const { data: escenario, isLoading: escenarioLoading } = useEscenarioActivo()
  const { data: quincena, isLoading: quincenaLoading } = useQuincena(resolvedParams.id)
  const { data: viajes = [], isLoading: viajesLoading, refetch: refetchViajes } = useViajesQuincena(resolvedParams.id)
  const { data: rutas = [] } = useRutasLogisticas()

  const updateEstadoViajeMutation = useUpdateEstadoViaje()
  const updateEstadoViajeConVariacionMutation = useUpdateEstadoViajeConVariacion()
  const generarViajesMutation = useGenerarViajesDesdeRutas()
  const updateEstadoQuincenaMutation = useUpdateEstadoQuincena()

  const isLoading = escenarioLoading || quincenaLoading || viajesLoading

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
      variacion: 0,
      noEjecutados: 0,
      pendientes: 0,
    }

    for (const v of viajes) {
      if (v.estado === 'ejecutado') stats.ejecutados++
      else if (v.estado === 'variacion') stats.variacion++
      else if (v.estado === 'no_ejecutado') stats.noEjecutados++
      else stats.pendientes++
    }

    return stats
  }, [viajes])

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

  // Cambiar estado de viaje (sin variación)
  const handleCambiarEstadoViaje = (viajeId: string, nuevoEstado: EstadoViaje, quincenaId: string) => {
    updateEstadoViajeMutation.mutate(
      {
        id: viajeId,
        estado: nuevoEstado,
        quincenaId,
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

  // Cambiar estado de viaje con ruta de variación
  const handleCambiarEstadoConVariacion = (
    viajeId: string,
    nuevoEstado: EstadoViaje,
    rutaVariacionId: string | null,
    quincenaId: string
  ) => {
    updateEstadoViajeConVariacionMutation.mutate(
      {
        id: viajeId,
        estado: nuevoEstado,
        rutaVariacionId,
        quincenaId,
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
  const isUpdating = updateEstadoViajeMutation.isPending || updateEstadoViajeConVariacionMutation.isPending

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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-sm text-muted-foreground">Viajes programados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{estadisticas.ejecutados}</span>
            </div>
            <p className="text-sm text-muted-foreground">Ejecutados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{estadisticas.variacion}</span>
            </div>
            <p className="text-sm text-muted-foreground">Otra ruta</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{estadisticas.noEjecutados}</span>
            </div>
            <p className="text-sm text-muted-foreground">No salieron</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{estadisticas.pendientes}</span>
            </div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para cambiar vista */}
      <Tabs value={vistaActiva} onValueChange={(v) => setVistaActiva(v as 'dia' | 'vehiculo')}>
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="dia" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Por Día
          </TabsTrigger>
          <TabsTrigger value="vehiculo" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Por Vehículo
          </TabsTrigger>
        </TabsList>

        {/* Vista por Día */}
        <TabsContent value="dia" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendario compacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendario
                </CardTitle>
                <CardDescription>
                  Selecciona un día para ver y validar los viajes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarioCompacto
                  fechaInicio={quincena.fecha_inicio}
                  fechaFin={quincena.fecha_fin}
                  viajes={viajes}
                  fechaSeleccionada={fechaSeleccionada}
                  onSelectFecha={setFechaSeleccionada}
                />
              </CardContent>
            </Card>

            {/* Lista de viajes del día seleccionado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Viajes del día
                </CardTitle>
                <CardDescription>
                  {fechaSeleccionada
                    ? new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    : 'Selecciona un día para ver los viajes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!fechaSeleccionada ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground">
                    Selecciona un día en el calendario
                  </div>
                ) : viajesFechaSeleccionada.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Truck className="h-8 w-8" />
                    <p>No hay viajes programados para este día</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {viajesFechaSeleccionada.map((viaje) => (
                      <TarjetaViaje
                        key={viaje.id}
                        viaje={viaje}
                        rutas={rutas}
                        onCambiarEstado={(estado) =>
                          handleCambiarEstadoViaje(viaje.id, estado, resolvedParams.id)
                        }
                        onCambiarEstadoConVariacion={(estado, rutaVariacionId) =>
                          handleCambiarEstadoConVariacion(viaje.id, estado, rutaVariacionId, resolvedParams.id)
                        }
                        isUpdating={isUpdating}
                        disabled={!esEditable}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vista por Vehículo */}
        <TabsContent value="vehiculo" className="mt-4">
          <VistaPorVehiculo
            viajes={viajes}
            rutas={rutas}
            onCambiarEstado={handleCambiarEstadoViaje}
            onCambiarEstadoConVariacion={handleCambiarEstadoConVariacion}
            isUpdating={isUpdating}
            disabled={!esEditable}
            quincenaId={resolvedParams.id}
          />
        </TabsContent>
      </Tabs>

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
