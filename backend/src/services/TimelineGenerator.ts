/**
 * Generador de timeline de 5 fases exactas para operaciones Integra
 * Mapea los estados CSV a un timeline visual coherente
 * Integra Control Tower MVP
 */

import { TimelineEvent, EstadoProceso } from '../types/Operation';
import { CSVRow } from './CSVProcessor';
import { ParsedOperationInfo } from './OperationInfoParser';
import { mapEstados, calculatePaymentProgress, validateLiberations } from './StateMapper';

export interface TimelinePhase {
  name: string;
  description: string;
  icon: string;
  dependencies: string[];
}

// Definición exacta de las 5 fases del timeline
const TIMELINE_PHASES: TimelinePhase[] = [
  {
    name: 'Solicitud Enviada',
    description: 'Cotización aprobada y firmada',
    icon: '📋',
    dependencies: []
  },
  {
    name: 'Documentos de Operación y Pago Cuota Operacional',
    description: 'Documentación procesada y cuota operacional pagada',
    icon: '📄',
    dependencies: ['Solicitud Enviada']
  },
  {
    name: 'Procesamiento de Pago',
    description: 'Giros procesados y pagos confirmados',
    icon: '💰',
    dependencies: ['Documentos de Operación y Pago Cuota Operacional']
  },
  {
    name: 'Envío y Logística',
    description: 'Factura final y preparación de envío',
    icon: '🚚',
    dependencies: ['Procesamiento de Pago']
  },
  {
    name: 'Operación Completada',
    description: 'Liberaciones completas y operación finalizada',
    icon: '✅',
    dependencies: ['Envío y Logística']
  }
];

/**
 * Genera timeline de 5 fases basado en datos CSV y información parseada
 */
export function generateTimeline(csvRow: CSVRow, parsedInfo: ParsedOperationInfo): TimelineEvent[] {
  console.log('⏱️ Generando timeline de 5 fases...');

  const timeline: TimelineEvent[] = [];
  const estados = mapEstados(csvRow);
  const paymentProgress = calculatePaymentProgress(parsedInfo);
  const liberationValidation = validateLiberations(parsedInfo);

  // Generar cada fase del timeline
  for (let i = 0; i < TIMELINE_PHASES.length; i++) {
    const phase = TIMELINE_PHASES[i];
    const event = generateTimelineEvent(phase, i, csvRow, parsedInfo, estados, paymentProgress, liberationValidation);
    timeline.push(event);
  }

  console.log(`✅ Timeline generado: ${timeline.length} fases`);
  return timeline;
}

/**
 * Genera un evento individual del timeline
 */
function generateTimelineEvent(
  phase: TimelinePhase,
  index: number,
  csvRow: CSVRow,
  parsedInfo: ParsedOperationInfo,
  estados: any,
  paymentProgress: any,
  liberationValidation: any
): TimelineEvent {
  
  const eventId = `phase-${index + 1}`;
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - (30 - (index * 6))); // Espaciar fechas

  let estado: EstadoProceso;
  let progreso: number;
  let descripcion: string;
  let responsable: string;
  let notas: string | undefined;

  // Aplicar lógica específica para cada fase
  switch (index) {
    case 0: // Solicitud Enviada
      ({ estado, progreso, descripcion, notas } = generatePhase1Logic(csvRow, estados));
      break;
    
    case 1: // Documentos de Operación y Pago Cuota Operacional
      ({ estado, progreso, descripcion, notas } = generatePhase2Logic(csvRow, estados));
      break;
    
    case 2: // Procesamiento de Pago
      ({ estado, progreso, descripcion, notas } = generatePhase3Logic(csvRow, estados, paymentProgress));
      break;
    
    case 3: // Envío y Logística
      ({ estado, progreso, descripcion, notas } = generatePhase4Logic(csvRow, estados, parsedInfo));
      break;
    
    case 4: // Operación Completada
      ({ estado, progreso, descripcion, notas } = generatePhase5Logic(csvRow, estados, liberationValidation, parsedInfo));
      break;
    
    default:
      estado = EstadoProceso.PENDIENTE;
      progreso = 0;
      descripcion = phase.description;
  }

  // Determinar responsable (campo opcional)
  responsable = csvRow['15. Equipo Comercial'] || 
               csvRow['Persona asignada'] || 
               'Sin asignar';

  const event: TimelineEvent = {
    id: eventId,
    fase: phase.name,
    descripcion,
    estado,
    progreso,
    responsable,
    fecha: baseDate.toISOString(),
    notas
  };

  console.log(`${phase.icon} Fase ${index + 1}: ${phase.name} - ${estado} (${progreso}%)`);
  
  return event;
}

