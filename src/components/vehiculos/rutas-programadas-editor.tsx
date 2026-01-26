'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { Loader2, Plus, Trash2, Route, Calendar, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  useRutasProgramadas,
  useSetRutasProgramadas,
  diasSemana,
} from '@/lib/hooks/use-rutas-programadas'
import {
  useRutasLogisticas,
  useInfoDiasCicloRutas,
  type InfoDiaCiclo,
} from '@/lib/hooks/use-rutas-logisticas'
import type { RutaLogistica } from '@/types'
import { useEscenarioActivo } from '@/lib/hooks/use-escenario-activo'
import type { LiqVehiculoTerceroConDetalles } from '@/types'

interface RutasProgramadasEditorProps {
  vehiculoTercero: LiqVehiculoTerceroConDetalles
}

// Tipo para el estado local de edición
interface RutaProgramadaLocal {
  id?: string
  dia_semana: number
  ruta_id: string
  ruta?: RutaLogistica
  dia_ciclo?: number | null
  isNew?: boolean
}

// Calcula dia_ciclo automaticamente basandose en dias consecutivos con la misma ruta
function calcularDiasCicloAutomatico(
  rutas: RutaProgramadaLocal[]
): RutaProgramadaLocal[] {
  if (rutas.length === 0) return rutas

  // Ordenar por dia de la semana
  const ordenadas = [...rutas].sort((a, b) => a.dia_semana - b.dia_semana)

  // Agrupar dias consecutivos con la misma ruta
  const grupos: { rutaId: string; indices: number[] }[] = []

  for (let i = 0; i < ordenadas.length; i++) {
    const ruta = ordenadas[i]
    const prevRuta = i > 0 ? ordenadas[i - 1] : null

    // Verificar si es consecutivo (mismo ruta_id y dia consecutivo)
    const esConsecutivo =
      prevRuta &&
      prevRuta.ruta_id === ruta.ruta_id &&
      ruta.dia_semana === prevRuta.dia_semana + 1

    if (esConsecutivo && grupos.length > 0) {
      // Agregar al grupo actual
      grupos[grupos.length - 1].indices.push(i)
    } else {
      // Crear nuevo grupo
      grupos.push({ rutaId: ruta.ruta_id, indices: [i] })
    }
  }

  // Asignar dia_ciclo basandose en los grupos
  const resultado = ordenadas.map((ruta) => ({ ...ruta, dia_ciclo: null as number | null }))

  for (const grupo of grupos) {
    if (grupo.indices.length > 1) {
      // Solo asignar dia_ciclo si hay mas de un dia consecutivo
      grupo.indices.forEach((idx, posEnGrupo) => {
        resultado[idx].dia_ciclo = posEnGrupo + 1
      })
    }
  }

  return resultado
}

