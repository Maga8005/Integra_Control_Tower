/**
 * Utilidades para generación de fechas realistas en timeline
 * Simula fechas coherentes para las 5 fases del proceso Integra
 * Integra Control Tower MVP
 */

import { EstadoProceso } from '../types/Operation';
import { PhaseProgress } from '../services/ProgressCalculator';
import type { GiroInfo, Liberacion } from '../types/Operation';

export interface DateRange {
  start: Date;
  end: Date;
  estimated: Date;
  actual?: Date;
}

export interface PhaseDateConfig {
  name: string;
  baseDelayDays: number; // Días base entre fases
  variationDays: number; // Variación posible ±días
  businessDaysOnly: boolean;
  dependencies: number[]; // Fases que deben completarse antes
}

// Configuración realista de duraciones por fase
const PHASE_DATE_CONFIGS: PhaseDateConfig[] = [
  {
    name: 'Solicitud Enviada',
    baseDelayDays: 0, // Punto de partida
    variationDays: 2,
    businessDaysOnly: true,
    dependencies: []
  },
  {
    name: 'Documentos de Operación y Pago Cuota Operacional',
    baseDelayDays: 5, // 5 días después de cotización
    variationDays: 3,
    businessDaysOnly: true,
    dependencies: [0]
  },
  {
    name: 'Procesamiento de Pago',
    baseDelayDays: 12, // 12 días después de documentos
    variationDays: 5,
    businessDaysOnly: true,
    dependencies: [1]
  },
  {
    name: 'Envío y Logística',
    baseDelayDays: 8, // 8 días después de pagos
    variationDays: 4,
    businessDaysOnly: true,
    dependencies: [2]
  },
  {
    name: 'Operación Completada',
    baseDelayDays: 15, // 15 días después de envío
    variationDays: 7,
    businessDaysOnly: false, // Puede completarse cualquier día
    dependencies: [3]
  }
];

/**
 * Genera fechas realistas para todas las fases basado en progreso actual
 */
export function generateRealisticDates(
  phaseDetails: PhaseProgress[],
  baseDate: Date = new Date()
): DateRange[] {
  console.log('📅 Generando fechas realistas para timeline...');

  const dateRanges: DateRange[] = [];
  let currentDate = new Date(baseDate);

  // Ajustar fecha base si es fin de semana
  currentDate = adjustToBusinessDay(currentDate, true);

  for (let i = 0; i < phaseDetails.length; i++) {
    const phase = phaseDetails[i];
    const config = PHASE_DATE_CONFIGS[i];
    
    if (!config) continue;

    const dateRange = generatePhaseDate(phase, config, currentDate, dateRanges);
    dateRanges.push(dateRange);

    // Actualizar fecha actual para la siguiente fase
    if (phase.estado === EstadoProceso.COMPLETADO && dateRange.actual) {
      currentDate = new Date(dateRange.actual);
    } else if (phase.estado === EstadoProceso.EN_PROCESO) {
      // Si está en proceso, usar la fecha estimada como base
      currentDate = new Date(dateRange.estimated);
    } else {
      // Si está pendiente, usar fecha estimada
      currentDate = new Date(dateRange.estimated);
    }
  }

  console.log(`✅ Fechas generadas para ${dateRanges.length} fases`);
  return dateRanges;
}

/**
 * Genera fechas para una fase específica
 */
function generatePhaseDate(
  phase: PhaseProgress,
  config: PhaseDateConfig,
  baseDate: Date,
  previousDateRanges: DateRange[]
): DateRange {
  const startDate = calculatePhaseStartDate(config, baseDate, previousDateRanges);
  const estimatedDate = calculateEstimatedDate(startDate, config, phase);
  const endDate = calculatePhaseEndDate(estimatedDate, config);
  const actualDate = calculateActualDate(phase, estimatedDate, config);

  console.log(`📆 Fase "${config.name}": ${formatDateRange(startDate, estimatedDate, actualDate)}`);

  return {
    start: startDate,
    end: endDate,
    estimated: estimatedDate,
    actual: actualDate
  };
}

/**
 * Calcula la fecha de inicio de una fase basado en dependencias
 */
