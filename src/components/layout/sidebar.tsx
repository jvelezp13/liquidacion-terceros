'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Users,
  Truck,
  Calendar,
  CheckSquare,
  FileText,
  CreditCard,
  History,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

// Flujo de trabajo principal
const navigation = [
  { name: 'Periodos', href: '/quincenas', icon: Calendar },
  { name: 'Validación', href: '/validacion', icon: CheckSquare },
  { name: 'Liquidación', href: '/liquidacion', icon: FileText },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Historial', href: '/historial', icon: History },
]

// Análisis
const analysisNavigation = [
  { name: 'Estadísticas', href: '/estadisticas', icon: BarChart3 },
]

// Configuración / datos maestros
const configNavigation = [
  { name: 'Contratistas', href: '/contratistas', icon: Users },
  { name: 'Vehículos', href: '/vehiculos', icon: Truck },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex h-full flex-col bg-blue-950 transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo + Toggle */}
      <div className="flex h-16 items-center justify-between px-3">
        {!collapsed && (
          <h1 className="text-xl font-bold text-white pl-3">
            Liquidación Terceros
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-blue-300 hover:bg-blue-900 hover:text-white transition-colors"
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
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
              title={collapsed ? item.name : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </nav>

      {/* Análisis */}
      <div className="border-t border-blue-800 px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="px-3 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
            Análisis
          </p>
        )}
        {analysisNavigation.map((item) => {
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </div>

      {/* Configuración - Datos maestros */}
      <div className="border-t border-blue-800 px-3 py-4 space-y-1">
        {configNavigation.map((item) => {
          const isActive = pathname === item.href ||
            pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-900 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white',
                collapsed && 'justify-center px-0'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
