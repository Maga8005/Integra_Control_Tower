"use strict";
/**
 * Calculador preciso de progreso para timeline de 5 fases
 * Lógica exacta para determinar porcentajes de progreso basado en estados CSV
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePreciseProgress = calculatePreciseProgress;
const Operation_1 = require("../types/Operation");
/**
 * Calcula el progreso exacto de cada una de las 5 fases
 */
function calculatePreciseProgress(csvRow, parsedInfo) {
    console.log('🧮 Calculando progreso preciso de 5 fases...');
    const phaseDetails = [
        calculatePhase1Progress(csvRow),
        calculatePhase2Progress(csvRow),
        calculatePhase3Progress(csvRow, parsedInfo),
        calculatePhase4Progress(csvRow, parsedInfo),
        calculatePhase5Progress(csvRow, parsedInfo)
    ];
    // Validar dependencias entre fases
    validatePhaseDependencies(phaseDetails);
    // Calcular progreso general
    const totalProgress = calculateWeightedProgress(phaseDetails);
    // Determinar fase actual y siguiente
    const { currentPhase, nextPhase } = determineCurrentPhase(phaseDetails);
    const completedPhases = phaseDetails.filter(p => p.estado === Operation_1.EstadoProceso.COMPLETADO).length;
    console.log(`📊 Progreso total: ${totalProgress}%, Fases completadas: ${completedPhases}/5`);
    return {
        totalProgress,
        completedPhases,
        currentPhase,
        nextPhase,
        phaseDetails
    };
}
/**
 * FASE 1: Solicitud Enviada - Progreso exacto
 */
function calculatePhase1Progress(csvRow) {
    const proceso = csvRow['Proceso'] || '';
    const estadoFirma = csvRow['1. ESTADO Firma Cotización'] || '';
    console.log(`📋 Fase 1 - Proceso: "${proceso}", Estado Firma: "${estadoFirma}"`);
    // Condición exacta: Proceso contiene "1. Aprobación de Cotización"
    const procesoAprobado = proceso.includes('1. Aprobación de Cotización');
    // Condición exacta: Estado firma = "Listo"
    const firmaLista = estadoFirma.toLowerCase().includes('listo');
    if (procesoAprobado || firmaLista) {
        return {
            phase: 1,
            name: 'Solicitud Enviada',
            progress: 100,
            estado: Operation_1.EstadoProceso.COMPLETADO,
            reason: procesoAprobado ?
                `Proceso aprobado: "${proceso}"` :
                `Firma completada: "${estadoFirma}"`,
            dependencies: true
        };
    }
    // Estados intermedios con progreso específico
    if (proceso.toLowerCase().includes('cotizacion') ||
        proceso.toLowerCase().includes('revision') ||
        estadoFirma.toLowerCase().includes('proceso')) {
        return {
            phase: 1,
            name: 'Solicitud Enviada',
            progress: 65,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Cotización en proceso de aprobación',
            dependencies: true
        };
    }
    if (proceso.trim() || estadoFirma.trim()) {
        return {
            phase: 1,
            name: 'Solicitud Enviada',
            progress: 30,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Información parcial disponible',
            dependencies: true
        };
    }
    return {
        phase: 1,
        name: 'Solicitud Enviada',
        progress: 0,
        estado: Operation_1.EstadoProceso.PENDIENTE,
        reason: 'Sin información de cotización',
        dependencies: true
    };
}
/**
 * FASE 2: Documentos de Operación y Pago Cuota Operacional - Progreso exacto
 */
