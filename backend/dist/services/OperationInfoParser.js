"use strict";
/**
 * Parser robusto para extraer información del campo "5. Info Gnal + Info Compra Int"
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationInfoParser = void 0;
exports.parseOperationInfo = parseOperationInfo;
exports.extractGiros = extractGiros;
exports.extractLiberaciones = extractLiberaciones;
exports.extractDatosBancarios = extractDatosBancarios;
exports.extractValue = extractValue;
exports.extractNumber = extractNumber;
const Operation_1 = require("../types/Operation");
/**
 * Función principal que parsea todo el texto de la operación
 */
function parseOperationInfo(text, csvRow) {
    console.log('🔍 Iniciando parsing de información de operación...');
    try {
        // Limpiar texto de entrada
        const cleanText = text
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        console.log('📄 Texto limpio, extrayendo campos...');
        // Extraer información básica usando las funciones específicas
        const cliente = extractValue(cleanText, /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i) || '';
        const paisImportador = extractValue(cleanText, /PAÍS IMPORTADOR:\s*(.+?)(?=\n|PAÍS|$)/i) || '';
        const paisExportador = extractValue(cleanText, /PAÍS EXPORTADOR:\s*(.+?)(?=\n|VALOR|$)/i) || '';
        const valorTotalCompra = extractNumber(cleanText, /VALOR TOTAL DE COMPRA:\s*(\d+(?:\.\d+)?)/i);
        // Extraer moneda
        const monedaText = extractValue(cleanText, /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i) || 'USD';
        const monedaPago = Operation_1.Currency[monedaText] || Operation_1.Currency.USD;
        const terminosPago = extractValue(cleanText, /TÉRMINOS DE PAGO:\s*(.+?)(?=\nDATOS|$)/i) || '';
        // Extraer Incoterms - soportar ambas variantes: ICOTERM e INCOTERM
        const incotermCompra = extractValue(cleanText, /I[NC]?COTERMS? COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) ||
            extractValue(cleanText, /INCOTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) || '';
        const incotermVenta = extractValue(cleanText, /I[NC]?COTERMS? VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) ||
            extractValue(cleanText, /INCOTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) || '';
        // Extraer datos usando funciones específicas
        const datosBancarios = extractDatosBancarios(cleanText);
        const giros = extractGiros(cleanText, csvRow);
        const liberaciones = extractLiberaciones(cleanText);
        const result = {
            cliente,
            paisImportador,
            paisExportador,
            valorTotalCompra,
            monedaPago,
            terminosPago,
            incotermCompra,
            incotermVenta,
            datosBancarios,
            giros,
            liberaciones
        };
        console.log('✅ Parsing completado exitosamente:', {
            cliente,
            valorTotal: valorTotalCompra,
            numGiros: giros.length,
            numLiberaciones: liberaciones.length
        });
        return result;
    }
    catch (error) {
        console.error('❌ Error durante el parsing:', error);
        // Retornar objeto con valores por defecto en caso de error
        return {
            cliente: '',
            paisImportador: '',
            paisExportador: '',
            valorTotalCompra: 0,
            monedaPago: Operation_1.Currency.USD,
            terminosPago: '',
            incotermCompra: '',
            incotermVenta: '',
            datosBancarios: {
                beneficiario: '',
                banco: '',
                direccion: '',
                numeroCuenta: '',
                swift: '',
                paisBanco: ''
            },
            giros: [],
            liberaciones: []
        };
    }
}
/**
 * Extrae información de giros del texto
 */
