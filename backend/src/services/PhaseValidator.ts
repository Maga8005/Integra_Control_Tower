/**
 * Validador detallado de estados por fase
 * Verifica coherencia y dependencias entre las 5 fases del timeline
 * Integra Control Tower MVP
 */

import { EstadoProceso, TimelineEvent } from '../types/Operation';
import { CSVRow } from './CSVProcessor';
import { ParsedOperationInfo } from './OperationInfoParser';
import { PhaseProgress, OverallProgress } from './ProgressCalculator';

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
  suggestions: string[];
}

export interface ValidationWarning {
  phase: number;
  type: 'dependency' | 'inconsistency' | 'data_quality';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationError {
  phase: number;
  type: 'logical_error' | 'missing_data' | 'invalid_state';
  message: string;
  blocking: boolean;
}

export interface PhaseValidationContext {
  csvRow: CSVRow;
  parsedInfo: ParsedOperationInfo;
  phaseDetails: PhaseProgress[];
  overallProgress: OverallProgress;
}

/**
 * Valida la coherencia completa del timeline de 5 fases
 */
export function validateCompleteTimeline(context: PhaseValidationContext): ValidationResult {
  console.log('🔍 Iniciando validación completa del timeline...');

  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  // Validaciones por fase individual
  for (let phase = 1; phase <= 5; phase++) {
    const phaseValidation = validateIndividualPhase(phase, context);
    warnings.push(...phaseValidation.warnings);
    errors.push(...phaseValidation.errors);
    suggestions.push(...phaseValidation.suggestions);
  }

  // Validaciones de dependencias entre fases
  const dependencyValidation = validatePhaseDependencies(context);
  warnings.push(...dependencyValidation.warnings);
  errors.push(...dependencyValidation.errors);
  suggestions.push(...dependencyValidation.suggestions);

  // Validaciones de coherencia lógica
  const coherenceValidation = validateLogicalCoherence(context);
  warnings.push(...coherenceValidation.warnings);
  errors.push(...coherenceValidation.errors);
  suggestions.push(...coherenceValidation.suggestions);

  // Validaciones de calidad de datos
  const dataQualityValidation = validateDataQuality(context);
  warnings.push(...dataQualityValidation.warnings);
  errors.push(...dataQualityValidation.errors);
  suggestions.push(...dataQualityValidation.suggestions);

  const isValid = errors.filter(e => e.blocking).length === 0;

  console.log(`✅ Validación completa: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
  console.log(`   Warnings: ${warnings.length}, Errors: ${errors.length}`);

  return {
    isValid,
    warnings,
    errors,
    suggestions
  };
}

/**
 * Valida una fase individual del timeline
 */
function validateIndividualPhase(phaseNumber: number, context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const phaseIndex = phaseNumber - 1;
  const phase = context.phaseDetails[phaseIndex];

  if (!phase) {
    errors.push({
      phase: phaseNumber,
      type: 'missing_data',
      message: `Fase ${phaseNumber} no encontrada en los datos`,
      blocking: true
    });
    return { isValid: false, warnings, errors, suggestions };
  }

  switch (phaseNumber) {
    case 1:
      return validatePhase1Details(phase, context);
    case 2:
      return validatePhase2Details(phase, context);
    case 3:
      return validatePhase3Details(phase, context);
    case 4:
      return validatePhase4Details(phase, context);
    case 5:
      return validatePhase5Details(phase, context);
    default:
      errors.push({
        phase: phaseNumber,
        type: 'invalid_state',
        message: `Número de fase inválido: ${phaseNumber}`,
        blocking: true
      });
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * VALIDACIÓN FASE 1: Solicitud Enviada
 */
function validatePhase1Details(phase: PhaseProgress, context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const proceso = context.csvRow['Proceso'] || '';
  const estadoFirma = context.csvRow['1. ESTADO Firma Cotización'] || '';

  // Validar que los campos críticos existan
  if (!proceso && !estadoFirma) {
    errors.push({
      phase: 1,
      type: 'missing_data',
      message: 'Faltan datos críticos: Proceso y Estado Firma Cotización',
      blocking: true
    });
  }

  // Validar coherencia de estado COMPLETADO
  if (phase.estado === EstadoProceso.COMPLETADO) {
    const hasApprovalProcess = proceso.includes('1. Aprobación de Cotización');
    const hasSignatureReady = estadoFirma.toLowerCase().includes('listo');

    if (!hasApprovalProcess && !hasSignatureReady) {
      warnings.push({
        phase: 1,
        type: 'inconsistency',
        message: 'Fase marcada como COMPLETADA pero no cumple condiciones exactas',
        severity: 'high'
      });
      
      suggestions.push('Verificar que el proceso contenga "1. Aprobación de Cotización" o que el estado de firma sea "Listo"');
    }
  }

  // Validar coherencia de progreso
  if (phase.progress === 100 && phase.estado !== EstadoProceso.COMPLETADO) {
    warnings.push({
      phase: 1,
      type: 'inconsistency',
      message: 'Progreso 100% pero estado no es COMPLETADO',
      severity: 'medium'
    });
  }

  // Sugerir mejoras de datos
  if (proceso && !proceso.includes('Aprobación') && !proceso.includes('Cotización')) {
    suggestions.push('El campo Proceso podría ser más específico para mejor seguimiento');
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * VALIDACIÓN FASE 2: Documentos y Cuota Operacional
 */
function validatePhase2Details(phase: PhaseProgress, context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const estadoCuota = context.csvRow['4. ESTADO pago Cuota Operacional'] || '';
  const previousPhase = context.phaseDetails[0];

  // Validar dependencia de Fase 1
  if (phase.estado === EstadoProceso.COMPLETADO && 
      previousPhase.estado !== EstadoProceso.COMPLETADO) {
    warnings.push({
      phase: 2,
      type: 'dependency',
      message: 'Fase 2 completa pero Fase 1 no está completada',
      severity: 'high'
    });
  }

  // Validar datos críticos
  if (!estadoCuota) {
    errors.push({
      phase: 2,
      type: 'missing_data',
      message: 'Falta información del estado de pago de cuota operacional',
      blocking: false
    });
  }

  // Validar coherencia de estado COMPLETADO
  if (phase.estado === EstadoProceso.COMPLETADO) {
    const isCuotaReady = estadoCuota.toLowerCase().includes('listo');

    if (!isCuotaReady) {
      warnings.push({
        phase: 2,
        type: 'inconsistency',
        message: 'Fase marcada como COMPLETADA pero cuota operacional no está "Listo"',
        severity: 'high'
      });
    }
  }

  // Validar progreso lógico
  if (phase.progress > previousPhase.progress + 20 && 
      previousPhase.estado !== EstadoProceso.COMPLETADO) {
    warnings.push({
      phase: 2,
      type: 'inconsistency',
      message: 'Progreso de Fase 2 excesivamente alto comparado con Fase 1',
      severity: 'medium'
    });
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * VALIDACIÓN FASE 3: Procesamiento de Pago
 */
function validatePhase3Details(phase: PhaseProgress, context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const estadoGiro = context.csvRow['10. ESTADO Giro Proveedor'] || '';
  const giros = context.parsedInfo.giros || [];
  const valorTotal = context.parsedInfo.valorTotalCompra || 0;

  // Validar datos críticos para cálculos de pago
  if (giros.length === 0 && phase.estado !== EstadoProceso.PENDIENTE) {
    warnings.push({
      phase: 3,
      type: 'data_quality',
      message: 'No se encontraron giros pero la fase no está pendiente',
      severity: 'medium'
    });
  }

  // Validar coherencia de pagos
  if (giros.length > 0) {
    const totalGiros = giros.reduce((sum, giro) => sum + giro.valorSolicitado, 0);
    const paymentPercent = valorTotal > 0 ? (totalGiros / valorTotal) * 100 : 0;

    if (phase.estado === EstadoProceso.COMPLETADO) {
      const isGiroConfirmed = estadoGiro.toLowerCase().includes('pago confirmado');
      
      if (paymentPercent < 95) {
        warnings.push({
          phase: 3,
          type: 'inconsistency',
          message: `Fase completa pero solo ${Math.round(paymentPercent)}% pagado`,
          severity: 'high'
        });
      }

      if (!isGiroConfirmed) {
        warnings.push({
          phase: 3,
          type: 'inconsistency',
          message: 'Fase completa pero giro no confirmado',
          severity: 'high'
        });
      }
    }

    // Validar lógica de progreso vs pagos
    if (phase.progress > paymentPercent + 10) {
      warnings.push({
        phase: 3,
        type: 'inconsistency',
        message: 'Progreso reportado excede porcentaje de pagos efectivos',
        severity: 'medium'
      });
    }
  }

  // Sugerencias
  if (estadoGiro && !estadoGiro.includes('Confirmado') && phase.progress > 90) {
    suggestions.push('Considerar confirmar el giro para completar la fase de pagos');
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * VALIDACIÓN FASE 4: Envío y Logística
 */
function validatePhase4Details(phase: PhaseProgress, context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const estadoFactura = context.csvRow['9. ESTADO Proforma / Factura final'] || '';
  const liberaciones = context.parsedInfo.liberaciones || [];
  const previousPhase = context.phaseDetails[2]; // Fase 3

  // Validar dependencia de pagos
  if (phase.estado === EstadoProceso.COMPLETADO && 
      previousPhase.estado !== EstadoProceso.COMPLETADO) {
    warnings.push({
      phase: 4,
      type: 'dependency',
      message: 'Envío completo pero pagos no están completados',
      severity: 'high'
    });
  }

  // Validar coherencia de factura final
  if (phase.estado === EstadoProceso.COMPLETADO) {
    const isFacturaFinalReady = estadoFactura.toLowerCase().includes('factura final') && 
                                estadoFactura.toLowerCase().includes('listo');
    
    if (!isFacturaFinalReady) {
      warnings.push({
        phase: 4,
        type: 'inconsistency',
        message: 'Fase completa pero factura final no está lista',
        severity: 'high'
      });
    }

    if (liberaciones.length === 0) {
      warnings.push({
        phase: 4,
        type: 'inconsistency',
        message: 'Envío completo pero no hay liberaciones programadas',
        severity: 'medium'
      });
    }
  }

  // Validar calidad de datos de factura
  if (!estadoFactura && phase.progress > 50) {
    errors.push({
      phase: 4,
      type: 'missing_data',
      message: 'Falta información crítica del estado de factura',
      blocking: false
    });
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * VALIDACIÓN FASE 5: Operación Completada
 */
function validatePhase5Details(phase: PhaseProgress, context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const liberaciones = context.parsedInfo.liberaciones || [];
  const valorTotal = context.parsedInfo.valorTotalCompra || 0;
  const previousPhase = context.phaseDetails[3]; // Fase 4

  // Calcular liberaciones totales
  const totalLiberado = liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
  const diferencia = Math.abs(valorTotal - totalLiberado);
  const tolerancia = 1000;

  // Validar dependencia de envío
  if (phase.estado === EstadoProceso.COMPLETADO && 
      previousPhase.estado !== EstadoProceso.COMPLETADO) {
    warnings.push({
      phase: 5,
      type: 'dependency',
      message: 'Operación completa pero envío no está completado',
      severity: 'high'
    });
  }

  // Validar coherencia de liberaciones
  if (phase.estado === EstadoProceso.COMPLETADO) {
    if (diferencia > tolerancia) {
      warnings.push({
        phase: 5,
        type: 'inconsistency',
        message: `Diferencia entre valor total (${valorTotal}) y liberado (${totalLiberado}) excede tolerancia`,
        severity: 'high'
      });
    }

    if (liberaciones.length === 0) {
      errors.push({
        phase: 5,
        type: 'logical_error',
        message: 'Operación marcada como completa pero no hay liberaciones',
        blocking: true
      });
    }
  }

  // Validar progreso vs liberaciones
  if (valorTotal > 0) {
    const expectedProgress = Math.min((totalLiberado / valorTotal) * 100, 100);
    
    if (phase.progress > expectedProgress + 15) {
      warnings.push({
        phase: 5,
        type: 'inconsistency',
        message: 'Progreso reportado excede liberaciones efectivas',
        severity: 'medium'
      });
    }
  }

  // Sugerencias finales
  if (totalLiberado > 0 && diferencia > 0 && diferencia <= tolerancia * 2) {
    suggestions.push(`Diferencia menor detectada: $${diferencia}. Verificar liberaciones finales.`);
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * Valida dependencias entre fases
 */
function validatePhaseDependencies(context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const phases = context.phaseDetails;

  for (let i = 1; i < phases.length; i++) {
    const currentPhase = phases[i];
    const previousPhase = phases[i - 1];

    // Regla: Una fase no puede estar COMPLETADA si la anterior no lo está
    if (currentPhase.estado === EstadoProceso.COMPLETADO && 
        previousPhase.estado !== EstadoProceso.COMPLETADO) {
      
      warnings.push({
        phase: i + 1,
        type: 'dependency',
        message: `Fase ${i + 1} completa pero Fase ${i} no está completada`,
        severity: 'high'
      });
    }

    // Regla: El progreso no puede exceder significativamente al de la fase anterior
    if (previousPhase.estado !== EstadoProceso.COMPLETADO && 
        currentPhase.progress > previousPhase.progress + 25) {
      
      warnings.push({
        phase: i + 1,
        type: 'dependency',
        message: `Progreso de Fase ${i + 1} (${currentPhase.progress}%) excede significativamente Fase ${i} (${previousPhase.progress}%)`,
        severity: 'medium'
      });
    }

    // Marcar dependencias como no cumplidas si hay inconsistencias
    if (!currentPhase.dependencies && currentPhase.estado !== EstadoProceso.PENDIENTE) {
      suggestions.push(`Revisar dependencias de Fase ${i + 1}: ${currentPhase.name}`);
    }
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * Valida coherencia lógica general
 */
function validateLogicalCoherence(context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const phases = context.phaseDetails;
  const overallProgress = context.overallProgress.totalProgress;

  // Validar que el progreso general sea coherente
  const completedPhases = phases.filter(p => p.estado === EstadoProceso.COMPLETADO).length;
  const expectedMinProgress = completedPhases * 15; // Mínimo progreso esperado

  if (overallProgress < expectedMinProgress) {
    warnings.push({
      phase: 0,
      type: 'inconsistency',
      message: `Progreso general (${overallProgress}%) parece bajo para ${completedPhases} fases completadas`,
      severity: 'medium'
    });
  }

  // Validar que no haya saltos ilógicos en el progreso
  let previousProgress = 0;
  phases.forEach((phase, index) => {
    if (phase.progress < previousProgress - 5) { // Tolerancia de 5%
      warnings.push({
        phase: index + 1,
        type: 'inconsistency',
        message: `Progreso de Fase ${index + 1} es menor que la fase anterior`,
        severity: 'low'
      });
    }
    previousProgress = Math.max(previousProgress, phase.progress);
  });

  // Validar estados coherentes
  const hasCompletedAfterPending = phases.some((phase, index) => {
    if (index === 0) return false;
    return phase.estado === EstadoProceso.COMPLETADO && 
           phases.slice(0, index).some(p => p.estado === EstadoProceso.PENDIENTE);
  });

  if (hasCompletedAfterPending) {
    warnings.push({
      phase: 0,
      type: 'inconsistency',
      message: 'Hay fases completadas con fases anteriores pendientes',
      severity: 'high'
    });
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * Valida calidad de los datos CSV
 */
function validateDataQuality(context: PhaseValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const suggestions: string[] = [];

  const csvRow = context.csvRow;
  const parsedInfo = context.parsedInfo;

  // Campos críticos que deben existir
  const criticalFields = [
    'Proceso',
    '1. ESTADO Firma Cotización',
    '4. ESTADO pago Cuota Operacional',
    '9. ESTADO Proforma / Factura final',
    '10. ESTADO Giro Proveedor',
    '15. Equipo Comercial'
  ];

  criticalFields.forEach((field, index) => {
    if (!csvRow[field] || csvRow[field].trim() === '') {
      warnings.push({
        phase: Math.floor(index / 2) + 1, // Distribuir entre fases
        type: 'data_quality',
        message: `Campo crítico faltante: ${field}`,
        severity: 'medium'
      });
    }
  });

  // Validar información parseada
  if (!parsedInfo.valorTotalCompra || parsedInfo.valorTotalCompra <= 0) {
    errors.push({
      phase: 0,
      type: 'missing_data',
      message: 'Valor total de compra no encontrado o inválido',
      blocking: false
    });
  }

  if (!parsedInfo.giros || parsedInfo.giros.length === 0) {
    warnings.push({
      phase: 3,
      type: 'data_quality',
      message: 'No se encontraron giros en la información parseada',
      severity: 'low'
    });
  }

  if (!parsedInfo.liberaciones || parsedInfo.liberaciones.length === 0) {
    warnings.push({
      phase: 5,
      type: 'data_quality',
      message: 'No se encontraron liberaciones en la información parseada',
      severity: 'low'
    });
  }

  // Sugerencias de mejora de datos
  if (parsedInfo.cliente && parsedInfo.cliente.length < 5) {
    suggestions.push('Información de cliente parece incompleta, verificar datos de entrada');
  }

  return { isValid: errors.length === 0, warnings, errors, suggestions };
}

/**
 * Genera un reporte de validación legible
 */
export function generateValidationReport(validation: ValidationResult): string {
  let report = '\n🔍 REPORTE DE VALIDACIÓN DEL TIMELINE\n';
  report += '================================================\n\n';

  report += `✅ Estado General: ${validation.isValid ? 'VÁLIDO' : 'REQUIERE ATENCIÓN'}\n`;
  report += `📊 Resumen: ${validation.errors.length} errores, ${validation.warnings.length} advertencias\n\n`;

  if (validation.errors.length > 0) {
    report += '❌ ERRORES CRÍTICOS:\n';
    validation.errors.forEach(error => {
      report += `   [Fase ${error.phase}] ${error.message}\n`;
      report += `   Tipo: ${error.type}, Bloquea: ${error.blocking ? 'Sí' : 'No'}\n\n`;
    });
  }

  if (validation.warnings.length > 0) {
    report += '⚠️ ADVERTENCIAS:\n';
    validation.warnings.forEach(warning => {
      report += `   [Fase ${warning.phase}] ${warning.message}\n`;
      report += `   Tipo: ${warning.type}, Severidad: ${warning.severity}\n\n`;
    });
  }

  if (validation.suggestions.length > 0) {
    report += '💡 SUGERENCIAS DE MEJORA:\n';
    validation.suggestions.forEach(suggestion => {
      report += `   • ${suggestion}\n`;
    });
    report += '\n';
  }

  report += '================================================\n';
  return report;
}