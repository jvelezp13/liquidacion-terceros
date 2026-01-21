'use client'

import { useState, useMemo } from 'react'
import { Check, ChevronsUpDown, Search, Route } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { RutaLogistica } from '@/types/database.types'

interface SelectorRutaVariacionProps {
  rutas: RutaLogistica[]
  rutaSeleccionada: string | null
  onSelect: (rutaId: string | null) => void
  disabled?: boolean
  placeholder?: string
}

export function SelectorRutaVariacion({
  rutas,
  rutaSeleccionada,
  onSelect,
  disabled = false,
  placeholder = 'Seleccionar ruta...',
}: SelectorRutaVariacionProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Filtrar rutas por búsqueda
  const rutasFiltradas = useMemo(() => {
    if (!searchValue.trim()) return rutas.slice(0, 10) // Máximo 10 resultados por defecto

    const termino = searchValue.toLowerCase()
    return rutas
      .filter(
        (r) =>
          r.nombre.toLowerCase().includes(termino) ||
          (r.codigo && r.codigo.toLowerCase().includes(termino))
      )
      .slice(0, 10)
  }, [rutas, searchValue])

  // Obtener la ruta seleccionada
  const rutaActual = useMemo(() => {
    if (!rutaSeleccionada) return null
    return rutas.find((r) => r.id === rutaSeleccionada)
  }, [rutas, rutaSeleccionada])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal',
            !rutaActual && 'text-muted-foreground'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Route className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {rutaActual
                ? `${rutaActual.codigo ? `[${rutaActual.codigo}] ` : ''}${rutaActual.nombre}`
                : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Buscar ruta..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>No se encontraron rutas.</CommandEmpty>
            <CommandGroup>
              {/* Opción para limpiar selección */}
              {rutaSeleccionada && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onSelect(null)
                    setOpen(false)
                  }}
                  className="text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Quitar selección</span>
                  </div>
                </CommandItem>
              )}

              {/* Lista de rutas */}
              {rutasFiltradas.map((ruta) => (
                <CommandItem
                  key={ruta.id}
                  value={ruta.id}
                  onSelect={() => {
                    onSelect(ruta.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      rutaSeleccionada === ruta.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {ruta.codigo && (
                        <span className="font-mono text-xs text-muted-foreground mr-1">
                          [{ruta.codigo}]
                        </span>
                      )}
                      {ruta.nombre}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
