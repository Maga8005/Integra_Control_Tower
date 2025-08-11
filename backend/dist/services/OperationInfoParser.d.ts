/**
 * Parser robusto para extraer información del campo "5. Info Gnal + Info Compra Int"
 * Integra Control Tower MVP
 */
import { ParsedOperationInfo, DatosBancarios, GiroInfo, Liberacion } from '../types/Operation';
export interface ParsingError {
    field: string;
    error: string;
    rawValue?: string;
}
export interface ParsingResult {
    success: boolean;
    data?: ParsedOperationInfo;
    errors: ParsingError[];
    warnings: string[];
}
/**
 * Función principal que parsea todo el texto de la operación
 */
export declare function parseOperationInfo(text: string, csvRow?: any): ParsedOperationInfo;
/**
 * Extrae información de giros del texto
 */
export declare function extractGiros(text: string, csvRow?: any): GiroInfo[];
/**
 * Extrae información de liberaciones del texto
 */
export declare function extractLiberaciones(text: string): Liberacion[];
/**
 * Extrae datos bancarios del texto
 */
export declare function extractDatosBancarios(text: string): DatosBancarios;
/**
 * Utilidad para extraer valores usando regex
 */
export declare function extractValue(text: string, regex: RegExp): string;
/**
 * Utilidad para extraer números usando regex
 */
export declare function extractNumber(text: string, regex: RegExp): number;
export declare class OperationInfoParser {
    private static readonly FIELD_PATTERNS;
    private static readonly CURRENCY_MAP;
    /**
     * Parser principal que procesa el texto completo
     */
    static parse(rawText: string): ParsingResult;
    /**
     * Limpia el texto de entrada eliminando caracteres especiales y normalizando espacios
     */
    private static cleanInputText;
    /**
     * Extrae información básica de la operación
     */
    private static extractBasicInfo;
    /**
     * Extrae información bancaria
     */
    private static extractBankingInfo;
    /**
     * Extrae información de giros
     */
    private static extractGiros;
    /**
     * Extrae información de liberaciones
     */
    private static extractLiberaciones;
    /**
     * Valida que la información crítica esté presente
     */
    private static validateCriticalInfo;
    /**
     * Método utilitario para extraer porcentajes de texto
     */
    static extractPercentage(text: string): number | null;
    /**
     * Método utilitario para extraer valores monetarios
     */
    static extractMonetaryValue(text: string): number | null;
    /**
     * Método para validar formato de fecha
     */
    static isValidDate(dateString: string): boolean;
}
//# sourceMappingURL=OperationInfoParser.d.ts.map