function calculatePhaseStartDate(
  config: PhaseDateConfig,
  baseDate: Date,
  previousDateRanges: DateRange[]
): Date {
  if (config.dependencies.length === 0) {
    return new Date(baseDate);
  }

  // Encontrar la fecha más tardía de las dependencias
  let latestDependencyDate = new Date(baseDate);
  
  config.dependencies.forEach(depIndex => {
    if (previousDateRanges[depIndex]) {
      const depRange = previousDateRanges[depIndex];
      const depCompletionDate = depRange.actual || depRange.estimated;
      
      if (depCompletionDate > latestDependencyDate) {
        latestDependencyDate = new Date(depCompletionDate);
      }
    }
  });

  return latestDependencyDate;
}

/**
 * Calcula la fecha estimada de una fase
 */
function calculateEstimatedDate(
  startDate: Date,
  config: PhaseDateConfig,
  phase: PhaseProgress
): Date {
  let estimatedDate = new Date(startDate);
  
  // Aplicar el delay base
  estimatedDate = addBusinessDays(estimatedDate, config.baseDelayDays, config.businessDaysOnly);

  // Aplicar variación basada en el progreso actual
  const progressFactor = phase.progress / 100;
  const variationDays = Math.round(config.variationDays * (1 - progressFactor));
  
  if (variationDays > 0) {
    estimatedDate = addBusinessDays(estimatedDate, variationDays, config.businessDaysOnly);
  }

  // Si la fase está completada, la fecha estimada no debe ser futura
  if (phase.estado === EstadoProceso.COMPLETADO) {
    const now = new Date();
    if (estimatedDate > now) {
      estimatedDate = adjustToBusinessDay(now, false);
    }
  }

  return estimatedDate;
}

/**
 * Calcula la fecha de fin de una fase (fecha límite)
 */
function calculatePhaseEndDate(estimatedDate: Date, config: PhaseDateConfig): Date {
  const bufferDays = Math.ceil(config.variationDays * 1.5); // Buffer adicional
  return addBusinessDays(estimatedDate, bufferDays, config.businessDaysOnly);
}

/**
 * Calcula la fecha actual/real si la fase está completada o en proceso
 */
function calculateActualDate(
  phase: PhaseProgress,
  estimatedDate: Date,
  config: PhaseDateConfig
): Date | undefined {
  if (phase.estado === EstadoProceso.COMPLETADO) {
    // Para fases completadas, generar fecha realista en el pasado
    const daysBack = Math.floor(Math.random() * config.variationDays) + 1;
    let actualDate = subtractBusinessDays(estimatedDate, daysBack, config.businessDaysOnly);
    
    // Asegurar que no sea futura
    const now = new Date();
    if (actualDate > now) {
      actualDate = adjustToBusinessDay(now, false);
    }
    
    return actualDate;
  }

  if (phase.estado === EstadoProceso.EN_PROCESO && phase.progress > 50) {
    // Para fases muy avanzadas, generar fecha de inicio realista
    const progressFactor = (phase.progress - 50) / 50; // 0 a 1 para progreso 50-100%
    const daysIntoPhase = Math.floor(config.baseDelayDays * progressFactor);
    
    return addBusinessDays(estimatedDate, -daysIntoPhase, config.businessDaysOnly);
  }

  return undefined; // No hay fecha actual para fases pendientes o poco avanzadas
}

/**
 * Agrega días hábiles a una fecha
 */
function addBusinessDays(date: Date, days: number, businessDaysOnly: boolean = true): Date {
  if (!businessDaysOnly) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  let result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    
    // Saltar fines de semana (0 = Domingo, 6 = Sábado)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }

  return result;
}

/**
 * Resta días hábiles a una fecha
 */
function subtractBusinessDays(date: Date, days: number, businessDaysOnly: boolean = true): Date {
  if (!businessDaysOnly) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  let result = new Date(date);
  let subtractedDays = 0;

  while (subtractedDays < days) {
    result.setDate(result.getDate() - 1);
    
    // Saltar fines de semana
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      subtractedDays++;
    }
  }

  return result;
}

/**
 * Ajusta una fecha al día hábil más cercano
 */
function adjustToBusinessDay(date: Date, forward: boolean = true): Date {
  const result = new Date(date);
  
  while (result.getDay() === 0 || result.getDay() === 6) {
    if (forward) {
      result.setDate(result.getDate() + 1);
    } else {
      result.setDate(result.getDate() - 1);
    }
  }
  
  return result;
}