/**
 * FASE 1: Solicitud Enviada
 * Condición: Proceso === "1. Aprobación de Cotización" OR "1. ESTADO Firma Cotización" === "Listo"
 */
function generatePhase1Logic(csvRow: CSVRow, estados: any): {
  estado: EstadoProceso;
  progreso: number;
  descripcion: string;
  notas?: string;
} {
  const proceso = csvRow['Proceso'] || '';
  const estadoFirma = csvRow['1. ESTADO Firma Cotización'] || '';

  console.log(`📋 Fase 1 - Proceso: "${proceso}", Estado Firma: "${estadoFirma}"`);

  // Condición 1: Proceso contiene "1. Aprobación de Cotización"
  if (proceso.includes('1. Aprobación de Cotización')) {
    return {
      estado: EstadoProceso.COMPLETADO,
      progreso: 100,
      descripcion: 'Cotización aprobada mediante proceso formal',
      notas: `Proceso registrado: ${proceso}`
    };
  }

  // Condición 2: Estado firma cotización = "Listo"
  if (estadoFirma.toLowerCase().includes('listo')) {
    return {
      estado: EstadoProceso.COMPLETADO,
      progreso: 100,
      descripcion: 'Cotización firmada y confirmada',
      notas: `Estado de firma: ${estadoFirma}`
    };
  }

  // Estados intermedios
  if (proceso.trim() || estadoFirma.trim()) {
    return {
      estado: EstadoProceso.EN_PROCESO,
      progreso: 60,
      descripcion: 'Cotización en proceso de aprobación',
      notas: `Proceso: ${proceso || 'N/A'}, Firma: ${estadoFirma || 'N/A'}`
    };
  }

  return {
    estado: EstadoProceso.PENDIENTE,
    progreso: 0,
    descripción: 'Esperando aprobación de cotización'
  };
}

/**
 * FASE 2: Documentos de Operación y Pago Cuota Operacional
 * Condición: "4. ESTADO pago Cuota Operacional" === "Listo"
 */
function generatePhase2Logic(csvRow: CSVRow, estados: any): {
  estado: EstadoProceso;
  progreso: number;
  descripcion: string;
  notas?: string;
} {
  const estadoCuota = csvRow['4. ESTADO pago Cuota Operacional'] || '';

  console.log(`📄 Fase 2 - Estado Cuota: "${estadoCuota}"`);

  if (estadoCuota.toLowerCase().includes('listo')) {
    return {
      estado: EstadoProceso.COMPLETADO,
      progreso: 100,
      descripcion: 'Documentos procesados y cuota operacional pagada',
      notas: `Cuota operacional: ${estadoCuota}`
    };
  }

  // Estados intermedios
  if (estadoCuota.toLowerCase().includes('proceso') || 
      estadoCuota.toLowerCase().includes('revision')) {
    return {
      estado: EstadoProceso.EN_PROCESO,
      progreso: 70,
      descripcion: 'Procesamiento de documentos y cuota en curso',
      notas: `Estado actual: ${estadoCuota}`
    };
  }

  // Si la fase anterior está completa pero esta no
  if (estados.cotizacion === EstadoProceso.COMPLETADO) {
    return {
      estado: EstadoProceso.EN_PROCESO,
      progreso: 30,
      descripcion: 'Iniciando procesamiento de documentos',
      notas: 'Cotización aprobada, documentos en preparación'
    };
  }

  return {
    estado: EstadoProceso.PENDIENTE,
    progreso: 0,
    descripcion: 'Esperando completar cotización para procesar documentos'
  };
}

