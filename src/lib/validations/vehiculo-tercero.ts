import { z } from 'zod'

// Schema base para vehículo tercero
const baseSchema = z.object({
  // Para vehículos normales: ID del vehículo de PlaneacionLogi
  // Para esporádicos: vacío o undefined
  vehiculo_id: z.string().optional().or(z.literal('')),

  contratista_id: z.string().min(1, 'Selecciona un contratista'),

  placa: z
    .string()
    .min(4, 'La placa debe tener al menos 4 caracteres')
    .max(10, 'La placa no puede exceder 10 caracteres')
    .regex(/^[A-Z0-9-]+$/i, 'La placa solo puede contener letras, números y guiones')
    .transform((val) => val.toUpperCase()),

  conductor_nombre: z.string().max(100).optional().or(z.literal('')),
  conductor_telefono: z.string().max(20).regex(/^[0-9+\s-]*$/, 'Teléfono inválido').optional().or(z.literal('')),
  conductor_documento: z.string().max(20).regex(/^[0-9A-Za-z-]*$/, 'Documento inválido').optional().or(z.literal('')),
  notas: z.string().max(500).optional().or(z.literal('')),

  // Campos para vehículos esporádicos
  modalidad_costo: z.enum(['flete_fijo', 'por_viaje']).optional(),
  flete_mensual: z.number().min(0).optional(),
  costo_por_viaje: z.number().min(0).optional(),
})

// Schema con validación condicional
export const vehiculoTerceroSchema = baseSchema.superRefine((data, ctx) => {
  const esEsporadico = !data.vehiculo_id

  if (esEsporadico) {
    // Esporádico: debe tener modalidad de costo
    if (!data.modalidad_costo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecciona la modalidad de costo',
        path: ['modalidad_costo'],
      })
    }

    // Validar monto según modalidad
    if (data.modalidad_costo === 'flete_fijo' && !data.flete_mensual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa el flete mensual',
        path: ['flete_mensual'],
      })
    }

    if (data.modalidad_costo === 'por_viaje' && !data.costo_por_viaje) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingresa el costo por viaje',
        path: ['costo_por_viaje'],
      })
    }
  }
})

export type VehiculoTerceroFormData = z.infer<typeof baseSchema>

// Schema para actualizar
export const vehiculoTerceroUpdateSchema = baseSchema
  .omit({ vehiculo_id: true })
  .partial()

export type VehiculoTerceroUpdateData = z.infer<typeof vehiculoTerceroUpdateSchema>