/**
 * Verifica si una fecha es día hábil
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // No es domingo ni sábado
}

/**
 * Calcula días hábiles entre dos fechas
 */
export function calculateBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  let current = new Date(startDate);
  
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Genera fechas festivas colombianas (simplificado)
 */
export function getColombianHolidays(year: number): Date[] {
  // Lista simplificada de festivos fijos en Colombia
  return [
    new Date(year, 0, 1),   // Año Nuevo
    new Date(year, 4, 1),   // Día del Trabajo
    new Date(year, 6, 20),  // Independencia
    new Date(year, 7, 7),   // Batalla de Boyacá
    new Date(year, 11, 8),  // Inmaculada Concepción
    new Date(year, 11, 25), // Navidad
  ];
}

/**
 * Verifica si una fecha es festivo en Colombia
 */
export function isColombianHoliday(date: Date): boolean {
  const holidays = getColombianHolidays(date.getFullYear());
  return holidays.some(holiday => 
    holiday.getDate() === date.getDate() && 
    holiday.getMonth() === date.getMonth()
  );
}

/**
 * Ajusta una fecha evitando fines de semana y festivos
 */
export function adjustToWorkingDay(date: Date, forward: boolean = true): Date {
  let result = new Date(date);
  
  while (!isBusinessDay(result) || isColombianHoliday(result)) {
    if (forward) {
      result.setDate(result.getDate() + 1);
    } else {
      result.setDate(result.getDate() - 1);
    }
  }
  
  return result;
}

/**
 * Formatea un rango de fechas para logging
 */
function formatDateRange(start: Date, estimated: Date, actual?: Date): string {
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  let range = `${formatDate(start)} → ${formatDate(estimated)}`;
  if (actual) {
    range += ` (actual: ${formatDate(actual)})`;
  }
  
  return range;
}

/**
 * Calcula duración realista de una fase basada en su progreso
 */
export function calculatePhaseDuration(
  phase: PhaseProgress,
  config: PhaseDateConfig
): { estimatedDays: number; actualDays?: number } {
  const baseDuration = config.baseDelayDays;
  const progressFactor = phase.progress / 100;
  
  // Duración estimada basada en progreso
  const estimatedDays = Math.ceil(baseDuration * (1 - progressFactor * 0.3)); // 30% reducción máxima
  
  let actualDays: number | undefined;
  
  if (phase.estado === EstadoProceso.COMPLETADO) {
    // Fases completadas tienen duración real
    actualDays = Math.max(1, baseDuration - Math.floor(Math.random() * config.variationDays));
  } else if (phase.estado === EstadoProceso.EN_PROCESO && phase.progress > 70) {
    // Fases muy avanzadas tienen duración parcial estimada
    actualDays = Math.ceil(baseDuration * progressFactor);
  }
  
  return { estimatedDays, actualDays };
}

/**
 * Genera reporte de timeline con fechas
 */
export function generateDateReport(
  phaseDetails: PhaseProgress[],
  dateRanges: DateRange[]
): string {
  let report = '\n📅 REPORTE DE FECHAS DEL TIMELINE\n';
  report += '=============================================\n\n';

  phaseDetails.forEach((phase, index) => {
    const dateRange = dateRanges[index];
    if (!dateRange) return;

    const statusIcon = phase.estado === EstadoProceso.COMPLETADO ? '✅' : 
                      phase.estado === EstadoProceso.EN_PROCESO ? '🔄' : '⏳';

    report += `${statusIcon} FASE ${index + 1}: ${phase.name}\n`;
    report += `   Estado: ${phase.estado} (${phase.progress}%)\n`;
    report += `   Inicio: ${dateRange.start.toISOString().split('T')[0]}\n`;
    report += `   Estimado: ${dateRange.estimated.toISOString().split('T')[0]}\n`;
    
    if (dateRange.actual) {
      report += `   Actual: ${dateRange.actual.toISOString().split('T')[0]}\n`;
    }
    
    report += `   Límite: ${dateRange.end.toISOString().split('T')[0]}\n`;
    
    if (dateRange.actual && dateRange.estimated) {
      const diff = Math.floor((dateRange.actual.getTime() - dateRange.estimated.getTime()) / (1000 * 60 * 60 * 24));
      report += `   Variación: ${diff > 0 ? '+' : ''}${diff} días\n`;
    }
    
    report += '\n';
  });

  report += '=============================================\n';
  return report;
}

