'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calculator, ChevronRight, DollarSign } from 'lucide-react'
import { useQuincenas, formatearQuincena } from '@/lib/hooks/use-quincenas'
import type { LiqQuincena } from '@/types'

// Variante de badge por estado
const getBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'borrador':
      return 'secondary'
    case 'validado':
      return 'default'
    case 'liquidado':
      return 'outline'
    case 'pagado':
      return 'outline'
    default:
      return 'secondary'
  }
}

// Traducir estado
const getEstadoLabel = (estado: string) => {
  switch (estado) {
    case 'borrador':
      return 'Borrador'
    case 'validado':
      return 'Validado'
    case 'liquidado':
      return 'Liquidado'
    case 'pagado':
      return 'Pagado'
    default:
      return estado
  }
}

export default function LiquidacionPage() {
  const router = useRouter()
  const { data: quincenas, isLoading } = useQuincenas()

  // Filtrar quincenas que pueden liquidarse (validadas) o ya liquidadas
  const quincenasLiquidables = quincenas?.filter(
    (q) => q.estado === 'validado' || q.estado === 'liquidado' || q.estado === 'pagado'
  )

  // Quincenas pendientes de validar
  const quincenasPendientes = quincenas?.filter((q) => q.estado === 'borrador')

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liquidacion</h1>
          <p className="text-muted-foreground">
            Genera y gestiona liquidaciones de vehiculos terceros
          </p>
        </div>
      </div>

      {/* Quincenas listas para liquidar */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Quincenas listas para liquidar
        </h2>

        {!quincenasLiquidables || quincenasLiquidables.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay quincenas validadas para liquidar.</p>
              <p className="text-sm mt-1">
                Valida los viajes de una quincena primero.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/validacion')}
              >
                Ir a Validacion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quincenasLiquidables.map((quincena: LiqQuincena) => (
              <Card
                key={quincena.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => router.push(`/liquidacion/${quincena.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {formatearQuincena(quincena)}
                    </CardTitle>
                    <Badge variant={getBadgeVariant(quincena.estado)}>
                      {getEstadoLabel(quincena.estado)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(quincena.fecha_inicio).toLocaleDateString('es-CO')} -{' '}
                    {new Date(quincena.fecha_fin).toLocaleDateString('es-CO')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {quincena.estado === 'validado'
                        ? 'Listo para liquidar'
                        : quincena.estado === 'liquidado'
                          ? 'Liquidacion completada'
                          : 'Pagado'}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quincenas pendientes de validar */}
      {quincenasPendientes && quincenasPendientes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Quincenas pendientes de validar
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quincenasPendientes.map((quincena: LiqQuincena) => (
              <Card
                key={quincena.id}
                className="opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => router.push(`/validacion/${quincena.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {formatearQuincena(quincena)}
                    </CardTitle>
                    <Badge variant="secondary">Borrador</Badge>
                  </div>
                  <CardDescription>
                    Requiere validacion de viajes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Ir a validar</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
