import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'

interface LoadingStateProps {
  message?: string
  className?: string
}

/**
 * Estado de carga genérico con spinner y mensaje opcional
 */
export function LoadingState({ message = 'Cargando...', className }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center gap-2 p-8 ${className || ''}`}>
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

interface LoadingTableProps {
  columns: number
  rows?: number
}

/**
 * Skeleton para tablas (muestra filas de loading)
 */
export function LoadingTable({ columns, rows = 5 }: LoadingTableProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

interface LoadingSkeletonProps {
  type: 'card' | 'table' | 'form'
  className?: string
}

/**
 * Skeleton genérico por tipo de contenido
 */
export function LoadingSkeleton({ type, className }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className={`space-y-3 rounded-lg border p-6 ${className || ''}`}>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className={`space-y-4 ${className || ''}`}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  // type === 'table'
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
