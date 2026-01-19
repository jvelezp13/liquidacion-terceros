import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LiquidacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Liquidación</h1>
        <p className="text-muted-foreground">
          Genera y gestiona las liquidaciones quincenales
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quincenas Validadas</CardTitle>
          <CardDescription>
            Períodos listos para liquidar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay quincenas validadas pendientes de liquidación.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
