'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Calendar, AlertTriangle } from 'lucide-react'
import {
  quincenaSchema,
  type QuincenaFormData,
  mesesOptions,
  quincenaOptions,
} from '@/lib/validations/quincena'
import { calcularFechasQuincena } from '@/lib/hooks/use-quincenas'

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
  const currentMonth = new Date().getMonth() + 1

  // Calcular fechas iniciales
  const fechasIniciales = calcularFechasQuincena(currentYear, currentMonth, 1)

  const form = useForm<QuincenaFormData>({
    resolver: zodResolver(quincenaSchema),
    defaultValues: {
      año: currentYear,
      mes: currentMonth,
      quincena: 1,
      fecha_inicio: fechasIniciales.fecha_inicio,
      fecha_fin: fechasIniciales.fecha_fin,
      notas: '',
    },
  })

  const watchAño = form.watch('año')
  const watchMes = form.watch('mes')
  const watchQuincena = form.watch('quincena')
  const watchFechaInicio = form.watch('fecha_inicio')
  const watchFechaFin = form.watch('fecha_fin')

  // Auto-actualizar fechas cuando cambia año/mes/quincena
  useEffect(() => {
    const nuevasFechas = calcularFechasQuincena(
      watchAño,
      watchMes,
      watchQuincena as 1 | 2
    )
    form.setValue('fecha_inicio', nuevasFechas.fecha_inicio)
    form.setValue('fecha_fin', nuevasFechas.fecha_fin)
  }, [watchAño, watchMes, watchQuincena, form])

  // Verificar si las fechas fueron modificadas manualmente
  const fechasSugeridas = calcularFechasQuincena(
    watchAño,
    watchMes,
    watchQuincena as 1 | 2
  )
  const fechasModificadas =
    watchFechaInicio !== fechasSugeridas.fecha_inicio ||
    watchFechaFin !== fechasSugeridas.fecha_fin

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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mes y Quincena en grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="mes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mes *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona mes" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mesesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quincena"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quincena *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona quincena" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {quincenaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fechas del periodo (editables) */}
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

          {/* Aviso si las fechas fueron modificadas */}
          {fechasModificadas && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Fechas personalizadas</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Las fechas no coinciden con el periodo estándar ({fechasSugeridas.fecha_inicio} al {fechasSugeridas.fecha_fin}).
                  Esto es válido si tu ciclo de pago es diferente.
                </p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {mesesOptions.find((m) => m.value === watchMes)?.label} {watchAño} -{' '}
            {watchQuincena === 1 ? '1ra' : '2da'} Quincena
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
                Opcional: Agrega notas o comentarios sobre esta quincena
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
