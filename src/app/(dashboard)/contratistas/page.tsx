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
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ContratistaForm, ContratistasTable } from '@/components/contratistas'
import {
  useContratistas,
  useCreateContratista,
  useUpdateContratista,
  useDeleteContratista,
  useToggleContratistaActivo,
} from '@/lib/hooks/use-contratistas'
import { useActiveTenant, useCanEdit } from '@/lib/hooks/use-tenant'
import type { LiqContratista } from '@/types'
import type { ContratistaFormData } from '@/lib/validations/contratista'

export default function ContratistasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContratista, setEditingContratista] = useState<LiqContratista | null>(null)
  const [deletingContratista, setDeletingContratista] = useState<LiqContratista | null>(null)

  const { data: tenant, isLoading: tenantLoading } = useActiveTenant()
  const { data: contratistas = [], isLoading: contratistasLoading } = useContratistas()
  const { hasRole: canEdit } = useCanEdit()

  const createMutation = useCreateContratista()
  const updateMutation = useUpdateContratista()
  const deleteMutation = useDeleteContratista()
  const toggleActivoMutation = useToggleContratistaActivo()

  const isLoading = tenantLoading || contratistasLoading
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleActivoMutation.isPending

  const handleCreate = () => {
    setEditingContratista(null)
    setIsFormOpen(true)
  }

  const handleEdit = (contratista: LiqContratista) => {
    setEditingContratista(contratista)
    setIsFormOpen(true)
  }

  const handleDelete = (contratista: LiqContratista) => {
    setDeletingContratista(contratista)
  }

  const handleToggleActivo = (contratista: LiqContratista) => {
    toggleActivoMutation.mutate(
      { id: contratista.id, activo: !contratista.activo },
      {
        onSuccess: () => {
          toast.success(
            contratista.activo
              ? 'Contratista desactivado'
              : 'Contratista activado'
          )
        },
        onError: (error) => {
          toast.error('Error al cambiar estado: ' + error.message)
        },
      }
    )
  }

  const handleSubmit = (data: ContratistaFormData) => {
    // Transformar null a undefined para compatibilidad con el hook
    const cleanData = {
      ...data,
      tipo_cuenta: data.tipo_cuenta || undefined,
    }

    if (editingContratista) {
      // Actualizar
      updateMutation.mutate(
        { id: editingContratista.id, ...cleanData },
        {
          onSuccess: () => {
            toast.success('Contratista actualizado')
            setIsFormOpen(false)
            setEditingContratista(null)
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
          toast.success('Contratista creado')
          setIsFormOpen(false)
        },
        onError: (error) => {
          toast.error('Error al crear: ' + error.message)
        },
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!deletingContratista) return

    deleteMutation.mutate(deletingContratista.id, {
      onSuccess: () => {
        toast.success('Contratista eliminado')
        setDeletingContratista(null)
      },
      onError: (error) => {
        toast.error('Error al eliminar: ' + error.message)
      },
    })
  }

  if (!tenant && !tenantLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">No hay empresa activa</p>
          <p className="text-muted-foreground">
            Selecciona una empresa para continuar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contratistas</h1>
          <p className="text-muted-foreground">
            Gestiona los propietarios de vehiculos terceros
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isLoading || !canEdit}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Contratista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratistas</CardTitle>
          <CardDescription>
            Contratistas registrados y sus datos bancarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ContratistasTable
              contratistas={contratistas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActivo={handleToggleActivo}
              isLoading={isMutating}
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContratista ? 'Editar Contratista' : 'Nuevo Contratista'}
            </DialogTitle>
            <DialogDescription>
              {editingContratista
                ? 'Modifica los datos del contratista'
                : 'Ingresa los datos del nuevo contratista'}
            </DialogDescription>
          </DialogHeader>
          <ContratistaForm
            contratista={editingContratista || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingContratista(null)
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        open={!!deletingContratista}
        onOpenChange={(open) => !open && setDeletingContratista(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar contratista</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar a <strong>{deletingContratista?.nombre}</strong>?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
