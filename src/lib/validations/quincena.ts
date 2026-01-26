import { z } from 'zod'

// Schema para crear un periodo (ya no usa mes/quincena)
export const quincenaSchema = z.object({
  año: z
    .number()
    .min(2020, 'El año debe ser mayor a 2020')
    .max(2100, 'El año debe ser menor a 2100'),

  // Fechas del periodo (obligatorias)
  fecha_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  notas: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => data.fecha_fin >= data.fecha_inicio,
  {
    message: 'La fecha fin debe ser igual o posterior a la fecha de inicio',
    path: ['fecha_fin'],
  }
)

export type QuincenaFormData = z.infer<typeof quincenaSchema>

// Estados de quincena con labels
export const estadoQuincenaOptions = [
  { value: 'borrador', label: 'Borrador', color: 'secondary' },
  { value: 'validado', label: 'Validado', color: 'default' },
  { value: 'liquidado', label: 'Liquidado', color: 'success' },
  { value: 'pagado', label: 'Pagado', color: 'outline' },
]

export function getEstadoQuincenaLabel(estado: string) {
  return estadoQuincenaOptions.find((e) => e.value === estado)?.label || estado
}

export function getEstadoQuincenaColor(estado: string) {
  return estadoQuincenaOptions.find((e) => e.value === estado)?.color || 'secondary'
}
