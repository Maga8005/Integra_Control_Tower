"use strict";
/**
 * Procesador CSV para leer archivo real de operaciones Integra
 * Maneja las 19 filas reales con mapeo exacto de estados
 * Integra Control Tower MVP - Soporte multi-país (Colombia y México)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVProcessor = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const Operation_1 = require("../types/Operation");
const OperationInfoParser_1 = require("./OperationInfoParser");
const StateMapper_1 = require("./StateMapper");
const TimelineGenerator_1 = require("./TimelineGenerator");
const ProgressCalculator_1 = require("./ProgressCalculator");
const PhaseValidator_1 = require("./PhaseValidator");
const dateUtils_1 = require("../utils/dateUtils");
const nitUtils_1 = require("../utils/nitUtils");
const csvMappers_1 = require("../utils/csvMappers");
class CSVProcessor {
    static CSV_PATH = path_1.default.join(__dirname, '../../src/data/integra_updated_v4.csv');
    static REQUIRED_COLUMNS = [
        'Nombre',
        'Completado',
        'Persona asignada',
        'Proceso',
        '5. Info Gnal + Info Compra Int'
        // Nota: '1.Docu. Cliente' puede variar entre '1. Docu. Cliente' y '1.Docu. Cliente'
    ];
    /**
     * Procesa el archivo CSV completo y convierte a OperationDetail[]
     * ACTUALIZADO: Detecta automáticamente el país (Colombia o México)
     */
    static async processCSVFile(csvPath) {
        console.log('📄 Iniciando procesamiento de archivo CSV...');
        try {
            // Verificar que el archivo existe
            if (!fs_1.default.existsSync(this.CSV_PATH)) {
                throw new Error(`Archivo CSV no encontrado en: ${this.CSV_PATH}`);
            }
            // Usar path proporcionado o el por defecto
            const finalPath = csvPath || this.CSV_PATH;
            // Leer archivo CSV
            const csvContent = fs_1.default.readFileSync(finalPath, 'utf-8');
            const rows = this.parseCSVContentRobust(csvContent);
            console.log(`📊 Archivo CSV leído: ${rows.length} filas encontradas`);
            // Detectar país basado en la estructura del primer registro válido
            let countryCode = 'CO'; // Por defecto Colombia
            if (rows.length > 0) {
                countryCode = (0, csvMappers_1.detectCountryFromCSV)(rows[0]);
            }
            const config = csvMappers_1.COUNTRY_CONFIGS[countryCode];
            console.log(`🌎 País detectado: ${config.name} (${countryCode})`);
            // Procesar cada fila
            const operations = [];
            const errors = [];
            const warnings = [];
            let validOperations = 0;
            let validationReport = '';
            let dateReport = '';
            for (let i = 0; i < rows.length; i++) {
                try {
                    const row = rows[i];
                    if (!row)
                        continue;
                    const operation = this.processCSVRow(row, i + 1, countryCode);
                    if (operation) {
                        operations.push(operation);
                        validOperations++;
                        console.log(`✅ Fila ${i + 1} procesada: ${operation.clienteCompleto}`);
                    }
                }
                catch (error) {
                    const errorMsg = `Error en fila ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
                    errors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }
            }
            console.log(`🎯 Procesamiento completo: ${validOperations}/${rows.length} operaciones válidas`);
            // Generar reportes de validación y fechas si hay operaciones válidas
            if (operations.length > 0) {
                console.log('📋 Generando reportes de validación y fechas...');
                // Generar reporte consolidado de validación
                const validationSummary = this.generateConsolidatedValidationReport(operations);
                validationReport = validationSummary.report;
                warnings.push(...validationSummary.warnings);
                // Generar reporte de fechas
                dateReport = this.generateConsolidatedDateReport(operations);
            }
            return {
                success: errors.length === 0,
                data: operations,
                rawData: rows, // NUEVO: Incluir datos CSV crudos
                countryCode, // NUEVO: País detectado
                countryName: config.name, // NUEVO: Nombre del país
                errors,
                warnings,
                totalProcessed: rows.length,
                validOperations,
                validationReport,
                dateReport
            };
        }
        catch (error) {
            console.error('❌ Error crítico procesando CSV:', error);
            return {
                success: false,
                rawData: [], // NUEVO: Array vacío en caso de error
                countryCode: 'CO', // Por defecto Colombia en caso de error
                countryName: 'Colombia',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                warnings: [],
                totalProcessed: 0,
                validOperations: 0
            };
        }
    }
    /**
     * Procesa una fila individual del CSV
     * ACTUALIZADO: Incluye soporte para configuración por país
     */
    static processCSVRow(row, rowNumber, countryCode = 'CO') {
        const config = csvMappers_1.COUNTRY_CONFIGS[countryCode];
        console.log(`🔄 Procesando fila ${rowNumber} (${config.name})...`);
        // Validar columnas requeridas con flexibilidad para nombres de columnas
        const missingColumns = this.validateRequiredColumnsFlexible(row, countryCode);
        if (missingColumns.length > 0) {
            throw new Error(`Columnas faltantes: ${missingColumns.join(', ')}`);
        }
        // 1. Parsear el campo "5. Info Gnal + Info Compra Int" (ahora opcional)
        const infoGralText = row['5. Info Gnal + Info Compra Int'] || '';
        let parsedInfo;
        if (infoGralText.trim()) {
            parsedInfo = (0, OperationInfoParser_1.parseOperationInfo)(infoGralText, row);
        }
        else {
            console.warn(`⚠️ Fila ${rowNumber}: Campo "5. Info Gnal + Info Compra Int" está vacío, usando valores por defecto`);
            // Crear objeto con valores por defecto cuando no hay info general
            parsedInfo = {
                cliente: '',
                paisImportador: config.name, // Usar país detectado
                paisExportador: 'No especificado',
                valorTotalCompra: 0,
                monedaPago: 'USD', // Cast to Currency enum
                terminosPago: '',
                giros: [], // Array vacío para evitar errores de reduce
                liberaciones: [], // Array vacío para evitar errores de reduce
                incotermCompra: '',
                incotermVenta: '',
                datosBancarios: {
                    beneficiario: 'No especificado',
                    banco: '',
                    numeroCuenta: '',
                    swift: '',
                    direccion: ''
                }
            };
        }
        // NUEVO: Extraer cliente y NIT de la columna "1.Docu. Cliente" (flexible)
        const docuClienteText = row['1.Docu. Cliente'] || row['1. Docu. Cliente'] || '';
        const clienteNitInfo = (0, nitUtils_1.extractClienteNitFromDocColumn)(docuClienteText);
        // Usar cliente extraído de "1.Docu. Cliente" como prioridad, con fallbacks
        const clientName = clienteNitInfo.cliente || parsedInfo.cliente || row['Nombre'] || 'Cliente no especificado';
        const clientNit = clienteNitInfo.nit || '';
        const valorOperacion = clienteNitInfo.valorOperacion; // NUEVO: Valor de la operación
        if (!clientName || clientName === 'Cliente no especificado' || clientName.trim() === '') {
            console.warn(`⚠️ Fila ${rowNumber}: Información crítica faltante (cliente). Docu Cliente: "${docuClienteText}"`);
            return null;
        }
        console.log(`👤 Cliente identificado: ${clientName} (NIT: ${clientNit || 'N/A'})`);
        console.log(`💰 Valor operación: ${valorOperacion || 'N/A'}`);
        // Si no se puede obtener el valor de la información parseada, intentar obtenerlo de otros campos
        const valorTotal = parsedInfo.valorTotalCompra || this.extractValueFromText(infoGralText) || 0;
        // 2. Calcular progreso preciso usando la nueva lógica
        const preciseProgress = (0, ProgressCalculator_1.calculatePreciseProgress)(row, parsedInfo);
        // 3. Generar timeline de 5 fases usando los datos CSV con configuración de país
        const timeline = (0, TimelineGenerator_1.generateTimeline)(row, parsedInfo, countryCode);
        // 4. Mapear estados individuales de los campos CSV con configuración de país
        const estados = (0, StateMapper_1.mapEstados)(row, countryCode);
        // 5. Validar coherencia del timeline
        const validationContext = {
            csvRow: row,
            parsedInfo,
            phaseDetails: preciseProgress.phaseDetails,
            overallProgress: preciseProgress
        };
        const validation = (0, PhaseValidator_1.validateCompleteTimeline)(validationContext);
        // 6. Generar fechas realistas
        const dateRanges = (0, dateUtils_1.generateRealisticDates)(preciseProgress.phaseDetails);
        // 7. Calcular fechas de vencimiento faltantes
        const { girosConVencimiento, liberacionesConVencimiento } = (0, dateUtils_1.calculateMissingVencimientos)(parsedInfo.giros, parsedInfo.liberaciones, parsedInfo.terminosPago);
        // 8. Usar progreso preciso en lugar del cálculo anterior
        const progresoGeneral = preciseProgress.totalProgress;
        // 9. Generar ID único para la operación (usando valor único de columna "Nombre")
        const nombreValue = row['Nombre'] || row['nombre'] || '';
        const operationId = this.generateOperationId(clientName, rowNumber, nombreValue);
        // 10. Determinar moneda (por defecto USD si no se puede determinar)
        const moneda = parsedInfo.monedaPago || Operation_1.Currency.USD;
        // 11. Extraer persona asignada (campo opcional)
        const personaAsignada = row['15. Equipo Comercial'] ||
            row['Persona asignada'] ||
            'Sin asignar';
        // 12. Construir OperationDetail completa con nueva lógica de precisión
        const operation = {
            // Identificadores
            id: operationId,
            numeroOperacion: this.generateOperationNumber(rowNumber),
            // Información básica (usar clientName que incluye fallback a campo "Nombre")
            clienteCompleto: clientName,
            clienteNit: clientNit, // NUEVO: NIT extraído de "1.Docu. Cliente"
            tipoEmpresa: this.inferCompanyType(clientName),
            proveedorBeneficiario: parsedInfo.datosBancarios.beneficiario || 'No especificado',
            paisProveedor: parsedInfo.paisExportador || 'No especificado',
            valorTotal: valorTotal, // Valor de compra de mercancía
            valorOperacion: valorOperacion, // NUEVO: Valor total de la operación
            moneda: moneda,
            progresoGeneral: progresoGeneral,
            personaAsignada: personaAsignada, // Campo opcional
            // Geografía y logística
            paisExportador: parsedInfo.paisExportador || 'No especificado',
            paisImportador: parsedInfo.paisImportador || 'No especificado',
            rutaComercial: this.generateTradeRoute(parsedInfo.paisExportador, parsedInfo.paisImportador),
            incoterms: this.formatIncoterms(parsedInfo.incotermCompra, parsedInfo.incotermVenta),
            // Información financiera
            montoTotal: valorTotal,
            montosLiberados: this.calculateReleasedAmounts(parsedInfo.liberaciones),
            montosPendientes: 0, // Se calculará después
            // Extracostos (estimados)
            extracostos: this.estimateExtraCosts(parsedInfo.valorTotalCompra),
            // Estados mapeados desde CSV
            estados: estados,
            // Giros y liberaciones con fechas de vencimiento calculadas
            giros: girosConVencimiento,
            liberaciones: liberacionesConVencimiento,
            // Documentos (placeholder)
            documentos: [],
            // Timeline generado
            timeline: timeline,
            // Fechas
            fechaCreacion: this.estimateCreationDate(row).toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            // Datos bancarios
            datosBancarios: parsedInfo.datosBancarios,
            // Información adicional
            observaciones: this.extractObservations(row),
            alertas: this.generateAlerts(estados, progresoGeneral, girosConVencimiento, liberacionesConVencimiento),
            // Nuevos campos de precisión
            preciseProgress: preciseProgress,
            validation: validation,
            dateRanges: dateRanges,
            validationWarnings: validation.warnings.length,
            validationErrors: validation.errors.length
        };
        // Calcular montos pendientes
        operation.montosPendientes = operation.montoTotal - operation.montosLiberados;
        // Log de resumen con nueva información de precisión
        console.log(`✅ Operación creada: ${operation.clienteCompleto} - $${operation.valorTotal.toLocaleString()}`);
        console.log(`   📊 Progreso preciso: ${preciseProgress.totalProgress}% (${preciseProgress.completedPhases}/5 fases completas)`);
        console.log(`   ⚠️ Validación: ${validation.warnings.length} warnings, ${validation.errors.length} errors`);
        // Mostrar warnings críticos
        const criticalWarnings = validation.warnings.filter(w => w.severity === 'high');
        if (criticalWarnings.length > 0) {
            console.warn(`   🚨 Warnings críticos: ${criticalWarnings.length}`);
            criticalWarnings.forEach(w => {
                console.warn(`      [Fase ${w.phase}] ${w.message}`);
            });
        }
        return operation;
    }
    /**
     * Parsea el contenido CSV crudo
     */
    static parseCSVContent(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('Archivo CSV debe tener al menos cabecera y una fila de datos');
        }
        // Extraer cabeceras
        const headers = this.parseCSVLine(lines[0]);
        console.log(`📋 Cabeceras CSV encontradas: ${headers.length} columnas`);
        // Parsear filas de datos
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                console.warn(`⚠️ Fila ${i}: Número de columnas inconsistente (${values.length} vs ${headers.length})`);
            }
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }
        return rows;
    }
    /**
     * Parsea una línea CSV manejando comillas, comas y multilinea robusto
     */
    static parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Comilla escapada ("" dentro de campo)
                    current += '"';
                    i += 2;
                }
                else if (inQuotes && (nextChar === ',' || nextChar === undefined)) {
                    // Final de campo quoted
                    inQuotes = false;
                    i++;
                }
                else if (!inQuotes && (current === '' || current.trim() === '')) {
                    // Inicio de campo quoted (solo si estamos al inicio del campo)
                    inQuotes = true;
                    i++;
                }
                else {
                    // Comilla literal dentro de contenido
                    current += char;
                    i++;
                }
            }
            else if (char === ',' && !inQuotes) {
                // Separador de campo válido
                values.push(current);
                current = '';
                i++;
            }
            else {
                // Contenido normal (incluye saltos de línea dentro de quotes)
                current += char;
                i++;
            }
        }
        // Agregar último valor
        values.push(current);
        // Limpiar valores: remover comillas externas y espacios solo si son comillas balanceadas
        return values.map(value => {
            // Remover comillas externas solo si están balanceadas
            if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
                const cleaned = value.slice(1, -1);
                // Convertir comillas dobles escapadas a comillas simples
                return cleaned.replace(/""/g, '"').trim();
            }
            return value.trim();
        });
    }
    /**
     * Parsea contenido CSV con manejo robusto de multilinea
     */
    static parseCSVContentRobust(content) {
        const lines = content.split('\n');
        const rows = [];
        if (lines.length < 2) {
            throw new Error('Archivo CSV debe tener al menos cabecera y una fila de datos');
        }
        // Extraer cabeceras desde la primera línea
        const headers = this.parseCSVLine(lines[0]);
        console.log(`📋 Cabeceras CSV encontradas: ${headers.length} columnas`);
        // Procesar líneas manejando multilinea
        let currentRowText = '';
        let inMultilineField = false;
        let quoteCount = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Contar comillas en la línea actual
            const lineQuotes = (line.match(/"/g) || []).length;
            quoteCount += lineQuotes;
            // Agregar línea al texto actual
            if (currentRowText) {
                currentRowText += '\n' + line;
            }
            else {
                currentRowText = line;
            }
            // Verificar si la fila está completa:
            // 1. Número par de comillas Y
            // 2. La línea actual parece terminar un registro (heurística)
            const seemsComplete = quoteCount % 2 === 0 && (
            // Línea termina con comillas y algo más (no solo comillas)
            (line.endsWith('"') && line.length > 1) ||
                // O la siguiente línea comienza un nuevo registro (con <#)
                (i + 1 < lines.length && lines[i + 1].startsWith('<#')) ||
                // O es la última línea
                (i === lines.length - 1));
            if (seemsComplete) {
                try {
                    const values = this.parseCSVLine(currentRowText);
                    // Validar que tenemos un número razonable de columnas
                    if (values.length >= Math.floor(headers.length * 0.7)) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });
                        rows.push(row);
                        console.log(`✅ Fila ${i} procesada: ${values.length}/${headers.length} columnas`);
                    }
                    else {
                        console.warn(`⚠️ Fila ${i} descartada: muy pocas columnas (${values.length} vs ${headers.length})`);
                    }
                }
                catch (error) {
                    console.error(`❌ Error parseando fila ${i}: ${error}`);
                }
                // Reset para la siguiente fila
                currentRowText = '';
                quoteCount = 0;
                inMultilineField = false;
            }
            else {
                inMultilineField = true;
            }
        }
        // Si queda contenido sin procesar, intentar parsearlo
        if (currentRowText.trim()) {
            try {
                const values = this.parseCSVLine(currentRowText);
                if (values.length >= Math.floor(headers.length * 0.7)) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    rows.push(row);
                    console.log(`✅ Última fila procesada: ${values.length}/${headers.length} columnas`);
                }
            }
            catch (error) {
                console.warn(`⚠️ Última fila incompleta descartada: ${error}`);
            }
        }
        return rows;
    }
    /**
     * Valida que las columnas requeridas estén presentes
     */
    static validateRequiredColumns(row) {
        return this.REQUIRED_COLUMNS.filter(column => !(column in row));
    }
    /**
     * Validación flexible de columnas que maneja variaciones en nombres
     */
    static validateRequiredColumnsFlexible(row, countryCode) {
        const config = csvMappers_1.COUNTRY_CONFIGS[countryCode];
        const missingColumns = [];
        const rowKeys = Object.keys(row);
        // Validar columnas básicas
        const basicColumns = ['Nombre', 'Completado', 'Persona asignada', 'Proceso', '5. Info Gnal + Info Compra Int'];
        for (const column of basicColumns) {
            if (!rowKeys.includes(column)) {
                missingColumns.push(column);
            }
        }
        // Validar columna de documentos cliente (flexible)
        const hasDocuCliente = rowKeys.some(key => key === '1.Docu. Cliente' ||
            key === '1. Docu. Cliente' ||
            key === '1.Docu Cliente' ||
            key.toLowerCase().includes('docu') && key.includes('cliente'));
        if (!hasDocuCliente) {
            missingColumns.push('1.Docu. Cliente (o variación)');
        }
        console.log(`🔍 Validación flexible ${config.name}:`, {
            rowKeys: rowKeys.length,
            missingColumns: missingColumns.length,
            hasDocuCliente
        });
        return missingColumns;
    }
    /**
     * Genera ID único para la operación (DETERMINÍSTICO)
     * Usa el valor único de la columna "Nombre" para garantizar consistencia
     */
    static generateOperationId(cliente, rowNumber, nombreValue) {
        const cleanClient = cliente.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
        // Usar el valor único de la columna "Nombre" como base para el hash
        const uniqueValue = nombreValue || `ROW-${rowNumber}`;
        const dataToHash = `${cliente}-${uniqueValue}-${rowNumber}`;
        let hash = 0;
        for (let i = 0; i < dataToHash.length; i++) {
            const char = dataToHash.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Convertir hash a número positivo de 6 dígitos
        const hashString = Math.abs(hash).toString().slice(-6).padStart(6, '0');
        return `${cleanClient}-${rowNumber.toString().padStart(2, '0')}-${hashString}`;
    }
    /**
     * Genera número de operación
     */
    static generateOperationNumber(rowNumber) {
        const year = new Date().getFullYear();
        return `OP-${year}-${rowNumber.toString().padStart(4, '0')}`;
    }
    /**
     * Infiere tipo de empresa basado en el nombre
     */
    static inferCompanyType(clientName) {
        const name = clientName.toUpperCase();
        if (name.includes('IMPORT'))
            return 'IMPORTADORA';
        if (name.includes('EXPORT'))
            return 'EXPORTADORA';
        if (name.includes('COMERCIALIZ'))
            return 'COMERCIALIZADORA';
        if (name.includes('DISTRIBU'))
            return 'DISTRIBUIDORA';
        if (name.includes('SA') || name.includes('SAS') || name.includes('LTDA'))
            return 'EMPRESA';
        return 'COMERCIAL';
    }
    /**
     * Genera ruta comercial
     */
    static generateTradeRoute(origen, destino) {
        if (!origen || !destino)
            return 'Ruta no especificada';
        return `${origen} → ${destino}`;
    }
    /**
     * Calcula montos liberados
     */
    static calculateReleasedAmounts(liberaciones) {
        return liberaciones.reduce((total, lib) => total + (lib.capital || 0), 0);
    }
    /**
     * Estima costos extra
     */
    static estimateExtraCosts(valorTotal) {
        const comisionBancaria = Math.floor(valorTotal * 0.02);
        const gastosLogisticos = Math.floor(valorTotal * 0.03);
        const seguroCarga = Math.floor(valorTotal * 0.01);
        return {
            comisionBancaria,
            gastosLogisticos,
            seguroCarga,
            totalExtracostos: comisionBancaria + gastosLogisticos + seguroCarga
        };
    }
    /**
     * Estima fecha de creación basada en datos CSV
     */
    static estimateCreationDate(row) {
        // Por ahora usar fecha actual menos días aleatorios
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date;
    }
    /**
     * Extrae observaciones relevantes
     */
    static extractObservations(row) {
        const observations = [];
        // Buscar campos que puedan contener observaciones
        Object.keys(row).forEach(key => {
            if (key.toLowerCase().includes('observ') || key.toLowerCase().includes('nota')) {
                const value = row[key];
                if (value && value.trim()) {
                    observations.push(value.trim());
                }
            }
        });
        return observations.length > 0 ? observations.join('; ') : 'Sin observaciones específicas';
    }
    /**
     * Genera alertas basadas en estados y fechas de vencimiento
     */
    static generateAlerts(estados, progreso, giros = [], liberaciones = []) {
        const alertas = [];
        if (progreso < 25) {
            alertas.push({
                tipo: 'info',
                mensaje: 'Operación en etapa inicial',
                fecha: new Date().toISOString()
            });
        }
        if (estados.cuotaOperacional === Operation_1.EstadoProceso.PENDIENTE) {
            alertas.push({
                tipo: 'warning',
                mensaje: 'Cuota operacional pendiente de pago',
                fecha: new Date().toISOString()
            });
        }
        // Alertas de vencimientos próximos
        giros.forEach((giro, index) => {
            if ((0, dateUtils_1.isVencimientoProximo)(giro.fechaVencimiento)) {
                alertas.push({
                    tipo: 'warning',
                    mensaje: `Giro ${index + 1} vence próximamente: ${giro.fechaVencimiento}`,
                    fecha: new Date().toISOString()
                });
            }
            if ((0, dateUtils_1.isVencimientoVencido)(giro.fechaVencimiento)) {
                alertas.push({
                    tipo: 'error',
                    mensaje: `Giro ${index + 1} VENCIDO: ${giro.fechaVencimiento}`,
                    fecha: new Date().toISOString()
                });
            }
        });
        // Alertas de liberaciones próximas
        liberaciones.forEach((liberacion, index) => {
            if ((0, dateUtils_1.isVencimientoProximo)(liberacion.fechaVencimiento)) {
                alertas.push({
                    tipo: 'warning',
                    mensaje: `Liberación ${index + 1} vence próximamente: ${liberacion.fechaVencimiento}`,
                    fecha: new Date().toISOString()
                });
            }
            if ((0, dateUtils_1.isVencimientoVencido)(liberacion.fechaVencimiento)) {
                alertas.push({
                    tipo: 'error',
                    mensaje: `Liberación ${index + 1} VENCIDA: ${liberacion.fechaVencimiento}`,
                    fecha: new Date().toISOString()
                });
            }
        });
        return alertas;
    }
    /**
     * Obtiene estadísticas del procesamiento
     */
    static async getProcessingStats() {
        try {
            if (!fs_1.default.existsSync(this.CSV_PATH)) {
                return { fileExists: false };
            }
            const stats = fs_1.default.statSync(this.CSV_PATH);
            const content = fs_1.default.readFileSync(this.CSV_PATH, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            return {
                fileExists: true,
                fileSize: stats.size,
                estimatedRows: Math.max(0, lines.length - 1), // -1 para excluir cabecera
                lastModified: stats.mtime.toISOString()
            };
        }
        catch (error) {
            console.error('Error obteniendo estadísticas del archivo:', error);
            return { fileExists: false };
        }
    }
    /**
     * Genera reporte consolidado de validación para todas las operaciones
     */
    static generateConsolidatedValidationReport(operations) {
        console.log('🔍 Generando reporte consolidado de validación...');
        let report = '\n🔍 REPORTE CONSOLIDADO DE VALIDACIÓN\n';
        report += '=====================================\n\n';
        const warnings = [];
        let totalWarnings = 0;
        let totalErrors = 0;
        let validOperations = 0;
        operations.forEach((operation, index) => {
            if (operation.validation) {
                const opWarnings = operation.validation.warnings.length;
                const opErrors = operation.validation.errors.length;
                totalWarnings += opWarnings;
                totalErrors += opErrors;
                if (operation.validation.isValid) {
                    validOperations++;
                }
                // Agregar warnings críticos al resumen
                const criticalWarnings = operation.validation.warnings.filter(w => w.severity === 'high');
                criticalWarnings.forEach(w => {
                    warnings.push(`${operation.clienteCompleto}: [Fase ${w.phase}] ${w.message}`);
                });
                // Agregar errores bloqueantes
                const blockingErrors = operation.validation.errors.filter(e => e.blocking);
                blockingErrors.forEach(e => {
                    warnings.push(`ERROR - ${operation.clienteCompleto}: [Fase ${e.phase}] ${e.message}`);
                });
            }
        });
        report += `📊 RESUMEN GENERAL:\n`;
        report += `   Total operaciones: ${operations.length}\n`;
        report += `   Operaciones válidas: ${validOperations}\n`;
        report += `   Total warnings: ${totalWarnings}\n`;
        report += `   Total errors: ${totalErrors}\n`;
        report += `   Tasa de validez: ${((validOperations / operations.length) * 100).toFixed(1)}%\n\n`;
        if (warnings.length > 0) {
            report += `⚠️ ISSUES CRÍTICOS (Top 10):\n`;
            warnings.slice(0, 10).forEach(warning => {
                report += `   • ${warning}\n`;
            });
            if (warnings.length > 10) {
                report += `   ... y ${warnings.length - 10} más\n`;
            }
        }
        report += '\n=====================================\n';
        return { report, warnings: warnings.slice(0, 20) }; // Limitar warnings
    }
    /**
     * Genera reporte consolidado de fechas para todas las operaciones
     */
    static generateConsolidatedDateReport(operations) {
        console.log('📅 Generando reporte consolidado de fechas...');
        let report = '\n📅 REPORTE CONSOLIDADO DE FECHAS\n';
        report += '==================================\n\n';
        const now = new Date();
        let onTimeOperations = 0;
        let delayedOperations = 0;
        let completedOperations = 0;
        operations.forEach(operation => {
            if (operation.dateRanges && operation.preciseProgress) {
                const isCompleted = operation.preciseProgress.completedPhases === 5;
                if (isCompleted)
                    completedOperations++;
                // Analizar si hay retrasos
                const hasDelays = operation.dateRanges.some(range => {
                    if (range.actual && range.estimated) {
                        return range.actual > range.estimated;
                    }
                    return range.estimated < now && !range.actual;
                });
                if (hasDelays) {
                    delayedOperations++;
                }
                else {
                    onTimeOperations++;
                }
            }
        });
        report += `📊 RESUMEN DE TIEMPOS:\n`;
        report += `   Total operaciones: ${operations.length}\n`;
        report += `   Operaciones completas: ${completedOperations}\n`;
        report += `   En tiempo: ${onTimeOperations}\n`;
        report += `   Con retrasos: ${delayedOperations}\n`;
        report += `   Eficiencia temporal: ${((onTimeOperations / operations.length) * 100).toFixed(1)}%\n\n`;
        // Top operaciones con retrasos
        const delayedOps = operations.filter(op => {
            if (!op.dateRanges || !op.preciseProgress)
                return false;
            return op.dateRanges.some(range => {
                if (range.actual && range.estimated) {
                    return range.actual > range.estimated;
                }
                return false;
            });
        }).slice(0, 5);
        if (delayedOps.length > 0) {
            report += `⏰ OPERACIONES CON RETRASOS (Top 5):\n`;
            delayedOps.forEach(op => {
                report += `   • ${op.clienteCompleto} (${op.preciseProgress?.completedPhases}/5 fases)\n`;
            });
        }
        report += '\n==================================\n';
        return report;
    }
    /**
     * Extrae valor monetario de un texto cuando el parser principal falla
     */
    static extractValueFromText(text) {
        // Buscar patrones como "VALOR TOTAL: 98470" o "$98,470"
        const patterns = [
            /VALOR\s+TOTAL[:\s]+(\d+(?:\.\d+)?)/i,
            /\$[\s,]*(\d+(?:,\d{3})*(?:\.\d+)?)/,
            /(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
            /(\d+(?:\.\d+)?)\s*(?:USD|DOLLARS?)/i
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const value = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(value) && value > 0) {
                    return value;
                }
            }
        }
        return 0;
    }
    /**
     * Formatea Incoterms para mostrar correctamente en el frontend
     */
    static formatIncoterms(incotermCompra, incotermVenta) {
        // Si ambos están disponibles, mostrar como "FOB / DAP"
        if (incotermCompra && incotermVenta) {
            return `${incotermCompra} / ${incotermVenta}`;
        }
        // Si solo uno está disponible, mostrar solo ese
        if (incotermCompra) {
            return incotermCompra;
        }
        if (incotermVenta) {
            return incotermVenta;
        }
        // Fallback si ninguno está disponible
        return 'FOB / CIF';
    }
}
exports.CSVProcessor = CSVProcessor;
//# sourceMappingURL=CSVProcessor.js.map