/**
 * FASE 3: Procesamiento de Pago
 * Condición Compleja: Calcular progreso de giros y verificar confirmación
 */
function generatePhase3Logic(csvRow: CSVRow, estados: any, paymentProgress: any): {
  estado: EstadoProceso;
  progreso: number;
  descripcion: string;
  notas?: string;
} {
  const estadoGiro = csvRow['10. ESTADO Giro Proveedor'] || '';
  const progressPercent = paymentProgress.progress;
  const { totalValue, paidValue, pendingValue } = paymentProgress;

  console.log(`💰 Fase 3 - Procesamiento de Pago: ${progressPercent}% (${paidValue}/${totalValue})`);

  // NUEVA LÓGICA: Completado cuando la suma de valores solicitados es igual o cercana al valor total
  if (progressPercent >= 95) { // Permitir tolerancia del 5% para diferencias menores
    return {
      estado: EstadoProceso.COMPLETADO,
      progreso: 100,
      descripcion: `Pagos completados: $${paidValue.toLocaleString()}`,
      notas: `Total: $${totalValue.toLocaleString()}, Pagado: $${paidValue.toLocaleString()}`
    };
  }

  // En proceso cuando existen valores solicitados (giros) pero no cubren el total
  if (paidValue > 0) {
    return {
      estado: EstadoProceso.EN_PROCESO,
      progreso: Math.round(progressPercent), 
      descripcion: `Procesando pagos: ${progressPercent}% completado`,
      notas: `Pagado: $${paidValue.toLocaleString()}, Pendiente: $${pendingValue.toLocaleString()}`
    };
  }

  // Si hay información de valor total pero no hay valores solicitados aún
  if (totalValue > 0) {
    return {
      estado: EstadoProceso.PENDIENTE,
      progreso: 0,
      descripcion: 'Esperando valores solicitados para giros',
      notas: `Total de operación: $${totalValue.toLocaleString()}`
    };
  }

  // Si no hay información de valores
  return {
    estado: EstadoProceso.PENDIENTE,
    progreso: 0,
    descripcion: 'Información de pagos no disponible',
    notas: 'No se pudo extraer valor total de la operación'
  };
}

/**
 * FASE 4: Envío y Logística
 * LÓGICA: INICIA cuando factura final está "Listo", COMPLETA cuando liberaciones ≈ valor total
 */