/**
 * Calcula fecha de vencimiento para giros cuando no está disponible
 * Basado en términos de pago estándar (30-90 días)
 */
export function calculateGiroVencimiento(
  giro: GiroInfo,
  fechaBase: Date = new Date(),
  terminosPago: string = '30 días'
): string | null {
  try {
    // Si ya tiene fecha de vencimiento, usarla
    if (giro.fechaVencimiento) {
      return giro.fechaVencimiento;
    }

    // Extraer días de los términos de pago
    const diasMatch = terminosPago.match(/(\d+)\s*d[ií]as?/i);
    let diasVencimiento = 30; // Default 30 días
    
    if (diasMatch) {
      diasVencimiento = parseInt(diasMatch[1]);
    } else if (terminosPago.toLowerCase().includes('60')) {
      diasVencimiento = 60;
    } else if (terminosPago.toLowerCase().includes('90')) {
      diasVencimiento = 90;
    }

    // Calcular fecha de vencimiento
    const fechaVencimiento = addBusinessDays(fechaBase, diasVencimiento, true);
    return fechaVencimiento.toISOString().split('T')[0];
    
  } catch (error) {
    console.warn('Error calculando fecha de vencimiento para giro:', error);
    return null;
  }
}

/**
 * Calcula fecha de vencimiento para liberaciones cuando no está disponible
 * Basado en la fecha de la liberación + buffer estándar
 */
export function calculateLiberacionVencimiento(
  liberacion: Liberacion,
  bufferDias: number = 15
): string | null {
  try {
    // Si ya tiene fecha de vencimiento, usarla
    if (liberacion.fechaVencimiento) {
      return liberacion.fechaVencimiento;
    }

    // Usar fecha de liberación como base
    const fechaBase = new Date(liberacion.fecha);
    
    // Añadir buffer de días
    const fechaVencimiento = addBusinessDays(fechaBase, bufferDias, true);
    return fechaVencimiento.toISOString().split('T')[0];
    
  } catch (error) {
    console.warn('Error calculando fecha de vencimiento para liberación:', error);
    return null;
  }
}

/**
 * Calcula todas las fechas de vencimiento faltantes en una operación
 */
export function calculateMissingVencimientos(
  giros: GiroInfo[],
  liberaciones: Liberacion[],
  terminosPago: string = '30 días',
  fechaBase: Date = new Date()
): {
  girosConVencimiento: GiroInfo[];
  liberacionesConVencimiento: Liberacion[];
} {
  console.log('📅 Calculando fechas de vencimiento faltantes...');
  
  // Procesar giros
  const girosConVencimiento = giros.map(giro => ({
    ...giro,
    fechaVencimiento: giro.fechaVencimiento || calculateGiroVencimiento(giro, fechaBase, terminosPago)
  }));
  
  // Procesar liberaciones
  const liberacionesConVencimiento = liberaciones.map(liberacion => ({
    ...liberacion,
    fechaVencimiento: liberacion.fechaVencimiento || calculateLiberacionVencimiento(liberacion)
  }));
  
  console.log(`✅ Procesados ${girosConVencimiento.length} giros y ${liberacionesConVencimiento.length} liberaciones`);
  
  return {
    girosConVencimiento,
    liberacionesConVencimiento
  };
}

/**
 * Verifica si una fecha de vencimiento está próxima (dentro de N días)
 */
export function isVencimientoProximo(
  fechaVencimiento: string | null | undefined,
  diasAlerta: number = 7
): boolean {
  if (!fechaVencimiento) return false;
  
  try {
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    const diferenciaDias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    
    return diferenciaDias <= diasAlerta && diferenciaDias >= 0;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica si una fecha de vencimiento ya pasó
 */
export function isVencimientoVencido(
  fechaVencimiento: string | null | undefined
): boolean {
  if (!fechaVencimiento) return false;
  
  try {
    const vencimiento = new Date(fechaVencimiento);
    const hoy = new Date();
    
    return vencimiento < hoy;
  } catch (error) {
    return false;
  }
}