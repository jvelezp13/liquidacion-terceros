# CLAUDE.md - Liquidación Terceros

## Descripción del Proyecto

Sistema de liquidación quincenal para vehículos de terceros (fleteros). Comparte la base de datos Supabase con Planeación Logi.

## Stack Tecnológico

- **Frontend/Backend**: Next.js 16 (App Router) + TypeScript
- **Base de Datos**: Supabase (PostgreSQL compartida con PlaneacionLogi)
- **UI**: shadcn/ui + Tailwind CSS v4
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod

## Comandos de Desarrollo

```bash
npm run dev          # Servidor desarrollo (localhost:3000)
npm run build        # Build producción
npm run lint         # ESLint
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/              # Login
│   │   └── login/
│   └── (dashboard)/         # Rutas protegidas
│       ├── contratistas/    # CRUD contratistas
│       ├── vehiculos/       # Vehículos terceros
│       ├── quincenas/       # Períodos de liquidación
│       ├── validacion/      # Validación de rutas
│       ├── liquidacion/     # Generar liquidaciones
│       ├── pagos/           # Registrar pagos
│       │   └── exportar/    # Exportar para Payana
│       └── historial/       # Historial de liquidaciones
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── layout/              # Sidebar, Header
├── lib/
│   ├── hooks/               # Custom hooks
│   ├── supabase/            # Clientes Supabase
│   ├── utils/               # Utilidades
│   └── providers/           # React Query provider
└── types/
    └── database.types.ts    # Tipos de BD
```

## Relación con Planeación Logi

Este proyecto **comparte la base de datos** con Planeación Logi:

### Tablas propias (prefijo `liq_*`):
- `liq_contratistas` - Propietarios de vehículos
- `liq_vehiculos_terceros` - Vínculo vehículo-contratista
- `liq_vehiculo_rutas_programadas` - Rutas por día de semana
- `liq_quincenas` - Períodos de liquidación
- `liq_viajes_ejecutados` - Viajes reales
- `liq_liquidaciones` - Liquidaciones generadas
- `liq_liquidacion_deducciones` - Deducciones aplicadas
- `liq_historial_pagos` - Pagos realizados
- `liq_sincronizacion_ejecucion` - Sync con PlaneacionLogi

### Tablas referenciadas (solo lectura):
- `escenarios` - Escenario activo
- `vehiculos` - Vehículos con esquema='tercero'
- `vehiculos_costos` - Costos por viaje
- `rutas_logisticas` - Rutas planeadas
- `ruta_municipios` - Municipios por ruta
- `lejanias_config` - Configuración de costos
- `matriz_desplazamientos` - Distancias y peajes

## Flujo de Trabajo

1. **Crear Quincena** → Auto-genera rutas desde programación
2. **Validar Rutas** → Marcar ejecutada/no ejecutada/parcial
3. **Generar Liquidación** → Cálculo automático + ajustes
4. **Exportar Payana** → CSV con totales por contratista
5. **Registrar Pago** → Confirmar referencia de pago

## Cálculo de Liquidación

```
Flete base     = costo_por_viaje × viajes_ejecutados
Lejanía+Peajes = suma de costos de rutas (de rutas_logisticas)
Pernocta       = noches × tarifa (de lejanias_config)
Ajustes        = manuales (+/-)
────────────────────────────────────────────────────────
Subtotal       = suma
────────────────────────────────────────────────────────
Deducciones:
  - 1% fijo
  - Anticipos
  - Otros
────────────────────────────────────────────────────────
TOTAL A PAGAR  = Subtotal - Deducciones
```

## Configuración

Copiar credenciales de Supabase desde `PlaneacionLogi/app/.env.local`:
```bash
cp ../PlaneacionLogi/app/.env.local .env.local
```

## Alias de Imports

El alias `@/` apunta a `src/`

## Estados de Quincena

- `borrador` - En proceso de validación
- `validado` - Rutas validadas, listo para liquidar
- `liquidado` - Liquidación generada
- `pagado` - Pagos registrados

## Estados de Viaje

- `pendiente` - Sin validar
- `ejecutado` - Ruta completa
- `parcial` - Ruta parcial
- `no_ejecutado` - No se realizó
- `variacion` - Ruta diferente a la planeada
