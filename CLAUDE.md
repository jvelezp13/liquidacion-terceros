# CLAUDE.md - Liquidación Terceros

## Descripción

Sistema de liquidación quincenal para vehículos de terceros (fleteros). **Comparte la base de datos Supabase con PlaneacionLogi**.

## Stack

- Next.js 16 (App Router) + TypeScript
- Supabase (PostgreSQL compartida)
- shadcn/ui + Tailwind v4
- TanStack Query + React Hook Form + Zod
- **Testing:** Vitest (43 tests unitarios)

## Comandos

```bash
npm run dev           # localhost:3001
npm run build
npm run test          # Vitest
npm run test:coverage
```

## Estructura

```
src/
├── app/(dashboard)/     # Rutas protegidas
│   ├── quincenas/       # Períodos de liquidación
│   ├── validacion/      # Validar viajes ejecutados
│   ├── liquidacion/     # Generar liquidaciones
│   └── pagos/exportar/  # Exportar CSV Payana
├── components/
│   └── ui/              # shadcn/ui + loading-state.tsx
├── lib/
│   ├── hooks/           # Hooks TanStack Query
│   ├── utils/           # Lógica pura testeable
│   │   ├── calcular-liquidacion.ts
│   │   ├── generar-viajes.ts
│   │   ├── formatters.ts         # formatFecha, formatCOP
│   │   └── toast-messages.ts     # Mensajes estandarizados
│   └── supabase/        # Clientes
└── types/
    └── database.types.ts  # Auto-generado
```

Alias: `@/` → `src/`

## Relación con PlaneacionLogi

**Base de datos compartida.** Usa `~/CascadeProjects/PlaneacionLogi/app/.env.local` para credenciales.

### Tablas propias (prefijo `liq_*`)
- `liq_contratistas`, `liq_vehiculos_terceros`, `liq_quincenas`
- `liq_viajes_ejecutados`, `liq_liquidaciones`, `liq_historial_pagos`

### Tablas referenciadas (solo lectura)
- `escenarios`, `vehiculos` (esquema='tercero'), `vehiculos_costos`
- `rutas_logisticas`, `ruta_municipios`, `matriz_desplazamientos`

### Sincronización
Liquidaciones → `ejecucion_rubros` (seguimiento PlaneacionLogi):
- Q1: reemplaza valor
- Q2: suma al valor existente (acumulado mensual)

## Flujo de Trabajo

1. **Crear Quincena** → Auto-genera viajes desde `liq_vehiculo_rutas_programadas`
2. **Validar Viajes** → Marcar `ejecutado/no_ejecutado/variacion`
3. **Generar Liquidación** → Cálculo automático + deducción 1%
4. **Exportar Payana** → CSV consolidado por contratista
5. **Registrar Pago** → Confirmar referencia

## Estados

**Quincena:** `borrador` → `validado` → `liquidado` → `pagado`

**Viaje:** `pendiente`, `ejecutado`, `no_ejecutado`, `variacion`

## Arquitectura: Hooks + Utils

Patrón de separación en 2 capas:

```typescript
// Hook: coordina queries Supabase (TanStack Query)
use-generar-viajes.ts → fetching + orquestación

// Utils: lógica pura testeable (sin Supabase)
utils/generar-viajes.ts → calcularCostosViaje()
```

**Beneficio:** Utils son 100% testeables sin mocks.

### Cálculos Específicos de Viajes

- **FIX 2:** Peajes distribuidos: `peajesCiclo / cantidadDíasCiclo`
- **FIX 4:** Pernocta al 50% (solo conductor): `Math.round(pernocta / 2)`
- Frecuencia semanal: ciclo se repite cada semana (ignorar número de semana)

Ver implementación en `utils/generar-viajes.ts`.

## Convenciones

- Hooks: `use-{entidad}.ts` o `use-{entidad}-{accion}.ts`
- Utils: `{accion}-{entidad}.ts`
- Query keys: `['entidad', filtros]` ej: `['viajes-ejecutados', quincenaId]`

## Testing

Tests unitarios en `__tests__/unit/utils/`:
- `calcular-liquidacion.test.ts` (18 tests)
- `generar-viajes.test.ts` (12 tests)
- `exportar-pagos.test.ts` (11 tests)
- `sincronizar-seguimiento.test.ts` (2 tests)

**Total: 43 tests** ✅

## Utilidades Centralizadas

```typescript
// Formatters
import { formatFecha, formatCOP } from '@/lib/utils/formatters'
formatFecha('2025-01-15')  // "15 ene 2025"
formatCOP(150000)          // "$150.000"

// Toast Messages
import { toastMessages } from '@/lib/utils/toast-messages'
toast.success(toastMessages.success.guardado)

// Loading States
import { LoadingState, LoadingTable } from '@/components/ui/loading-state'
```

## Mejoras Recientes (Enero 2025)

- Refactoring: dividir hooks grandes, extraer utils testeables
- Testing: Vitest desde cero, 43 tests unitarios
- Estandarización: loading states, formatters, toast messages
- Reducción código: ~33% en hooks principales
