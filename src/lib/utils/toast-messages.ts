/**
 * Mensajes estandarizados para toasts
 * Centraliza todos los mensajes de éxito, error y advertencia
 */

export const toastMessages = {
  // Mensajes de éxito
  success: {
    guardado: 'Guardado correctamente',
    eliminado: 'Eliminado correctamente',
    generado: 'Generado correctamente',
    actualizado: 'Actualizado correctamente',
    creado: 'Creado correctamente',
    sincronizado: 'Sincronizado correctamente',
    enviado: 'Enviado correctamente',
    exportado: 'Exportado correctamente',

    // Específicos
    viajesGenerados: 'Viajes generados correctamente',
    liquidacionesGeneradas: 'Liquidaciones generadas correctamente',
    comprobantesGenerados: 'Comprobantes generados correctamente',
    pagoRegistrado: 'Pago registrado correctamente',
  },

  // Mensajes de error
  error: {
    generico: 'Ocurrió un error. Intenta de nuevo.',
    noPermisos: 'No tienes permisos para esta acción',
    noEncontrado: 'No se encontró el recurso',
    formularioInvalido: 'Por favor verifica los datos del formulario',
    cargaDatos: 'Error al cargar los datos',
    guardado: 'Error al guardar',
    eliminado: 'Error al eliminar',

    // Específicos
    viajesSinGenerar: 'No se pudieron generar los viajes',
    liquidacionesSinGenerar: 'No se pudieron generar las liquidaciones',
    sincronizacionFallida: 'Error al sincronizar con seguimiento',
    exportacionFallida: 'Error al exportar datos',
  },

  // Mensajes de advertencia
  warning: {
    datosIncompletos: 'Hay datos incompletos',
    cambiosSinGuardar: 'Tienes cambios sin guardar',
    accionIrreversible: 'Esta acción no se puede deshacer',

    // Específicos
    viajesExistentes: 'Ya existen viajes para esta quincena',
    liquidacionesExistentes: 'Ya existen liquidaciones. Se actualizarán los valores.',
    sinDatosExportar: 'No hay datos para exportar',
  },

  // Mensajes de información
  info: {
    procesando: 'Procesando...',
    cargando: 'Cargando datos...',
    generando: 'Generando...',

    // Específicos
    quincenaCerrada: 'Esta quincena está cerrada y no se puede modificar',
    sincronizarPrimero: 'Debes sincronizar con seguimiento primero',
  },
} as const

// Tipos para autocompletado
export type ToastMessageKey = keyof typeof toastMessages
export type SuccessMessageKey = keyof typeof toastMessages.success
export type ErrorMessageKey = keyof typeof toastMessages.error
export type WarningMessageKey = keyof typeof toastMessages.warning
export type InfoMessageKey = keyof typeof toastMessages.info
