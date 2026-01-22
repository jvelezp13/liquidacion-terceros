'use client'

import { useState } from 'react'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAddDeduccion,
  tiposDeduccion,
} from '@/lib/hooks/use-liquidaciones'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'

interface PopoverDeduccionProps {
  liquidacionId: string
  quincenaId: string
  subtotal: number // Para calcular retencion 1% sugerida
  disabled?: boolean
}

export function PopoverDeduccion({
  liquidacionId,
  quincenaId,
  subtotal,
  disabled = false,
}: PopoverDeduccionProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<string>('retencion_1_porciento')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const addDeduccionMutation = useAddDeduccion()

  // Calcular retencion 1% sugerida
  const retencion1Sugerida = Math.round(subtotal * 0.01)

  const handleAgregar = () => {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) {
      toast.error('Ingresa un monto valido')
      return
    }

    addDeduccionMutation.mutate(
      {
        liquidacion_id: liquidacionId,
        tipo: tipo as 'retencion_1_porciento' | 'anticipo' | 'otro',
        monto: montoNum,
        descripcion: descripcion || undefined,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Deduccion agregada')
          setOpen(false)
          // Limpiar formulario
          setMonto('')
          setDescripcion('')
          setTipo('retencion_1_porciento')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const usarSugerido = () => {
    setMonto(retencion1Sugerida.toString())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          Agregar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Agregar Deduccion</h4>
            <p className="text-xs text-muted-foreground">
              Retencion 1% sugerida: {formatCOP(retencion1Sugerida)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo" className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDeduccion.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="monto" className="text-xs">Monto</Label>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder={tipo === 'retencion_1_porciento' ? retencion1Sugerida.toString() : '0'}
                className="h-8"
              />
              {tipo === 'retencion_1_porciento' && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={usarSugerido}
                >
                  Usar valor sugerido ({formatCOP(retencion1Sugerida)})
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-xs">Descripcion (opcional)</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle de la deduccion"
                className="h-8"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAgregar}
              disabled={addDeduccionMutation.isPending}
            >
              {addDeduccionMutation.isPending && (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              )}
              Agregar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
