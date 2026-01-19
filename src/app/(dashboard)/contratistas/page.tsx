import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ContratistasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contratistas</h1>
          <p className="text-muted-foreground">
            Gestiona los propietarios de vehículos terceros
          </p>
        </div>
        <Button>
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
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay contratistas registrados. Crea uno para empezar.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
