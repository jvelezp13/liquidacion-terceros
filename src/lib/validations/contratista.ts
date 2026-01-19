import { z } from 'zod'

// Tipos de documento válidos
export const tiposDocumento = ['CC', 'CE', 'NIT', 'PASAPORTE'] as const
export type TipoDocumento = typeof tiposDocumento[number]

// Tipos de cuenta válidos
export const tiposCuenta = ['ahorros', 'corriente'] as const
export type TipoCuenta = typeof tiposCuenta[number]

// Schema para crear/editar contratista
export const contratistaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  tipo_documento: z.enum(tiposDocumento, {
    message: 'Selecciona un tipo de documento valido',
  }),

  numero_documento: z
    .string()
    .min(5, 'El documento debe tener al menos 5 caracteres')
    .max(20, 'El documento no puede exceder 20 caracteres')
    .regex(/^[0-9A-Za-z-]+$/, 'El documento solo puede contener números, letras y guiones'),

  telefono: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\s-]*$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Correo electrónico inválido')
    .optional()
    .or(z.literal('')),

  direccion: z
    .string()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),

  banco: z
    .string()
    .max(50, 'El nombre del banco no puede exceder 50 caracteres')
    .optional()
    .or(z.literal('')),

  tipo_cuenta: z
    .enum(tiposCuenta)
    .optional()
    .nullable(),

  numero_cuenta: z
    .string()
    .max(30, 'El número de cuenta no puede exceder 30 caracteres')
    .regex(/^[0-9-]*$/, 'El número de cuenta solo puede contener números y guiones')
    .optional()
    .or(z.literal('')),

  notas: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
})

export type ContratistaFormData = z.infer<typeof contratistaSchema>

// Schema para actualizar (todos los campos opcionales excepto el que se está editando)
export const contratistaUpdateSchema = contratistaSchema.partial()

export type ContratistaUpdateData = z.infer<typeof contratistaUpdateSchema>

// Opciones para selects
export const tipoDocumentoOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
]

export const tipoCuentaOptions = [
  { value: 'ahorros', label: 'Ahorros' },
  { value: 'corriente', label: 'Corriente' },
]