function extractGiros(text, csvRow) {
    console.log('💰 Extrayendo información de giros...');
    try {
        const giros = [];
        // Patrón mejorado para capturar giros con formato de CSV multilinea
        // Formato: - VALOR SOLICITADO: 75000\n- NÚMERO DE GIRO: 1° Giro a Proveedor\n- PORCENTAJE DE GIRO: 70% del total
        const giroPattern = /-\s*VALOR SOLICITADO:\s*([0-9,]+(?:\.[0-9]+)?)\s*[\n\r]*-\s*NÚMERO DE GIRO:\s*([^\n\r]+)[\n\r]*-\s*PORCENTAJE DE GIRO:\s*([^\n\r]+)/gi;
        // También buscar formato con formato de líneas separadas
        const giroPattern2 = /VALOR SOLICITADO:\s*([0-9,]+(?:\.[0-9]+)?)\s*[\n\r]*.*?NÚMERO DE GIRO:\s*([^\n\r]+)[\n\r]*.*?PORCENTAJE DE GIRO:\s*([^\n\r]+)/gi;
        // Patrón adicional para formato con separadores de línea (PRUEBA 2 format)
        // Formato: - VALOR SOLICITADO: 20000\n- NÚMERO DE GIRO: 1er Giro a Proveedor\n- PORCENTAJE DE GIRO: 30% del total\n---------------
        const giroPattern3 = /-\s*VALOR SOLICITADO:\s*([0-9,]+(?:\.[0-9]+)?)\s*[\n\r]+-\s*NÚMERO DE GIRO:\s*([^\n\r-]+)[\n\r]+-\s*PORCENTAJE DE GIRO:\s*([^\n\r-]+)/gi;
        const patterns = [giroPattern, giroPattern2, giroPattern3];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const valorText = match[1];
                const numeroGiroText = match[2];
                const porcentajeGiroText = match[3];
                if (!valorText || !numeroGiroText || !porcentajeGiroText)
                    continue;
                const valorSolicitado = parseFloat(valorText.replace(/,/g, ''));
                const numeroGiro = numeroGiroText.trim();
                const porcentajeGiro = porcentajeGiroText.trim();
                // Validación: debe tener valor válido y no estar duplicado
                const isDuplicate = giros.some(g => g.valorSolicitado === valorSolicitado &&
                    g.numeroGiro === numeroGiro);
                if (valorSolicitado > 0 && numeroGiro && porcentajeGiro && !isDuplicate) {
                    // Determinar estado del giro basado en CSV
                    let estadoGiro = Operation_1.EstadoProceso.PENDIENTE;
                    if (csvRow) {
                        const estadoGiroProveedor = csvRow['10. ESTADO Giro Proveedor'] || '';
                        // Si el campo contiene "Listo" significa que el giro está completado
                        if (estadoGiroProveedor.toLowerCase().includes('listo')) {
                            estadoGiro = Operation_1.EstadoProceso.COMPLETADO;
                        }
                    }
                    giros.push({
                        valorSolicitado,
                        numeroGiro,
                        porcentajeGiro,
                        estado: estadoGiro,
                        fechaVencimiento: undefined
                    });
                    const estadoTexto = estadoGiro === Operation_1.EstadoProceso.COMPLETADO ? 'completado' : 'pendiente';
                    console.log(`💸 Giro extraído (${estadoTexto}): ${numeroGiro} - $${valorSolicitado.toLocaleString()}`);
                }
            }
        }
        if (giros.length === 0) {
            console.log('ℹ️ No se encontraron giros con "VALOR SOLICITADO" válidos en el texto');
        }
        return giros;
    }
    catch (error) {
        console.error('❌ Error extrayendo giros:', error);
        return [];
    }
}
/**
 * Extrae información de liberaciones del texto
 */
