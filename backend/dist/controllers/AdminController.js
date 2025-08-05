"use strict";
/**
 * Controller para endpoints administrativos - Acceso a datos raw del CSV
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const tslib_1 = require("tslib");
const CSVProcessor_1 = require("../services/CSVProcessor");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const multer_1 = tslib_1.__importDefault(require("multer"));
// Cache para datos raw del CSV
let csvRawDataCache = null;
let csvFieldsCache = null;
let lastCsvProcessTime = null;
const CSV_CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutos
// Configuración de multer para upload de CSV
const csvUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Almacenar en memoria para procesamiento
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
        files: 1 // Solo un archivo
    },
    fileFilter: (req, file, cb) => {
        // Validar que sea un archivo CSV
        if (file.mimetype === 'text/csv' ||
            file.originalname.toLowerCase().endsWith('.csv') ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten archivos CSV'), false);
        }
    }
});
// Columnas requeridas mínimas para el nuevo formato
const REQUIRED_CSV_COLUMNS = [
    'Nombre',
    'Completado',
    'Persona asignada',
    'Proceso',
    '1.Docu. Cliente',
    '5. Info Gnal + Info Compra Int'
];
class AdminController {
    /**
     * Configuración de multer para upload (método estático para acceso externo)
     */
    static getUploadMiddleware() {
        return csvUpload.single('csvFile');
    }
    /**
     * POST /api/admin/upload-csv - Cargar nuevo archivo CSV y reemplazar datos actuales
     */
    static async uploadCSV(req, res) {
        try {
            console.log('📤 POST /api/admin/upload-csv - Iniciando carga de nuevo CSV');
            // Verificar acceso admin
            const adminAccess = AdminController.verifyAdminAccess(req);
            if (!adminAccess.authorized) {
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Se requieren permisos de administrador',
                    errors: [adminAccess.reason],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Verificar que se subió un archivo
            const uploadedFile = req.file;
            if (!uploadedFile) {
                res.status(400).json({
                    success: false,
                    message: 'No se recibió ningún archivo CSV',
                    errors: ['Se requiere un archivo CSV para la carga'],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            console.log('📄 Archivo recibido:', {
                originalName: uploadedFile.originalname,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                sizeFormatted: AdminController.formatFileSize(uploadedFile.size)
            });
            // Obtener estadísticas del CSV actual antes del reemplazo
            const previousData = await AdminController.getRawCSVData();
            const previousRows = previousData ? previousData.rows.length : 0;
            // Crear backup del CSV actual
            const backupResult = await AdminController.createCSVBackup();
            if (!backupResult.success) {
                res.status(500).json({
                    success: false,
                    message: 'Error creando backup del CSV actual',
                    errors: [backupResult.error || 'Error desconocido'],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Parsear y validar el nuevo CSV
            const csvContent = uploadedFile.buffer.toString('utf-8');
            const validationResult = await AdminController.validateCSVContent(csvContent);
            if (!validationResult.valid) {
                res.status(400).json({
                    success: false,
                    message: 'El archivo CSV no es válido',
                    errors: validationResult.errors,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Guardar el nuevo archivo CSV
            const saveResult = await AdminController.saveNewCSV(csvContent, uploadedFile.originalname);
            if (!saveResult.success) {
                res.status(500).json({
                    success: false,
                    message: 'Error guardando el nuevo archivo CSV',
                    errors: [saveResult.error || 'Error desconocido'],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Limpiar cache para forzar recarga
            csvRawDataCache = null;
            csvFieldsCache = null;
            lastCsvProcessTime = null;
            // Cargar y validar los nuevos datos
            const newData = await AdminController.getRawCSVData();
            const newRows = newData ? newData.rows.length : 0;
            console.log('✅ CSV actualizado exitosamente:', {
                previousRows,
                newRows,
                backupFile: backupResult.backupPath
            });
            // Respuesta exitosa
            res.status(200).json({
                success: true,
                message: 'CSV actualizado exitosamente',
                data: {
                    summary: {
                        rowsProcessed: newRows,
                        previousRows: previousRows,
                        validOperations: validationResult.rowCount,
                        errorCount: validationResult.errors.length,
                        warningCount: validationResult.warnings?.length || 0
                    },
                    backup: {
                        created: true,
                        backupFile: path_1.default.basename(backupResult.backupPath || ''),
                        timestamp: new Date().toISOString()
                    },
                    validation: {
                        columnsFound: validationResult.columnsFound,
                        requiredColumnsMet: validationResult.requiredColumnsMet,
                        totalColumns: validationResult.totalColumns
                    },
                    upload: {
                        originalFilename: uploadedFile.originalname,
                        fileSize: uploadedFile.size,
                        fileSizeFormatted: AdminController.formatFileSize(uploadedFile.size),
                        uploadedBy: adminAccess.user || 'unknown'
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en uploadCSV:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor durante la carga del CSV',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /api/admin/csv-data - Retorna todos los datos raw del CSV procesado
     */
    static async getCSVData(req, res) {
        try {
            console.log('🔧 GET /api/admin/csv-data - Acceso a datos administrativos');
            // Verificar acceso admin (placeholder para futura autenticación)
            const adminAccess = AdminController.verifyAdminAccess(req);
            if (!adminAccess.authorized) {
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Se requieren permisos de administrador',
                    errors: [adminAccess.reason],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Obtener datos raw del CSV
            const csvData = await AdminController.getRawCSVData();
            if (!csvData) {
                res.status(500).json({
                    success: false,
                    message: 'Error obteniendo datos del CSV',
                    errors: ['No se pudo procesar el archivo CSV'],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Preparar metadata
            const metadata = {
                totalRecords: csvData.rows.length,
                fields: csvData.fields,
                lastUpdated: lastCsvProcessTime?.toISOString() || new Date().toISOString(),
                fileInfo: await AdminController.getCSVFileInfo(),
                processingStats: {
                    cacheStatus: csvRawDataCache ? 'cached' : 'fresh',
                    cacheAge: lastCsvProcessTime ?
                        Math.floor((Date.now() - lastCsvProcessTime.getTime()) / 1000) : 0
                }
            };
            // Verificar si se solicita formato pretty
            const pretty = req.query.pretty === 'true';
            console.log(`✅ Datos CSV obtenidos: ${csvData.rows.length} registros, ${csvData.fields.length} campos`);
            const response = {
                success: true,
                data: {
                    data: csvData.rows,
                    metadata
                },
                message: 'Datos CSV obtenidos exitosamente',
                timestamp: new Date().toISOString()
            };
            // Configurar respuesta para formato pretty si se solicita
            if (pretty) {
                res.set('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify(response, null, 2));
            }
            else {
                res.status(200).json(response);
            }
        }
        catch (error) {
            console.error('❌ Error en getCSVData:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /api/admin/csv-fields - Retorna solo los nombres de columnas disponibles
     */
    static async getCSVFields(req, res) {
        try {
            console.log('📋 GET /api/admin/csv-fields - Obteniendo campos del CSV');
            // Verificar acceso admin
            const adminAccess = AdminController.verifyAdminAccess(req);
            if (!adminAccess.authorized) {
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Se requieren permisos de administrador',
                    errors: [adminAccess.reason],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Obtener campos del CSV
            const csvData = await AdminController.getRawCSVData();
            const fields = csvData ? csvData.fields : null;
            if (!fields) {
                res.status(500).json({
                    success: false,
                    message: 'Error obteniendo campos del CSV',
                    errors: ['No se pudo leer la estructura del archivo CSV'],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const metadata = {
                totalFields: fields.length,
                requiredFields: CSVProcessor_1.CSVProcessor['REQUIRED_COLUMNS'] || [],
                optionalFields: CSVProcessor_1.CSVProcessor['OPTIONAL_COLUMNS'] || [],
                lastUpdated: lastCsvProcessTime?.toISOString() || new Date().toISOString()
            };
            console.log(`✅ Campos CSV obtenidos: ${fields.length} columnas`);
            res.status(200).json({
                success: true,
                data: {
                    fields,
                    metadata
                },
                message: 'Campos CSV obtenidos exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en getCSVFields:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /api/admin/csv-refresh - Fuerza la recarga del cache del CSV
     */
    static async refreshCSVCache(req, res) {
        try {
            console.log('🔄 POST /api/admin/csv-refresh - Refrescando cache CSV');
            // Verificar acceso admin
            const adminAccess = AdminController.verifyAdminAccess(req);
            if (!adminAccess.authorized) {
                res.status(403).json({
                    success: false,
                    message: 'Acceso denegado - Se requieren permisos de administrador',
                    errors: [adminAccess.reason],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Limpiar cache
            csvRawDataCache = null;
            csvFieldsCache = null;
            lastCsvProcessTime = null;
            // Forzar recarga
            const csvData = await AdminController.getRawCSVData();
            if (!csvData) {
                res.status(500).json({
                    success: false,
                    message: 'Error refrescando datos del CSV',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            console.log(`✅ Cache CSV refrescado: ${csvData.rows.length} registros`);
            res.status(200).json({
                success: true,
                data: {
                    totalRecords: csvData.rows.length,
                    totalFields: csvData.fields.length,
                    refreshedAt: lastCsvProcessTime?.toISOString()
                },
                message: 'Cache CSV refrescado exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en refreshCSVCache:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Obtiene datos raw del CSV (con cache)
     */
    static async getRawCSVData() {
        const now = new Date();
        // Verificar cache válido
        if (csvRawDataCache &&
            csvFieldsCache &&
            lastCsvProcessTime &&
            (now.getTime() - lastCsvProcessTime.getTime()) < CSV_CACHE_DURATION_MS) {
            console.log('📋 Usando datos CSV desde cache');
            return {
                rows: csvRawDataCache,
                fields: csvFieldsCache
            };
        }
        console.log('🔄 Cache CSV expirado, cargando desde archivo...');
        try {
            // Leer archivo CSV directamente
            const csvPath = path_1.default.join(__dirname, '../../src/data/integra_updated_v4.csv');
            if (!fs_1.default.existsSync(csvPath)) {
                console.error(`❌ Archivo CSV no encontrado en: ${csvPath}`);
                return null;
            }
            const csvContent = fs_1.default.readFileSync(csvPath, 'utf-8');
            // Usar parsing robusto para manejar campos multilínea
            const parsedData = AdminController.parseCSVContentRobust(csvContent);
            if (!parsedData || parsedData.rows.length === 0) {
                console.error('❌ No se pudieron parsear los datos del CSV');
                return null;
            }
            const { headers, rows } = parsedData;
            // Actualizar cache
            csvRawDataCache = rows;
            csvFieldsCache = headers;
            lastCsvProcessTime = now;
            console.log(`✅ CSV cargado: ${rows.length} filas, ${headers.length} columnas`);
            return {
                rows,
                fields: headers
            };
        }
        catch (error) {
            console.error('❌ Error cargando datos raw del CSV:', error);
            return null;
        }
    }
    /**
     * Obtiene información del archivo CSV
     */
    static async getCSVFileInfo() {
        try {
            const csvPath = path_1.default.join(__dirname, '../../src/data/integra_updated_v4.csv');
            if (!fs_1.default.existsSync(csvPath)) {
                return { exists: false };
            }
            const stats = fs_1.default.statSync(csvPath);
            return {
                exists: true,
                size: stats.size,
                sizeFormatted: AdminController.formatFileSize(stats.size),
                lastModified: stats.mtime.toISOString(),
                created: stats.birthtime.toISOString()
            };
        }
        catch (error) {
            return { exists: false, error: error instanceof Error ? error.message : 'Error desconocido' };
        }
    }
    /**
     * Parsea una línea CSV (misma lógica que CSVProcessor)
     */
    static parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        while (i < line.length) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                }
                else {
                    inQuotes = !inQuotes;
                    i++;
                }
            }
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
                i++;
            }
            else {
                current += char;
                i++;
            }
        }
        values.push(current.trim());
        return values;
    }
    /**
     * Verifica acceso de administrador (placeholder para autenticación futura)
     */
    static verifyAdminAccess(req) {
        // TODO: Implementar autenticación real
        // Por ahora, verificar header simple o query param para testing
        const adminKey = req.headers['x-admin-key'] || req.query.admin;
        if (adminKey === 'admin-dev-key') {
            return {
                authorized: true,
                reason: 'Acceso de desarrollo autorizado',
                user: 'admin-dev'
            };
        }
        // En desarrollo, permitir acceso si viene de localhost
        const isLocalhost = req.ip === '127.0.0.1' ||
            req.ip === '::1' ||
            req.hostname === 'localhost';
        if (process.env.NODE_ENV === 'development' && isLocalhost) {
            return {
                authorized: true,
                reason: 'Acceso local de desarrollo',
                user: 'localhost-dev'
            };
        }
        return {
            authorized: false,
            reason: 'Se requiere autenticación de administrador'
        };
    }
    /**
     * Formatea el tamaño de archivo en formato legible
     */
    static formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    /**
     * Crear backup del CSV actual con timestamp
     */
    static async createCSVBackup() {
        try {
            const csvPath = path_1.default.join(__dirname, '../../src/data/integra_updated_v4.csv');
            if (!fs_1.default.existsSync(csvPath)) {
                return {
                    success: false,
                    error: 'Archivo CSV actual no encontrado para backup'
                };
            }
            // Crear nombre de backup con timestamp
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/T/, '-')
                .replace(/:/g, '-')
                .substring(0, 19); // YYYY-MM-DD-HH-mm-ss
            const backupFileName = `backup_integra_${timestamp}.csv`;
            const backupPath = path_1.default.join(__dirname, '../../src/data', backupFileName);
            // Copiar archivo actual a backup
            const csvContent = fs_1.default.readFileSync(csvPath, 'utf-8');
            fs_1.default.writeFileSync(backupPath, csvContent, 'utf-8');
            console.log(`📋 Backup creado: ${backupFileName}`);
            return {
                success: true,
                backupPath
            };
        }
        catch (error) {
            console.error('❌ Error creando backup:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Validar contenido del CSV
     */
    static async validateCSVContent(csvContent) {
        const errors = [];
        const warnings = [];
        try {
            // Parsear CSV básico
            const lines = csvContent.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                errors.push('El archivo CSV debe contener al menos una cabecera y una fila de datos');
                return {
                    valid: false,
                    errors,
                    warnings,
                    columnsFound: [],
                    requiredColumnsMet: false,
                    totalColumns: 0,
                    rowCount: 0
                };
            }
            // Parsear cabecera
            const headers = AdminController.parseCSVLine(lines[0]);
            const rowCount = lines.length - 1; // Excluir cabecera
            // Validar columnas requeridas
            const missingColumns = [];
            REQUIRED_CSV_COLUMNS.forEach(requiredCol => {
                if (!headers.some(header => header.trim() === requiredCol)) {
                    missingColumns.push(requiredCol);
                }
            });
            if (missingColumns.length > 0) {
                errors.push(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
            }
            // Validar que hay datos
            if (rowCount === 0) {
                errors.push('El archivo CSV no contiene filas de datos');
            }
            // Validaciones adicionales
            if (headers.length < 5) {
                warnings.push('El archivo tiene pocas columnas, verifique que sea el formato correcto');
            }
            if (rowCount < 1) {
                warnings.push('El archivo tiene pocas filas de datos');
            }
            // Validar formato de algunas filas de muestra
            let invalidRowCount = 0;
            const maxSampleRows = Math.min(5, rowCount); // Validar máximo 5 filas
            for (let i = 1; i <= maxSampleRows; i++) {
                const values = AdminController.parseCSVLine(lines[i]);
                if (values.length !== headers.length) {
                    invalidRowCount++;
                }
            }
            if (invalidRowCount > 0) {
                warnings.push(`${invalidRowCount} de ${maxSampleRows} filas de muestra tienen formato inconsistente`);
            }
            console.log('📊 Validación CSV completada:', {
                totalColumns: headers.length,
                rowCount,
                requiredColumnsMet: missingColumns.length === 0,
                errorsCount: errors.length,
                warningsCount: warnings.length
            });
            return {
                valid: errors.length === 0,
                errors,
                warnings,
                columnsFound: headers,
                requiredColumnsMet: missingColumns.length === 0,
                totalColumns: headers.length,
                rowCount
            };
        }
        catch (error) {
            console.error('❌ Error validando CSV:', error);
            errors.push(`Error parseando CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            return {
                valid: false,
                errors,
                warnings,
                columnsFound: [],
                requiredColumnsMet: false,
                totalColumns: 0,
                rowCount: 0
            };
        }
    }
    /**
     * Guardar nuevo archivo CSV
     */
    static async saveNewCSV(csvContent, originalFilename) {
        try {
            const csvPath = path_1.default.join(__dirname, '../../src/data/integra_updated_v4.csv');
            // Crear directorio si no existe
            const dataDir = path_1.default.dirname(csvPath);
            if (!fs_1.default.existsSync(dataDir)) {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
            }
            // Guardar nuevo archivo
            fs_1.default.writeFileSync(csvPath, csvContent, 'utf-8');
            console.log(`💾 Nuevo CSV guardado desde: ${originalFilename}`);
            return { success: true };
        }
        catch (error) {
            console.error('❌ Error guardando nuevo CSV:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    /**
     * Parsing robusto de CSV que maneja campos multilínea correctamente
     */
    static parseCSVContentRobust(content) {
        const lines = content.split('\n');
        if (lines.length < 2) {
            console.error('❌ Archivo CSV debe tener al menos cabecera y una fila de datos');
            return null;
        }
        // Extraer cabeceras desde la primera línea
        const headers = AdminController.parseCSVLine(lines[0]);
        console.log(`📋 Cabeceras CSV encontradas: ${headers.length} columnas`);
        // Procesar líneas manejando multilinea
        const rows = [];
        let currentRowText = '';
        let inMultilineField = false;
        let quoteCount = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Contar comillas en la línea actual
            const quotesInLine = (line.match(/"/g) || []).length;
            quoteCount += quotesInLine;
            if (currentRowText === '') {
                // Comenzar nueva fila
                currentRowText = line;
            }
            else {
                // Continuar fila multilínea
                currentRowText += '\n' + line;
            }
            // Si tenemos un número par de comillas, la fila está completa
            if (quoteCount % 2 === 0) {
                try {
                    const values = AdminController.parseCSVLine(currentRowText);
                    // Solo procesar si tenemos al menos algunas columnas
                    if (values.length >= Math.floor(headers.length * 0.5)) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });
                        // Añadir metadata adicional
                        row._rowNumber = rows.length + 1;
                        row._rawLine = currentRowText;
                        rows.push(row);
                    }
                    else {
                        console.warn(`⚠️ Fila ${i} descartada: muy pocas columnas (${values.length} vs ${headers.length})`);
                    }
                }
                catch (error) {
                    console.warn(`⚠️ Error parseando fila ${i}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
                }
                // Reiniciar para la siguiente fila
                currentRowText = '';
                quoteCount = 0;
                inMultilineField = false;
            }
            else {
                inMultilineField = true;
            }
        }
        // Procesar última fila si quedó pendiente
        if (currentRowText && !inMultilineField) {
            try {
                const values = AdminController.parseCSVLine(currentRowText);
                if (values.length >= Math.floor(headers.length * 0.5)) {
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    row._rowNumber = rows.length + 1;
                    row._rawLine = currentRowText;
                    rows.push(row);
                }
            }
            catch (error) {
                console.warn(`⚠️ Última fila incompleta descartada: ${error}`);
            }
        }
        console.log(`✅ CSV parseado correctamente: ${rows.length} filas procesadas`);
        return { headers, rows };
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map