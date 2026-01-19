import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function QuincenasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quincenas</h1>
          <p className="text-muted-foreground">
            Períodos de liquidación quincenal
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Quincena
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quincenas Activas</CardTitle>
          <CardDescription>
            Períodos en proceso de validación o liquidación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay quincenas activas. Crea una para iniciar el proceso.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
