"use strict";
/**
 * Mapeo exacto de estados CSV a timeline de 5 fases
 * Lógica crítica para determinar estados basado en campos específicos del CSV
 * Integra Control Tower MVP - Soporte multi-país (Colombia y México)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapEstados = mapEstados;
exports.analyzeStates = analyzeStates;
exports.calculatePaymentProgress = calculatePaymentProgress;
exports.validateLiberations = validateLiberations;
const Operation_1 = require("../types/Operation");
const csvMappers_1 = require("../utils/csvMappers");
/**
 * Mapea estados CSV a los 6 estados principales del sistema
 * ACTUALIZADO: Soporte multi-país
 */
function mapEstados(csvRow, countryCode = 'CO') {
    const config = csvMappers_1.COUNTRY_CONFIGS[countryCode];
    console.log(`🔄 Mapeando estados desde CSV (${config.name})...`);
    const estados = {
        cotizacion: mapCotizacionState(csvRow, countryCode),
        documentosLegales: mapDocumentosLegalesState(csvRow, countryCode),
        cuotaOperacional: mapCuotaOperacionalState(csvRow, countryCode),
        compraInternacional: mapCompraInternacionalState(csvRow, countryCode),
        giroProveedor: mapGiroProveedorState(csvRow, countryCode),
        facturaFinal: mapFacturaFinalState(csvRow, countryCode)
    };
    console.log('✅ Estados mapeados:', estados);
    return estados;
}
/**
 * Análisis detallado de estados con explicaciones
 * ACTUALIZADO: Soporte multi-país
 */
function analyzeStates(csvRow, parsedInfo, countryCode = 'CO') {
    console.log('🔍 Iniciando análisis detallado de estados...');
    const analysis = {};
    // 1. Análisis de Cotización
    const cotizacionState = mapCotizacionState(csvRow, countryCode);
    analysis.cotizacion = {
        condition: 'Proceso === "1. Aprobación de Cotización" OR "1. ESTADO Firma Cotización" === "Listo"',
        result: cotizacionState,
        reason: getCotizacionReason(csvRow)
    };
    // 2. Análisis de Documentos Legales
    const documentosState = mapDocumentosLegalesState(csvRow);
    analysis.documentosLegales = {
        condition: 'Estado derivado de progreso de cotización y cuota operacional',
        result: documentosState,
        reason: getDocumentosReason(csvRow)
    };
    // 3. Análisis de Cuota Operacional
    const cuotaState = mapCuotaOperacionalState(csvRow);
    analysis.cuotaOperacional = {
        condition: '"4. ESTADO pago Cuota Operacional" === "Listo"',
        result: cuotaState,
        reason: getCuotaReason(csvRow)
    };
    // 4. Análisis de Compra Internacional
    const compraState = mapCompraInternacionalState(csvRow);
    analysis.compraInternacional = {
        condition: 'Basado en progreso de cuota operacional y giros',
        result: compraState,
        reason: getCompraReason(csvRow, parsedInfo)
    };
    // 5. Análisis de Giro Proveedor
    const giroState = mapGiroProveedorState(csvRow);
    analysis.giroProveedor = {
        condition: '"10. ESTADO Giro Proveedor" === "Listo - Pago Confirmado"',
        result: giroState,
        reason: getGiroReason(csvRow)
    };
    // 6. Análisis de Factura Final
    const facturaState = mapFacturaFinalState(csvRow);
    analysis.facturaFinal = {
        condition: '"9. ESTADO Proforma / Factura final" === "Listo - Factura Final"',
        result: facturaState,
        reason: getFacturaReason(csvRow)
    };
    return {
        estados: {
            cotizacion: cotizacionState,
            documentosLegales: documentosState,
            cuotaOperacional: cuotaState,
            compraInternacional: compraState,
            giroProveedor: giroState,
            facturaFinal: facturaState
        },
        analysis
    };
}
/**
 * 1. COTIZACIÓN - Condición: Proceso = "1. Aprobación de Cotización" OR Campo "1. ESTADO Firma Cotización" = "Listo"
 */