function generatePhase4Logic(csvRow: CSVRow, estados: any, parsedInfo: ParsedOperationInfo): {
  estado: EstadoProceso;
  progreso: number;
  descripcion: string;
  notas?: string;
} {
  const estadoFactura = csvRow['9. ESTADO Proforma / Factura final'] || '';
  const valorTotal = parsedInfo.valorTotalCompra || 0;
  const liberaciones = parsedInfo.liberaciones || [];
  const totalLiberado = liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
  const estadoFacturaLower = estadoFactura.toLowerCase();

  console.log(`🚚 Fase 4 - Envío y Logística: Factura="${estadoFactura}", Liberaciones=${liberaciones.length}, $${totalLiberado.toLocaleString()}/${valorTotal.toLocaleString()}`);

  // PRIMERO: Verificar si la factura final está lista (condición para INICIAR)
  const facturaFinalLista = estadoFacturaLower.includes('listo');
  
  if (!facturaFinalLista) {
    // Sin factura final lista = PENDIENTE
    return {
      estado: EstadoProceso.PENDIENTE,
      progreso: 0,
      descripcion: 'Esperando factura final para iniciar envío',
      notas: `Estado factura: ${estadoFactura || 'Sin información'}`
    };
  }

  // SEGUNDO: Factura lista, ahora verificar liberaciones para COMPLETAR
  if (valorTotal > 0 && liberaciones.length > 0) {
    const porcentajeLiberado = (totalLiberado / valorTotal) * 100;
    
    // COMPLETADO: Liberaciones cubren 98% o más del valor total
    if (porcentajeLiberado >= 98) {
      return {
        estado: EstadoProceso.COMPLETADO,
        progreso: 100,
        descripcion: `Envío completado - Liberaciones: $${totalLiberado.toLocaleString()}`,
        notas: `Factura: Lista | Total: $${valorTotal.toLocaleString()}, Liberado: $${totalLiberado.toLocaleString()} (${liberaciones.length} liberación(es))`
      };
    }
    
    // EN PROCESO: Factura lista + liberaciones parciales
    if (totalLiberado > 0) {
      return {
        estado: EstadoProceso.EN_PROCESO,
        progreso: Math.max(50, Math.round(porcentajeLiberado)), // Mínimo 50% porque factura está lista
        descripcion: `Envío en proceso - Liberaciones: ${Math.round(porcentajeLiberado)}% completadas`,
        notas: `Factura: Lista | Liberado: $${totalLiberado.toLocaleString()}/${valorTotal.toLocaleString()} (${liberaciones.length} liberación(es))`
      };
    }
  } else if (liberaciones.length > 0) {
    // Factura lista + liberaciones sin valor total conocido
    return {
      estado: EstadoProceso.EN_PROCESO,
      progreso: 70,
      descripcion: 'Envío en proceso - Verificando completitud de liberaciones',
      notas: `Factura: Lista | ${liberaciones.length} liberación(es) por $${totalLiberado.toLocaleString()}`
    };
  }

  // Factura lista pero SIN liberaciones aún
  return {
    estado: EstadoProceso.EN_PROCESO,
    progreso: 50,
    descripcion: 'Factura final lista - Esperando liberaciones',
    notas: `Factura: ${estadoFactura} | ${valorTotal > 0 ? `Valor total: $${valorTotal.toLocaleString()} - ` : ''}Sin liberaciones aún`
  };
}

/**
 * FASE 5: Operación Completada
 * NUEVA LÓGICA: Completada SOLO cuando las 4 fases anteriores estén COMPLETADAS
 */
function generatePhase5Logic(csvRow: CSVRow, estados: any, liberationValidation: any, parsedInfo: ParsedOperationInfo): {
  estado: EstadoProceso;
  progreso: number;
  descripcion: string;
  notas?: string;
} {
  console.log(`✅ Fase 5 - Operación Completada: Verificando fases anteriores`);

  // Generar los estados de las 4 fases anteriores para verificar
  const fase1 = generatePhase1Logic(csvRow, estados);
  const fase2 = generatePhase2Logic(csvRow, estados);
  const fase3 = generatePhase3Logic(csvRow, estados, calculatePaymentProgress(parsedInfo));
  const fase4 = generatePhase4Logic(csvRow, estados, parsedInfo);
  
  const fasesAnteriores = [fase1, fase2, fase3, fase4];
  const fasesCompletadas = fasesAnteriores.filter(fase => fase.estado === EstadoProceso.COMPLETADO);
  const fasesEnProceso = fasesAnteriores.filter(fase => fase.estado === EstadoProceso.EN_PROCESO);
  
  console.log(`📊 Estado de fases: ${fasesCompletadas.length}/4 completadas, ${fasesEnProceso.length} en proceso`);

  // COMPLETADO: Todas las 4 fases anteriores están completadas
  if (fasesCompletadas.length === 4) {
    return {
      estado: EstadoProceso.COMPLETADO,
      progreso: 100,
      descripcion: 'Operación completada exitosamente',
      notas: 'Todas las fases completadas: Solicitud, Documentos, Pagos y Envío'
    };
  }

  // EN PROCESO: Al menos algunas fases completadas o en proceso
  if (fasesCompletadas.length > 0 || fasesEnProceso.length > 0) {
    // Calcular progreso basado en las fases completadas
    const progresoBase = Math.round((fasesCompletadas.length / 4) * 100);
    
    // Añadir progreso parcial de fases en proceso
    let progresoAdicional = 0;
    fasesEnProceso.forEach(fase => {
      progresoAdicional += (fase.progreso || 0) * 0.25 / 100; // 25% de peso por fase
    });
    
    const progresoTotal = Math.min(95, Math.round(progresoBase + progresoAdicional));
    
    return {
      estado: EstadoProceso.EN_PROCESO,
      progreso: progresoTotal,
      descripcion: `Operación en progreso: ${fasesCompletadas.length}/4 fases completadas`,
      notas: `Completadas: ${fasesCompletadas.length} | En proceso: ${fasesEnProceso.length}`
    };
  }

  // PENDIENTE: Ninguna fase completada aún
  return {
    estado: EstadoProceso.PENDIENTE,
    progreso: 0,
    descripcion: 'Esperando completar las fases anteriores',
    notas: 'Pendiente: Solicitud, Documentos, Pagos y Envío'
  };
}

