'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Edit, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateAjusteLiquidacion } from '@/lib/hooks/use-liquidaciones'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'

interface PopoverAjusteProps {
  liquidacionId: string
  quincenaId: string
  ajusteActual: number
  descripcionActual?: string | null
  disabled?: boolean
}

export function PopoverAjuste({
  liquidacionId,
  quincenaId,
  ajusteActual,
  descripcionActual,
  disabled = false,
}: PopoverAjusteProps) {
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState(ajusteActual.toString())
  const [descripcion, setDescripcion] = useState(descripcionActual || '')

  const updateAjusteMutation = useUpdateAjusteLiquidacion()

  // Sincronizar estado local cuando cambian los props
  useEffect(() => {
    setMonto(ajusteActual.toString())
    setDescripcion(descripcionActual || '')
  }, [ajusteActual, descripcionActual])

  const handleGuardar = () => {
    const montoNum = parseFloat(monto) || 0

    updateAjusteMutation.mutate(
      {
        id: liquidacionId,
        ajuste_monto: montoNum,
        ajuste_descripcion: descripcion || undefined,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Ajuste guardado')
          setOpen(false)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleLimpiar = () => {
    updateAjusteMutation.mutate(
      {
        id: liquidacionId,
        ajuste_monto: 0,
        ajuste_descripcion: undefined,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Ajuste eliminado')
          setMonto('0')
          setDescripcion('')
          setOpen(false)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const tieneAjuste = ajusteActual !== 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={tieneAjuste ? 'outline' : 'ghost'}
          size="sm"
          disabled={disabled}
          className="h-7 gap-1 text-xs"
        >
          {tieneAjuste ? (
            <>
              <span className={ajusteActual > 0 ? 'text-green-600' : 'text-red-600'}>
                {ajusteActual > 0 ? '+' : ''}{formatCOP(ajusteActual)}
              </span>
              <Edit className="h-3 w-3" />
            </>
          ) : (
            <>
              <span>+ Ajuste</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Ajuste Manual</h4>
            <p className="text-xs text-muted-foreground">
              Agrega un ajuste positivo o negativo
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto" className="text-xs">Monto</Label>
              <Input
                id="monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0"
                className="h-8"
              />
              <p className="text-[10px] text-muted-foreground">
                Usa valores negativos para descuentos
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion" className="text-xs">Descripcion (opcional)</Label>
              <Input
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Razon del ajuste"
                className="h-8"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {tieneAjuste ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLimpiar}
                disabled={updateAjusteMutation.isPending}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardar}
                disabled={updateAjusteMutation.isPending}
              >
                {updateAjusteMutation.isPending && (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
