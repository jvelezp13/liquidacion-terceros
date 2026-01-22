'use client'

import { Button } from '@/components/ui/button'
import { LogOut, User, Rocket } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TenantSelector } from './tenant-selector'
import { useEscenarioProduccion } from '@/lib/hooks/use-escenario-activo'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const { data: escenario, isLoading: loadingEscenario } = useEscenarioProduccion()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Selector de empresa a la izquierda (igual que PlaneacionLogi) */}
      <div className="flex items-center gap-4">
        <TenantSelector />
      </div>

      {/* Indicador de escenario de produccion */}
      <div className="flex items-center gap-2">
        {loadingEscenario ? (
          <span className="text-sm text-muted-foreground">Cargando escenario...</span>
        ) : escenario ? (
          <div className="flex items-center gap-2 rounded-md bg-purple-50 px-3 py-1.5 border border-purple-200">
            <Rocket className="h-4 w-4 text-purple-600" />
            <div className="flex flex-col">
              <span className="text-xs text-purple-600 font-medium">Escenario de produccion</span>
              <span className="text-sm font-semibold text-purple-800">{escenario.nombre} ({escenario.año})</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 border border-amber-200">
            <Rocket className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">Sin escenario de produccion</span>
          </div>
        )}
      </div>

      {/* Menu de usuario a la derecha */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
