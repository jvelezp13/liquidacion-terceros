'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarIcon,
  Loader2,
  Plus,
  Truck,
  ChevronRight,
  ChevronLeft,
  Route,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRutasLogisticas } from '@/lib/hooks/use-rutas-logisticas'
import { createClient } from '@/lib/supabase/client'
import { calcularCostosViaje, type DatosRutaPlanificacion, type CostoDiaPlanificacion } from '@/lib/utils/generar-viajes'
import type { LiqVehiculoTerceroConDetalles, RutaLogistica } from '@/types'

// Schema de validacion
const viajeAdicionalSchema = z.object({
  vehiculo_tercero_id: z.string().min(1, 'Selecciona un vehículo'),
  tipo_ruta: z.enum(['existente', 'libre']),
  ruta_id: z.string().optional(),
  destino: z.string().optional(),
  fecha: z.date({ message: 'Selecciona una fecha' }),
  costo_combustible: z.number().min(0),
  costo_peajes: z.number().min(0),
  costo_flete_adicional: z.number().min(0),
  costo_pernocta: z.number().min(0),
  notas: z.string().optional(),
}).refine(
  (data) => {
    // Si tipo_ruta es 'existente', debe haber ruta_id
    if (data.tipo_ruta === 'existente') {
      return !!data.ruta_id
    }
    // Si tipo_ruta es 'libre', debe haber destino
    if (data.tipo_ruta === 'libre') {
      return !!data.destino && data.destino.trim().length > 0
    }
    return true
  },
  {
    message: 'Debes seleccionar una ruta o ingresar un destino',
    path: ['destino'],
  }
)

type ViajeAdicionalFormData = z.infer<typeof viajeAdicionalSchema>

interface ViajeManualFormProps {
  vehiculos: LiqVehiculoTerceroConDetalles[]
  fechaInicio: Date
  fechaFin: Date
  escenarioId?: string // Para consultar costos de planificacion_lejanias
  onSubmit: (data: {
    vehiculo_tercero_id: string
    fecha: string
    ruta_programada_id?: string
    destino?: string
    costo_combustible: number
    costo_peajes: number
    costo_flete_adicional: number
    costo_pernocta: number
    notas?: string
  }) => Promise<void>
  isLoading?: boolean
}

type Paso = 1 | 2 | 3

