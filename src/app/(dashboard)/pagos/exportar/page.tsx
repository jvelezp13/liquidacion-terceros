import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet } from 'lucide-react'

export default function ExportarPayanaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exportar para Payana</h1>
        <p className="text-muted-foreground">
          Genera el archivo de pagos consolidados por contratista
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecciona Quincena</CardTitle>
          <CardDescription>
            Elige el período para exportar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay quincenas liquidadas disponibles para exportar.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato de Exportación</CardTitle>
          <CardDescription>
            El archivo incluirá los siguientes campos por contratista
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Tipo y número de documento</li>
              <li>Nombre del contratista</li>
              <li>Banco y número de cuenta</li>
              <li>Tipo de cuenta</li>
              <li>Monto total a pagar</li>
              <li>Descripción del pago</li>
            </ul>

            <div className="flex gap-2">
              <Button disabled>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
