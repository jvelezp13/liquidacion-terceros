'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  contratistaSchema,
  type ContratistaFormData,
  tipoDocumentoOptions,
  tipoCuentaOptions,
} from '@/lib/validations/contratista'
import type { LiqContratista } from '@/types'

interface ContratistaFormProps {
  contratista?: LiqContratista
  onSubmit: (data: ContratistaFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ContratistaForm({
  contratista,
  onSubmit,
  onCancel,
  isLoading = false,
}: ContratistaFormProps) {
  const form = useForm<ContratistaFormData>({
    resolver: zodResolver(contratistaSchema),
    defaultValues: {
      nombre: contratista?.nombre || '',
      tipo_documento: (contratista?.tipo_documento as ContratistaFormData['tipo_documento']) || 'CC',
      numero_documento: contratista?.numero_documento || '',
      telefono: contratista?.telefono || '',
      email: contratista?.email || '',
      direccion: contratista?.direccion || '',
      banco: contratista?.banco || '',
      tipo_cuenta: (contratista?.tipo_cuenta as ContratistaFormData['tipo_cuenta']) || undefined,
      numero_cuenta: contratista?.numero_cuenta || '',
      notas: contratista?.notas || '',
    },
  })

  const handleSubmit = (data: ContratistaFormData) => {
    // Limpiar campos vacíos
    const cleanData = {
      ...data,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      direccion: data.direccion || undefined,
      banco: data.banco || undefined,
      tipo_cuenta: data.tipo_cuenta || undefined,
      numero_cuenta: data.numero_cuenta || undefined,
      notas: data.notas || undefined,
    }
    onSubmit(cleanData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Datos personales */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Datos Personales</h3>

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del contratista" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="tipo_documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de documento *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipoDocumentoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
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
              name="numero_documento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de documento *</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="telefono"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="direccion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección del contratista" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Datos bancarios */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Datos Bancarios</h3>

          <FormField
            control={form.control}
            name="banco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del banco" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="tipo_cuenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de cuenta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipoCuentaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
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
              name="numero_cuenta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de cuenta</FormLabel>
                  <FormControl>
                    <Input placeholder="000-123456-00" {...field} />
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
            {isLoading ? 'Guardando...' : contratista ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