export function ViajeManualForm({
  vehiculos,
  fechaInicio,
  fechaFin,
  escenarioId,
  onSubmit,
  isLoading = false,
}: ViajeManualFormProps) {
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState<Paso>(1)
  const [cargandoCostos, setCargandoCostos] = useState(false)

  const { data: rutasLogisticas = [] } = useRutasLogisticas()

  const form = useForm<ViajeAdicionalFormData>({
    resolver: zodResolver(viajeAdicionalSchema),
    defaultValues: {
      vehiculo_tercero_id: '',
      tipo_ruta: 'existente',
      ruta_id: '',
      destino: '',
      costo_combustible: 0,
      costo_peajes: 0,
      costo_flete_adicional: 0,
      costo_pernocta: 0,
      notas: '',
    },
  })

  const vehiculoSeleccionadoId = form.watch('vehiculo_tercero_id')
  const tipoRuta = form.watch('tipo_ruta')

  // Obtener el vehículo seleccionado
  const vehiculoSeleccionado = useMemo(() => {
    return vehiculos.find((v) => v.id === vehiculoSeleccionadoId)
  }, [vehiculos, vehiculoSeleccionadoId])

  // Determinar si es vehículo de planeación (tiene vehiculo_id)
  const esVehiculoPlaneacion = vehiculoSeleccionado?.vehiculo_id != null

  // Separar vehículos por tipo para mostrar agrupados
  const vehiculosPlaneacion = useMemo(() => {
    return vehiculos.filter((v) => v.vehiculo_id != null)
  }, [vehiculos])

  const vehiculosEsporadicos = useMemo(() => {
    return vehiculos.filter((v) => v.vehiculo_id == null)
  }, [vehiculos])

  // Filtrar rutas del vehículo seleccionado (si es de planeación)
  const rutasDelVehiculo = useMemo(() => {
    if (!vehiculoSeleccionado?.vehiculo_id) return []
    return rutasLogisticas.filter(
      (r) => r.vehiculo_id === vehiculoSeleccionado.vehiculo_id
    )
  }, [rutasLogisticas, vehiculoSeleccionado])

  const rutaId = form.watch('ruta_id')

  // Función para cargar costos de planificación cuando se selecciona una ruta existente
  const cargarCostosDeRuta = useCallback(async (rutaIdSeleccionada: string) => {
    if (!escenarioId || !rutaIdSeleccionada) return

    setCargandoCostos(true)
    try {
      const supabase = createClient()
      // Consultar planificacion_lejanias para obtener costos_por_dia y peajes_ciclo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: planificacion, error } = await (supabase as any)
        .from('planificacion_lejanias')
        .select('costos_por_dia, peajes_ciclo, frecuencia')
        .eq('escenario_id', escenarioId)
        .eq('ruta_id', rutaIdSeleccionada)
        .eq('tipo', 'logistico')
        .single()

      if (error || !planificacion) {
        // No hay planificación para esta ruta, los costos quedan en 0
        return
      }

      // Construir DatosRutaPlanificacion para calcularCostosViaje
      const datosRuta: DatosRutaPlanificacion = {
        costos: (planificacion.costos_por_dia || []) as CostoDiaPlanificacion[],
        peajesCiclo: planificacion.peajes_ciclo || 0,
        frecuencia: planificacion.frecuencia || 'quincenal',
      }

      // Usar calcularCostosViaje con usarPrimerDiaSiFalta=true
      // Esto obtiene costos promedio de la ruta independiente del día
      const costos = calcularCostosViaje(datosRuta, 1, true)

      // Autocompletar campos del formulario
      form.setValue('costo_combustible', Math.round(costos.costoCombustible))
      form.setValue('costo_peajes', Math.round(costos.costoPeajes))
      form.setValue('costo_flete_adicional', Math.round(costos.costoAdicionales))
      form.setValue('costo_pernocta', Math.round(costos.costoPernocta))
    } finally {
      setCargandoCostos(false)
    }
  }, [escenarioId, form])

  // Efecto: cuando se selecciona una ruta existente, cargar costos
  useEffect(() => {
    if (tipoRuta === 'existente' && rutaId) {
      cargarCostosDeRuta(rutaId)
    }
  }, [tipoRuta, rutaId, cargarCostosDeRuta])

  // Resetear formulario al cerrar
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      form.reset()
      setPaso(1)
    }
  }

  // Navegar entre pasos
  const siguientePaso = () => {
    if (paso === 1) {
      // Validar que haya vehículo seleccionado
      if (!vehiculoSeleccionadoId) {
        form.setError('vehiculo_tercero_id', { message: 'Selecciona un vehículo' })
        return
      }
      // Si es esporádico, saltar al paso 3 con tipo_ruta = 'libre'
      if (!esVehiculoPlaneacion) {
        form.setValue('tipo_ruta', 'libre')
        setPaso(3)
      } else {
        setPaso(2)
      }
    } else if (paso === 2) {
      // Validar según tipo de ruta
      if (tipoRuta === 'existente' && !form.getValues('ruta_id')) {
        form.setError('ruta_id', { message: 'Selecciona una ruta' })
        return
      }
      if (tipoRuta === 'libre' && !form.getValues('destino')?.trim()) {
        form.setError('destino', { message: 'Ingresa el destino' })
        return
      }
      setPaso(3)
    }
  }

  const pasoAnterior = () => {
    if (paso === 3) {
      // Si es esporádico, volver al paso 1
      if (!esVehiculoPlaneacion) {
        setPaso(1)
      } else {
        setPaso(2)
      }
    } else if (paso === 2) {
      setPaso(1)
    }
  }

  const handleSubmit = async (data: ViajeAdicionalFormData) => {
    await onSubmit({
      vehiculo_tercero_id: data.vehiculo_tercero_id,
      fecha: format(data.fecha, 'yyyy-MM-dd'),
      ruta_programada_id: data.tipo_ruta === 'existente' ? data.ruta_id : undefined,
      destino: data.tipo_ruta === 'libre' ? data.destino : undefined,
      costo_combustible: data.costo_combustible,
      costo_peajes: data.costo_peajes,
      costo_flete_adicional: data.costo_flete_adicional,
      costo_pernocta: data.costo_pernocta,
      notas: data.notas,
    })
    form.reset()
    setPaso(1)
    setOpen(false)
  }

  // Obtener título del paso actual
  const getTituloPaso = () => {
    switch (paso) {
      case 1:
        return 'Seleccionar vehículo'
      case 2:
        return 'Tipo de ruta'
      case 3:
        return 'Datos del viaje'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Agregar viaje
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Agregar viaje</span>
            <Badge variant="outline" className="ml-2">
              Paso {paso} de {esVehiculoPlaneacion || paso === 1 ? 3 : 2}
            </Badge>
          </DialogTitle>
          <DialogDescription>{getTituloPaso()}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* PASO 1: Selección de vehículo */}
            {paso === 1 && (
              <FormField
                control={form.control}
                name="vehiculo_tercero_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Vehículos de planeación */}
                        {vehiculosPlaneacion.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Vehículos de planeación
                            </div>
                            {vehiculosPlaneacion.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{v.placa}</span>
                                  <span className="text-muted-foreground">
                                    · {v.vehiculo?.nombre || 'Sin nombre'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}

                        {/* Separador */}
                        {vehiculosPlaneacion.length > 0 &&
                          vehiculosEsporadicos.length > 0 && (
                            <div className="my-1 border-t" />
                          )}

                        {/* Vehículos esporádicos */}
                        {vehiculosEsporadicos.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Vehículos esporádicos
                            </div>
                            {vehiculosEsporadicos.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{v.placa}</span>
                                  {v.conductor_nombre && (
                                    <span className="text-muted-foreground">
                                      · {v.conductor_nombre}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}

                        {vehiculos.length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No hay vehículos disponibles
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona el vehículo que realizó el viaje adicional
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* PASO 2: Tipo de ruta (solo para vehículos de planeación) */}
            {paso === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo_ruta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de ruta *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem
                              value="existente"
                              id="existente"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="existente"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Route className="mb-2 h-6 w-6" />
                              <span className="text-sm font-medium">Ruta existente</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">
                                Seleccionar una ruta de planeación
                              </span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="libre"
                              id="libre"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="libre"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <MapPin className="mb-2 h-6 w-6" />
                              <span className="text-sm font-medium">Destino libre</span>
                              <span className="text-xs text-muted-foreground text-center mt-1">
                                Ingresar destino manualmente
                              </span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selector de ruta existente */}
                {tipoRuta === 'existente' && (
                  <FormField
                    control={form.control}
                    name="ruta_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ruta *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona la ruta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rutasDelVehiculo.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Este vehículo no tiene rutas asignadas
                              </div>
                            ) : (
                              rutasDelVehiculo.map((ruta) => (
                                <SelectItem key={ruta.id} value={ruta.id}>
                                  <div className="flex items-center gap-2">
                                    <Route className="h-4 w-4 text-muted-foreground" />
                                    <span>{ruta.nombre}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Rutas configuradas para {vehiculoSeleccionado?.placa}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Campo de destino libre */}
                {tipoRuta === 'libre' && (
                  <FormField
                    control={form.control}
                    name="destino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Bogotá, Medellín"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe el destino del viaje
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* PASO 3: Fecha y costos */}
            {paso === 3 && (
              <div className="space-y-4">
                {/* Resumen del vehículo seleccionado */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4" />
                    <span className="font-medium">{vehiculoSeleccionado?.placa}</span>
                    {esVehiculoPlaneacion && (
                      <Badge variant="secondary" className="text-xs">
                        Planeación
                      </Badge>
                    )}
                    {!esVehiculoPlaneacion && (
                      <Badge variant="outline" className="text-xs">
                        Esporádico
                      </Badge>
                    )}
                  </div>
                  {tipoRuta === 'existente' && form.getValues('ruta_id') && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Route className="h-3 w-3" />
                      {rutasDelVehiculo.find((r) => r.id === form.getValues('ruta_id'))?.nombre}
                    </div>
                  )}
                  {tipoRuta === 'libre' && form.getValues('destino') && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {form.getValues('destino')}
                    </div>
                  )}
                </div>

                {/* Campo destino para esporádicos (que saltaron paso 2) */}
                {!esVehiculoPlaneacion && (
                  <FormField
                    control={form.control}
                    name="destino"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destino *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Bogotá, Medellín"
                            value={field.value ?? ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Fecha */}
                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha del viaje *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: es })
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < fechaInicio || date > fechaFin
                            }
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Debe estar dentro del período de la quincena
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Costos */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Costos del viaje (opcional)
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="costo_combustible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Combustible</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? 0 : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costo_peajes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peajes</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? 0 : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costo_flete_adicional"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flete adicional</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? 0 : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costo_pernocta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pernocta</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              value={field.value === 0 ? '' : field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === '' ? 0 : Number(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Notas */}
                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Observaciones (opcional)"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              {paso > 1 ? (
                <Button type="button" variant="outline" onClick={pasoAnterior}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
              )}

              {paso < 3 ? (
                <Button type="button" onClick={siguientePaso}>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear viaje'
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
