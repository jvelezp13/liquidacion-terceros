import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ValidacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validación de Rutas</h1>
        <p className="text-muted-foreground">
          Valida las rutas ejecutadas día a día
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecciona una Quincena</CardTitle>
          <CardDescription>
            Elige el período que deseas validar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay quincenas pendientes de validación.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
