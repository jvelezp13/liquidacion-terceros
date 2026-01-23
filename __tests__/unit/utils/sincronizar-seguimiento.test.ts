import { describe, it, expect } from 'vitest'
import { getMesDesdeQuincena } from '@/lib/utils/sincronizar-seguimiento'
import type { LiqQuincena } from '@/types'

describe('sincronizar-seguimiento', () => {
  describe('getMesDesdeQuincena', () => {
    it('debe extraer el mes de la quincena correctamente', () => {
      const quincena: LiqQuincena = {
        id: 'q1',
        mes: 5,
        quincena: 1,
        año: 2025,
        fecha_inicio: '2025-05-01',
        fecha_fin: '2025-05-15',
      } as LiqQuincena

      expect(getMesDesdeQuincena(quincena)).toBe(5)
    })

    it('debe funcionar para diferentes meses', () => {
      const quincenaEnero: LiqQuincena = {
        id: 'q1',
        mes: 1,
        quincena: 1,
        año: 2025,
      } as LiqQuincena

      const quincenaDiciembre: LiqQuincena = {
        id: 'q2',
        mes: 12,
        quincena: 2,
        año: 2025,
      } as LiqQuincena

      expect(getMesDesdeQuincena(quincenaEnero)).toBe(1)
      expect(getMesDesdeQuincena(quincenaDiciembre)).toBe(12)
    })
  })
})
