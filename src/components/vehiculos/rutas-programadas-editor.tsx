'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Trash2, Save, Route, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  useRutasProgramadas,
  useSetRutasProgramadas,
  diasSemana,
  type RutaProgramadaConDetalles,
} from '@/lib/hooks/use-rutas-programadas'
import { useRutasLogisticasVehiculo, type RutaLogisticaConMunicipios } from '@/lib/hooks/use-rutas-logisticas'
import type { LiqVehiculoTerceroConDetalles } from '@/types/database.types'

interface RutasProgramadasEditorProps {
  vehiculoTercero: LiqVehiculoTerceroConDetalles
}

// Tipo para el estado local de edición
interface RutaProgramadaLocal {
  id?: string
  dia_semana: number
  ruta_id: string
  ruta?: RutaLogisticaConMunicipios
  isNew?: boolean
}

export function RutasProgramadasEditor({ vehiculoTercero }: RutasProgramadasEditorProps) {
  const [editando, setEditando] = useState(false)
  const [rutasLocales, setRutasLocales] = useState<RutaProgramadaLocal[]>([])

  // Datos
  const { data: rutasProgramadas = [], isLoading: loadingProgramadas } = useRutasProgramadas(vehiculoTercero.id)
  const { data: rutasDisponibles = [], isLoading: loadingRutas } = useRutasLogisticasVehiculo(vehiculoTercero.vehiculo_id)
  const setRutasMutation = useSetRutasProgramadas()

  const isLoading = loadingProgramadas || loadingRutas

  // Sincronizar rutas programadas con estado local
  useEffect(() => {
    if (rutasProgramadas.length > 0 && !editando) {
      setRutasLocales(
        rutasProgramadas.map((rp) => ({
          id: rp.id,
          dia_semana: rp.dia_semana,
          ruta_id: rp.ruta_id,
          ruta: rutasDisponibles.find((r) => r.id === rp.ruta_id),
        }))
      )
    } else if (rutasProgramadas.length === 0 && !editando) {
      setRutasLocales([])
    }
  }, [rutasProgramadas, rutasDisponibles, editando])

  // Agregar nueva ruta
  const handleAddRuta = () => {
    if (rutasDisponibles.length === 0) {
      toast.error('No hay rutas disponibles para este vehículo')
      return
    }

    // Encontrar el primer día sin ruta
    const diasOcupados = new Set(rutasLocales.map((r) => r.dia_semana))
    const primerDiaLibre = diasSemana.find((d) => !diasOcupados.has(d.value))?.value || 1

    setRutasLocales([
      ...rutasLocales,
      {
        dia_semana: primerDiaLibre,
        ruta_id: rutasDisponibles[0].id,
        ruta: rutasDisponibles[0],
        isNew: true,
      },
    ])
    setEditando(true)
  }

  // Eliminar ruta
  const handleRemoveRuta = (index: number) => {
    setRutasLocales(rutasLocales.filter((_, i) => i !== index))
    setEditando(true)
  }

  // Cambiar día
  const handleChangeDia = (index: number, dia: number) => {
    const nuevasRutas = [...rutasLocales]
    nuevasRutas[index] = { ...nuevasRutas[index], dia_semana: dia }
    setRutasLocales(nuevasRutas)
    setEditando(true)
  }

  // Cambiar ruta
  const handleChangeRuta = (index: number, rutaId: string) => {
    const ruta = rutasDisponibles.find((r) => r.id === rutaId)
    const nuevasRutas = [...rutasLocales]
    nuevasRutas[index] = { ...nuevasRutas[index], ruta_id: rutaId, ruta }
    setRutasLocales(nuevasRutas)
    setEditando(true)
  }

  // Guardar cambios
  const handleSave = () => {
    // Validar que no haya duplicados de día
    const dias = rutasLocales.map((r) => r.dia_semana)
    const diasUnicos = new Set(dias)
    if (dias.length !== diasUnicos.size) {
      toast.error('No puedes tener dos rutas el mismo día')
      return
    }

    setRutasMutation.mutate(
      {
        vehiculoTerceroId: vehiculoTercero.id,
        rutas: rutasLocales.map((r) => ({
          ruta_id: r.ruta_id,
          dia_semana: r.dia_semana,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Rutas programadas actualizadas')
          setEditando(false)
        },
        onError: (error) => {
          toast.error('Error al guardar: ' + error.message)
        },
      }
    )
  }

  // Cancelar edición
  const handleCancel = () => {
    setRutasLocales(
      rutasProgramadas.map((rp) => ({
        id: rp.id,
        dia_semana: rp.dia_semana,
        ruta_id: rp.ruta_id,
        ruta: rutasDisponibles.find((r) => r.id === rp.ruta_id),
      }))
    )
    setEditando(false)
  }

  // Obtener municipios de una ruta para mostrar
  const getMunicipiosLabel = (ruta: RutaLogisticaConMunicipios | undefined) => {
    if (!ruta || !ruta.municipios || ruta.municipios.length === 0) return ''
    return ruta.municipios.map((m) => m.municipio?.nombre || '').filter(Boolean).join(' → ')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (rutasDisponibles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rutas Programadas
          </CardTitle>
          <CardDescription>
            Asigna rutas a cada dia de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Route className="h-8 w-8" />
            <p>Este vehiculo no tiene rutas configuradas en Planeacion Logi</p>
            <p className="text-sm">Configura primero las rutas en el sistema de Planeacion</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rutas Programadas
            </CardTitle>
            <CardDescription>
              Asigna rutas a cada dia de la semana para este vehiculo
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {editando ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={setRutasMutation.isPending}>
                  {setRutasMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleAddRuta}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ruta
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rutasLocales.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Route className="h-8 w-8" />
            <p>No hay rutas programadas para este vehiculo</p>
            <Button variant="outline" size="sm" onClick={handleAddRuta}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar primera ruta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rutasLocales
              .sort((a, b) => a.dia_semana - b.dia_semana)
              .map((rp, index) => (
                <div
                  key={rp.id || `new-${index}`}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {/* Selector de día */}
                  <Select
                    value={rp.dia_semana.toString()}
                    onValueChange={(v) => handleChangeDia(index, parseInt(v))}
                    disabled={!editando && !rp.isNew}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {diasSemana.map((dia) => (
                        <SelectItem key={dia.value} value={dia.value.toString()}>
                          {dia.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Selector de ruta */}
                  <div className="flex-1">
                    <Select
                      value={rp.ruta_id}
                      onValueChange={(v) => handleChangeRuta(index, v)}
                      disabled={!editando && !rp.isNew}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rutasDisponibles.map((ruta) => (
                          <SelectItem key={ruta.id} value={ruta.id}>
                            <div className="flex flex-col">
                              <span>{ruta.nombre}</span>
                              <span className="text-xs text-muted-foreground">
                                {getMunicipiosLabel(ruta)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Info de la ruta */}
                  <div className="hidden md:flex items-center gap-2">
                    {rp.ruta?.requiere_pernocta && (
                      <Badge variant="outline" className="text-xs">
                        Pernocta
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {rp.ruta?.viajes_por_periodo || 1} viaje(s)/{rp.ruta?.frecuencia || 'mes'}
                    </Badge>
                  </div>

                  {/* Botón eliminar */}
                  {(editando || rp.isNew) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRuta(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

            {/* Botón para agregar más rutas */}
            {editando && rutasLocales.length < 7 && (
              <Button variant="outline" className="w-full" onClick={handleAddRuta}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar otra ruta
              </Button>
            )}
          </div>
        )}

        {/* Resumen semanal */}
        {rutasLocales.length > 0 && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">Resumen semanal</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {diasSemana.map((dia) => {
                const rutaDia = rutasLocales.find((r) => r.dia_semana === dia.value)
                return (
                  <Badge
                    key={dia.value}
                    variant={rutaDia ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {dia.short}: {rutaDia?.ruta?.codigo || rutaDia?.ruta?.nombre?.substring(0, 8) || '-'}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