function extractLiberaciones(text) {
    console.log('📋 Extrayendo liberaciones ejecutadas...');
    try {
        const liberaciones = [];
        // Patrón mejorado para formato CSV: - Liberación 1 - Capital: 70,000 EUR - Fecha: 2025-07-01
        const liberacionPattern = /-\s*Liberación\s+(\d+)\s*-\s*Capital:\s*([0-9,]+(?:\.[0-9]+)?)\s*(USD|EUR|GBP|COP)?\s*-\s*Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;
        // Patrón alternativo para formatos con saltos de línea
        const liberacionPattern2 = /Liberación\s+(\d+)\s*[\n\r]*.*?Capital:\s*[\n\r]*\s*([0-9,]+(?:\.[0-9]+)?)\s*(USD|EUR|GBP|COP)?\s*[\n\r]*.*?Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;
        // Patrón para formato simple con dos puntos
        const liberacionPattern3 = /Liberación\s+(\d+)[^\n]*[\n\r]*Capital:\s*([0-9,]+(?:\.[0-9]+)?)\s*(USD|EUR|GBP|COP)?[\n\r]*Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;
        // Patrón específico para formato PRUEBA 2 (con saltos de línea entre Capital: y valor)
        // - Liberación 1\n- Capital:\n40000 USD\n- Fecha: 2025-07-25
        const liberacionPattern4 = /-\s*Liberación\s+(\d+)\s*[\n\r]*-\s*Capital:\s*[\n\r]*([0-9,]+(?:\.[0-9]+)?)\s*(USD|EUR|GBP|COP)?\s*[\n\r]*-\s*Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;
        const patterns = [liberacionPattern, liberacionPattern2, liberacionPattern3, liberacionPattern4];
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const numeroText = match[1];
                const capitalText = match[2];
                const moneda = match[3] || '';
                const fecha = match[4];
                if (!numeroText || !capitalText || !fecha)
                    continue;
                const numero = parseInt(numeroText);
                const capital = parseFloat(capitalText.replace(/,/g, ''));
                // Validar que no esté duplicado
                const isDuplicate = liberaciones.some(lib => lib.numero === numero &&
                    lib.capital === capital &&
                    lib.fecha === fecha);
                if (numero > 0 && capital > 0 && fecha && !isDuplicate) {
                    // Determinar estado basado en la fecha
                    const fechaObj = new Date(fecha);
                    const ahora = new Date();
                    const estado = fechaObj <= ahora ? Operation_1.EstadoProceso.COMPLETADO : Operation_1.EstadoProceso.PENDIENTE;
                    liberaciones.push({
                        numero,
                        capital,
                        fecha,
                        estado
                    });
                    const estadoTexto = estado === Operation_1.EstadoProceso.COMPLETADO ? 'ejecutada' : 'programada';
                    console.log(`💰 Liberación ${estadoTexto}: ${numero} - $${capital.toLocaleString()} ${moneda} - ${fecha}`);
                }
            }
        }
        // Ordenar por número de liberación
        liberaciones.sort((a, b) => a.numero - b.numero);
        if (liberaciones.length > 0) {
            const totalLiberaciones = liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
            const ejecutadas = liberaciones.filter(lib => lib.estado === Operation_1.EstadoProceso.COMPLETADO).length;
            const programadas = liberaciones.filter(lib => lib.estado === Operation_1.EstadoProceso.PENDIENTE).length;
            console.log(`✅ ${liberaciones.length} liberaciones encontradas: ${ejecutadas} ejecutadas, ${programadas} programadas. Total: $${totalLiberaciones.toLocaleString()}`);
        }
        else {
            console.log('ℹ️ No se encontraron liberaciones');
        }
        return liberaciones;
    }
    catch (error) {
        console.error('❌ Error extrayendo liberaciones:', error);
        return [];
    }
}
/**
 * Extrae datos bancarios del texto
 */