/**
 * Calcula el progreso general basado en el timeline
 */
export function calculateOverallProgress(timeline: TimelineEvent[]): number {
  if (!timeline || timeline.length === 0) return 0;

  const totalPhases = timeline.length;
  let weightedProgress = 0;

  // Pesos por fase (las últimas fases tienen más peso)
  const phaseWeights = [15, 20, 25, 25, 15]; // Suma = 100

  timeline.forEach((event, index) => {
    const weight = phaseWeights[index] || 20;
    const phaseProgress = event.progreso || 0;
    weightedProgress += (phaseProgress * weight) / 100;
  });

  const overallProgress = Math.round(weightedProgress);
  console.log(`📊 Progreso general calculado: ${overallProgress}%`);
  
  return overallProgress;
}

/**
 * Obtiene un resumen del estado del timeline
 */
export function getTimelineSummary(timeline: TimelineEvent[]): {
  completedPhases: number;
  inProgressPhases: number;
  pendingPhases: number;
  currentPhase: string | null;
  nextPhase: string | null;
  overallProgress: number;
} {
  let completedPhases = 0;
  let inProgressPhases = 0;
  let pendingPhases = 0;
  let currentPhase: string | null = null;
  let nextPhase: string | null = null;

  timeline.forEach((event, index) => {
    switch (event.estado) {
      case EstadoProceso.COMPLETADO:
        completedPhases++;
        break;
      case EstadoProceso.EN_PROCESO:
        inProgressPhases++;
        if (!currentPhase) currentPhase = event.fase;
        break;
      case EstadoProceso.PENDIENTE:
        pendingPhases++;
        if (!nextPhase && !currentPhase) nextPhase = event.fase;
        break;
    }
  });

  return {
    completedPhases,
    inProgressPhases,
    pendingPhases,
    currentPhase,
    nextPhase,
    overallProgress: calculateOverallProgress(timeline)
  };
}

/**
 * Valida que el timeline sea coherente (las fases sigan un orden lógico)
 */
export function validateTimelineCoherence(timeline: TimelineEvent[]): {
  isCoherent: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (let i = 1; i < timeline.length; i++) {
    const currentEvent = timeline[i];
    const previousEvent = timeline[i - 1];

    // Una fase no puede estar completada si la anterior está pendiente
    if (currentEvent.estado === EstadoProceso.COMPLETADO && 
        previousEvent.estado === EstadoProceso.PENDIENTE) {
      issues.push(`Fase "${currentEvent.fase}" está completa pero "${previousEvent.fase}" está pendiente`);
    }

    // Una fase no puede tener más progreso que la anterior si la anterior no está completa
    if (previousEvent.estado !== EstadoProceso.COMPLETADO && 
        (currentEvent.progreso || 0) > (previousEvent.progreso || 0)) {
      issues.push(`Fase "${currentEvent.fase}" tiene más progreso que "${previousEvent.fase}"`);
    }
  }

  return {
    isCoherent: issues.length === 0,
    issues
  };
}