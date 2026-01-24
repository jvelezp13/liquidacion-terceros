'use client'

import { Building2, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useActiveTenant, useUserTenants, useSetActiveTenant, type RolTenant } from '@/lib/hooks/use-tenant'
import { toast } from 'sonner'

// Colores para los badges de rol
const rolColors: Record<RolTenant, string> = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-700',
  logistica: 'bg-green-100 text-green-700',
  soporte: 'bg-orange-100 text-orange-700',
}

const rolLabels: Record<RolTenant, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
  logistica: 'Logistica',
  soporte: 'Soporte',
}

export function TenantSelector() {
  const { data: activeTenant, isLoading: loadingActive } = useActiveTenant()
  const { data: tenants, isLoading: loadingTenants } = useUserTenants()
  const setActive = useSetActiveTenant()

  const handleSelect = (tenantId: string) => {
    if (tenantId === activeTenant?.id) return

    setActive.mutate(tenantId, {
      onSuccess: () => {
        const selectedTenant = tenants?.find(t => t.id === tenantId)
        toast.success(`Cambiado a "${selectedTenant?.nombre}"`)
      },
      onError: () => {
        toast.error('Error al cambiar de empresa')
      },
    })
  }

  // Estado de carga
  if (loadingActive || loadingTenants) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Cargando...</span>
      </div>
    )
  }

  // Sin tenant activo
  if (!activeTenant) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <Building2 className="h-4 w-4" />
        <span>Sin empresa</span>
      </div>
    )
  }

  // Si solo tiene un tenant, mostrar sin dropdown
  if (!tenants || tenants.length <= 1) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="font-medium">{activeTenant.nombre}</span>
        <Badge variant="secondary" className={`text-xs ${rolColors[activeTenant.rol]}`}>
          {rolLabels[activeTenant.rol]}
        </Badge>
      </div>
    )
  }

  // Multiples tenants: mostrar dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-auto py-1.5">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate font-medium">
            {activeTenant.nombre}
          </span>
          <Badge variant="secondary" className={`text-xs ${rolColors[activeTenant.rol]}`}>
            {rolLabels[activeTenant.rol]}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Cambiar empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSelect(tenant.id)}
            className="cursor-pointer"
          >
            <Check
              className={`mr-2 h-4 w-4 ${
                tenant.id === activeTenant.id ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="flex flex-1 items-center justify-between">
              <span className="truncate">{tenant.nombre}</span>
              <Badge variant="secondary" className={`text-xs ml-2 ${rolColors[tenant.rol]}`}>
                {rolLabels[tenant.rol]}
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