export function RutasProgramadasEditor({ vehiculoTercero }: RutasProgramadasEditorProps) {
  const [rutasLocales, setRutasLocales] = useState<RutaProgramadaLocal[]>([])
  const [guardando, setGuardando] = useState(false)
  const [guardadoExitoso, setGuardadoExitoso] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inicializado = useRef(false)

  // Datos
  const { data: escenario, isLoading: loadingEscenario } = useEscenarioActivo()
  const { data: rutasProgramadas = [], isLoading: loadingProgramadas } = useRutasProgramadas(vehiculoTercero.id)
  const { data: rutasDisponibles = [], isLoading: loadingRutas } = useRutasLogisticas()
  const setRutasMutation = useSetRutasProgramadas()

  // Obtener info de dias del ciclo para las rutas disponibles
  const rutaIds = rutasDisponibles.map((r) => r.id)
  const { data: infoDiasCicloMap = new Map() } = useInfoDiasCicloRutas(rutaIds)

  const isLoading = loadingProgramadas || loadingRutas || loadingEscenario

  // Helper para obtener info de dias del ciclo de una ruta
  const getInfoDiasCiclo = (rutaId: string): InfoDiaCiclo[] => {
    return infoDiasCicloMap.get(rutaId) || []
  }

  // Funcion de guardado
  const guardarCambios = useCallback((rutasParaGuardar: RutaProgramadaLocal[]) => {
    // Validar que no haya duplicados de dia
    const dias = rutasParaGuardar.map((r) => r.dia_semana)
    const diasUnicos = new Set(dias)
    if (dias.length !== diasUnicos.size) {
      toast.error('No puedes tener dos rutas el mismo dia')
      return
    }

    // Calcular dia_ciclo automaticamente
    const rutasConDiaCiclo = calcularDiasCicloAutomatico(rutasParaGuardar)

    setGuardando(true)
    setGuardadoExitoso(false)

    setRutasMutation.mutate(
      {
        vehiculoTerceroId: vehiculoTercero.id,
        rutas: rutasConDiaCiclo.map((r) => ({
          ruta_id: r.ruta_id,
          dia_semana: r.dia_semana,
          dia_ciclo: r.dia_ciclo ?? null,
        })),
      },
      {
        onSuccess: () => {
          setGuardando(false)
          setGuardadoExitoso(true)
          // Limpiar indicador de exito despues de 2 segundos
          setTimeout(() => setGuardadoExitoso(false), 2000)
        },
        onError: (error) => {
          toast.error('Error al guardar: ' + error.message)
          setGuardando(false)
        },
      }
    )
  }, [vehiculoTercero.id, setRutasMutation])

  // Autoguardado con debounce
  const handleChange = useCallback((nuevasRutas: RutaProgramadaLocal[], guardarInmediato = false) => {
    setRutasLocales(nuevasRutas)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Usar debounce mas corto si es guardar inmediato (eliminar)
    const delay = guardarInmediato ? 100 : 500

    debounceRef.current = setTimeout(() => {
      guardarCambios(nuevasRutas)
    }, delay)
  }, [guardarCambios])

  // Sincronizar rutas programadas con estado local (solo al cargar)
  useEffect(() => {
    // Solo sincronizar si no estamos guardando y es la primera carga
    if (guardando) return

    if (rutasProgramadas.length > 0 && rutasDisponibles.length > 0) {
      const nuevasRutas = rutasProgramadas.map((rp) => ({
        id: rp.id,
        dia_semana: rp.dia_semana,
        ruta_id: rp.ruta_id,
        ruta: rutasDisponibles.find((r) => r.id === rp.ruta_id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dia_ciclo: (rp as any).dia_ciclo ?? null,
      }))

      // Solo actualizar si los datos realmente cambiaron
      setRutasLocales((prev) => {
        const prevKey = prev.map((r) => `${r.id}-${r.dia_semana}-${r.ruta_id}-${r.dia_ciclo}`).sort().join(',')
        const newKey = nuevasRutas.map((r) => `${r.id}-${r.dia_semana}-${r.ruta_id}-${r.dia_ciclo}`).sort().join(',')
        if (prevKey === newKey) return prev
        inicializado.current = true
        return nuevasRutas
      })
    } else if (rutasProgramadas.length === 0 && rutasDisponibles.length > 0) {
      setRutasLocales((prev) => {
        if (prev.length === 0) {
          inicializado.current = true
          return prev
        }
        // Si tenemos rutas locales pero no hay en BD, puede ser que estemos en proceso de guardar
        if (!inicializado.current) {
          inicializado.current = true
          return []
        }
        return prev
      })
    }
  }, [rutasProgramadas, rutasDisponibles, guardando])

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Agregar nueva ruta
  const handleAddRuta = () => {
    if (rutasDisponibles.length === 0) {
      toast.error('No hay rutas disponibles en el escenario')
      return
    }

    // Encontrar el primer dia sin ruta
    const diasOcupados = new Set(rutasLocales.map((r) => r.dia_semana))
    const primerDiaLibre = diasSemana.find((d) => !diasOcupados.has(d.value))?.value || 1

    const nuevasRutas = [
      ...rutasLocales,
      {
        dia_semana: primerDiaLibre,
        ruta_id: rutasDisponibles[0].id,
        ruta: rutasDisponibles[0],
        isNew: true,
      },
    ]

    handleChange(nuevasRutas)
  }

  // Eliminar ruta
  const handleRemoveRuta = (index: number) => {
    const nuevasRutas = rutasLocales.filter((_, i) => i !== index)
    handleChange(nuevasRutas, true)
  }

  // Cambiar dia
  const handleChangeDia = (index: number, dia: number) => {
    const nuevasRutas = [...rutasLocales]
    nuevasRutas[index] = { ...nuevasRutas[index], dia_semana: dia }
    handleChange(nuevasRutas)
  }

  // Cambiar ruta
  const handleChangeRuta = (index: number, rutaId: string) => {
    const ruta = rutasDisponibles.find((r) => r.id === rutaId)
    const nuevasRutas = [...rutasLocales]
    nuevasRutas[index] = { ...nuevasRutas[index], ruta_id: rutaId, ruta }
    handleChange(nuevasRutas)
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
            <p>No hay rutas configuradas en el escenario</p>
            <p className="text-sm">Configura primero las rutas en el sistema de Planeacion Logi</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular dia_ciclo para mostrar badges informativos
  const rutasConCicloCalculado = calcularDiasCicloAutomatico(rutasLocales)

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
          <div className="flex items-center gap-2">
            {/* Indicador de estado */}
            {guardando && (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Guardando...
              </Badge>
            )}
            {guardadoExitoso && !guardando && (
              <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                <Check className="h-3 w-3" />
                Guardado
              </Badge>
            )}
            {rutasLocales.length < 7 && (
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
            {rutasConCicloCalculado
              .sort((a, b) => a.dia_semana - b.dia_semana)
              .map((rp, index) => {
                // Encontrar cuantos dias tiene este ciclo
                const mismaRutaConsecutiva = rutasConCicloCalculado.filter(
                  (r) => r.ruta_id === rp.ruta_id && r.dia_ciclo !== null
                )
                const totalDiasCiclo = mismaRutaConsecutiva.length

                return (
                  <div
                    key={rp.id || `new-${index}`}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    {/* Selector de dia */}
                    <Select
                      value={rp.dia_semana.toString()}
                      onValueChange={(v) => handleChangeDia(index, parseInt(v))}
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
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rutasDisponibles.map((ruta) => {
                            const infoDias = getInfoDiasCiclo(ruta.id)
                            return (
                              <SelectItem key={ruta.id} value={ruta.id}>
                                <div className="flex items-center gap-2">
                                  <span>{ruta.nombre}</span>
                                  {infoDias.length > 1 && (
                                    <Badge variant="outline" className="text-xs">
                                      {infoDias.length} dias
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Badge informativo de dia del ciclo (calculado automaticamente) */}
                    {rp.dia_ciclo !== null && totalDiasCiclo > 1 && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">
                        Dia {rp.dia_ciclo}/{totalDiasCiclo}
                      </Badge>
                    )}

                    {/* Info de la ruta */}
                    <div className="hidden md:flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rp.ruta?.codigo || rp.ruta?.nombre?.substring(0, 10) || 'Sin ruta'}
                      </Badge>
                    </div>

                    {/* Boton eliminar - siempre visible */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRuta(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
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
