import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Link from 'next/link'

export default function PagosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-muted-foreground">
            Registra y gestiona los pagos a contratistas
          </p>
        </div>
        <Link href="/pagos/exportar">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar para Payana
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagos Pendientes</CardTitle>
          <CardDescription>
            Liquidaciones aprobadas pendientes de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay pagos pendientes.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
