"use strict";
/**
 * Funciones de mapeo específicas para conectar datos CSV con dashboard
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInfoGeneralColumn = parseInfoGeneralColumn;
exports.calculateProgressFromProceso = calculateProgressFromProceso;
exports.extractClientNit = extractClientNit;
exports.mapCSVToOperationCard = mapCSVToOperationCard;
exports.mapMultipleCSVToCards = mapMultipleCSVToCards;
exports.validateCSVRow = validateCSVRow;
// Import timeline types
const timelineMapper_1 = require("./timelineMapper");
/**
 * 1. Función para parsear la columna "5.Info Gnal + Info Compra Int"
 * Extrae cliente, valor total y ruta (países origen/destino)
 */
function parseInfoGeneralColumn(infoGeneralValue) {
    console.log('📋 Parseando columna Info General:', infoGeneralValue?.substring(0, 100) + '...');
    try {
        if (!infoGeneralValue || typeof infoGeneralValue !== 'string') {
            return {
                cliente: '',
                proveedor: '',
                valor: 0,
                ruta: '',
                moneda: 'USD'
            };
        }
        const cleanText = infoGeneralValue
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
        // Extraer cliente usando patrones múltiples
        const clientePatterns = [
            /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i,
            /Cliente:\s*(.+?)(?=\n|País|$)/i,
            /NOMBRE CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i
        ];
        let cliente = '';
        for (const pattern of clientePatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                cliente = match[1].trim();
                break;
            }
        }
        // Extraer proveedor/beneficiario - solo el nombre, no toda la información
        const proveedorPatterns = [
            // Patrón que se detiene en la primera coma, salto de línea, o información adicional
            /BENEFICIARIO:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|BANCO|DIRECCION|ADDRESS|TEL|PHONE|\d{3,}|$)/i,
            /Beneficiario:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|Banco|Direccion|Address|Tel|Phone|\d{3,}|$)/i,
            /PROVEEDOR:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|BANCO|DIRECCION|ADDRESS|TEL|PHONE|\d{3,}|$)/i,
            /Proveedor:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|Banco|Direccion|Address|Tel|Phone|\d{3,}|$)/i,
            // Patrones más simples si los anteriores no funcionan
            /BENEFICIARIO:\s*([A-Za-z\s]{5,30})/i,
            /beneficiario:\s*([A-Za-z\s]{5,30})/i
        ];
        let proveedor = '';
        for (let i = 0; i < proveedorPatterns.length; i++) {
            const pattern = proveedorPatterns[i];
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                proveedor = match[1].trim()
                    .replace(/,$/, '') // Remover coma al final
                    .replace(/\s+/g, ' ') // Normalizar espacios
                    .trim();
                // Validar que el resultado no sea muy largo (probablemente incluye info extra)
                if (proveedor.length <= 50 && proveedor.length >= 3) {
                    console.log(`🏢 Proveedor extraído: "${proveedor}" con patrón ${i + 1}`);
                    break;
                }
                else {
                    console.log(`🚫 Proveedor descartado (muy largo): "${proveedor.substring(0, 100)}..."`);
                    proveedor = ''; // Reset para probar siguiente patrón
                }
            }
        }
        // Log del texto para debugging
        if (!proveedor) {
            console.log('🔍 Texto completo para debugging beneficiario:', cleanText.substring(0, 800));
        }
        // Extraer valor total usando patrones múltiples más precisos
        const valorPatterns = [
            /VALOR TOTAL DE COMPRA:\s*([\d,\.]+)/i,
            /VALOR TOTAL:\s*([\d,\.]+)/i,
            /MONTO:\s*([\d,\.]+)/i,
            /VALOR:\s*([\d,\.]+)/i,
            // Patrones adicionales para casos específicos
            /COMPRA:\s*([\d,\.]+)/i,
            /([\d,\.]+)\s*USD/i,
            /([\d,\.]+)\s*EUR/i
        ];
        let valor = 0;
        for (const pattern of valorPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                // Limpiar el valor: remover comas, mantener solo números y punto decimal
                const cleanValue = match[1].replace(/,/g, '').replace(/[^\d\.]/g, '');
                const parsedValue = parseFloat(cleanValue);
                if (!isNaN(parsedValue) && parsedValue > 0) {
                    valor = parsedValue;
                    console.log(`💰 Valor extraído: ${valor} de "${match[1]}"`);
                    break;
                }
            }
        }
        // Si no encontramos valor con patrones, buscar números grandes en el texto
        if (valor === 0) {
            const numberMatches = cleanText.match(/([\d,\.]+)/g);
            if (numberMatches) {
                for (const numStr of numberMatches) {
                    const cleanNum = numStr.replace(/,/g, '').replace(/[^\d\.]/g, '');
                    const num = parseFloat(cleanNum);
                    if (!isNaN(num) && num >= 1000) { // Asumimos que valores de operaciones son >= 1000
                        valor = num;
                        console.log(`💰 Valor inferido: ${valor} de "${numStr}"`);
                        break;
                    }
                }
            }
        }
        // Extraer países para formar la ruta
        const paisImportadorPatterns = [
            /PAÍS IMPORTADOR:\s*(.+?)(?=\n|PAÍS|$)/i,
            /País Importador:\s*(.+?)(?=\n|País|$)/i,
            /DESTINO:\s*(.+?)(?=\n|ORIGEN|$)/i
        ];
        const paisExportadorPatterns = [
            /PAÍS EXPORTADOR:\s*(.+?)(?=\n|VALOR|$)/i,
            /País Exportador:\s*(.+?)(?=\n|Valor|$)/i,
            /ORIGEN:\s*(.+?)(?=\n|DESTINO|$)/i
        ];
        let paisImportador = '';
        let paisExportador = '';
        for (const pattern of paisImportadorPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                paisImportador = match[1].trim();
                break;
            }
        }
        for (const pattern of paisExportadorPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                paisExportador = match[1].trim();
                break;
            }
        }
        // Formar ruta
        const ruta = paisExportador && paisImportador
            ? `${paisExportador} → ${paisImportador}`
            : paisExportador || paisImportador || '';
        // Extraer moneda
        const monedaPatterns = [
            /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i,
            /MONEDA:\s*([A-Z]{3})/i,
            /CURRENCY:\s*([A-Z]{3})/i
        ];
        let moneda = 'USD';
        for (const pattern of monedaPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                moneda = match[1].toUpperCase();
                break;
            }
        }
        const result = {
            cliente: cliente || 'Cliente no especificado',
            proveedor: proveedor || 'Proveedor no especificado',
            valor: valor || 0,
            ruta: ruta || 'Ruta no especificada',
            moneda: moneda
        };
        console.log('✅ Info general parseada:', result);
        return result;
    }
    catch (error) {
        console.error('❌ Error parseando info general:', error);
        return {
            cliente: 'Error en parsing',
            proveedor: 'Error en parsing',
            valor: 0,
            ruta: 'Error en parsing',
            moneda: 'USD'
        };
    }
}
/**
 * 2. Función para calcular progreso basado en la columna "Proceso"
 * Mapea los 6 pasos específicos con sus porcentajes exactos
 */
