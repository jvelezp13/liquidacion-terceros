'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Truck, AlertCircle } from 'lucide-react'
import {
  vehiculoTerceroSchema,
  type VehiculoTerceroFormData,
} from '@/lib/validations/vehiculo-tercero'
import type { LiqVehiculoTerceroConDetalles, Vehiculo, VehiculoCostos, LiqContratista } from '@/types/database.types'

// Tipo para vehículos sin vincular
type VehiculoSinVincular = Vehiculo & { costos: VehiculoCostos | null }

interface VehiculoTerceroFormProps {
  vehiculosSinVincular?: VehiculoSinVincular[]
  contratistas?: LiqContratista[]
  vehiculoTercero?: LiqVehiculoTerceroConDetalles
  onSubmit: (data: VehiculoTerceroFormData) => void
  onCancel: () => void
  isLoading?: boolean
  isLoadingData?: boolean
}

export function VehiculoTerceroForm({
  vehiculosSinVincular = [],
  contratistas = [],
  vehiculoTercero,
  onSubmit,
  onCancel,
  isLoading = false,
  isLoadingData = false,
}: VehiculoTerceroFormProps) {
  const isEditing = !!vehiculoTercero
  const esEsporadicoExistente = isEditing && !vehiculoTercero.vehiculo_id

  // Estado local para controlar si es esporádico
  const [esEsporadico, setEsEsporadico] = useState(esEsporadicoExistente)

  const form = useForm<VehiculoTerceroFormData>({
    resolver: zodResolver(vehiculoTerceroSchema),
    defaultValues: {
      vehiculo_id: vehiculoTercero?.vehiculo_id || '',
      contratista_id: vehiculoTercero?.contratista_id || '',
      placa: vehiculoTercero?.placa || '',
      conductor_nombre: vehiculoTercero?.conductor_nombre || '',
      conductor_telefono: vehiculoTercero?.conductor_telefono || '',
      conductor_documento: vehiculoTercero?.conductor_documento || '',
      notas: vehiculoTercero?.notas || '',
      modalidad_costo: vehiculoTercero?.modalidad_costo || undefined,
      flete_mensual: vehiculoTercero?.flete_mensual || undefined,
      costo_por_viaje: vehiculoTercero?.costo_por_viaje || undefined,
    },
  })

  const modalidadCosto = form.watch('modalidad_costo')

  const handleSubmit = (data: VehiculoTerceroFormData) => {
    const cleanData = {
      ...data,
      // Si es esporádico, limpiar vehiculo_id
      vehiculo_id: esEsporadico ? undefined : data.vehiculo_id,
      conductor_nombre: data.conductor_nombre || undefined,
      conductor_telefono: data.conductor_telefono || undefined,
      conductor_documento: data.conductor_documento || undefined,
      notas: data.notas || undefined,
      // Solo incluir costos si es esporádico
      modalidad_costo: esEsporadico ? data.modalidad_costo : undefined,
      flete_mensual: esEsporadico && data.modalidad_costo === 'flete_fijo' ? data.flete_mensual : undefined,
      costo_por_viaje: esEsporadico && data.modalidad_costo === 'por_viaje' ? data.costo_por_viaje : undefined,
    }
    onSubmit(cleanData)
  }

  // Al cambiar el switch, limpiar campos relacionados
  const handleEsporadicoChange = (checked: boolean) => {
    setEsEsporadico(checked)
    if (checked) {
      form.setValue('vehiculo_id', '')
    } else {
      form.setValue('modalidad_costo', undefined)
      form.setValue('flete_mensual', undefined)
      form.setValue('costo_por_viaje', undefined)
    }
  }

  const formatCosto = (vehiculo: VehiculoSinVincular) => {
    if (!vehiculo.costos) return ''
    const { modalidad_tercero, costo_por_viaje, flete_mensual } = vehiculo.costos
    if (modalidad_tercero === 'por_viaje' && costo_por_viaje) {
      return `$${costo_por_viaje.toLocaleString()}/viaje`
    }
    if (modalidad_tercero === 'flete_fijo' && flete_mensual) {
      return `$${flete_mensual.toLocaleString()}/mes`
    }
    return ''
  }

  if (isLoadingData) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Tipo de vehículo */}
        {!isEditing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Vehículo esporádico</p>
                <p className="text-sm text-muted-foreground">
                  Activar si el vehículo no está en PlaneacionLogi
                </p>
              </div>
              <Switch
                checked={esEsporadico}
                onCheckedChange={handleEsporadicoChange}
              />
            </div>

            {esEsporadico && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los costos se registrarán como &quot;vehículos esporádicos&quot; en seguimiento.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Selección de vehículo (solo si NO es esporádico) */}
        {!esEsporadico && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Vehículo</h3>

            {isEditing ? (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{vehiculoTercero.vehiculo?.nombre || vehiculoTercero.placa}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehiculoTercero.vehiculo?.tipo_vehiculo || 'Vehículo esporádico'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="vehiculo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículo de Planeación *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un vehículo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehiculosSinVincular.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No hay vehículos terceros disponibles
                          </div>
                        ) : (
                          vehiculosSinVincular.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{v.nombre}</span>
                                <span className="text-xs text-muted-foreground">
                                  {v.tipo_vehiculo} {formatCosto(v)}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Vehículos con esquema &quot;tercero&quot; sin vincular
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Campos de costos (solo si ES esporádico) */}
        {esEsporadico && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Costos del Vehículo</h3>

            <FormField
              control={form.control}
              name="modalidad_costo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidad de costo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona modalidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="por_viaje">Por viaje</SelectItem>
                      <SelectItem value="flete_fijo">Flete fijo mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {modalidadCosto === 'flete_fijo' && (
              <FormField
                control={form.control}
                name="flete_mensual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flete mensual *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>Se divide por quincena</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {modalidadCosto === 'por_viaje' && (
              <FormField
                control={form.control}
                name="costo_por_viaje"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo por viaje *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>Se multiplica por viajes ejecutados</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Contratista */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Contratista</h3>

          <FormField
            control={form.control}
            name="contratista_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contratista (Propietario) *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un contratista" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contratistas.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No hay contratistas registrados
                      </div>
                    ) : (
                      contratistas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span>{c.nombre}</span>
                            <span className="text-xs text-muted-foreground">
                              {c.numero_documento}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Placa */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Datos del Vehículo</h3>

          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ABC-123"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Conductor */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Conductor</h3>

          <FormField
            control={form.control}
            name="conductor_nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del conductor</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="conductor_telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+57 300 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conductor_documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de documento" {...field} />
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
                <Input placeholder="Observaciones adicionales" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : esEsporadico ? 'Crear' : 'Vincular'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
