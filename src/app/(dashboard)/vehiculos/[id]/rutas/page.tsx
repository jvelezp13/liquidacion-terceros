'use client'

import { use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Truck, User, Building } from 'lucide-react'
import { RutasProgramadasEditor } from '@/components/vehiculos'
import { useVehiculoTercero } from '@/lib/hooks/use-vehiculos-terceros'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function VehiculoRutasPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { data: escenario, isLoading: escenarioLoading } = useEscenarioActivo()
  const { data: vehiculoTercero, isLoading: vehiculoLoading } = useVehiculoTercero(resolvedParams.id)

  const isLoading = escenarioLoading || vehiculoLoading

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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!vehiculoTercero) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Vehiculo no encontrado</p>
        <Button asChild variant="outline">
          <Link href="/vehiculos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a vehiculos
          </Link>
        </Button>
      </div>
    )
  }

  // Formatear costo
  const formatCosto = () => {
    if (!vehiculoTercero.vehiculo_costos) return '-'
    const { modalidad_tercero, costo_por_viaje, flete_mensual } = vehiculoTercero.vehiculo_costos
    if (modalidad_tercero === 'por_viaje' && costo_por_viaje) {
      return `$${costo_por_viaje.toLocaleString()}/viaje`
    }
    if (modalidad_tercero === 'flete_fijo' && flete_mensual) {
      return `$${flete_mensual.toLocaleString()}/mes`
    }
    return '-'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/vehiculos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Rutas del Vehiculo</h1>
          <p className="text-muted-foreground">
            Configura las rutas programadas por dia de semana
          </p>
        </div>
      </div>

      {/* Info del vehículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {vehiculoTercero.vehiculo?.nombre || vehiculoTercero.placa}
          </CardTitle>
          <CardDescription>
            {vehiculoTercero.vehiculo?.tipo_vehiculo || 'Vehículo esporádico'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Placa */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-mono font-medium">{vehiculoTercero.placa}</p>
              </div>
            </div>

            {/* Contratista */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contratista</p>
                <p className="font-medium">{vehiculoTercero.contratista.nombre}</p>
              </div>
            </div>

            {/* Conductor */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conductor</p>
                <p className="font-medium">
                  {vehiculoTercero.conductor_nombre || 'No asignado'}
                </p>
              </div>
            </div>
          </div>

          {/* Badges de info */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">
              {vehiculoTercero.vehiculo_costos?.modalidad_tercero === 'por_viaje'
                ? 'Por viaje'
                : 'Flete fijo'}
            </Badge>
            <Badge variant="secondary">{formatCosto()}</Badge>
            <Badge variant={vehiculoTercero.activo ? 'default' : 'secondary'}>
              {vehiculoTercero.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Editor de rutas programadas */}
      <RutasProgramadasEditor vehiculoTercero={vehiculoTercero} />
    </div>
  )
}
