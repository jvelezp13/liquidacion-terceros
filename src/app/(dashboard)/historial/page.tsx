import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HistorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial</h1>
        <p className="text-muted-foreground">
          Consulta liquidaciones y pagos anteriores
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Liquidaciones</CardTitle>
          <CardDescription>
            Liquidaciones completadas por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay historial disponible.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
