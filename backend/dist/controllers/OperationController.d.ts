/**
 * Controller para operaciones - Maneja endpoints relacionados con operaciones CSV
 * Integra Control Tower MVP
 */
import { Request, Response } from 'express';
export declare class OperationController {
    /**
     * GET /api/operations - Obtiene todas las operaciones del CSV
     * ACTUALIZADO: Usa la misma data que el admin dashboard para consistencia
     */
    static getAllOperations(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/operations/:id - Obtiene una operación específica por ID
     * Usa EXACTAMENTE la misma data que el admin dashboard para consistencia
     */
    static getOperationById(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/operations/stats - Obtiene estadísticas generales de las operaciones
     */
    static getOperationStats(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/operations/reload - Recarga las operaciones desde el CSV
     */
    static reloadOperations(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/operations/dashboard - Endpoint optimizado para dashboard
     * Usa las funciones de mapeo específicas para obtener OperationCard
     */
    static getDashboardOperations(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/operations/csv/info - Obtiene información del archivo CSV
     */
    static getCSVInfo(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene operaciones desde cache o las carga del CSV
     */
    private static getOperationsFromCache;
    /**
     * Aplica filtros a las operaciones
     */
    private static applyFilters;
    /**
     * Calcula estadísticas de las operaciones
     */
    private static calculateStats;
}
//# sourceMappingURL=OperationController.d.ts.map