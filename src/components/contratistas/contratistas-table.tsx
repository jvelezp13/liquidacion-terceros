'use client'

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
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from 'lucide-react'
import type { LiqContratista } from '@/types'
import { tipoDocumentoOptions } from '@/lib/validations/contratista'

interface ContratistasTableProps {
  contratistas: LiqContratista[]
  onEdit: (contratista: LiqContratista) => void
  onDelete: (contratista: LiqContratista) => void
  onToggleActivo: (contratista: LiqContratista) => void
  isLoading?: boolean
  canEdit?: boolean
}

export function ContratistasTable({
  contratistas,
  onEdit,
  onDelete,
  onToggleActivo,
  isLoading = false,
  canEdit = true,
}: ContratistasTableProps) {
  const getTipoDocumentoLabel = (tipo: string) => {
    const option = tipoDocumentoOptions.find((o) => o.value === tipo)
    return option?.label || tipo
  }

  if (contratistas.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        No hay contratistas registrados. Crea uno para empezar.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Banco</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contratistas.map((contratista) => (
            <TableRow key={contratista.id} className={!contratista.activo ? 'opacity-50' : ''}>
              <TableCell className="font-medium">{contratista.nombre}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {getTipoDocumentoLabel(contratista.tipo_documento)}
                  </span>
                  <span>{contratista.numero_documento}</span>
                </div>
              </TableCell>
              <TableCell>{contratista.telefono || '-'}</TableCell>
              <TableCell>{contratista.banco || '-'}</TableCell>
              <TableCell>
                {contratista.numero_cuenta ? (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground capitalize">
                      {contratista.tipo_cuenta || ''}
                    </span>
                    <span className="font-mono text-sm">{contratista.numero_cuenta}</span>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Badge variant={contratista.activo ? 'default' : 'secondary'}>
                  {contratista.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading || !canEdit}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contratista)} disabled={!canEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleActivo(contratista)} disabled={!canEdit}>
                      {contratista.activo ? (
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
                      onClick={() => onDelete(contratista)}
                      className="text-destructive"
                      disabled={!canEdit}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
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
