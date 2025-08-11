/**
 * Procesador CSV para leer archivo real de operaciones Integra
 * Maneja las 19 filas reales con mapeo exacto de estados
 * Integra Control Tower MVP - Soporte multi-país (Colombia y México)
 */
import { OperationDetail } from '../types/Operation';
import { CountryCode } from '../utils/csvMappers';
export interface CSVRow {
    [key: string]: string;
}
export interface ProcessingResult {
    success: boolean;
    data?: OperationDetail[];
    rawData?: CSVRow[];
    countryCode?: CountryCode;
    countryName?: string;
    errors: string[];
    warnings: string[];
    totalProcessed: number;
    validOperations: number;
    validationReport?: string;
    dateReport?: string;
}
export declare class CSVProcessor {
    private static readonly CSV_PATH;
    private static readonly REQUIRED_COLUMNS;
    /**
     * Procesa el archivo CSV completo y convierte a OperationDetail[]
     * ACTUALIZADO: Detecta automáticamente el país (Colombia o México)
     */
    static processCSVFile(csvPath?: string): Promise<ProcessingResult>;
    /**
     * Procesa una fila individual del CSV
     * ACTUALIZADO: Incluye soporte para configuración por país
     */
    static processCSVRow(row: CSVRow, rowNumber: number, countryCode?: CountryCode): OperationDetail | null;
    /**
     * Parsea el contenido CSV crudo
     */
    private static parseCSVContent;
    /**
     * Parsea una línea CSV manejando comillas, comas y multilinea robusto
     */
    private static parseCSVLine;
    /**
     * Parsea contenido CSV con manejo robusto de multilinea
     */
    private static parseCSVContentRobust;
    /**
     * Valida que las columnas requeridas estén presentes
     */
    private static validateRequiredColumns;
    /**
     * Validación flexible de columnas que maneja variaciones en nombres
     */
    private static validateRequiredColumnsFlexible;
    /**
     * Genera ID único para la operación (DETERMINÍSTICO)
     * Usa el valor único de la columna "Nombre" para garantizar consistencia
     */
    private static generateOperationId;
    /**
     * Genera número de operación
     */
    private static generateOperationNumber;
    /**
     * Infiere tipo de empresa basado en el nombre
     */
    private static inferCompanyType;
    /**
     * Genera ruta comercial
     */
    private static generateTradeRoute;
    /**
     * Calcula montos liberados
     */
    private static calculateReleasedAmounts;
    /**
     * Estima costos extra
     */
    private static estimateExtraCosts;
    /**
     * Estima fecha de creación basada en datos CSV
     */
    private static estimateCreationDate;
    /**
     * Extrae observaciones relevantes
     */
    private static extractObservations;
    /**
     * Genera alertas basadas en estados y fechas de vencimiento
     */
    private static generateAlerts;
    /**
     * Obtiene estadísticas del procesamiento
     */
    static getProcessingStats(): Promise<{
        fileExists: boolean;
        fileSize?: number;
        estimatedRows?: number;
        lastModified?: string;
    }>;
    /**
     * Genera reporte consolidado de validación para todas las operaciones
     */
    private static generateConsolidatedValidationReport;
    /**
     * Genera reporte consolidado de fechas para todas las operaciones
     */
    private static generateConsolidatedDateReport;
    /**
     * Extrae valor monetario de un texto cuando el parser principal falla
     */
    private static extractValueFromText;
    /**
     * Formatea Incoterms para mostrar correctamente en el frontend
     */
    private static formatIncoterms;
}
//# sourceMappingURL=CSVProcessor.d.ts.map