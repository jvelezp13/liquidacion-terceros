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
  useConfirmarViajesBatch,
  useUpsertViaje,
  useDeleteViaje,
} from '@/lib/hooks/use-viajes-ejecutados'
import { useRutasLogisticas } from '@/lib/hooks/use-rutas-logisticas'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import { useVehiculosTerceros } from '@/lib/hooks/use-vehiculos-terceros'
import {
  CalendarioCompacto,
  TarjetaViaje,
  VistaPorVehiculo,
} from '@/components/validacion'
import { ViajeManualForm } from '@/components/validacion/viaje-manual-form'
import type { EstadoViaje } from '@/types'

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
  const { data: vehiculosTerceros = [] } = useVehiculosTerceros()

  const updateEstadoViajeMutation = useUpdateEstadoViaje()
  const updateEstadoViajeConVariacionMutation = useUpdateEstadoViajeConVariacion()
  const confirmarViajesBatchMutation = useConfirmarViajesBatch()
  const generarViajesMutation = useGenerarViajesDesdeRutas()
  const updateEstadoQuincenaMutation = useUpdateEstadoQuincena()
  const upsertViajeMutation = useUpsertViaje()
  const deleteViajeMutation = useDeleteViaje()

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

  // Viajes pendientes del día seleccionado
  const viajesPendientesDelDia = viajesFechaSeleccionada.filter((v) => v.estado === 'pendiente')

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
        escenarioId: escenario?.id, // Para obtener costos de planificación
      },
      {
        onSuccess: (viajesCreados) => {
          toast.success(`${viajesCreados.length} viajes generados con costos asignados`)
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

  // Confirmar todas las rutas pendientes del día como ejecutadas
  const handleConfirmarTodasDelDia = () => {
    if (viajesPendientesDelDia.length === 0) return

    confirmarViajesBatchMutation.mutate(
      {
        viajeIds: viajesPendientesDelDia.map((v) => v.id),
        quincenaId: resolvedParams.id,
      },
      {
        onSuccess: () => {
          toast.success(`${viajesPendientesDelDia.length} rutas confirmadas`)
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

  // Crear viaje adicional (para cualquier vehículo)
  const handleCrearViajeManual = async (data: {
    vehiculo_tercero_id: string
    fecha: string
    ruta_programada_id?: string
    destino?: string
    costo_combustible: number
    costo_peajes: number
    costo_flete_adicional: number
    costo_pernocta: number
    notas?: string
  }) => {
    await upsertViajeMutation.mutateAsync(
      {
        quincena_id: resolvedParams.id,
        vehiculo_tercero_id: data.vehiculo_tercero_id,
        fecha: data.fecha,
        ruta_programada_id: data.ruta_programada_id || null,
        destino: data.destino || null,
        estado: 'pendiente',
        costo_combustible: data.costo_combustible,
        costo_peajes: data.costo_peajes,
        costo_flete_adicional: data.costo_flete_adicional,
        costo_pernocta: data.costo_pernocta,
        notas: data.notas,
      },
      {
        onSuccess: () => {
          toast.success('Viaje creado')
          refetchViajes()
        },
        onError: (error) => {
          toast.error('Error al crear viaje: ' + error.message)
        },
      }
    )
  }

  // Eliminar viaje
  const handleEliminarViaje = (viajeId: string) => {
    if (!confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.')) return

    deleteViajeMutation.mutate(
      { id: viajeId, quincenaId: resolvedParams.id },
      {
        onSuccess: () => {
          toast.success('Viaje eliminado')
        },
        onError: (error) => {
          toast.error('Error al eliminar: ' + error.message)
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
  const isUpdating = updateEstadoViajeMutation.isPending || updateEstadoViajeConVariacionMutation.isPending || confirmarViajesBatchMutation.isPending

  return (
    <div className="space-y-3">
      {/* Header compacto */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/validacion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold truncate">{formatearQuincena(quincena)}</h1>
            <Badge variant={quincena.estado === 'borrador' ? 'secondary' : 'default'} className="text-xs">
              {quincena.estado.charAt(0).toUpperCase() + quincena.estado.slice(1)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {quincena.fecha_inicio} al {quincena.fecha_fin}
          </p>
        </div>
        {/* Acciones en el header */}
        {esEditable && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerarViajes}
              disabled={generarViajesMutation.isPending}
            >
              {generarViajesMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Generar viajes
            </Button>
            {quincena && (
              <ViajeManualForm
                vehiculos={vehiculosTerceros}
                fechaInicio={new Date(quincena.fecha_inicio + 'T00:00:00')}
                fechaFin={new Date(quincena.fecha_fin + 'T00:00:00')}
                escenarioId={escenario?.id}
                onSubmit={handleCrearViajeManual}
                isLoading={upsertViajeMutation.isPending}
              />
            )}
            {estadisticas.pendientes === 0 && estadisticas.total > 0 && (
              <Button size="sm" onClick={() => setConfirmValidar(true)}>
                <CheckCircle className="mr-1 h-3 w-3" />
                Validar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs para cambiar vista */}
      <Tabs value={vistaActiva} onValueChange={(v) => setVistaActiva(v as 'dia' | 'vehiculo')}>
        <TabsList className="h-8">
          <TabsTrigger value="dia" className="flex items-center gap-1.5 text-xs px-3">
            <CalendarDays className="h-3.5 w-3.5" />
            Por Día
          </TabsTrigger>
          <TabsTrigger value="vehiculo" className="flex items-center gap-1.5 text-xs px-3">
            <Truck className="h-3.5 w-3.5" />
            Por Vehículo
          </TabsTrigger>
        </TabsList>

        {/* Vista por Día */}
        <TabsContent value="dia" className="mt-3">
          <div className="grid gap-4 lg:grid-cols-[3fr_7fr]">
            {/* Calendario compacto */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Calendario</span>
              </div>
              <CalendarioCompacto
                fechaInicio={quincena.fecha_inicio}
                fechaFin={quincena.fecha_fin}
                viajes={viajes}
                fechaSeleccionada={fechaSeleccionada}
                onSelectFecha={setFechaSeleccionada}
              />
            </Card>

            {/* Lista de viajes del día seleccionado */}
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {fechaSeleccionada
                    ? new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    : 'Viajes del día'}
                </span>
                {fechaSeleccionada && viajesFechaSeleccionada.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge variant="secondary" className="text-xs">
                      {viajesFechaSeleccionada.length} viajes
                    </Badge>
                    {esEditable && viajesPendientesDelDia.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={handleConfirmarTodasDelDia}
                        disabled={confirmarViajesBatchMutation.isPending}
                      >
                        {confirmarViajesBatchMutation.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        Confirmar todas
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {!fechaSeleccionada ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  Selecciona un día en el calendario
                </div>
              ) : viajesFechaSeleccionada.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-1 text-muted-foreground">
                  <Truck className="h-6 w-6" />
                  <p className="text-sm">No hay viajes para este día</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
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
                      onEliminar={() => handleEliminarViaje(viaje.id)}
                      isUpdating={isUpdating}
                      disabled={!esEditable}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Vista por Vehículo */}
        <TabsContent value="vehiculo" className="mt-3">
          <VistaPorVehiculo
            viajes={viajes}
            rutas={rutas}
            onCambiarEstado={handleCambiarEstadoViaje}
            onCambiarEstadoConVariacion={handleCambiarEstadoConVariacion}
            onEliminar={handleEliminarViaje}
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
