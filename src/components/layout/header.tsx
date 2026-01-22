'use client'

import { Button } from '@/components/ui/button'
import { LogOut, Rocket } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { TenantSelector } from './tenant-selector'
import { useEscenarioProduccion } from '@/lib/hooks/use-escenario-activo'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { data: escenario, isLoading: loadingEscenario } = useEscenarioProduccion()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Selector de empresa + Escenario a la izquierda */}
      <div className="flex items-center gap-4">
        <TenantSelector />
        <div className="h-6 w-px bg-gray-200" />
        {/* Indicador de escenario de produccion */}
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-900 text-white">
                {user?.email ? getInitials(user.email) : 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">Mi cuenta</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