function calculatePhase2Progress(csvRow) {
    const estadoCuota = csvRow['4. ESTADO pago Cuota Operacional'] || '';
    console.log(`📄 Fase 2 - Estado Cuota: "${estadoCuota}"`);
    // Condición exacta: Estado = "Listo"
    if (estadoCuota.toLowerCase().includes('listo')) {
        return {
            phase: 2,
            name: 'Documentos de Operación y Pago Cuota Operacional',
            progress: 100,
            estado: Operation_1.EstadoProceso.COMPLETADO,
            reason: `Cuota operacional pagada: "${estadoCuota}"`,
            dependencies: true
        };
    }
    // Estados intermedios específicos
    if (estadoCuota.toLowerCase().includes('confirmado') ||
        estadoCuota.toLowerCase().includes('procesado')) {
        return {
            phase: 2,
            name: 'Documentos de Operación y Pago Cuota Operacional',
            progress: 85,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Cuota en confirmación final',
            dependencies: true
        };
    }
    if (estadoCuota.toLowerCase().includes('proceso') ||
        estadoCuota.toLowerCase().includes('revision')) {
        return {
            phase: 2,
            name: 'Documentos de Operación y Pago Cuota Operacional',
            progress: 60,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Cuota en proceso de pago',
            dependencies: true
        };
    }
    if (estadoCuota.toLowerCase().includes('pendiente') ||
        estadoCuota.toLowerCase().includes('documentos')) {
        return {
            phase: 2,
            name: 'Documentos de Operación y Pago Cuota Operacional',
            progress: 35,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Documentos en preparación',
            dependencies: true
        };
    }
    if (estadoCuota.trim()) {
        return {
            phase: 2,
            name: 'Documentos de Operación y Pago Cuota Operacional',
            progress: 15,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Estado: "${estadoCuota}"`,
            dependencies: true
        };
    }
    return {
        phase: 2,
        name: 'Documentos de Operación y Pago Cuota Operacional',
        progress: 0,
        estado: Operation_1.EstadoProceso.PENDIENTE,
        reason: 'Sin información de cuota operacional',
        dependencies: false
    };
}
/**
 * FASE 3: Procesamiento de Pago - Progreso exacto con cálculos complejos
 */
function calculatePhase3Progress(csvRow, parsedInfo) {
    const estadoGiro = csvRow['10. ESTADO Giro Proveedor'] || '';
    // Calcular progreso de pagos basado en giros
    const paymentProgress = calculatePaymentProgressDetailed(parsedInfo);
    const paymentPercent = paymentProgress.progressPercent;
    console.log(`💰 Fase 3 - Progreso Pagos: ${paymentPercent}%, Estado Giro: "${estadoGiro}"`);
    // Condición exacta: 100% pagado Y giro confirmado
    const pagoCompleto = paymentPercent >= 100;
    const giroConfirmado = estadoGiro.toLowerCase().includes('listo') &&
        estadoGiro.toLowerCase().includes('pago confirmado');
    if (pagoCompleto && giroConfirmado) {
        return {
            phase: 3,
            name: 'Procesamiento de Pago',
            progress: 100,
            estado: Operation_1.EstadoProceso.COMPLETADO,
            reason: `Pagos completos (${paymentPercent}%) y confirmados`,
            dependencies: true
        };
    }
    // Pago completo pero no confirmado aún
    if (pagoCompleto && !giroConfirmado) {
        return {
            phase: 3,
            name: 'Procesamiento de Pago',
            progress: 95,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Pagos completos, esperando confirmación final`,
            dependencies: true
        };
    }
    // Pagos parciales con giro en proceso
    if (paymentPercent > 0) {
        let adjustedProgress = Math.min(paymentPercent * 0.9, 90); // Máximo 90% hasta confirmación
        // Ajustar según estado del giro
        if (estadoGiro.toLowerCase().includes('proceso')) {
            adjustedProgress = Math.max(adjustedProgress, 50);
        }
        else if (estadoGiro.toLowerCase().includes('listo') && !giroConfirmado) {
            adjustedProgress = Math.max(adjustedProgress, 75);
        }
        return {
            phase: 3,
            name: 'Procesamiento de Pago',
            progress: Math.round(adjustedProgress),
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Progreso de pagos: ${paymentPercent}% (${paymentProgress.paidAmount}/${paymentProgress.totalAmount})`,
            dependencies: true
        };
    }
    // Giro iniciado pero sin pagos aún
    if (estadoGiro.toLowerCase().includes('preparacion') ||
        estadoGiro.toLowerCase().includes('proceso')) {
        return {
            phase: 3,
            name: 'Procesamiento de Pago',
            progress: 25,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Preparando procesamiento de pagos',
            dependencies: true
        };
    }
    if (estadoGiro.trim()) {
        return {
            phase: 3,
            name: 'Procesamiento de Pago',
            progress: 10,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Estado giro: "${estadoGiro}"`,
            dependencies: true
        };
    }
    return {
        phase: 3,
        name: 'Procesamiento de Pago',
        progress: 0,
        estado: Operation_1.EstadoProceso.PENDIENTE,
        reason: 'Sin información de pagos',
        dependencies: false
    };
}
/**
 * FASE 4: Envío y Logística - Progreso exacto
 */
