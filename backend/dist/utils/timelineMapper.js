"use strict";
/**
 * Mapeo específico de timeline de 5 estados basado en columnas CSV
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapState1_SolicitudEnviada = mapState1_SolicitudEnviada;
exports.mapState2_DocumentosYCuota = mapState2_DocumentosYCuota;
exports.mapState3_ProcesamientoPago = mapState3_ProcesamientoPago;
exports.mapState4_EnvioYLogistica = mapState4_EnvioYLogistica;
exports.mapState5_OperacionCompletada = mapState5_OperacionCompletada;
exports.mapCompleteTimeline = mapCompleteTimeline;
const csvMappers_1 = require("./csvMappers");
/**
 * Estado 1: Solicitud Enviada
 * Basado en columna "1. ESTADO Firma Cotización"
 */
function mapState1_SolicitudEnviada(csvRow) {
    const estadoFirma = csvRow['1. ESTADO Firma Cotización'] || '';
    console.log('📋 Estado 1 - Firma Cotización:', estadoFirma);
    let status = 'pending';
    let progress = 0;
    let description = 'Esperando firma de cotización';
    let notes = '';
    const estadoLower = estadoFirma.toLowerCase().trim();
    if (estadoLower.includes('listo')) {
        status = 'completed';
        progress = 100;
        description = 'Cotización firmada y confirmada';
        notes = `Estado: ${estadoFirma}`;
    }
    else if (estadoLower.includes('solicitado') || estadoLower.includes('proceso')) {
        status = 'in-progress';
        progress = 75;
        description = 'Cotización en proceso de firma';
        notes = `Estado: ${estadoFirma}`;
    }
    else if (estadoLower.includes('pendiente') || estadoLower.includes('revision')) {
        status = 'in-progress';
        progress = 50;
        description = 'Cotización en revisión';
        notes = `Estado: ${estadoFirma}`;
    }
    else if (estadoFirma.trim()) {
        status = 'in-progress';
        progress = 25;
        description = 'Cotización iniciada';
        notes = `Estado: ${estadoFirma}`;
    }
    return {
        id: 1,
        name: 'Solicitud Enviada',
        status,
        progress,
        description,
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };
}
/**
 * Estado 2: Documentos de Operación y Pago Cuota Operacional
 * Basado en columnas "2. ESTADO factura Cuota Operacional" y "4. ESTADO pago Cuota Operacional"
 */
function mapState2_DocumentosYCuota(csvRow) {
    const estadoFacturaCuota = csvRow['2. ESTADO factura Cuota Operacional'] || '';
    const estadoPagoCuota = csvRow['4. ESTADO pago Cuota Operacional'] || '';
    console.log('📄 Estado 2 - Documentos y Cuota:', {
        factura: estadoFacturaCuota,
        pago: estadoPagoCuota
    });
    let status = 'pending';
    let progress = 0;
    let description = 'Esperando documentos y pago de cuota operacional';
    let notes = '';
    const facturaLower = estadoFacturaCuota.toLowerCase().trim();
    const pagoLower = estadoPagoCuota.toLowerCase().trim();
    // Lógica: Pago "Listo" = Completado
    if (pagoLower.includes('listo')) {
        status = 'completed';
        progress = 100;
        description = 'Documentos procesados y cuota operacional pagada';
        notes = `Factura: ${estadoFacturaCuota}, Pago: ${estadoPagoCuota}`;
    }
    // Lógica: Factura "Solicitado" = En progreso
    else if (facturaLower.includes('solicitado') || pagoLower.includes('proceso')) {
        status = 'in-progress';
        progress = 60;
        description = 'Procesando documentos y cuota operacional';
        notes = `Factura: ${estadoFacturaCuota}, Pago: ${estadoPagoCuota}`;
    }
    // Cualquier actividad = iniciado
    else if (estadoFacturaCuota.trim() || estadoPagoCuota.trim()) {
        status = 'in-progress';
        progress = 30;
        description = 'Documentos y cuota en preparación';
        notes = `Factura: ${estadoFacturaCuota}, Pago: ${estadoPagoCuota}`;
    }
    return {
        id: 2,
        name: 'Documentos de Operación y Pago Cuota Operacional',
        status,
        progress,
        description,
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };
}
/**
 * Estado 3: Procesamiento de Pago
 * Basado en parsing de valores en "5. Info Gnal + Info Compra Int"
 * Compara valor total vs valores solicitados
 */
