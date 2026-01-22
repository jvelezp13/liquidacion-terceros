'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, Truck, User, Building } from 'lucide-react'
import { toast } from 'sonner'
import { formatCOP } from '@/lib/utils/calcular-liquidacion'
import {
  useUpdateAjusteLiquidacion,
  useAddDeduccion,
  useDeleteDeduccion,
  tiposDeduccion,
  type LiquidacionConDeducciones,
} from '@/lib/hooks/use-liquidaciones'

interface LiquidacionDetalleProps {
  liquidacion: LiquidacionConDeducciones
  quincenaId: string
  esEditable?: boolean
  onClose?: () => void
}

export function LiquidacionDetalle({
  liquidacion,
  quincenaId,
  esEditable = true,
  onClose,
}: LiquidacionDetalleProps) {
  const [showAjusteDialog, setShowAjusteDialog] = useState(false)
  const [showDeduccionDialog, setShowDeduccionDialog] = useState(false)
  const [ajusteMonto, setAjusteMonto] = useState(liquidacion.ajuste_monto.toString())
  const [ajusteDescripcion, setAjusteDescripcion] = useState(liquidacion.ajuste_descripcion || '')
  const [deduccionTipo, setDeduccionTipo] = useState<string>('retencion_1_porciento')
  const [deduccionMonto, setDeduccionMonto] = useState('')
  const [deduccionDescripcion, setDeduccionDescripcion] = useState('')

  const updateAjusteMutation = useUpdateAjusteLiquidacion()
  const addDeduccionMutation = useAddDeduccion()
  const deleteDeduccionMutation = useDeleteDeduccion()

  const vt = liquidacion.vehiculo_tercero

  const handleGuardarAjuste = () => {
    const monto = parseFloat(ajusteMonto) || 0

    updateAjusteMutation.mutate(
      {
        id: liquidacion.id,
        ajuste_monto: monto,
        ajuste_descripcion: ajusteDescripcion || undefined,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Ajuste guardado')
          setShowAjusteDialog(false)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleLimpiarAjuste = () => {
    updateAjusteMutation.mutate(
      {
        id: liquidacion.id,
        ajuste_monto: 0,
        ajuste_descripcion: undefined,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Ajuste eliminado')
          setAjusteMonto('0')
          setAjusteDescripcion('')
          setShowAjusteDialog(false)
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleAgregarDeduccion = () => {
    const monto = parseFloat(deduccionMonto)
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    addDeduccionMutation.mutate(
      {
        liquidacion_id: liquidacion.id,
        tipo: deduccionTipo as 'retencion_1_porciento' | 'anticipo' | 'otro',
        monto,
        descripcion: deduccionDescripcion || undefined,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Deducción agregada')
          setShowDeduccionDialog(false)
          setDeduccionMonto('')
          setDeduccionDescripcion('')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  const handleEliminarDeduccion = (deduccionId: string) => {
    deleteDeduccionMutation.mutate(
      {
        id: deduccionId,
        liquidacionId: liquidacion.id,
        quincenaId,
      },
      {
        onSuccess: () => {
          toast.success('Deducción eliminada')
        },
        onError: (error) => {
          toast.error('Error: ' + error.message)
        },
      }
    )
  }

  // Calcular retención 1% sugerida
  const retencion1Sugerida = Math.round(liquidacion.subtotal * 0.01)

  return (
    <div className="space-y-6">
      {/* Info del vehículo */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Vehiculo</p>
            <p className="font-medium">{vt?.placa || 'Sin placa'}</p>
            <p className="text-xs text-muted-foreground">{vt?.vehiculo?.nombre || ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Building className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Contratista</p>
            <p className="font-medium">{vt?.contratista?.nombre || 'Sin contratista'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Conductor</p>
            <p className="font-medium">{vt?.conductor_nombre || 'No asignado'}</p>
          </div>
        </div>
      </div>

      {/* Desglose de liquidación */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Liquidacion</CardTitle>
          <CardDescription>
            {liquidacion.viajes_ejecutados} viajes ejecutados
            {liquidacion.viajes_variacion > 0 && ` + ${liquidacion.viajes_variacion} otra ruta`}
            {liquidacion.viajes_no_ejecutados > 0 && ` - ${liquidacion.viajes_no_ejecutados} no ejecutados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b">
              <span>Flete base</span>
              <span className="font-mono">{formatCOP(liquidacion.flete_base)}</span>
            </div>
            {liquidacion.total_combustible > 0 && (
              <div className="flex justify-between py-1 border-b">
                <span>Combustible</span>
                <span className="font-mono">{formatCOP(liquidacion.total_combustible)}</span>
              </div>
            )}
            {liquidacion.total_peajes > 0 && (
              <div className="flex justify-between py-1 border-b">
                <span>Peajes</span>
                <span className="font-mono">{formatCOP(liquidacion.total_peajes)}</span>
              </div>
            )}
            {liquidacion.total_fletes_adicionales > 0 && (
              <div className="flex justify-between py-1 border-b">
                <span>Fletes adicionales</span>
                <span className="font-mono">{formatCOP(liquidacion.total_fletes_adicionales)}</span>
              </div>
            )}
            {liquidacion.total_pernocta > 0 && (
              <div className="flex justify-between py-1 border-b">
                <span>Pernocta</span>
                <span className="font-mono">{formatCOP(liquidacion.total_pernocta)}</span>
              </div>
            )}
            {liquidacion.ajuste_monto !== 0 && (
              <div className="flex justify-between py-1 border-b">
                <span>
                  Ajuste {liquidacion.ajuste_descripcion && `(${liquidacion.ajuste_descripcion})`}
                </span>
                <span className={`font-mono ${liquidacion.ajuste_monto < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {liquidacion.ajuste_monto > 0 ? '+' : ''}{formatCOP(liquidacion.ajuste_monto)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 font-bold">
              <span>Subtotal</span>
              <span className="font-mono">{formatCOP(liquidacion.subtotal)}</span>
            </div>

            {/* Botón para editar ajuste */}
            {esEditable && liquidacion.estado === 'borrador' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAjusteDialog(true)}
              >
                Editar ajuste manual
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deducciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deducciones</CardTitle>
            <CardDescription>
              Retencion 1% sugerida: {formatCOP(retencion1Sugerida)}
            </CardDescription>
          </div>
          {esEditable && liquidacion.estado === 'borrador' && (
            <Button size="sm" onClick={() => setShowDeduccionDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {liquidacion.deducciones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay deducciones registradas
            </p>
          ) : (
            <div className="space-y-2">
              {liquidacion.deducciones.map((ded) => (
                <div key={ded.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <Badge variant="outline" className="mr-2">
                      {tiposDeduccion.find((t) => t.value === ded.tipo)?.label || ded.tipo}
                    </Badge>
                    {ded.descripcion && (
                      <span className="text-sm text-muted-foreground">{ded.descripcion}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-red-600">-{formatCOP(ded.monto)}</span>
                    {esEditable && liquidacion.estado === 'borrador' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEliminarDeduccion(ded.id)}
                        disabled={deleteDeduccionMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-between py-2 font-bold text-red-600">
                <span>Total deducciones</span>
                <span className="font-mono">-{formatCOP(liquidacion.total_deducciones)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total a pagar */}
      <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">TOTAL A PAGAR</span>
          <span className="text-2xl font-bold font-mono">{formatCOP(liquidacion.total_a_pagar)}</span>
        </div>
      </div>

      {/* Dialog para editar ajuste */}
      <Dialog open={showAjusteDialog} onOpenChange={setShowAjusteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ajuste manual</DialogTitle>
            <DialogDescription>
              Agrega un ajuste positivo o negativo a la liquidacion
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                value={ajusteMonto}
                onChange={(e) => setAjusteMonto(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Usa valores negativos para descuentos
              </p>
            </div>
            <div className="space-y-2">
              <Label>Descripcion (opcional)</Label>
              <Input
                value={ajusteDescripcion}
                onChange={(e) => setAjusteDescripcion(e.target.value)}
                placeholder="Razon del ajuste"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              {liquidacion.ajuste_monto !== 0 && (
                <Button
                  variant="destructive"
                  onClick={handleLimpiarAjuste}
                  disabled={updateAjusteMutation.isPending}
                >
                  Limpiar ajuste
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAjusteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarAjuste} disabled={updateAjusteMutation.isPending}>
                {updateAjusteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para agregar deducción */}
      <Dialog open={showDeduccionDialog} onOpenChange={setShowDeduccionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar deduccion</DialogTitle>
            <DialogDescription>
              Retencion 1% sugerida: {formatCOP(retencion1Sugerida)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={deduccionTipo} onValueChange={setDeduccionTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDeduccion.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                value={deduccionMonto}
                onChange={(e) => setDeduccionMonto(e.target.value)}
                placeholder={deduccionTipo === 'retencion_1_porciento' ? retencion1Sugerida.toString() : '0'}
              />
              {deduccionTipo === 'retencion_1_porciento' && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => setDeduccionMonto(retencion1Sugerida.toString())}
                >
                  Usar valor sugerido ({formatCOP(retencion1Sugerida)})
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Descripcion (opcional)</Label>
              <Input
                value={deduccionDescripcion}
                onChange={(e) => setDeduccionDescripcion(e.target.value)}
                placeholder="Detalle de la deduccion"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeduccionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarDeduccion} disabled={addDeduccionMutation.isPending}>
              {addDeduccionMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
