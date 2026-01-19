import { z } from 'zod'

// Schema para crear una quincena
export const quincenaSchema = z.object({
  año: z
    .number()
    .min(2020, 'El año debe ser mayor a 2020')
    .max(2100, 'El año debe ser menor a 2100'),

  mes: z
    .number()
    .min(1, 'Selecciona un mes válido')
    .max(12, 'Selecciona un mes válido'),

  quincena: z.union([z.literal(1), z.literal(2)], {
    message: 'Selecciona 1ra o 2da quincena',
  }),

  notas: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
})

export type QuincenaFormData = z.infer<typeof quincenaSchema>

// Opciones para selects
export const mesesOptions = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

export const quincenaOptions = [
  { value: 1, label: '1ra Quincena (1-15)' },
  { value: 2, label: '2da Quincena (16-fin)' },
]

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
