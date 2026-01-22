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
import {
  MoreHorizontal,
  Trash2,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  DollarSign,
  ArrowRight,
} from 'lucide-react'
import type { LiqQuincena } from '@/types'
import { formatearQuincena, getNombreMes } from '@/lib/hooks/use-quincenas'
import { getEstadoQuincenaLabel } from '@/lib/validations/quincena'

interface QuincenasTableProps {
  quincenas: LiqQuincena[]
  onDelete: (quincena: LiqQuincena) => void
  onCambiarEstado: (quincena: LiqQuincena, nuevoEstado: string) => void
  isLoading?: boolean
}

export function QuincenasTable({
  quincenas,
  onDelete,
  onCambiarEstado,
  isLoading = false,
}: QuincenasTableProps) {
  // Obtener variante de badge según estado
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

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
    })
  }

  if (quincenas.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Calendar className="h-8 w-8" />
        <p>No hay periodos creados.</p>
        <p className="text-sm">Crea un periodo para empezar a validar rutas.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periodo</TableHead>
            <TableHead>Fechas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Historial</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quincenas.map((q) => (
            <TableRow key={q.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatearQuincena(q)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getNombreMes(q.mes)} {q.año}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="font-medium">{formatFecha(q.fecha_inicio)}</span>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className="font-medium">{formatFecha(q.fecha_fin)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(q.estado)}>
                  {getEstadoQuincenaLabel(q.estado)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {q.fecha_validacion && (
                    <p>Validado: {new Date(q.fecha_validacion).toLocaleDateString('es-CO')}</p>
                  )}
                  {q.fecha_liquidacion && (
                    <p>Liquidado: {new Date(q.fecha_liquidacion).toLocaleDateString('es-CO')}</p>
                  )}
                  {q.fecha_pago && (
                    <p>Pagado: {new Date(q.fecha_pago).toLocaleDateString('es-CO')}</p>
                  )}
                  {!q.fecha_validacion && !q.fecha_liquidacion && !q.fecha_pago && (
                    <p>Sin fechas registradas</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {/* Botón principal según estado */}
                  {q.estado === 'borrador' && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/validacion/${q.id}`}>
                        <ClipboardCheck className="mr-1 h-3 w-3" />
                        Validar
                      </Link>
                    </Button>
                  )}
                  {q.estado === 'validado' && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/liquidacion/${q.id}`}>
                        <DollarSign className="mr-1 h-3 w-3" />
                        Liquidar
                      </Link>
                    </Button>
                  )}
                  {q.estado === 'liquidado' && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/pagos?quincena=${q.id}`}>
                        <ArrowRight className="mr-1 h-3 w-3" />
                        Pagar
                      </Link>
                    </Button>
                  )}
                  {q.estado === 'pagado' && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/historial?quincena=${q.id}`}>
                        Ver detalle
                      </Link>
                    </Button>
                  )}

                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Acciones según estado */}
                      {q.estado === 'borrador' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/validacion/${q.id}`}>
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Ir a validación
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCambiarEstado(q, 'validado')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marcar como validado
                          </DropdownMenuItem>
                        </>
                      )}
                      {q.estado === 'validado' && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href={`/liquidacion/${q.id}`}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Ir a liquidación
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCambiarEstado(q, 'borrador')}
                          >
                            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                            Volver a borrador
                          </DropdownMenuItem>
                        </>
                      )}
                      {q.estado === 'liquidado' && (
                        <DropdownMenuItem
                          onClick={() => onCambiarEstado(q, 'validado')}
                        >
                          <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                          Volver a validado
                        </DropdownMenuItem>
                      )}

                      {/* Eliminar solo en borrador */}
                      {q.estado === 'borrador' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(q)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
