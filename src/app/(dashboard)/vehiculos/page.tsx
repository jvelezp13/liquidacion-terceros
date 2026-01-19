'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { VehiculoTerceroForm, VehiculosTercerosTable } from '@/components/vehiculos'
import {
  useVehiculosTerceros,
  useVehiculosTercerosSinVincular,
  useCreateVehiculoTercero,
  useUpdateVehiculoTercero,
  useDeleteVehiculoTercero,
} from '@/lib/hooks/use-vehiculos-terceros'
import { useContratistasActivos } from '@/lib/hooks/use-contratistas'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import type { LiqVehiculoTerceroConDetalles } from '@/types/database.types'
import type { VehiculoTerceroFormData } from '@/lib/validations/vehiculo-tercero'

export default function VehiculosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState<LiqVehiculoTerceroConDetalles | null>(null)
  const [deletingVehiculo, setDeletingVehiculo] = useState<LiqVehiculoTerceroConDetalles | null>(null)

  const { data: escenario, isLoading: escenarioLoading } = useEscenarioActivo()
  const { data: vehiculosTerceros = [], isLoading: vehiculosLoading, refetch: refetchVehiculos } = useVehiculosTerceros()
  const { data: vehiculosSinVincular = [], isLoading: sinVincularLoading, refetch: refetchSinVincular } = useVehiculosTercerosSinVincular()
  const { data: contratistas = [], isLoading: contratistasLoading } = useContratistasActivos()

  const createMutation = useCreateVehiculoTercero()
  const updateMutation = useUpdateVehiculoTercero()
  const deleteMutation = useDeleteVehiculoTercero()

  const isLoading = escenarioLoading || vehiculosLoading
  const isLoadingForm = sinVincularLoading || contratistasLoading
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const handleCreate = () => {
    setEditingVehiculo(null)
    setIsFormOpen(true)
  }

  const handleEdit = (vehiculo: LiqVehiculoTerceroConDetalles) => {
    setEditingVehiculo(vehiculo)
    setIsFormOpen(true)
  }

  const handleDelete = (vehiculo: LiqVehiculoTerceroConDetalles) => {
    setDeletingVehiculo(vehiculo)
  }

  const handleToggleActivo = (vehiculo: LiqVehiculoTerceroConDetalles) => {
    updateMutation.mutate(
      { id: vehiculo.id, activo: !vehiculo.activo },
      {
        onSuccess: () => {
          toast.success(
            vehiculo.activo
              ? 'Vehículo desactivado'
              : 'Vehículo activado'
          )
        },
        onError: (error) => {
          toast.error('Error al cambiar estado: ' + error.message)
        },
      }
    )
  }

  const handleSubmit = (data: VehiculoTerceroFormData) => {
    // Limpiar campos vacíos
    const cleanData = {
      ...data,
      conductor_nombre: data.conductor_nombre || undefined,
      conductor_telefono: data.conductor_telefono || undefined,
      conductor_documento: data.conductor_documento || undefined,
      notas: data.notas || undefined,
    }

    if (editingVehiculo) {
      // Actualizar (no incluir vehiculo_id)
      const { vehiculo_id, ...updateData } = cleanData
      updateMutation.mutate(
        { id: editingVehiculo.id, ...updateData },
        {
          onSuccess: () => {
            toast.success('Vehículo actualizado')
            setIsFormOpen(false)
            setEditingVehiculo(null)
          },
          onError: (error) => {
            toast.error('Error al actualizar: ' + error.message)
          },
        }
      )
    } else {
      // Crear
      createMutation.mutate(cleanData, {
        onSuccess: () => {
          toast.success('Vehículo vinculado')
          setIsFormOpen(false)
        },
        onError: (error) => {
          toast.error('Error al vincular: ' + error.message)
        },
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingVehiculo) return

    deleteMutation.mutate(deletingVehiculo.id, {
      onSuccess: () => {
        toast.success('Vehículo desvinculado')
        setDeletingVehiculo(null)
      },
      onError: (error) => {
        toast.error('Error al desvincular: ' + error.message)
      },
    })
  }

  const handleRefresh = () => {
    refetchVehiculos()
    refetchSinVincular()
    toast.success('Datos actualizados')
  }

  if (!escenario && !escenarioLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">No hay escenario activo</p>
          <p className="text-muted-foreground">
            Activa un escenario en Planeacion Logi para continuar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehiculos Terceros</h1>
          <p className="text-muted-foreground">
            Vehiculos sincronizados desde Planeacion Logi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Vincular Vehiculo
          </Button>
        </div>
      </div>

      {/* Resumen de vehículos disponibles */}
      {!sinVincularLoading && vehiculosSinVincular.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">
                {vehiculosSinVincular.length} vehiculo(s) tercero(s) disponible(s) para vincular
              </p>
              <p className="text-xs text-muted-foreground">
                Vehiculos con esquema &quot;tercero&quot; en Planeacion Logi sin contratista asignado
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Vincular
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vehiculos</CardTitle>
          <CardDescription>
            Vehiculos con esquema &quot;tercero&quot; vinculados a contratistas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <VehiculosTercerosTable
              vehiculos={vehiculosTerceros}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActivo={handleToggleActivo}
              isLoading={isMutating}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehiculo ? 'Editar Vehiculo' : 'Vincular Vehiculo'}
            </DialogTitle>
            <DialogDescription>
              {editingVehiculo
                ? 'Modifica los datos del vehiculo tercero'
                : 'Vincula un vehiculo de Planeacion Logi a un contratista'}
            </DialogDescription>
          </DialogHeader>
          <VehiculoTerceroForm
            vehiculosSinVincular={vehiculosSinVincular}
            contratistas={contratistas}
            vehiculoTercero={editingVehiculo || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingVehiculo(null)
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            isLoadingData={isLoadingForm}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        open={!!deletingVehiculo}
        onOpenChange={(open) => !open && setDeletingVehiculo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular vehiculo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de desvincular el vehiculo{' '}
              <strong>{deletingVehiculo?.placa}</strong> ({deletingVehiculo?.vehiculo.nombre})?
              Esta accion no elimina el vehiculo de Planeacion Logi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Desvinculando...' : 'Desvincular'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