function calculateProgressFromProceso(procesoValue) {
    console.log('📊 Calculando progreso de proceso:', procesoValue);
    try {
        if (!procesoValue || typeof procesoValue !== 'string') {
            return {
                currentStep: 0,
                percentage: 0,
                stepName: 'Sin información',
                isCompleted: false
            };
        }
        const cleanProceso = procesoValue.toLowerCase().trim();
        // Definir los 6 pasos específicos con sus porcentajes
        const processSteps = [
            {
                step: 1,
                keywords: ['aprobación de cotización', 'cotización', 'aprobacion'],
                percentage: 16.67,
                name: 'Aprobación de Cotización'
            },
            {
                step: 2,
                keywords: ['docu legal gnal', 'cuota op', 'nego int', 'documentos legal', 'negociacion'],
                percentage: 33.33,
                name: 'Docu Legal Gnal / Cuota Op / Nego Int'
            },
            {
                step: 3,
                keywords: ['componente no 1', 'plataforma', 'giro 1', 'proveedor internacional'],
                percentage: 50.0,
                name: 'Componente No 1 Plataforma - Giro 1 Proveedor Internacional'
            },
            {
                step: 4,
                keywords: ['componente no 2', 'giro 2', 'segundo giro'],
                percentage: 66.67,
                name: 'Componente No 2 Plataforma y Giro 2 Proveedor Internacional'
            },
            {
                step: 5,
                keywords: ['componente financiamiento logístico', 'financiamiento logistico', 'logistica'],
                percentage: 83.33,
                name: 'Componente Financiamiento Logístico'
            },
            {
                step: 6,
                keywords: ['liberación de mercancía', 'liberacion', 'mercancia', 'completado'],
                percentage: 100.0,
                name: 'Liberación de Mercancía'
            }
        ];
        // Buscar coincidencia con los pasos
        for (const processStep of processSteps) {
            const hasMatch = processStep.keywords.some(keyword => cleanProceso.includes(keyword.toLowerCase()));
            if (hasMatch) {
                console.log(`✅ Paso encontrado: ${processStep.step} - ${processStep.name} (${processStep.percentage}%)`);
                return {
                    currentStep: processStep.step,
                    percentage: Math.round(processStep.percentage * 100) / 100, // Redondear a 2 decimales
                    stepName: processStep.name,
                    isCompleted: processStep.step === 6
                };
            }
        }
        // Si no hay coincidencia exacta, intentar detectar progreso parcial
        if (cleanProceso.includes('en proceso') || cleanProceso.includes('proceso')) {
            return {
                currentStep: 1,
                percentage: 8.33, // Aproximadamente la mitad del primer paso
                stepName: 'En proceso',
                isCompleted: false
            };
        }
        if (cleanProceso.includes('iniciado') || cleanProceso.includes('comenzado')) {
            return {
                currentStep: 1,
                percentage: 5.0,
                stepName: 'Iniciado',
                isCompleted: false
            };
        }
        // Valor por defecto si no se encuentra información
        return {
            currentStep: 0,
            percentage: 0,
            stepName: 'Sin información de proceso',
            isCompleted: false
        };
    }
    catch (error) {
        console.error('❌ Error calculando progreso:', error);
        return {
            currentStep: 0,
            percentage: 0,
            stepName: 'Error en cálculo',
            isCompleted: false
        };
    }
}
/**
 * 3. Función para extraer NIT/RFC de la columna "1. Docu. Cliente"
 * Extrae el NIT/RFC del cliente desde la documentación
 */
