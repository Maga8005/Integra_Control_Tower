/**
 * Controller para endpoints administrativos - Acceso a datos raw del CSV
 * Integra Control Tower MVP
 */
import { Request, Response } from 'express';
export declare class AdminController {
    /**
     * Configuración de multer para upload (método estático para acceso externo)
     */
    static getUploadMiddleware(): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
    /**
     * POST /api/admin/upload-csv - Cargar nuevo archivo CSV y reemplazar datos actuales
     */
    static uploadCSV(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/csv-data - Retorna todos los datos raw del CSV procesado
     */
    static getCSVData(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/csv-fields - Retorna solo los nombres de columnas disponibles
     */
    static getCSVFields(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/admin/csv-refresh - Fuerza la recarga del cache del CSV
     */
    static refreshCSVCache(req: Request, res: Response): Promise<void>;
    /**
     * Obtiene datos raw del CSV (con cache)
     */
    private static getRawCSVData;
    /**
     * Obtiene información del archivo CSV
     */
    private static getCSVFileInfo;
    /**
     * Parsea una línea CSV (misma lógica que CSVProcessor)
     */
    private static parseCSVLine;
    /**
     * Verifica acceso de administrador (placeholder para autenticación futura)
     */
    private static verifyAdminAccess;
    /**
     * Formatea el tamaño de archivo en formato legible
     */
    private static formatFileSize;
    /**
     * Crear backup del CSV actual con timestamp
     */
    private static createCSVBackup;
    /**
     * Validar contenido del CSV
     */
    private static validateCSVContent;
    /**
     * Guardar nuevo archivo CSV
     */
    private static saveNewCSV;
    /**
     * Parsing robusto de CSV que maneja campos multilínea correctamente
     */
    private static parseCSVContentRobust;
}
//# sourceMappingURL=AdminController.d.ts.map