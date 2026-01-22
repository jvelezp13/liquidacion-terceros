'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  Truck,
  Calendar,
  CheckSquare,
  FileText,
  CreditCard,
  History
} from 'lucide-react'

// Flujo de trabajo principal
const navigation = [
  { name: 'Periodos', href: '/quincenas', icon: Calendar },
  { name: 'Validación', href: '/validacion', icon: CheckSquare },
  { name: 'Liquidación', href: '/liquidacion', icon: FileText },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Historial', href: '/historial', icon: History },
]

// Configuración / datos maestros
const configNavigation = [
  { name: 'Contratistas', href: '/contratistas', icon: Users },
  { name: 'Vehículos', href: '/vehiculos', icon: Truck },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-blue-950">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">
          Liquidación Terceros
        </h1>
      </div>

      {/* Navegación principal - Flujo de trabajo */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Configuración - Datos maestros */}
      <div className="border-t border-blue-800 px-3 py-4 space-y-1">
        {configNavigation.map((item) => {
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
