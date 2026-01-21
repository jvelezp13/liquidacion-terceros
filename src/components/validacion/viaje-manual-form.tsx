'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, Loader2, Plus, Truck } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { LiqVehiculoTerceroConDetalles } from '@/types/database.types'

// Schema de validacion
const viajeManualSchema = z.object({
  vehiculo_tercero_id: z.string().min(1, 'Selecciona un vehículo'),
  fecha: z.date({ message: 'Selecciona una fecha' }),
  destino: z.string().min(1, 'Ingresa el destino del viaje'),
  costo_combustible: z.number().min(0),
  costo_peajes: z.number().min(0),
  costo_flete_adicional: z.number().min(0),
  costo_pernocta: z.number().min(0),
  notas: z.string().optional(),
})

type ViajeManualFormData = z.infer<typeof viajeManualSchema>

interface ViajeManualFormProps {
  vehiculos: LiqVehiculoTerceroConDetalles[]
  fechaInicio: Date
  fechaFin: Date
  onSubmit: (data: {
    vehiculo_tercero_id: string
    fecha: string
    destino: string
    costo_combustible: number
    costo_peajes: number
    costo_flete_adicional: number
    costo_pernocta: number
    notas?: string
  }) => Promise<void>
  isLoading?: boolean
}

export function ViajeManualForm({
  vehiculos,
  fechaInicio,
  fechaFin,
  onSubmit,
  isLoading = false,
}: ViajeManualFormProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<ViajeManualFormData>({
    resolver: zodResolver(viajeManualSchema),
    defaultValues: {
      vehiculo_tercero_id: '',
      destino: '',
      costo_combustible: 0,
      costo_peajes: 0,
      costo_flete_adicional: 0,
      costo_pernocta: 0,
      notas: '',
    },
  })

  const handleSubmit = async (data: ViajeManualFormData) => {
    await onSubmit({
      vehiculo_tercero_id: data.vehiculo_tercero_id,
      fecha: format(data.fecha, 'yyyy-MM-dd'),
      destino: data.destino,
      costo_combustible: data.costo_combustible,
      costo_peajes: data.costo_peajes,
      costo_flete_adicional: data.costo_flete_adicional,
      costo_pernocta: data.costo_pernocta,
      notas: data.notas,
    })
    form.reset()
    setOpen(false)
  }

  // Filtrar solo vehiculos esporadicos (sin vehiculo_id de PlaneacionLogi)
  const vehiculosEsporadicos = vehiculos.filter((v) => !v.vehiculo_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Viaje manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear viaje manual</DialogTitle>
          <DialogDescription>
            Agrega un viaje para vehículos esporádicos sin ruta programada.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Selector de vehiculo */}
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
                      {vehiculosEsporadicos.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No hay vehículos esporádicos
                        </div>
                      ) : (
                        vehiculosEsporadicos.map((v) => (
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
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Solo vehículos esporádicos (sin ruta de PlaneacionLogi)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Destino */}
            <FormField
              control={form.control}
              name="destino"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Bogotá - Medellín"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormDescription>
                    Identifica el viaje en la lista de validación
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Costos */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Costos del viaje
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
                          value={field.value === 0 ? '0' : field.value || ''}
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
                          value={field.value === 0 ? '0' : field.value || ''}
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
                          value={field.value === 0 ? '0' : field.value || ''}
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
                          value={field.value === 0 ? '0' : field.value || ''}
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
                      placeholder="Descripción del viaje (opcional)"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
