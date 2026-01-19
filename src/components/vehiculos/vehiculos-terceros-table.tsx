'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff, User, Truck, Route } from 'lucide-react'
import type { LiqVehiculoTerceroConDetalles } from '@/types/database.types'

interface VehiculosTercerosTableProps {
  vehiculos: LiqVehiculoTerceroConDetalles[]
  onEdit: (vehiculo: LiqVehiculoTerceroConDetalles) => void
  onDelete: (vehiculo: LiqVehiculoTerceroConDetalles) => void
  onToggleActivo: (vehiculo: LiqVehiculoTerceroConDetalles) => void
  isLoading?: boolean
}

export function VehiculosTercerosTable({
  vehiculos,
  onEdit,
  onDelete,
  onToggleActivo,
  isLoading = false,
}: VehiculosTercerosTableProps) {
  // Formatear costo del vehículo
  const formatCosto = (vehiculo: LiqVehiculoTerceroConDetalles) => {
    if (!vehiculo.vehiculo_costos) return '-'
    const { modalidad_tercero, costo_por_viaje, flete_mensual } = vehiculo.vehiculo_costos
    if (modalidad_tercero === 'por_viaje' && costo_por_viaje) {
      return `$${costo_por_viaje.toLocaleString()}/viaje`
    }
    if (modalidad_tercero === 'flete_fijo' && flete_mensual) {
      return `$${flete_mensual.toLocaleString()}/mes`
    }
    return '-'
  }

  if (vehiculos.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Truck className="h-8 w-8" />
        <p>No hay vehículos terceros vinculados.</p>
        <p className="text-sm">Vincula un vehículo de Planeación para empezar.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Contratista</TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehiculos.map((vt) => (
            <TableRow key={vt.id} className={!vt.activo ? 'opacity-50' : ''}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{vt.vehiculo.nombre}</p>
                    <p className="text-xs text-muted-foreground">{vt.vehiculo.tipo_vehiculo}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono font-medium">{vt.placa}</span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{vt.contratista.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {vt.contratista.numero_documento}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {vt.conductor_nombre ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>{vt.conductor_nombre}</p>
                      {vt.conductor_telefono && (
                        <p className="text-xs text-muted-foreground">{vt.conductor_telefono}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">{formatCosto(vt)}</span>
              </TableCell>
              <TableCell>
                <Badge variant={vt.activo ? 'default' : 'secondary'}>
                  {vt.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/vehiculos/${vt.id}/rutas`}>
                        <Route className="mr-2 h-4 w-4" />
                        Ver rutas
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(vt)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActivo(vt)}>
                      {vt.activo ? (
                        <>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(vt)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Desvincular
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