function mapState3_ProcesamientoPago(csvRow) {
    const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || '';
    const infoGiros = csvRow['10. Info por GIRO Proveedor'] || '';
    console.log('💰 Estado 3 - Procesamiento de Pago');
    let status = 'pending';
    let progress = 0;
    let description = 'Esperando procesamiento de pagos';
    let notes = '';
    try {
        // Parsear info general para obtener valor total
        const parsedInfo = (0, csvMappers_1.parseInfoGeneralColumn)(infoGeneral);
        const valorTotal = parsedInfo.valor;
        if (valorTotal > 0) {
            // Extraer valores solicitados de la información de giros
            const valoresSolicitados = extractValoresSolicitados(infoGeneral, infoGiros);
            const totalSolicitado = valoresSolicitados.reduce((sum, val) => sum + val, 0);
            console.log('💰 Análisis de pagos:', {
                valorTotal,
                totalSolicitado,
                valores: valoresSolicitados
            });
            if (totalSolicitado >= valorTotal * 0.98) { // 98% tolerancia
                status = 'completed';
                progress = 100;
                description = `Pagos completados: $${totalSolicitado.toLocaleString()}`;
                notes = `Total: $${valorTotal.toLocaleString()}, Pagado: $${totalSolicitado.toLocaleString()}`;
            }
            else if (totalSolicitado > 0) {
                status = 'in-progress';
                progress = Math.round((totalSolicitado / valorTotal) * 100);
                description = `Pagos en proceso: ${progress}% completado`;
                notes = `Total: $${valorTotal.toLocaleString()}, Pagado: $${totalSolicitado.toLocaleString()}`;
            }
            else {
                // No hay pagos pero hay valor total
                status = 'pending';
                progress = 0;
                description = 'Sin pagos procesados aún';
                notes = `Valor total: $${valorTotal.toLocaleString()}`;
            }
        }
        else {
            // No se pudo extraer valor total
            status = 'pending';
            progress = 0;
            description = 'Información de pagos no disponible';
            notes = 'No se pudo extraer valor total de la operación';
        }
    }
    catch (error) {
        console.error('❌ Error procesando Estado 3:', error);
        status = 'pending';
        progress = 0;
        description = 'Error procesando información de pagos';
        notes = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
    return {
        id: 3,
        name: 'Procesamiento de Pago',
        status,
        progress,
        description,
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };
}
/**
 * Función auxiliar para extraer valores solicitados de texto
 */
function extractValoresSolicitados(infoGeneral, infoGiros) {
    const valores = [];
    const textoCompleto = `${infoGeneral} ${infoGiros}`;
    console.log('🔍 Buscando valores solicitados en texto...');
    // Buscar SOLO bloques que contengan "VALOR SOLICITADO:" específicamente
    // Excluir explícitamente secciones bancarias para evitar confusiones
    const bloquesSolicitados = textoCompleto.split(/(?=VALOR SOLICITADO:)/i).filter(bloque => {
        const tieneValorSolicitado = bloque.includes('VALOR SOLICITADO:');
        const esSeccionBancaria = bloque.includes('DATOS BANCARIOS') ||
            bloque.includes('BENEFICIARIO:') ||
            bloque.includes('NÚMERO DE CUENTA:') ||
            bloque.includes('BANCO:') ||
            bloque.includes('SWIFT:');
        return tieneValorSolicitado && !esSeccionBancaria;
    });
    console.log(`📊 Encontrados ${bloquesSolicitados.length} bloques con VALOR SOLICITADO válidos`);
    // Extraer valores solo de bloques válidos
    bloquesSolicitados.forEach((bloque, index) => {
        const match = bloque.match(/VALOR SOLICITADO:\s*(\d+(?:\.\d+)?)/i);
        if (match) {
            const valor = parseFloat(match[1]);
            if (!isNaN(valor) && valor > 0) {
                valores.push(valor);
                console.log(`💰 Valor solicitado encontrado: $${valor.toLocaleString()}`);
            }
        }
        else {
            console.log(`⚠️ Bloque ${index + 1} descartado - no contiene valor válido`);
        }
    });
    if (valores.length === 0) {
        console.log('ℹ️ No se encontraron valores con "VALOR SOLICITADO" específicos - esto es correcto si no hay giros');
    }
    return valores;
}
/**
 * Extrae información de liberaciones del texto
 * Busca patrones como "Liberación 1", "Capital: XXXX USD", "Fecha: YYYY-MM-DD"
 */
function extractLiberaciones(infoGeneral) {
    const liberaciones = [];
    console.log('📋 Buscando liberaciones en texto...');
    try {
        // Buscar bloques que contengan "Liberación" seguido de información
        // Mejorar la detección para capturar múltiples liberaciones
        const bloquesLiberacion = infoGeneral.split(/(?=Liberación\s+\d+|Liberacion\s+\d+|-\s*Liberación|\n\s*Liberación)/i).filter(bloque => {
            const match = bloque.match(/Liberación\s*\d+|Liberacion\s*\d+/i);
            return match && bloque.trim().length > 10; // Al menos 10 caracteres para ser válido
        });
        console.log(`📊 Encontrados ${bloquesLiberacion.length} bloques de liberaciones`);
        bloquesLiberacion.forEach((bloque, index) => {
            try {
                // Extraer número de liberación
                const numeroMatch = bloque.match(/Liberación\s+(\d+)|Liberacion\s+(\d+)/i);
                const numero = numeroMatch ? parseInt(numeroMatch[1] || numeroMatch[2]) : index + 1;
                // Extraer capital - buscar patrones con números seguidos de moneda
                const capitalPatterns = [
                    /Capital:\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
                    /Capital:\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
                    /Capital\s+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
                    /(\d+(?:,\d{3})*(?:\.\d+)?)\s+USD/i,
                    // Patrón más flexible para números dentro del bloque de liberación
                    /(\d{4,})/i // Cualquier número de 4+ dígitos en el bloque de liberación
                ];
                let capital = 0;
                for (const pattern of capitalPatterns) {
                    const match = bloque.match(pattern);
                    if (match) {
                        const valorStr = match[1].replace(/,/g, '');
                        capital = parseFloat(valorStr);
                        if (!isNaN(capital) && capital > 0) {
                            console.log(`💰 Capital encontrado: $${capital.toLocaleString()}`);
                            break;
                        }
                    }
                }
                // Extraer fecha
                const fechaPatterns = [
                    /Fecha:\s*(\d{4}-\d{2}-\d{2})/i,
                    /(\d{4}-\d{2}-\d{2})/,
                    /(\d{2}\/\d{2}\/\d{4})/,
                    /(\d{2}-\d{2}-\d{4})/
                ];
                let fecha = '';
                for (const pattern of fechaPatterns) {
                    const match = bloque.match(pattern);
                    if (match) {
                        fecha = match[1];
                        // Normalizar formato de fecha
                        if (fecha.includes('/')) {
                            const [dia, mes, año] = fecha.split('/');
                            fecha = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                        }
                        else if (fecha.match(/\d{2}-\d{2}-\d{4}/)) {
                            const [dia, mes, año] = fecha.split('-');
                            fecha = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                        }
                        break;
                    }
                }
                // Solo agregar si tiene al menos capital válido
                if (capital > 0) {
                    liberaciones.push({
                        numero,
                        capital,
                        fecha: fecha || new Date().toISOString().split('T')[0] // Fecha actual como fallback
                    });
                    console.log(`📅 Liberación ${numero} extraída: $${capital.toLocaleString()} - ${fecha || 'fecha no especificada'}`);
                }
                else {
                    console.log(`⚠️ Bloque de liberación ${index + 1} descartado - sin capital válido`);
                }
            }
            catch (error) {
                console.warn(`⚠️ Error procesando bloque de liberación ${index + 1}:`, error);
            }
        });
        if (liberaciones.length === 0) {
            console.log('ℹ️ No se encontraron liberaciones con datos válidos');
        }
    }
    catch (error) {
        console.error('❌ Error extrayendo liberaciones:', error);
    }
    return liberaciones;
}
/**
 * Estado 4: Envío y Logística
 * NUEVA LÓGICA: Basado en datos de "Liberación" en "5. Info Gnal + Info Compra Int"
 * Completo cuando la suma de liberaciones es igual o cercana al valor total
 */
function mapState4_EnvioYLogistica(csvRow) {
    const estadoProforma = csvRow['9. ESTADO Proforma / Factura final'] || '';
    const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || '';
    console.log('🚚 Estado 4 - Envío y Logística (basado en Liberaciones)');
    let status = 'pending';
    let progress = 0;
    let description = 'Esperando información de liberaciones';
    let notes = '';
    try {
        // Parsear info general para obtener valor total
        const parsedInfo = (0, csvMappers_1.parseInfoGeneralColumn)(infoGeneral);
        const valorTotal = parsedInfo.valor;
        // Extraer información de liberaciones
        const liberaciones = extractLiberaciones(infoGeneral);
        const totalLiberado = liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
        const proformaLower = estadoProforma.toLowerCase().trim();
        console.log('🚚 Análisis Envío y Logística:', {
            factura: estadoProforma,
            facturaLista: proformaLower.includes('listo'),
            valorTotal,
            totalLiberado,
            liberaciones: liberaciones.length
        });
        // PRIMERO: Verificar si la factura final está lista (condición para INICIAR)
        const facturaFinalLista = proformaLower.includes('listo');
        if (!facturaFinalLista) {
            // Sin factura final lista = PENDIENTE
            status = 'pending';
            progress = 0;
            description = 'Esperando factura final para iniciar envío';
            notes = `Estado factura: ${estadoProforma || 'Sin información'}`;
        }
        else {
            // SEGUNDO: Factura lista, ahora verificar liberaciones para COMPLETAR
            if (valorTotal > 0 && liberaciones.length > 0) {
                const porcentajeLiberado = (totalLiberado / valorTotal) * 100;
                // COMPLETADO: Liberaciones cubren 98% o más del valor total
                if (porcentajeLiberado >= 98) {
                    status = 'completed';
                    progress = 100;
                    description = `Envío completado - Liberaciones: $${totalLiberado.toLocaleString()}`;
                    notes = `Factura: Lista | Total: $${valorTotal.toLocaleString()}, Liberado: $${totalLiberado.toLocaleString()} (${liberaciones.length} liberación(es))`;
                }
                else if (totalLiberado > 0) {
                    // EN PROCESO: Factura lista + liberaciones parciales
                    status = 'in-progress';
                    progress = Math.max(50, Math.round(porcentajeLiberado)); // Mínimo 50% porque factura está lista
                    description = `Envío en proceso - Liberaciones: ${Math.round(porcentajeLiberado)}% completadas`;
                    notes = `Factura: Lista | Liberado: $${totalLiberado.toLocaleString()}/${valorTotal.toLocaleString()} (${liberaciones.length} liberación(es))`;
                }
            }
            else if (liberaciones.length > 0) {
                // Factura lista + liberaciones sin valor total conocido
                status = 'in-progress';
                progress = 70;
                description = 'Envío en proceso - Verificando completitud de liberaciones';
                notes = `Factura: Lista | ${liberaciones.length} liberación(es) por $${totalLiberado.toLocaleString()}`;
            }
            else {
                // Factura lista pero SIN liberaciones aún
                status = 'in-progress';
                progress = 50;
                description = 'Factura final lista - Esperando liberaciones';
                notes = `Factura: ${estadoProforma} | ${valorTotal > 0 ? `Valor total: $${valorTotal.toLocaleString()} - ` : ''}Sin liberaciones aún`;
            }
        }
    }
    catch (error) {
        console.error('❌ Error procesando Estado 4:', error);
        status = 'pending';
        progress = 0;
        description = 'Error procesando información de liberaciones';
        notes = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
    return {
        id: 4,
        name: 'Envío y Logística',
        status,
        progress,
        description,
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };
}
/**
 * Estado 5: Operación Completada
 * Basado en la evaluación general de todos los estados anteriores
 * Se considera completada cuando todos los estados previos están al 100%
 */
function mapState5_OperacionCompletada(csvRow) {
    console.log('🎯 Estado 5 - Operación Completada');
    let status = 'pending';
    let progress = 0;
    let description = 'Operación en proceso';
    let notes = '';
    try {
        // Evaluar estados previos para determinar completitud
        const state1 = mapState1_SolicitudEnviada(csvRow);
        const state2 = mapState2_DocumentosYCuota(csvRow);
        const state3 = mapState3_ProcesamientoPago(csvRow);
        const state4 = mapState4_EnvioYLogistica(csvRow);
        const previousStates = [state1, state2, state3, state4];
        const completedStates = previousStates.filter(s => s.status === 'completed');
        const inProgressStates = previousStates.filter(s => s.status === 'in-progress');
        console.log('📊 Análisis estados previos:', {
            completed: completedStates.length,
            inProgress: inProgressStates.length,
            total: previousStates.length
        });
        if (completedStates.length === 4) {
            // COMPLETADO: Las 4 fases anteriores están completadas
            status = 'completed';
            progress = 100;
            description = 'Operación completada exitosamente';
            notes = 'Todas las fases completadas: Solicitud, Documentos, Pagos y Envío';
        }
        else if (completedStates.length > 0 || inProgressStates.length > 0) {
            // EN PROCESO: Al menos algunas fases completadas o en proceso
            const progressBase = Math.round((completedStates.length / 4) * 100);
            // Añadir progreso parcial de estados en proceso
            let additionalProgress = 0;
            inProgressStates.forEach(state => {
                additionalProgress += (state.progress || 0) * 0.25 / 100; // 25% de peso por fase
            });
            status = 'in-progress';
            progress = Math.min(95, Math.round(progressBase + additionalProgress));
            description = `Operación en progreso: ${completedStates.length}/4 fases completadas`;
            notes = `Completadas: ${completedStates.map(s => s.name.split(' ')[0]).join(', ')}${inProgressStates.length > 0 ? ` | En proceso: ${inProgressStates.length}` : ''}`;
        }
        else {
            // Estados iniciales
            status = 'pending';
            progress = 0;
            description = 'Operación pendiente de inicio';
            notes = 'Esperando inicio de procesos';
        }
    }
    catch (error) {
        console.error('❌ Error procesando Estado 5:', error);
        status = 'pending';
        progress = 0;
        description = 'Error evaluando completitud de operación';
        notes = `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;
    }
    return {
        id: 5,
        name: 'Operación Completada',
        status,
        progress,
        description,
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
    };
}
/**
 * Función principal que mapea todos los estados del timeline
 */
function mapCompleteTimeline(csvRow) {
    console.log('🔄 Mapeando timeline completo para operación...');
    const state1 = mapState1_SolicitudEnviada(csvRow);
    const state2 = mapState2_DocumentosYCuota(csvRow);
    const state3 = mapState3_ProcesamientoPago(csvRow);
    // Estados 4 y 5 - Implementación completa
    const state4 = mapState4_EnvioYLogistica(csvRow);
    const state5 = mapState5_OperacionCompletada(csvRow);
    const states = [state1, state2, state3, state4, state5];
    // Determinar estado actual (primer estado no completado)
    let currentState = 5; // Por defecto, todo completado
    for (let i = 0; i < states.length; i++) {
        if (states[i].status !== 'completed') {
            currentState = i + 1;
            break;
        }
    }
    // Calcular progreso general
    const overallProgress = Math.round(states.reduce((sum, state) => sum + state.progress, 0) / states.length);
    console.log('✅ Timeline mapeado:', {
        currentState,
        overallProgress,
        states: states.map(s => ({ id: s.id, status: s.status, progress: s.progress }))
    });
    return {
        states,
        currentState,
        overallProgress
    };
}
//# sourceMappingURL=timelineMapper.js.map