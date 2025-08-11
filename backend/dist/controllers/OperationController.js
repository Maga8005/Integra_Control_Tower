"use strict";
/**
 * Controller para operaciones - Maneja endpoints relacionados con operaciones CSV
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationController = void 0;
const tslib_1 = require("tslib");
const CSVProcessor_1 = require("../services/CSVProcessor");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
// Removed: import { mapMultipleCSVToCards, validateCSVRow } from '../utils/csvMappers';
// Cache simple en memoria para las operaciones
let operationsCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION_MS = 30 * 1000; // 30 segundos
class OperationController {
    /**
     * GET /api/operations - Obtiene todas las operaciones del CSV
     * ACTUALIZADO: Usa la misma data que el admin dashboard para consistencia
     */
    static async getAllOperations(req, res) {
        try {
            console.log('📊 GET /api/operations - Solicitando todas las operaciones (MODO UNIFICADO)');
            // Usar la misma lógica que el admin dashboard para consistencia
            const countries = ['CO', 'MX'];
            let allOperations = [];
            for (const country of countries) {
                try {
                    const countryFileName = `integra_${country.toLowerCase()}_data.csv`;
                    const countryFilePath = path_1.default.join(__dirname, `../../src/data/${countryFileName}`);
                    // Check if country file exists
                    if (!fs_1.default.existsSync(countryFilePath)) {
                        console.log(`⚠️ Archivo de ${country} no encontrado: ${countryFileName}`);
                        continue;
                    }
                    // Process country CSV using the same method as AdminController
                    const result = await CSVProcessor_1.CSVProcessor.processCSVFile(countryFilePath);
                    if (result.success && result.data && result.data.length > 0) {
                        console.log(`📊 ${country}: ${result.data.length} operaciones cargadas`);
                        allOperations.push(...result.data);
                    }
                    else {
                        console.log(`⚠️ Error procesando ${country}:`, result.errors);
                    }
                }
                catch (error) {
                    console.error(`⚠️ Error cargando ${country}:`, error);
                }
            }
            console.log(`✅ Total operaciones cargadas: ${allOperations.length}`);
            if (allOperations.length === 0) {
                res.status(500).json({
                    success: false,
                    message: 'No se encontraron operaciones en ningún país',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Aplicar filtros si se proporcionan
            const filteredOperations = OperationController.applyFilters(allOperations, req.query);
            // Aplicar paginación
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedOperations = filteredOperations.slice(startIndex, endIndex);
            console.log(`✅ Devolviendo ${paginatedOperations.length} operaciones (página ${page})`);
            res.status(200).json({
                success: true,
                data: {
                    data: paginatedOperations,
                    total: filteredOperations.length,
                    page,
                    limit,
                    totalPages: Math.ceil(filteredOperations.length / limit)
                },
                message: 'Operaciones obtenidas exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en getAllOperations:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /api/operations/:id - Obtiene una operación específica por ID
     * Usa EXACTAMENTE la misma data que el admin dashboard para consistencia
     */
    static async getOperationById(req, res) {
        try {
            const { id } = req.params;
            console.log(`🔍 GET /api/operations/${id} - Buscando operación específica`);
            // Import AdminController to use the same data processing
            const { AdminController } = await Promise.resolve().then(() => tslib_1.__importStar(require('./AdminController')));
            const countries = ['CO', 'MX'];
            let foundOperation = null;
            let foundCountry = null;
            // Use the EXACT same logic as AdminController.getCountryData
            for (const country of countries) {
                try {
                    const countryName = country === 'CO' ? 'Colombia' : 'México';
                    const countryFileName = `integra_${country.toLowerCase()}_data.csv`;
                    const countryFilePath = path_1.default.join(__dirname, `../../src/data/${countryFileName}`);
                    console.log(`🌍 Buscando operación ${id} en ${countryName}...`);
                    // Check if country file exists
                    if (!fs_1.default.existsSync(countryFilePath)) {
                        console.log(`⚠️ Archivo de ${countryName} no encontrado`);
                        continue;
                    }
                    // Use the EXACT same processing as AdminController.getCountryData
                    const processingResult = await CSVProcessor_1.CSVProcessor.processCSVFile(countryFilePath);
                    if (processingResult.success && processingResult.data && processingResult.data.length > 0) {
                        console.log(`📊 ${countryName}: ${processingResult.data.length} operaciones procesadas`);
                        // Search for the operation
                        const operation = processingResult.data.find((op) => op.id === id);
                        if (operation) {
                            foundOperation = operation;
                            foundCountry = country;
                            console.log(`✅ Operación ${id} encontrada en ${countryName}: ${operation.clienteCompleto}`);
                            break;
                        }
                        else {
                            // Log available IDs for debugging (first 5)
                            const availableIds = processingResult.data.slice(0, 5).map((op) => op.id);
                            console.log(`❌ Operación ${id} NO encontrada en ${countryName}`);
                            console.log(`   IDs disponibles (primeros 5): ${availableIds.join(', ')}`);
                        }
                    }
                    else {
                        console.log(`⚠️ Error procesando datos de ${countryName}:`, processingResult.errors);
                    }
                }
                catch (error) {
                    console.error(`⚠️ Error procesando ${country}:`, error);
                    continue;
                }
            }
            if (!foundOperation) {
                console.log(`❌ Operación ${id} NO ENCONTRADA en ningún país`);
                res.status(404).json({
                    success: false,
                    message: `Operación con ID ${id} no encontrada`,
                    errors: [`Operación ${id} no existe en los datos de Colombia ni México`],
                    timestamp: new Date().toISOString()
                });
                return;
            }
            console.log(`✅ OPERACIÓN ENCONTRADA: ${foundOperation.clienteCompleto} (${foundCountry})`);
            res.status(200).json({
                success: true,
                data: foundOperation,
                message: 'Operación obtenida exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ ERROR CRÍTICO en getOperationById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /api/operations/stats - Obtiene estadísticas generales de las operaciones
     */
    static async getOperationStats(req, res) {
        try {
            console.log('📈 GET /api/operations/stats - Calculando estadísticas');
            const operations = await OperationController.getOperationsFromCache();
            if (!operations) {
                res.status(500).json({
                    success: false,
                    message: 'Error procesando archivo CSV',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const stats = OperationController.calculateStats(operations);
            console.log(`✅ Estadísticas calculadas para ${operations.length} operaciones`);
            res.status(200).json({
                success: true,
                data: stats,
                message: 'Estadísticas calculadas exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en getOperationStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * POST /api/operations/reload - Recarga las operaciones desde el CSV
     */
    static async reloadOperations(req, res) {
        try {
            console.log('🔄 POST /api/operations/reload - Recargando operaciones desde CSV');
            // Limpiar cache
            operationsCache = null;
            lastCacheUpdate = null;
            // Forzar recarga desde CSV
            const result = await CSVProcessor_1.CSVProcessor.processCSVFile();
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    message: 'Error procesando archivo CSV',
                    errors: result.errors,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            // Actualizar cache
            operationsCache = result.data || [];
            lastCacheUpdate = new Date();
            console.log(`✅ Operaciones recargadas: ${result.validOperations}/${result.totalProcessed}`);
            res.status(200).json({
                success: true,
                data: {
                    totalProcessed: result.totalProcessed,
                    validOperations: result.validOperations,
                    errors: result.errors,
                    reloadedAt: lastCacheUpdate.toISOString()
                },
                message: 'Operaciones recargadas exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en reloadOperations:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * GET /api/operations/dashboard - Endpoint optimizado para dashboard
     * Usa las funciones de mapeo específicas para obtener OperationCard
     */
    static async getDashboardOperations(req, res) {
        try {
            console.log('🎯 GET /api/operations/dashboard - Solicitando datos para dashboard');
            // NUEVO: Usar datos ya procesados del cache para consistencia
            const operations = await OperationController.getOperationsFromCache();
            if (!operations) {
                res.status(500).json({
                    success: false,
                    data: [],
                    metadata: {
                        totalOperations: 0,
                        lastUpdated: new Date().toISOString(),
                        processingStats: {
                            validOperations: 0,
                            errorCount: 1,
                            warningCount: 0
                        }
                    },
                    message: 'Error procesando archivo CSV',
                    errors: ['No se pudieron cargar las operaciones']
                });
                return;
            }
            console.log(`📊 Convirtiendo ${operations.length} operaciones procesadas para dashboard...`);
            // Convertir OperationDetail[] a BackendOperationCard[] para el dashboard con manejo de errores
            const operationCards = [];
            operations.forEach((operation, index) => {
                try {
                    console.log(`📋 Mapeando operación ${index + 1}/${operations.length}: ${operation.id}`);
                    // Convertir timeline de backend a formato frontend
                    let timeline = undefined;
                    let currentPhaseName = undefined;
                    if (operation.timeline && operation.timeline.length > 0) {
                        const states = operation.timeline.map((event, idx) => ({
                            id: idx + 1, // Frontend usa números para id
                            name: event.fase || event.descripcion || `Fase ${idx + 1}`,
                            status: event.estado === 'completado' ? 'completed' :
                                event.estado === 'en_proceso' ? 'in-progress' :
                                    event.estado === 'bloqueado' ? 'blocked' : 'pending',
                            progress: event.progreso || 0,
                            description: event.descripcion || '',
                            completedAt: event.estado === 'completado' ? event.fecha : undefined,
                            notes: event.notas || ''
                        }));
                        // Encontrar fase actual (última completada o primera en progreso)
                        let currentStateIndex = 0;
                        for (let i = states.length - 1; i >= 0; i--) {
                            if (states[i].status === 'completed' || states[i].status === 'in-progress') {
                                currentStateIndex = i;
                                currentPhaseName = states[i].name;
                                break;
                            }
                        }
                        timeline = {
                            states,
                            currentState: currentStateIndex,
                            overallProgress: Math.round(operation.progresoGeneral || 0)
                        };
                    }
                    const card = {
                        id: operation.id,
                        clientName: operation.clienteCompleto || 'Cliente no especificado',
                        clientNit: operation.clienteNit || '', // NUEVO: Usar el NIT ya extraído
                        providerName: operation.proveedorBeneficiario || 'Proveedor no especificado',
                        totalValue: `$${(operation.valorTotal || 0).toLocaleString()} ${operation.moneda || 'USD'}`, // Valor compra mercancía
                        totalValueNumeric: operation.valorTotal || 0,
                        operationValue: operation.valorOperacion ? `$${operation.valorOperacion.toLocaleString()} ${operation.moneda || 'USD'}` : undefined, // NUEVO: Valor operación
                        operationValueNumeric: operation.valorOperacion, // NUEVO: Valor operación numérico
                        route: operation.rutaComercial || 'Ruta no especificada',
                        assignedPerson: operation.personaAsignada || 'No asignado',
                        progress: Math.round(operation.progresoGeneral || 0),
                        status: (operation.progresoGeneral || 0) === 100 ? 'completed' :
                            (operation.progresoGeneral || 0) > 0 ? 'in-progress' : 'draft',
                        currentPhaseName, // NUEVO: Nombre de la fase actual
                        timeline, // NUEVO: Timeline convertido al formato frontend
                        createdAt: operation.fechaCreacion || new Date().toISOString(),
                        updatedAt: operation.ultimaActualizacion || new Date().toISOString()
                    };
                    operationCards.push(card);
                    console.log(`✅ Operación ${index + 1} mapeada exitosamente: ${card.clientName}`);
                }
                catch (error) {
                    console.error(`❌ Error mapeando operación ${index + 1}:`, error);
                    console.error(`   ID: ${operation?.id}`);
                    console.error(`   Cliente: ${operation?.clienteCompleto}`);
                }
            });
            // DEBUG: Log all operations to see what's being filtered out
            console.log(`📋 Todas las operaciones antes del filtrado:`);
            operationCards.forEach((card, index) => {
                console.log(`  ${index + 1}. ID: ${card.id}`);
                console.log(`     Cliente: "${card.clientName}"`);
                console.log(`     NIT: "${card.clientNit}"`);
                console.log(`     Ruta: "${card.route}"`);
                console.log(`     ---`);
            });
            // TEMPORARILY: No filtering to see all operations
            const cleanCards = operationCards;
            console.log(`🔍 Filtrado: ${cleanCards.length}/${operationCards.length} operaciones válidas para dashboard`);
            // Aplicar filtros adicionales si se proporcionan
            let filteredCards = [...cleanCards];
            // Filtro por cliente
            if (req.query.cliente) {
                const clienteFilter = req.query.cliente.toLowerCase();
                filteredCards = filteredCards.filter(card => card.clientName.toLowerCase().includes(clienteFilter));
            }
            // Filtro por estado
            if (req.query.status) {
                filteredCards = filteredCards.filter(card => card.status === req.query.status);
            }
            // Filtro por persona asignada
            if (req.query.assignedPerson) {
                const personFilter = req.query.assignedPerson.toLowerCase();
                filteredCards = filteredCards.filter(card => card.assignedPerson.toLowerCase().includes(personFilter));
            }
            // Aplicar paginación
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50; // Límite más alto para dashboard
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedCards = filteredCards.slice(startIndex, endIndex);
            console.log(`✅ Dashboard: ${paginatedCards.length} operaciones devueltas para dashboard`);
            console.log(`📈 Estadísticas: ${cleanCards.length} válidas de ${operations.length} procesadas`);
            // Respuesta optimizada para dashboard
            const response = {
                success: true,
                data: paginatedCards,
                metadata: {
                    totalOperations: filteredCards.length,
                    lastUpdated: new Date().toISOString(),
                    processingStats: {
                        validOperations: cleanCards.length,
                        errorCount: operations.length - cleanCards.length,
                        warningCount: 0
                    }
                },
                message: `Dashboard actualizado con ${paginatedCards.length} operaciones`
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('❌ Error en getDashboardOperations:', error);
            const errorResponse = {
                success: false,
                data: [],
                metadata: {
                    totalOperations: 0,
                    lastUpdated: new Date().toISOString(),
                    processingStats: {
                        validOperations: 0,
                        errorCount: 1,
                        warningCount: 0
                    }
                },
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido']
            };
            res.status(500).json(errorResponse);
        }
    }
    /**
     * GET /api/operations/csv/info - Obtiene información del archivo CSV
     */
    static async getCSVInfo(req, res) {
        try {
            console.log('📄 GET /api/operations/csv/info - Obteniendo info del CSV');
            const csvStats = await CSVProcessor_1.CSVProcessor.getProcessingStats();
            res.status(200).json({
                success: true,
                data: {
                    ...csvStats,
                    cacheStatus: {
                        cached: operationsCache !== null,
                        lastUpdate: lastCacheUpdate?.toISOString() || null,
                        cacheSize: operationsCache?.length || 0
                    }
                },
                message: 'Información del CSV obtenida exitosamente',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en getCSVInfo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Obtiene operaciones desde cache o las carga del CSV
     */
    static async getOperationsFromCache() {
        const now = new Date();
        // Verificar si el cache es válido
        if (operationsCache &&
            lastCacheUpdate &&
            (now.getTime() - lastCacheUpdate.getTime()) < CACHE_DURATION_MS) {
            console.log('📋 Usando operaciones desde cache');
            return operationsCache;
        }
        console.log('🔄 Cache expirado o vacío, cargando desde CSV...');
        // Cargar desde CSV
        const result = await CSVProcessor_1.CSVProcessor.processCSVFile();
        if (result.success && result.data) {
            operationsCache = result.data;
            lastCacheUpdate = now;
            console.log(`✅ Cache actualizado con ${result.data.length} operaciones`);
            return result.data;
        }
        console.error('❌ Error cargando operaciones desde CSV:', result.errors);
        return null;
    }
    /**
     * Aplica filtros a las operaciones
     */
    static applyFilters(operations, queryParams) {
        let filtered = [...operations];
        // Filtro por cliente
        if (queryParams.cliente) {
            const clienteFilter = queryParams.cliente.toLowerCase();
            filtered = filtered.filter(op => op.clienteCompleto.toLowerCase().includes(clienteFilter));
        }
        // Filtro por persona asignada
        if (queryParams.personaAsignada) {
            const personaFilter = queryParams.personaAsignada.toLowerCase();
            filtered = filtered.filter(op => op.personaAsignada.toLowerCase().includes(personaFilter));
        }
        // Filtro por rango de valores
        if (queryParams.valorMinimo) {
            const valorMin = parseFloat(queryParams.valorMinimo);
            if (!isNaN(valorMin)) {
                filtered = filtered.filter(op => op.valorTotal >= valorMin);
            }
        }
        if (queryParams.valorMaximo) {
            const valorMax = parseFloat(queryParams.valorMaximo);
            if (!isNaN(valorMax)) {
                filtered = filtered.filter(op => op.valorTotal <= valorMax);
            }
        }
        // Filtro por progreso
        if (queryParams.progresoMinimo) {
            const progresoMin = parseInt(queryParams.progresoMinimo);
            if (!isNaN(progresoMin)) {
                filtered = filtered.filter(op => op.progresoGeneral >= progresoMin);
            }
        }
        // Filtro por moneda
        if (queryParams.moneda) {
            filtered = filtered.filter(op => op.moneda === queryParams.moneda);
        }
        console.log(`🔍 Filtros aplicados: ${operations.length} → ${filtered.length} operaciones`);
        return filtered;
    }
    /**
     * Calcula estadísticas de las operaciones
     */
    static calculateStats(operations) {
        const totalOperations = operations.length;
        const totalValue = operations.reduce((sum, op) => sum + op.valorTotal, 0);
        const averageValue = totalOperations > 0 ? totalValue / totalOperations : 0;
        // Distribución por progreso
        const progressDistribution = {
            inicial: 0, // 0-25%
            proceso: 0, // 26-75%
            avanzado: 0, // 76-99%
            completado: 0 // 100%
        };
        // Distribución por moneda
        const currencyDistribution = {};
        // Distribución por persona asignada
        const assigneeDistribution = {};
        // Top 5 operaciones por valor
        const topOperations = [...operations]
            .sort((a, b) => b.valorTotal - a.valorTotal)
            .slice(0, 5)
            .map(op => ({
            id: op.id,
            cliente: op.clienteCompleto,
            valor: op.valorTotal,
            progreso: op.progresoGeneral
        }));
        operations.forEach(op => {
            // Distribución por progreso
            if (op.progresoGeneral === 100) {
                progressDistribution.completado++;
            }
            else if (op.progresoGeneral >= 76) {
                progressDistribution.avanzado++;
            }
            else if (op.progresoGeneral >= 26) {
                progressDistribution.proceso++;
            }
            else {
                progressDistribution.inicial++;
            }
            // Distribución por moneda
            currencyDistribution[op.moneda] = (currencyDistribution[op.moneda] || 0) + 1;
            // Distribución por persona asignada
            assigneeDistribution[op.personaAsignada] = (assigneeDistribution[op.personaAsignada] || 0) + 1;
        });
        return {
            summary: {
                totalOperations,
                totalValue,
                averageValue: Math.round(averageValue),
                lastUpdate: lastCacheUpdate?.toISOString() || null
            },
            distributions: {
                progress: progressDistribution,
                currency: currencyDistribution,
                assignee: assigneeDistribution
            },
            topOperations
        };
    }
}
exports.OperationController = OperationController;
//# sourceMappingURL=OperationController.js.map