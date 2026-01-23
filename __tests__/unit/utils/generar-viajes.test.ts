import { describe, it, expect } from 'vitest'
import {
  calcularCostosViaje,
  convertirDiaJSaISO,
  getSemanaQuincena,
  DIAS_NOMBRE,
  type DatosRutaPlanificacion,
  type CostoDiaPlanificacion,
} from '@/lib/utils/generar-viajes'

describe('generar-viajes', () => {
  describe('DIAS_NOMBRE', () => {
    it('debe tener el mapeo correcto de días', () => {
      expect(DIAS_NOMBRE[1]).toBe('lunes')
      expect(DIAS_NOMBRE[2]).toBe('martes')
      expect(DIAS_NOMBRE[3]).toBe('miercoles')
      expect(DIAS_NOMBRE[4]).toBe('jueves')
      expect(DIAS_NOMBRE[5]).toBe('viernes')
      expect(DIAS_NOMBRE[6]).toBe('sabado')
      expect(DIAS_NOMBRE[7]).toBe('domingo')
    })
  })

  describe('convertirDiaJSaISO', () => {
    it('debe convertir domingo (0) a 7', () => {
      expect(convertirDiaJSaISO(0)).toBe(7)
    })

    it('debe mantener días 1-6 sin cambios', () => {
      expect(convertirDiaJSaISO(1)).toBe(1) // Lunes
      expect(convertirDiaJSaISO(2)).toBe(2) // Martes
      expect(convertirDiaJSaISO(3)).toBe(3) // Miércoles
      expect(convertirDiaJSaISO(4)).toBe(4) // Jueves
      expect(convertirDiaJSaISO(5)).toBe(5) // Viernes
      expect(convertirDiaJSaISO(6)).toBe(6) // Sábado
    })
  })

  describe('getSemanaQuincena', () => {
    it('debe retornar 1 para la primera semana', () => {
      const fechaInicio = new Date('2025-05-01T00:00:00')
      const fecha1 = new Date('2025-05-01T00:00:00') // Día 1
      const fecha5 = new Date('2025-05-05T00:00:00') // Día 5
      const fecha7 = new Date('2025-05-07T00:00:00') // Día 7

      expect(getSemanaQuincena(fecha1, fechaInicio)).toBe(1)
      expect(getSemanaQuincena(fecha5, fechaInicio)).toBe(1)
      expect(getSemanaQuincena(fecha7, fechaInicio)).toBe(1)
    })

    it('debe retornar 2 para la segunda semana', () => {
      const fechaInicio = new Date('2025-05-01T00:00:00')
      const fecha8 = new Date('2025-05-08T00:00:00') // Día 8
      const fecha10 = new Date('2025-05-10T00:00:00') // Día 10
      const fecha15 = new Date('2025-05-15T00:00:00') // Día 15

      expect(getSemanaQuincena(fecha8, fechaInicio)).toBe(2)
      expect(getSemanaQuincena(fecha10, fechaInicio)).toBe(2)
      expect(getSemanaQuincena(fecha15, fechaInicio)).toBe(2)
    })
  })

  describe('calcularCostosViaje', () => {
    it('debe retornar ceros si no hay datos de ruta', () => {
      const costos = calcularCostosViaje(undefined, 1)

      expect(costos.costoCombustible).toBe(0)
      expect(costos.costoPeajes).toBe(0)
      expect(costos.costoAdicionales).toBe(0)
      expect(costos.costoPernocta).toBe(0)
      expect(costos.requierePernocta).toBe(false)
      expect(costos.nochesPernocta).toBe(0)
      expect(costos.kmRecorridos).toBe(0)
      expect(costos.costoTotal).toBe(0)
    })

    it('debe calcular costos correctamente para un día de la semana', () => {
      const costoDia: CostoDiaPlanificacion = {
        dia: 'lunes',
        semana: 1,
        km_total: 250,
        combustible: 120000,
        adicionales: 15000,
        peajes: 0, // No se usa, se calcula desde peajes_ciclo
        pernocta: 60000,
      }

      const datosRuta: DatosRutaPlanificacion = {
        costos: [costoDia],
        peajesCiclo: 50000,
        frecuencia: 'semanal',
      }

      const costos = calcularCostosViaje(datosRuta, 1) // Lunes (diaISO = 1)

      expect(costos.costoCombustible).toBe(120000)
      expect(costos.costoAdicionales).toBe(15000)
      expect(costos.kmRecorridos).toBe(250)

      // FIX 4: Pernocta al 50% (solo conductor)
      expect(costos.costoPernocta).toBe(30000) // 60000 / 2
      expect(costos.requierePernocta).toBe(true)
      expect(costos.nochesPernocta).toBe(1)

      // FIX 2: Peajes distribuidos entre días del ciclo
      expect(costos.costoPeajes).toBe(50000) // 50000 / 1 día

      expect(costos.costoTotal).toBe(215000) // 120000 + 50000 + 15000 + 30000
    })

    it('debe distribuir peajes proporcionalmente entre días del ciclo', () => {
      const costos3Dias: CostoDiaPlanificacion[] = [
        { dia: 'lunes', semana: 1, km_total: 100, combustible: 50000, adicionales: 0, pernocta: 0 },
        { dia: 'miercoles', semana: 1, km_total: 100, combustible: 50000, adicionales: 0, pernocta: 0 },
        { dia: 'viernes', semana: 1, km_total: 100, combustible: 50000, adicionales: 0, pernocta: 0 },
      ]

      const datosRuta: DatosRutaPlanificacion = {
        costos: costos3Dias,
        peajesCiclo: 30000, // Total de peajes del ciclo
        frecuencia: 'semanal',
      }

      // Calcular para lunes (primer día)
      const costosLunes = calcularCostosViaje(datosRuta, 1)

      // Peajes = 30000 / 3 días = 10000 por día
      expect(costosLunes.costoPeajes).toBe(10000)
    })

    it('debe calcular pernocta al 50% (solo conductor)', () => {
      const costoDia: CostoDiaPlanificacion = {
        dia: 'martes',
        semana: 1,
        km_total: 300,
        combustible: 100000,
        adicionales: 0,
        pernocta: 80000, // Pernocta completa
      }

      const datosRuta: DatosRutaPlanificacion = {
        costos: [costoDia],
        peajesCiclo: 0,
        frecuencia: 'semanal',
      }

      const costos = calcularCostosViaje(datosRuta, 2) // Martes

      // FIX 4: Solo el 50% porque el copiloto no va
      expect(costos.costoPernocta).toBe(40000) // 80000 / 2
      expect(costos.requierePernocta).toBe(true)
      expect(costos.nochesPernocta).toBe(1)
    })

    it('debe retornar ceros si no encuentra el día en los costos', () => {
      const costoDia: CostoDiaPlanificacion = {
        dia: 'lunes',
        semana: 1,
        km_total: 100,
        combustible: 50000,
        adicionales: 0,
        pernocta: 0,
      }

      const datosRuta: DatosRutaPlanificacion = {
        costos: [costoDia], // Solo tiene lunes
        peajesCiclo: 10000,
        frecuencia: 'semanal',
      }

      // Buscar martes (no existe en costos)
      const costos = calcularCostosViaje(datosRuta, 2)

      expect(costos.costoCombustible).toBe(0)
      expect(costos.costoPeajes).toBe(0)
      expect(costos.costoTotal).toBe(0)
    })

    it('debe redondear correctamente los peajes', () => {
      const costoDia: CostoDiaPlanificacion = {
        dia: 'lunes',
        semana: 1,
        km_total: 100,
        combustible: 50000,
        adicionales: 0,
        pernocta: 0,
      }

      const datosRuta: DatosRutaPlanificacion = {
        costos: [costoDia, costoDia, costoDia], // 3 días
        peajesCiclo: 25000, // No divisible por 3
        frecuencia: 'semanal',
      }

      const costos = calcularCostosViaje(datosRuta, 1)

      // 25000 / 3 = 8333.33... -> 8333
      expect(costos.costoPeajes).toBe(8333)
    })

    it('debe calcular correctamente sin pernocta', () => {
      const costoDia: CostoDiaPlanificacion = {
        dia: 'viernes',
        semana: 1,
        km_total: 150,
        combustible: 75000,
        adicionales: 5000,
        pernocta: 0, // Sin pernocta
      }

      const datosRuta: DatosRutaPlanificacion = {
        costos: [costoDia],
        peajesCiclo: 15000,
        frecuencia: 'semanal',
      }

      const costos = calcularCostosViaje(datosRuta, 5) // Viernes

      expect(costos.costoPernocta).toBe(0)
      expect(costos.requierePernocta).toBe(false)
      expect(costos.nochesPernocta).toBe(0)
      expect(costos.costoTotal).toBe(95000) // 75000 + 15000 + 5000
    })
  })
})
