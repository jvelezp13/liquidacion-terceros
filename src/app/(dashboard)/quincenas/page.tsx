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
import { QuincenaForm, QuincenasTable } from '@/components/quincenas'
import {
  useQuincenas,
  useCreateQuincena,
  useUpdateEstadoQuincena,
  useDeleteQuincena,
  calcularFechasQuincena,
  formatearQuincena,
} from '@/lib/hooks/use-quincenas'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import { useCanEdit } from '@/lib/hooks/use-tenant'
import type { LiqQuincena, EstadoQuincena } from '@/types/database.types'
import type { QuincenaFormData } from '@/lib/validations/quincena'

export default function QuincenasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deletingQuincena, setDeletingQuincena] = useState<LiqQuincena | null>(null)

  const { data: escenario, isLoading: escenarioLoading } = useEscenarioActivo()
  const { data: quincenas = [], isLoading: quincenasLoading } = useQuincenas()
  const { hasRole: canEdit } = useCanEdit()

  const createMutation = useCreateQuincena()
  const updateEstadoMutation = useUpdateEstadoQuincena()
  const deleteMutation = useDeleteQuincena()

  const isLoading = escenarioLoading || quincenasLoading
  const isMutating = createMutation.isPending || updateEstadoMutation.isPending || deleteMutation.isPending

  const handleCreate = () => {
    setIsFormOpen(true)
  }

  const handleSubmit = (data: QuincenaFormData) => {
    const fechas = calcularFechasQuincena(data.año, data.mes, data.quincena as 1 | 2)

    createMutation.mutate(
      {
        año: data.año,
        mes: data.mes,
        quincena: data.quincena as 1 | 2,
        fecha_inicio: fechas.fecha_inicio,
        fecha_fin: fechas.fecha_fin,
        notas: data.notas,
      },
      {
        onSuccess: () => {
          toast.success('Quincena creada')
          setIsFormOpen(false)
        },
        onError: (error) => {
          toast.error('Error al crear: ' + error.message)
        },
      }
    )
  }

  const handleCambiarEstado = (quincena: LiqQuincena, nuevoEstado: string) => {
    updateEstadoMutation.mutate(
      { id: quincena.id, estado: nuevoEstado as EstadoQuincena },
      {
        onSuccess: () => {
          toast.success(`Quincena marcada como ${nuevoEstado}`)
        },
        onError: (error) => {
          toast.error('Error al cambiar estado: ' + error.message)
        },
      }
    )
  }

  const handleDelete = (quincena: LiqQuincena) => {
    setDeletingQuincena(quincena)
  }

  const handleConfirmDelete = () => {
    if (!deletingQuincena) return

    deleteMutation.mutate(deletingQuincena.id, {
      onSuccess: () => {
        toast.success('Quincena eliminada')
        setDeletingQuincena(null)
      },
      onError: (error) => {
        toast.error('Error al eliminar: ' + error.message)
      },
    })
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

  // Separar quincenas por estado
  const quincenasActivas = quincenas.filter((q) =>
    ['borrador', 'validado', 'liquidado'].includes(q.estado)
  )
  const quincenasPagadas = quincenas.filter((q) => q.estado === 'pagado')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quincenas</h1>
          <p className="text-muted-foreground">
            Periodos de liquidacion quincenal
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Quincena
        </Button>
      </div>

      {/* Quincenas activas */}
      <Card>
        <CardHeader>
          <CardTitle>Quincenas Activas</CardTitle>
          <CardDescription>
            Periodos en proceso de validacion o liquidacion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <QuincenasTable
              quincenas={quincenasActivas}
              onDelete={handleDelete}
              onCambiarEstado={handleCambiarEstado}
              isLoading={isMutating}
            />
          )}
        </CardContent>
      </Card>

      {/* Quincenas pagadas (historial reciente) */}
      {quincenasPagadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
            <CardDescription>
              Ultimas quincenas pagadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuincenasTable
              quincenas={quincenasPagadas.slice(0, 5)}
              onDelete={handleDelete}
              onCambiarEstado={handleCambiarEstado}
              isLoading={isMutating}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog para crear quincena */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Quincena</DialogTitle>
            <DialogDescription>
              Crea un nuevo periodo de liquidacion quincenal
            </DialogDescription>
          </DialogHeader>
          <QuincenaForm
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createMutation.isPending}
            añoDefault={escenario?.año}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        open={!!deletingQuincena}
        onOpenChange={(open) => !open && setDeletingQuincena(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar quincena</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de eliminar{' '}
              <strong>{deletingQuincena && formatearQuincena(deletingQuincena)}</strong>?
              Esta accion no se puede deshacer y eliminara todos los datos asociados.
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
