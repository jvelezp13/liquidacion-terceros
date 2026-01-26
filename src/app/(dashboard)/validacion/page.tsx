'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, ArrowRight, ClipboardCheck } from 'lucide-react'
import { useQuincenasPorEstado, formatearQuincena, getNombreMes } from '@/lib/hooks/use-quincenas'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import { useCanEdit } from '@/lib/hooks/use-tenant'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'

export default function ValidacionPage() {
  const { data: escenario, isLoading: escenarioLoading } = useEscenarioActivo()
  const { data: quincenasBorrador = [], isLoading: borradorLoading } = useQuincenasPorEstado('borrador')
  const { data: quincenasValidado = [], isLoading: validadoLoading } = useQuincenasPorEstado('validado')
  const { hasRole: canEdit, isLoading: permisosLoading } = useCanEdit()

  const isLoading = escenarioLoading || borradorLoading || validadoLoading || permisosLoading

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validacion de Rutas</h1>
        <p className="text-muted-foreground">
          Valida las rutas ejecutadas dia a dia
        </p>
      </div>

      {/* Alerta de permisos si es viewer */}
      {!canEdit && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Solo lectura</AlertTitle>
          <AlertDescription>
            No tienes permisos para validar rutas. Contacta al administrador si necesitas editar.
          </AlertDescription>
        </Alert>
      )}

      {/* Periodos pendientes de validación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Periodos Pendientes
          </CardTitle>
          <CardDescription>
            Periodos en estado borrador que requieren validacion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : quincenasBorrador.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Calendar className="h-8 w-8" />
              <p>No hay periodos pendientes de validacion.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/quincenas">
                  Ir a Periodos
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {quincenasBorrador.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{formatearQuincena(q)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFecha(q.fecha_inicio)} - {formatFecha(q.fecha_fin)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Borrador</Badge>
                    <Button asChild>
                      <Link href={`/validacion/${q.id}`}>
                        Validar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Periodos ya validados (para referencia) */}
      {quincenasValidado.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Periodos Validados</CardTitle>
            <CardDescription>
              Periodos validados pendientes de liquidacion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quincenasValidado.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between rounded-lg border p-4 opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{formatearQuincena(q)}</p>
                      <p className="text-sm text-muted-foreground">
                        Validado el {q.fecha_validacion && new Date(q.fecha_validacion).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">Validado</Badge>
                    <Button asChild variant="outline">
                      <Link href={`/validacion/${q.id}`}>
                        Ver detalle
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