function extractDatosBancarios(text) {
    console.log('🏦 Extrayendo datos bancarios...');
    try {
        const beneficiario = extractValue(text, /BENEFICIARIO:\s*(.+?)(?=\n|BANCO|$)/i) || '';
        const banco = extractValue(text, /BANCO:\s*(.+?)(?=\n|DIRECCIÓN|$)/i) || '';
        const direccion = extractValue(text, /DIRECCIÓN:\s*(.+?)(?=\n|NÚMERO|$)/i) || '';
        const numeroCuenta = extractValue(text, /NÚMERO DE CUENTA:\s*(.+?)(?=\n|SWIFT|$)/i) || '';
        const swift = extractValue(text, /SWIFT:\s*(.+?)(?=\n|ICOTERM|$)/i) || '';
        const datosBancarios = {
            beneficiario: beneficiario.trim(),
            banco: banco.trim(),
            direccion: direccion.trim(),
            numeroCuenta: numeroCuenta.trim(),
            swift: swift.trim(),
            paisBanco: '' // Se puede inferir de otros campos
        };
        console.log('🏦 Datos bancarios extraídos:', {
            beneficiario: !!datosBancarios.beneficiario,
            banco: !!datosBancarios.banco,
            cuenta: !!datosBancarios.numeroCuenta
        });
        return datosBancarios;
    }
    catch (error) {
        console.error('❌ Error extrayendo datos bancarios:', error);
        return {
            beneficiario: '',
            banco: '',
            direccion: '',
            numeroCuenta: '',
            swift: '',
            paisBanco: ''
        };
    }
}
/**
 * Utilidad para extraer valores usando regex
 */
function extractValue(text, regex) {
    try {
        const match = text.match(regex);
        const value = match?.[1]?.trim() || '';
        if (value) {
            console.log(`🔍 Valor extraído con regex ${regex.source}: "${value}"`);
        }
        return value;
    }
    catch (error) {
        console.error('❌ Error en extractValue:', error);
        return '';
    }
}
/**
 * Utilidad para extraer números usando regex
 */