function extractClientNit(docuClienteValue) {
    console.log('🆔 Extrayendo NIT/RFC del cliente:', docuClienteValue?.substring(0, 50) + '...');
    try {
        if (!docuClienteValue || typeof docuClienteValue !== 'string') {
            return 'Sin NIT';
        }
        const cleanText = docuClienteValue.trim();
        // Patrones para encontrar NIT/RFC/RUT
        const nitPatterns = [
            /NIT[:\s]*([0-9]{9,10}[\-]?[0-9]?)/i,
            /RFC[:\s]*([A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3})/i,
            /RUT[:\s]*([0-9]{1,2}\.[0-9]{3}\.[0-9]{3}[\-][0-9Kk])/i,
            /CÉDULA[:\s]*([0-9]{8,10})/i,
            /([0-9]{9,10}[\-][0-9])/g, // Patrón genérico NIT
            /([A-Z]{4}[0-9]{6}[A-Z0-9]{3})/g // Patrón genérico RFC
        ];
        for (const pattern of nitPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                const nit = match[1].trim();
                console.log('✅ NIT/RFC encontrado:', nit);
                return nit;
            }
        }
        // Buscar números largos que puedan ser NITs
        const numberMatch = cleanText.match(/([0-9]{8,12})/);
        if (numberMatch && numberMatch[1]) {
            const nit = numberMatch[1];
            console.log('✅ Posible NIT numérico encontrado:', nit);
            return nit;
        }
        // Si no se encuentra, buscar cualquier identificador alfanumérico
        const alphaMatch = cleanText.match(/([A-Z0-9]{8,15})/i);
        if (alphaMatch && alphaMatch[1]) {
            const id = alphaMatch[1].toUpperCase();
            console.log('✅ Identificador alfanumérico encontrado:', id);
            return id;
        }
        return 'Sin NIT';
    }
    catch (error) {
        console.error('❌ Error extrayendo NIT:', error);
        return 'Error NIT';
    }
}
/**
 * 4. Función principal de mapeo CSV a OperationCard para Dashboard
 * Combina todas las funciones anteriores para transformar una fila CSV completa
 */
