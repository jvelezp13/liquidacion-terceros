'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar, Clock } from 'lucide-react'
import {
  quincenaSchema,
  type QuincenaFormData,
} from '@/lib/validations/quincena'
import {
  calcularFechasPeriodo,
  calcularDuracionPeriodo,
} from '@/lib/hooks/use-quincenas'

interface QuincenaFormProps {
  onSubmit: (data: QuincenaFormData) => void
  onCancel: () => void
  isLoading?: boolean
  añoDefault?: number
}

export function QuincenaForm({
  onSubmit,
  onCancel,
  isLoading = false,
  añoDefault,
}: QuincenaFormProps) {
  const currentYear = añoDefault || new Date().getFullYear()

  // Fechas por defecto: hoy + 13 dias (2 semanas)
  const fechasDefault = calcularFechasPeriodo()

  const form = useForm<QuincenaFormData>({
    resolver: zodResolver(quincenaSchema),
    defaultValues: {
      año: currentYear,
      fecha_inicio: fechasDefault.fecha_inicio,
      fecha_fin: fechasDefault.fecha_fin,
      notas: '',
    },
  })

  const watchFechaInicio = form.watch('fecha_inicio')
  const watchFechaFin = form.watch('fecha_fin')

  // Calcular duracion del periodo
  const duracion = watchFechaInicio && watchFechaFin
    ? calcularDuracionPeriodo(watchFechaInicio, watchFechaFin)
    : 0

  const handleSubmit = (data: QuincenaFormData) => {
    onSubmit({
      ...data,
      notas: data.notas || undefined,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Año */}
        <FormField
          control={form.control}
          name="año"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Año *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2020}
                  max={2100}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                El numero de periodo se asignara automaticamente
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fechas del periodo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Fechas del periodo
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fecha_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha inicio *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha_fin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha fin *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Duracion calculada */}
          {duracion > 0 && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Duracion: <strong>{duracion} dias</strong>
                {duracion === 14 && (
                  <span className="ml-2 text-muted-foreground">(2 semanas)</span>
                )}
                {duracion === 15 && (
                  <span className="ml-2 text-muted-foreground">(quincena estandar)</span>
                )}
              </span>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Las fechas pueden cruzar meses. El mes para sincronizacion se derivara de la fecha de inicio.
          </p>
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
              <FormDescription>
                Opcional: Agrega notas o comentarios sobre este periodo
              </FormDescription>
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
            {isLoading ? 'Creando...' : 'Crear Periodo'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