function extractNumber(text, regex) {
    try {
        const match = text.match(regex);
        const numberStr = match?.[1] || '0';
        const number = parseFloat(numberStr.replace(/,/g, '')) || 0;
        if (number > 0) {
            console.log(`🔢 Número extraído con regex ${regex.source}: ${number}`);
        }
        return number;
    }
    catch (error) {
        console.error('❌ Error en extractNumber:', error);
        return 0;
    }
}
// Clase legacy para compatibilidad con tests existentes
class OperationInfoParser {
    static FIELD_PATTERNS = {
        CLIENTE: /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i,
        PAIS_IMPORTADOR: /PAÍS IMPORTADOR:\s*(.+?)(?=\n|PAÍS|$)/i,
        PAIS_EXPORTADOR: /PAÍS EXPORTADOR:\s*(.+?)(?=\n|VALOR|$)/i,
        VALOR_TOTAL: /VALOR TOTAL DE COMPRA:\s*(\d+(?:\.\d+)?)/i,
        MONEDA_PAGO: /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i,
        TERMINOS_PAGO: /TÉRMINOS DE PAGO:\s*(.+?)(?=\nDATOS|$)/i,
        INCOTERM_COMPRA: /ICOTERM COMPRA:\s*(.+?)(?=\n|ICOTERM|$)/i,
        INCOTERM_VENTA: /ICOTERM VENTA:\s*(.+?)(?=\n|OBSERVACIONES|$)/i,
        // Datos bancarios
        BENEFICIARIO: /BENEFICIARIO:\s*(.+?)(?=\n|BANCO|$)/i,
        BANCO: /BANCO:\s*(.+?)(?=\n|DIRECCIÓN|$)/i,
        DIRECCION: /DIRECCIÓN:\s*(.+?)(?=\n|NÚMERO|$)/i,
        NUMERO_CUENTA: /NÚMERO DE CUENTA:\s*(.+?)(?=\n|SWIFT|$)/i,
        SWIFT: /SWIFT:\s*(.+?)(?=\n|ICOTERM|$)/i,
    };
    static CURRENCY_MAP = {
        'USD': Operation_1.Currency.USD,
        'EUR': Operation_1.Currency.EUR,
        'GBP': Operation_1.Currency.GBP,
        'COP': Operation_1.Currency.COP,
    };
    /**
     * Parser principal que procesa el texto completo
     */
    static parse(rawText) {
        const errors = [];
        const warnings = [];
        try {
            // Limpiar el texto de entrada
            const cleanText = this.cleanInputText(rawText);
            // Extraer campos básicos
            const basicInfo = this.extractBasicInfo(cleanText, errors);
            // Extraer datos bancarios
            const bankingInfo = this.extractBankingInfo(cleanText, errors);
            // Extraer giros
            const giros = this.extractGiros(cleanText, errors, warnings);
            // Extraer liberaciones
            const liberaciones = this.extractLiberaciones(cleanText, errors, warnings);
            // Validar información crítica
            this.validateCriticalInfo(basicInfo, bankingInfo, errors);
            // Construir resultado
            const parsedData = {
                cliente: basicInfo.cliente || '',
                paisImportador: basicInfo.paisImportador || '',
                paisExportador: basicInfo.paisExportador || '',
                valorTotalCompra: basicInfo.valorTotalCompra || 0,
                monedaPago: basicInfo.monedaPago || Operation_1.Currency.USD,
                terminosPago: basicInfo.terminosPago || '',
                incotermCompra: basicInfo.incotermCompra || '',
                incotermVenta: basicInfo.incotermVenta || '',
                datosBancarios: bankingInfo,
                giros,
                liberaciones
            };
            return {
                success: errors.length === 0,
                data: parsedData,
                errors,
                warnings
            };
        }
        catch (error) {
            errors.push({
                field: 'general',
                error: `Error inesperado durante el parsing: ${error instanceof Error ? error.message : 'Error desconocido'}`
            });
            return {
                success: false,
                errors,
                warnings
            };
        }
    }
    /**
     * Limpia el texto de entrada eliminando caracteres especiales y normalizando espacios
     */
    static cleanInputText(text) {
        return text
            .replace(/\r\n/g, '\n') // Normalizar saltos de línea
            .replace(/\r/g, '\n') // Convertir \r a \n
            .replace(/\n{3,}/g, '\n\n') // Reducir múltiples saltos de línea
            .replace(/\s+$/gm, '') // Eliminar espacios al final de líneas
            .trim();
    }
    /**
     * Extrae información básica de la operación
     */
    static extractBasicInfo(text, errors) {
        const info = {};
        // Cliente
        const clienteMatch = text.match(this.FIELD_PATTERNS.CLIENTE);
        if (clienteMatch?.[1]) {
            info.cliente = clienteMatch[1].trim();
        }
        else {
            errors.push({ field: 'cliente', error: 'Campo CLIENTE no encontrado o vacío' });
        }
        // País importador
        const paisImportadorMatch = text.match(this.FIELD_PATTERNS.PAIS_IMPORTADOR);
        if (paisImportadorMatch?.[1]) {
            info.paisImportador = paisImportadorMatch[1].trim();
        }
        else {
            errors.push({ field: 'paisImportador', error: 'Campo PAÍS IMPORTADOR no encontrado' });
        }
        // País exportador
        const paisExportadorMatch = text.match(this.FIELD_PATTERNS.PAIS_EXPORTADOR);
        if (paisExportadorMatch?.[1]) {
            info.paisExportador = paisExportadorMatch[1].trim();
        }
        else {
            errors.push({ field: 'paisExportador', error: 'Campo PAÍS EXPORTADOR no encontrado' });
        }
        // Valor total
        const valorMatch = text.match(this.FIELD_PATTERNS.VALOR_TOTAL);
        if (valorMatch?.[1]) {
            info.valorTotalCompra = parseFloat(valorMatch[1]);
        }
        else {
            errors.push({ field: 'valorTotalCompra', error: 'Campo VALOR TOTAL DE COMPRA no encontrado o inválido' });
        }
        // Moneda
        const monedaMatch = text.match(this.FIELD_PATTERNS.MONEDA_PAGO);
        if (monedaMatch?.[1]) {
            const monedaCode = monedaMatch[1].trim();
            info.monedaPago = this.CURRENCY_MAP[monedaCode] || Operation_1.Currency.USD;
        }
        else {
            errors.push({ field: 'monedaPago', error: 'Campo MONEDA DE PAGO no encontrado, usando USD por defecto' });
            info.monedaPago = Operation_1.Currency.USD;
        }
        // Términos de pago
        const terminosMatch = text.match(this.FIELD_PATTERNS.TERMINOS_PAGO);
        if (terminosMatch?.[1]) {
            info.terminosPago = terminosMatch[1].trim();
        }
        else {
            errors.push({ field: 'terminosPago', error: 'Campo TÉRMINOS DE PAGO no encontrado' });
        }
        // Incoterms
        const incotermCompraMatch = text.match(this.FIELD_PATTERNS.INCOTERM_COMPRA);
        if (incotermCompraMatch?.[1]) {
            info.incotermCompra = incotermCompraMatch[1].trim();
        }
        const incotermVentaMatch = text.match(this.FIELD_PATTERNS.INCOTERM_VENTA);
        if (incotermVentaMatch?.[1]) {
            info.incotermVenta = incotermVentaMatch[1].trim();
        }
        return info;
    }
    /**
     * Extrae información bancaria
     */
    static extractBankingInfo(text, errors) {
        const beneficiarioMatch = text.match(this.FIELD_PATTERNS.BENEFICIARIO);
        const bancoMatch = text.match(this.FIELD_PATTERNS.BANCO);
        const direccionMatch = text.match(this.FIELD_PATTERNS.DIRECCION);
        const numeroCuentaMatch = text.match(this.FIELD_PATTERNS.NUMERO_CUENTA);
        const swiftMatch = text.match(this.FIELD_PATTERNS.SWIFT);
        const bankingInfo = {
            beneficiario: beneficiarioMatch?.[1]?.trim() || '',
            banco: bancoMatch?.[1]?.trim() || '',
            direccion: direccionMatch?.[1]?.trim() || '',
            numeroCuenta: numeroCuentaMatch?.[1]?.trim() || '',
            swift: swiftMatch?.[1]?.trim() || '',
            paisBanco: '' // Se puede inferir de la dirección o país exportador
        };
        // Validar campos críticos de datos bancarios
        if (!bankingInfo.beneficiario) {
            errors.push({ field: 'beneficiario', error: 'Beneficiario bancario no encontrado' });
        }
        if (!bankingInfo.banco) {
            errors.push({ field: 'banco', error: 'Nombre del banco no encontrado' });
        }
        if (!bankingInfo.numeroCuenta) {
            errors.push({ field: 'numeroCuenta', error: 'Número de cuenta no encontrado' });
        }
        return bankingInfo;
    }
    /**
     * Extrae información de giros
     */
    static extractGiros(text, errors, warnings) {
        const giros = [];
        // Buscar bloques de giros usando patrones más flexibles
        const giroPatterns = [
            /VALOR SOLICITADO:\s*(\d+(?:\.\d+)?)\s*\n.*?NÚMERO DE GIRO:\s*(.+?)\s*\n.*?PORCENTAJE DE GIRO:\s*(.+?)(?=\n\n|VALOR SOLICITADO|Liberación|$)/gis,
        ];
        for (const pattern of giroPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                try {
                    const valorSolicitado = parseFloat(match[1] || '0');
                    const numeroGiro = (match[2] || '').trim();
                    const porcentajeGiro = (match[3] || '').trim();
                    if (!isNaN(valorSolicitado) && numeroGiro && porcentajeGiro) {
                        giros.push({
                            valorSolicitado,
                            numeroGiro,
                            porcentajeGiro,
                            estado: Operation_1.EstadoProceso.PENDIENTE
                        });
                    }
                    else {
                        warnings.push(`Giro con datos incompletos encontrado: valor=${match[1] || 'undefined'}, numero=${match[2] || 'undefined'}, porcentaje=${match[3] || 'undefined'}`);
                    }
                }
                catch (error) {
                    warnings.push(`Error procesando giro: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                }
            }
        }
        if (giros.length === 0) {
            errors.push({ field: 'giros', error: 'No se encontraron giros válidos en el texto' });
        }
        return giros;
    }
    /**
     * Extrae información de liberaciones
     */
    static extractLiberaciones(text, errors, warnings) {
        const liberaciones = [];
        // Patrón para encontrar liberaciones (mejorado para capturar múltiples liberaciones)
        const liberacionPattern = /-\s*Liberación\s+(\d+)\s*\n\s*-\s*Capital:\s*\n\s*(\d+(?:\.\d+)?)\s+USD\s*\n\s*-\s*Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;
        // Debug logging
        console.log('🔍 [LIBERACIONES] Buscando liberaciones en texto...');
        console.log('📝 [LIBERACIONES] Texto length:', text.length);
        let match;
        while ((match = liberacionPattern.exec(text)) !== null) {
            console.log(`💰 [LIBERACIONES] Match encontrado:`, {
                numero: match[1],
                capital: match[2],
                fecha: match[3],
                index: match.index
            });
            try {
                const numero = parseInt(match[1] || '0');
                const capital = parseFloat(match[2] || '0');
                const fecha = (match[3] || '').trim();
                if (!isNaN(numero) && !isNaN(capital) && fecha) {
                    liberaciones.push({
                        numero,
                        capital,
                        fecha,
                        estado: Operation_1.EstadoProceso.PENDIENTE
                    });
                }
                else {
                    warnings.push(`Liberación con datos inválidos: numero=${match[1] || 'undefined'}, capital=${match[2] || 'undefined'}, fecha=${match[3] || 'undefined'}`);
                }
            }
            catch (error) {
                warnings.push(`Error procesando liberación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }
        if (liberaciones.length === 0) {
            warnings.push('No se encontraron liberaciones en el texto');
        }
        return liberaciones;
    }
    /**
     * Valida que la información crítica esté presente
     */
    static validateCriticalInfo(basicInfo, bankingInfo, errors) {
        // Validar campos obligatorios
        const requiredFields = ['cliente', 'paisImportador', 'paisExportador', 'valorTotalCompra'];
        for (const field of requiredFields) {
            if (!basicInfo[field] || (typeof basicInfo[field] === 'string' && basicInfo[field].trim() === '')) {
                errors.push({ field, error: `Campo obligatorio ${field} está vacío o no encontrado` });
            }
        }
        // Validar valor total > 0
        if (basicInfo.valorTotalCompra && basicInfo.valorTotalCompra <= 0) {
            errors.push({ field: 'valorTotalCompra', error: 'El valor total debe ser mayor que 0' });
        }
        // Validar formato de datos bancarios críticos
        if (bankingInfo.numeroCuenta && !/^\d+$/.test(bankingInfo.numeroCuenta.replace(/\s/g, ''))) {
            errors.push({ field: 'numeroCuenta', error: 'Número de cuenta contiene caracteres no numéricos' });
        }
        if (bankingInfo.swift && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bankingInfo.swift)) {
            errors.push({ field: 'swift', error: 'Código SWIFT no tiene formato válido' });
        }
    }
    /**
     * Método utilitario para extraer porcentajes de texto
     */
    static extractPercentage(text) {
        const percentageMatch = text.match(/(\d+(?:\.\d+)?)%/);
        return percentageMatch?.[1] ? parseFloat(percentageMatch[1]) : null;
    }
    /**
     * Método utilitario para extraer valores monetarios
     */
    static extractMonetaryValue(text) {
        const valueMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (valueMatch?.[1]) {
            return parseFloat(valueMatch[1].replace(/,/g, ''));
        }
        return null;
    }
    /**
     * Método para validar formato de fecha
     */
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
}
exports.OperationInfoParser = OperationInfoParser;
//# sourceMappingURL=OperationInfoParser.js.map