function mapCotizacionState(csvRow, countryCode = 'CO') {
    const proceso = csvRow['Proceso'] || '';
    const estadoFirma = csvRow['1. ESTADO Firma Cotización'] || '';
    console.log(`🔍 Cotización - Proceso: "${proceso}", Estado Firma: "${estadoFirma}"`);
    // Condición 1: Proceso contiene "1. Aprobación de Cotización"
    if (proceso.includes('1. Aprobación de Cotización')) {
        console.log('✅ Cotización COMPLETADA (por proceso)');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    // Condición 2: Estado firma cotización = "Listo"
    if (estadoFirma.toLowerCase().includes('listo')) {
        console.log('✅ Cotización COMPLETADA (por estado firma)');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    // Si hay alguna información pero no está completa
    if (proceso.trim() || estadoFirma.trim()) {
        console.log('🔄 Cotización EN_PROCESO');
        return Operation_1.EstadoProceso.EN_PROCESO;
    }
    console.log('⏳ Cotización PENDIENTE');
    return Operation_1.EstadoProceso.PENDIENTE;
}
/**
 * 2. DOCUMENTOS LEGALES - Estado derivado basado en progreso general
 */
function mapDocumentosLegalesState(csvRow, countryCode = 'CO') {
    // Los documentos legales siguen a la cotización
    const config = csvMappers_1.COUNTRY_CONFIGS[countryCode];
    const cotizacionState = mapCotizacionState(csvRow, countryCode);
    const cuotaState = mapCuotaOperacionalState(csvRow, countryCode);
    // Para Colombia: verificar también "8. ESTADO Doc Legal X Comp"
    let docLegalXCompState = Operation_1.EstadoProceso.COMPLETADO; // Por defecto para México
    if (config.hasDocLegalXComp) {
        const docLegalEstado = csvRow['8. ESTADO Doc Legal X Comp'] || '';
        const docLegalLower = docLegalEstado.toLowerCase().trim();
        if (docLegalLower.includes('listo') || docLegalLower.includes('completado')) {
            docLegalXCompState = Operation_1.EstadoProceso.COMPLETADO;
        }
        else if (docLegalEstado.trim()) {
            docLegalXCompState = Operation_1.EstadoProceso.EN_PROCESO;
        }
        else {
            docLegalXCompState = Operation_1.EstadoProceso.PENDIENTE;
        }
    }
    console.log(`🔍 Documentos (${config.name}) - Cotización: ${cotizacionState}, Cuota: ${cuotaState}${config.hasDocLegalXComp ? `, Doc Legal X Comp: ${docLegalXCompState}` : ''}`);
    // Todos los componentes deben estar completados
    if (cotizacionState === Operation_1.EstadoProceso.COMPLETADO &&
        cuotaState === Operation_1.EstadoProceso.COMPLETADO &&
        docLegalXCompState === Operation_1.EstadoProceso.COMPLETADO) {
        console.log('✅ Documentos COMPLETADOS');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    if (cotizacionState === Operation_1.EstadoProceso.COMPLETADO) {
        console.log('🔄 Documentos EN_PROCESO');
        return Operation_1.EstadoProceso.EN_PROCESO;
    }
    console.log('⏳ Documentos PENDIENTE');
    return Operation_1.EstadoProceso.PENDIENTE;
}
/**
 * 3. CUOTA OPERACIONAL - Condición: "4. ESTADO pago Cuota Operacional" === "Listo"
 */
function mapCuotaOperacionalState(csvRow, countryCode = 'CO') {
    const estadoCuota = csvRow['4. ESTADO pago Cuota Operacional'] || '';
    console.log(`🔍 Cuota Operacional - Estado: "${estadoCuota}"`);
    if (estadoCuota.toLowerCase().includes('listo')) {
        console.log('✅ Cuota Operacional COMPLETADA');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    // Verificar si hay alguna información que indique proceso
    if (estadoCuota.toLowerCase().includes('proceso') ||
        estadoCuota.toLowerCase().includes('revision') ||
        estadoCuota.toLowerCase().includes('pendiente confirmacion')) {
        console.log('🔄 Cuota Operacional EN_PROCESO');
        return Operation_1.EstadoProceso.EN_PROCESO;
    }
    console.log('⏳ Cuota Operacional PENDIENTE');
    return Operation_1.EstadoProceso.PENDIENTE;
}
/**
 * 4. COMPRA INTERNACIONAL - Lógica compleja basada en progreso de pagos
 */
function mapCompraInternacionalState(csvRow, countryCode = 'CO') {
    const cuotaState = mapCuotaOperacionalState(csvRow);
    const giroState = mapGiroProveedorState(csvRow);
    console.log(`🔍 Compra Internacional - Cuota: ${cuotaState}, Giro: ${giroState}`);
    // Si la cuota no está completa, compra internacional no puede empezar
    if (cuotaState !== Operation_1.EstadoProceso.COMPLETADO) {
        console.log('⏳ Compra Internacional PENDIENTE (cuota no completa)');
        return Operation_1.EstadoProceso.PENDIENTE;
    }
    // Si el giro está completado, compra internacional está completa
    if (giroState === Operation_1.EstadoProceso.COMPLETADO) {
        console.log('✅ Compra Internacional COMPLETADA');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    // Si la cuota está lista pero el giro no, está en proceso
    console.log('🔄 Compra Internacional EN_PROCESO');
    return Operation_1.EstadoProceso.EN_PROCESO;
}
/**
 * 5. GIRO PROVEEDOR - Condición: "10. ESTADO Giro Proveedor" === "Listo - Pago Confirmado"
 */
function mapGiroProveedorState(csvRow, countryCode = 'CO') {
    const estadoGiro = csvRow['10. ESTADO Giro Proveedor'] || '';
    console.log(`🔍 Giro Proveedor - Estado: "${estadoGiro}"`);
    // Condición exacta: "Listo - Pago Confirmado"
    if (estadoGiro.toLowerCase().includes('listo') &&
        estadoGiro.toLowerCase().includes('pago confirmado')) {
        console.log('✅ Giro Proveedor COMPLETADO');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    // Estados que indican proceso
    if (estadoGiro.toLowerCase().includes('proceso') ||
        estadoGiro.toLowerCase().includes('revision') ||
        estadoGiro.toLowerCase().includes('preparacion') ||
        estadoGiro.toLowerCase().includes('listo') && !estadoGiro.toLowerCase().includes('confirmado')) {
        console.log('🔄 Giro Proveedor EN_PROCESO');
        return Operation_1.EstadoProceso.EN_PROCESO;
    }
    console.log('⏳ Giro Proveedor PENDIENTE');
    return Operation_1.EstadoProceso.PENDIENTE;
}
/**
 * 6. FACTURA FINAL - Condición: "9. ESTADO Proforma / Factura final" === "Listo - Factura Final"
 */
function mapFacturaFinalState(csvRow, countryCode = 'CO') {
    const estadoFactura = csvRow['9. ESTADO Proforma / Factura final'] || '';
    console.log(`🔍 Factura Final - Estado: "${estadoFactura}"`);
    // Condición exacta: "Listo - Factura Final"
    if (estadoFactura.toLowerCase().includes('listo') &&
        estadoFactura.toLowerCase().includes('factura final')) {
        console.log('✅ Factura Final COMPLETADA');
        return Operation_1.EstadoProceso.COMPLETADO;
    }
    // Estados que indican proceso
    if (estadoFactura.toLowerCase().includes('proceso') ||
        estadoFactura.toLowerCase().includes('revision') ||
        estadoFactura.toLowerCase().includes('proforma') ||
        estadoFactura.toLowerCase().includes('listo') && !estadoFactura.toLowerCase().includes('final')) {
        console.log('🔄 Factura Final EN_PROCESO');
        return Operation_1.EstadoProceso.EN_PROCESO;
    }
    console.log('⏳ Factura Final PENDIENTE');
    return Operation_1.EstadoProceso.PENDIENTE;
}
/**
 * Funciones auxiliares para generar explicaciones detalladas
 */
function getCotizacionReason(csvRow) {
    const proceso = csvRow['Proceso'] || '';
    const estadoFirma = csvRow['1. ESTADO Firma Cotización'] || '';
    if (proceso.includes('1. Aprobación de Cotización')) {
        return `Proceso indica aprobación de cotización: "${proceso}"`;
    }
    if (estadoFirma.toLowerCase().includes('listo')) {
        return `Estado de firma cotización es "Listo": "${estadoFirma}"`;
    }
    return `Proceso: "${proceso}", Estado firma: "${estadoFirma}"`;
}
function getDocumentosReason(csvRow) {
    return 'Estado derivado del progreso de cotización y cuota operacional';
}
function getCuotaReason(csvRow) {
    const estadoCuota = csvRow['4. ESTADO pago Cuota Operacional'] || '';
    return `Estado cuota operacional: "${estadoCuota}"`;
}
function getCompraReason(csvRow, parsedInfo) {
    const valorTotal = parsedInfo.valorTotalCompra;
    const giroTotal = parsedInfo.giros.reduce((sum, giro) => sum + giro.valorSolicitado, 0);
    const progreso = valorTotal > 0 ? Math.round((giroTotal / valorTotal) * 100) : 0;
    return `Progreso de giros: ${progreso}% (${giroTotal}/${valorTotal})`;
}
function getGiroReason(csvRow) {
    const estadoGiro = csvRow['10. ESTADO Giro Proveedor'] || '';
    return `Estado giro proveedor: "${estadoGiro}"`;
}
function getFacturaReason(csvRow) {
    const estadoFactura = csvRow['9. ESTADO Proforma / Factura final'] || '';
    return `Estado factura final: "${estadoFactura}"`;
}
/**
 * Calcula el progreso de giros/pagos basado en los datos parseados
 */
function calculatePaymentProgress(parsedInfo) {
    const totalValue = parsedInfo.valorTotalCompra;
    const paidValue = parsedInfo.giros.reduce((sum, giro) => sum + giro.valorSolicitado, 0);
    const pendingValue = totalValue - paidValue;
    const progress = totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0;
    console.log(`💰 Progreso de pagos: ${progress}% (${paidValue}/${totalValue})`);
    return {
        progress,
        totalValue,
        paidValue,
        pendingValue
    };
}
/**
 * Verifica si las liberaciones coinciden con el valor total
 */
function validateLiberations(parsedInfo, tolerance = 1000) {
    const totalValue = parsedInfo.valorTotalCompra;
    const liberatedValue = parsedInfo.liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
    const difference = Math.abs(totalValue - liberatedValue);
    const isComplete = difference <= tolerance;
    console.log(`📋 Validación liberaciones: ${isComplete ? 'COMPLETA' : 'INCOMPLETA'} (diff: ${difference})`);
    return {
        isComplete,
        totalValue,
        liberatedValue,
        difference
    };
}
//# sourceMappingURL=StateMapper.js.map