import { z } from 'zod'

// Schema para vincular un vehículo a un contratista
export const vehiculoTerceroSchema = z.object({
  vehiculo_id: z
    .string()
    .min(1, 'Selecciona un vehículo'),

  contratista_id: z
    .string()
    .min(1, 'Selecciona un contratista'),

  placa: z
    .string()
    .min(4, 'La placa debe tener al menos 4 caracteres')
    .max(10, 'La placa no puede exceder 10 caracteres')
    .regex(/^[A-Z0-9-]+$/i, 'La placa solo puede contener letras, números y guiones')
    .transform((val) => val.toUpperCase()),

  conductor_nombre: z
    .string()
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  conductor_telefono: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\s-]*$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),

  conductor_documento: z
    .string()
    .max(20, 'El documento no puede exceder 20 caracteres')
    .regex(/^[0-9A-Za-z-]*$/, 'Documento inválido')
    .optional()
    .or(z.literal('')),

  notas: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
})

export type VehiculoTerceroFormData = z.infer<typeof vehiculoTerceroSchema>

// Schema para actualizar (todos los campos opcionales excepto el que se está editando)
export const vehiculoTerceroUpdateSchema = vehiculoTerceroSchema
  .omit({ vehiculo_id: true })
  .partial()

export type VehiculoTerceroUpdateData = z.infer<typeof vehiculoTerceroUpdateSchema>
