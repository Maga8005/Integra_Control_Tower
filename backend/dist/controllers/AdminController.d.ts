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
    /**
     * POST /api/admin/upload-country-csv/:country - Upload CSV específico por país (UNIFICADO)
     */
    static uploadCountryCSV(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/country-data/:country - Obtener datos específicos por país
     */
    static getCountryData(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/admin/process-mexico-csv - Procesar CSV de México específicamente
     */
    static processMexicoCSV(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/country-comparison - Comparar estructuras de CSV entre países
     */
    static compareCountryCSVs(req: Request, res: Response): Promise<void>;
    /**
     * Crear backup del CSV actual por país con timestamp
     */
    private static createCountryCSVBackup;
    /**
     * Guardar nuevo archivo CSV por país
     */
    private static saveCountryCSV;
    /**
     * GET /api/admin/countries - Listar países disponibles y configuraciones
     */
    static getAvailableCountries(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AdminController.d.ts.map