function mapCSVToOperationCard(csvRow) {
    console.log('🎯 Mapeando fila CSV a OperationCard para dashboard...');
    try {
        // Extraer campos específicos del CSV
        const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || ''; // CORREGIDO
        const proceso = csvRow['Proceso'] || '';
        const equipoComercial = csvRow['15. Equipo Comercial'] || '';
        const docuCliente = csvRow['1. Docu. Cliente'] || '';
        const operationId = csvRow['ID'] || csvRow['id'] || generateConsistentOperationId(csvRow);
        // Parsear información general usando funciones existentes
        const parsedInfo = parseInfoGeneralColumn(infoGeneral);
        // Extraer NIT del cliente
        const clientNit = extractClientNit(docuCliente);
        // Calcular progreso
        const progressInfo = calculateProgressFromProceso(proceso);
        // Generar timeline de 5 estados
        const timeline = (0, timelineMapper_1.mapCompleteTimeline)(csvRow);
        // Usar progreso del timeline si está disponible, sino usar el calculado anterior
        const finalProgress = timeline ? timeline.overallProgress : Math.round(progressInfo.percentage);
        // Determinar estado basado en el progreso del timeline o el método anterior
        let status;
        let currentPhaseName;
        // Determinar la fase actual del timeline
        if (timeline && timeline.states) {
            const activePhase = timeline.states.find(state => state.status === 'in-progress');
            const completedPhases = timeline.states.filter(state => state.status === 'completed');
            if (activePhase) {
                currentPhaseName = activePhase.name;
                status = 'in-progress';
            }
            else if (completedPhases.length === timeline.states.length) {
                // Todas las fases completadas
                currentPhaseName = 'Completada';
                status = 'completed';
            }
            else if (completedPhases.length > 0) {
                // Hay fases completadas pero no todas
                const lastCompletedPhase = completedPhases[completedPhases.length - 1];
                const nextPhaseIndex = timeline.states.findIndex(state => state.id === lastCompletedPhase.id) + 1;
                if (nextPhaseIndex < timeline.states.length) {
                    currentPhaseName = timeline.states[nextPhaseIndex].name;
                    status = 'in-progress';
                }
                else {
                    currentPhaseName = 'Completada';
                    status = 'completed';
                }
            }
            else {
                currentPhaseName = timeline.states[0].name;
                status = 'draft';
            }
        }
        else {
            // Fallback al método anterior si no hay timeline
            if (progressInfo.isCompleted) {
                status = 'completed';
                currentPhaseName = 'Completada';
            }
            else if (progressInfo.currentStep > 0) {
                status = 'in-progress';
            }
            else if (progressInfo.currentStep === 0 && proceso.toLowerCase().includes('hold')) {
                status = 'on-hold';
            }
            else {
                status = 'draft';
            }
        }
        // Formatear valor total con moneda
        const formattedValue = parsedInfo.valor > 0
            ? `$${parsedInfo.valor.toLocaleString()} ${parsedInfo.moneda}`
            : 'Valor no disponible';
        // Construir objeto OperationCard
        const operationCard = {
            id: operationId,
            clientName: parsedInfo.cliente || 'Cliente no especificado',
            clientNit: clientNit,
            providerName: parsedInfo.proveedor || 'Proveedor no especificado', // NUEVO: Proveedor
            totalValue: formattedValue,
            totalValueNumeric: parsedInfo.valor || 0, // NUEVO: Valor numérico
            route: parsedInfo.ruta || 'Ruta no especificada',
            assignedPerson: equipoComercial || 'No asignado',
            progress: finalProgress,
            status,
            currentPhaseName, // NUEVO: Nombre de la fase actual
            timeline: timeline, // NUEVO: Timeline de 5 estados
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        console.log('✅ OperationCard creada:', {
            id: operationCard.id,
            clientName: operationCard.clientName,
            clientNit: operationCard.clientNit,
            progress: operationCard.progress,
            status: operationCard.status
        });
        return operationCard;
    }
    catch (error) {
        console.error('❌ Error mapeando CSV a OperationCard:', error);
        // Retornar OperationCard por defecto en caso de error
        return {
            id: generateOperationId(),
            clientName: 'Error en mapeo',
            clientNit: 'Error NIT',
            providerName: 'Error en mapeo', // NUEVO: Proveedor
            totalValue: '$0 USD',
            totalValueNumeric: 0, // NUEVO: Valor numérico
            route: 'Error en mapeo',
            assignedPerson: 'No asignado',
            progress: 0,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}
/**
 * 6. Función para mapear múltiples filas CSV a OperationCard
 * Procesa un array completo de datos CSV para el dashboard
 */
function mapMultipleCSVToCards(csvRows) {
    console.log(`🎯 Mapeando ${csvRows.length} filas CSV a OperationCards...`);
    return csvRows.map((row, index) => {
        try {
            return mapCSVToOperationCard(row);
        }
        catch (error) {
            console.error(`❌ Error en fila ${index}:`, error);
            return mapCSVToOperationCard({}); // OperationCard por defecto
        }
    });
}
// Funciones auxiliares
function generateOperationId() {
    return `OP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}
// Generate consistent operation ID based on CSV row data
function generateConsistentOperationId(csvRow) {
    // Create a unique identifier based on stable CSV data
    const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || '';
    const docuCliente = csvRow['1. Docu. Cliente'] || '';
    const equipoComercial = csvRow['15. Equipo Comercial'] || '';
    // Extract client name and value for unique ID
    const parsedInfo = parseInfoGeneralColumn(infoGeneral);
    const clientNit = extractClientNit(docuCliente);
    // Create hash-like ID from stable data
    const dataString = `${parsedInfo.cliente}-${clientNit}-${parsedInfo.valor}-${equipoComercial}`;
    const hash = dataString
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .toUpperCase()
        .substring(0, 12); // Take first 12 characters
    // Add index based on client + value to ensure uniqueness
    const shortHash = Math.abs(hashCode(dataString)).toString(36).toUpperCase().substring(0, 4);
    return `OP-${hash}-${shortHash}`;
}
// Simple hash function for consistent ID generation
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
}
/**
 * 5. Función para validar datos CSV antes del mapeo
 * Verifica que los campos críticos estén presentes
 */
function validateCSVRow(csvRow) {
    const errors = [];
    const warnings = [];
    // Verificar campos críticos - CORREGIR nombres exactos del CSV
    const criticalFields = [
        '5. Info Gnal + Info Compra Int', // CORREGIDO: agregar espacio después del 5
        'Proceso',
        '15. Equipo Comercial'
    ];
    criticalFields.forEach(field => {
        if (!csvRow[field] || csvRow[field].trim() === '') {
            if (field === '5. Info Gnal + Info Compra Int') {
                // CAMBIO: Solo warning en lugar de error para ser menos estricto
                warnings.push(`Campo crítico con datos faltantes: ${field}`);
            }
            else {
                warnings.push(`Campo recomendado faltante: ${field}`);
            }
        }
    });
    // Validar que la info general tenga contenido mínimo
    const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || ''; // CORREGIDO: nombre exacto
    if (infoGeneral.length < 20) { // REDUCIDO: de 50 a 20 caracteres para ser menos estricto
        warnings.push('Información general muy breve, puede afectar el parsing');
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=csvMappers.js.map