function calculatePhase4Progress(csvRow, parsedInfo) {
    const estadoFactura = csvRow['9. ESTADO Proforma / Factura final'] || '';
    const hasLiberations = parsedInfo.liberaciones && parsedInfo.liberaciones.length > 0;
    const liberationCount = parsedInfo.liberaciones.length;
    console.log(`🚚 Fase 4 - Estado Factura: "${estadoFactura}", Liberaciones: ${liberationCount}`);
    // Condición exacta: Factura final lista Y liberaciones programadas
    const facturaFinalLista = estadoFactura.toLowerCase().includes('listo') &&
        estadoFactura.toLowerCase().includes('factura final');
    if (facturaFinalLista && hasLiberations) {
        return {
            phase: 4,
            name: 'Envío y Logística',
            progress: 100,
            estado: Operation_1.EstadoProceso.COMPLETADO,
            reason: `Factura final lista con ${liberationCount} liberación(es) programada(s)`,
            dependencies: true
        };
    }
    // Factura final lista pero sin liberaciones
    if (facturaFinalLista && !hasLiberations) {
        return {
            phase: 4,
            name: 'Envío y Logística',
            progress: 85,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Factura final lista, programando liberaciones',
            dependencies: true
        };
    }
    // Estados intermedios de factura
    if (estadoFactura.toLowerCase().includes('listo') &&
        !estadoFactura.toLowerCase().includes('final')) {
        return {
            phase: 4,
            name: 'Envío y Logística',
            progress: 70,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Proforma lista, preparando factura final',
            dependencies: true
        };
    }
    if (estadoFactura.toLowerCase().includes('proceso') ||
        estadoFactura.toLowerCase().includes('proforma')) {
        return {
            phase: 4,
            name: 'Envío y Logística',
            progress: 45,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Procesando documentación de envío',
            dependencies: true
        };
    }
    if (estadoFactura.toLowerCase().includes('preparacion') ||
        estadoFactura.toLowerCase().includes('revision')) {
        return {
            phase: 4,
            name: 'Envío y Logística',
            progress: 25,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: 'Preparando documentación final',
            dependencies: true
        };
    }
    if (estadoFactura.trim()) {
        return {
            phase: 4,
            name: 'Envío y Logística',
            progress: 10,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Estado factura: "${estadoFactura}"`,
            dependencies: true
        };
    }
    return {
        phase: 4,
        name: 'Envío y Logística',
        progress: 0,
        estado: Operation_1.EstadoProceso.PENDIENTE,
        reason: 'Sin información de facturación',
        dependencies: false
    };
}
/**
 * FASE 5: Operación Completada - Progreso exacto con validación de liberaciones
 */
function calculatePhase5Progress(csvRow, parsedInfo) {
    const liberationValidation = validateLiberationCompletion(parsedInfo);
    const totalValue = parsedInfo.valorTotalCompra;
    const liberatedValue = liberationValidation.totalLiberated;
    const completionPercent = liberationValidation.completionPercent;
    console.log(`✅ Fase 5 - Liberado: ${liberatedValue}/${totalValue} (${completionPercent}%)`);
    // Condición exacta: Liberaciones ≈ Valor total (tolerancia ±1000)
    if (liberationValidation.isComplete) {
        return {
            phase: 5,
            name: 'Operación Completada',
            progress: 100,
            estado: Operation_1.EstadoProceso.COMPLETADO,
            reason: `Operación completada: $${liberatedValue.toLocaleString()} liberado`,
            dependencies: true
        };
    }
    // Liberaciones parciales con progreso específico
    if (completionPercent >= 90) {
        return {
            phase: 5,
            name: 'Operación Completada',
            progress: 95,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Liberaciones casi completas: ${completionPercent}%`,
            dependencies: true
        };
    }
    if (completionPercent >= 50) {
        return {
            phase: 5,
            name: 'Operación Completada',
            progress: Math.round(completionPercent * 0.8), // Factor de ajuste
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Liberaciones en proceso: ${completionPercent}%`,
            dependencies: true
        };
    }
    if (liberatedValue > 0) {
        return {
            phase: 5,
            name: 'Operación Completada',
            progress: Math.max(Math.round(completionPercent * 0.6), 15),
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `Liberaciones iniciadas: $${liberatedValue.toLocaleString()}`,
            dependencies: true
        };
    }
    // Hay liberaciones programadas pero no ejecutadas
    if (parsedInfo.liberaciones && parsedInfo.liberaciones.length > 0) {
        return {
            phase: 5,
            name: 'Operación Completada',
            progress: 10,
            estado: Operation_1.EstadoProceso.EN_PROCESO,
            reason: `${parsedInfo.liberaciones.length} liberación(es) programada(s)`,
            dependencies: true
        };
    }
    return {
        phase: 5,
        name: 'Operación Completada',
        progress: 0,
        estado: Operation_1.EstadoProceso.PENDIENTE,
        reason: 'Sin liberaciones programadas',
        dependencies: false
    };
}
/**
 * Calcula progreso detallado de pagos
 */
function calculatePaymentProgressDetailed(parsedInfo) {
    const totalAmount = parsedInfo.valorTotalCompra;
    const paidAmount = parsedInfo.giros.reduce((sum, giro) => sum + giro.valorSolicitado, 0);
    const pendingAmount = totalAmount - paidAmount;
    const progressPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
    return {
        totalAmount,
        paidAmount,
        pendingAmount,
        progressPercent,
        girosCount: parsedInfo.giros.length
    };
}
/**
 * Valida la completitud de liberaciones
 */
function validateLiberationCompletion(parsedInfo, tolerance = 1000) {
    const expectedTotal = parsedInfo.valorTotalCompra;
    const totalLiberated = parsedInfo.liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
    const difference = Math.abs(expectedTotal - totalLiberated);
    const isComplete = difference <= tolerance && totalLiberated > 0;
    const completionPercent = expectedTotal > 0 ? Math.round((totalLiberated / expectedTotal) * 100) : 0;
    return {
        isComplete,
        totalLiberated,
        expectedTotal,
        difference,
        completionPercent
    };
}
/**
 * Calcula progreso general ponderado
 */
function calculateWeightedProgress(phases) {
    // Pesos específicos para cada fase
    const weights = [15, 20, 25, 25, 15]; // Total = 100%
    let weightedSum = 0;
    phases.forEach((phase, index) => {
        const weight = weights[index] || 20;
        weightedSum += (phase.progress * weight) / 100;
    });
    return Math.round(weightedSum);
}
/**
 * Determina la fase actual y siguiente
 */
function determineCurrentPhase(phases) {
    let currentPhase = null;
    let nextPhase = null;
    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        if (phase.estado === Operation_1.EstadoProceso.EN_PROCESO && currentPhase === null) {
            currentPhase = i + 1;
        }
        if (phase.estado === Operation_1.EstadoProceso.PENDIENTE && nextPhase === null) {
            nextPhase = i + 1;
            break;
        }
    }
    return { currentPhase, nextPhase };
}
/**
 * Valida dependencias entre fases
 */
function validatePhaseDependencies(phases) {
    for (let i = 1; i < phases.length; i++) {
        const currentPhase = phases[i];
        const previousPhase = phases[i - 1];
        // Una fase no puede estar completada si la anterior no lo está
        if (currentPhase.estado === Operation_1.EstadoProceso.COMPLETADO &&
            previousPhase.estado !== Operation_1.EstadoProceso.COMPLETADO) {
            console.warn(`⚠️ Inconsistencia: Fase ${i + 1} completada pero Fase ${i} no`);
            // Ajustar dependencias
            if (currentPhase.progress > previousPhase.progress) {
                currentPhase.dependencies = false;
            }
        }
        // Una fase no puede tener más progreso que la anterior si la anterior no está completa
        if (previousPhase.estado !== Operation_1.EstadoProceso.COMPLETADO &&
            currentPhase.progress > previousPhase.progress + 10) { // Tolerancia de 10%
            console.warn(`⚠️ Inconsistencia: Fase ${i + 1} tiene más progreso que Fase ${i}`);
            currentPhase.dependencies = false;
        }
    }
}
//# sourceMappingURL=ProgressCalculator.js.map