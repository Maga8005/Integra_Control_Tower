/**
 * Utilidades para procesamiento de texto y parsing
 * Integra Control Tower MVP
 */
export declare class TextUtils {
    /**
     * Normaliza espacios en blanco en un texto
     */
    static normalizeWhitespace(text: string): string;
    /**
     * Limpia un texto eliminando caracteres especiales comunes
     */
    static cleanText(text: string): string;
    /**
     * Extrae un valor numérico de un texto
     */
    static extractNumber(text: string): number | null;
    /**
     * Extrae un porcentaje de un texto
     */
    static extractPercentage(text: string): number | null;
    /**
     * Capitaliza la primera letra de cada palabra
     */
    static capitalizeWords(text: string): string;
    /**
     * Extrae líneas que contienen un patrón específico
     */
    static extractLinesContaining(text: string, pattern: string | RegExp): string[];
    /**
     * Busca el texto que viene después de una etiqueta específica
     */
    static extractAfterLabel(text: string, label: string, delimiter?: string): string | null;
    /**
     * Divide un texto en bloques basado en un separador
     */
    static splitIntoBlocks(text: string, separator: string | RegExp): string[];
    /**
     * Valida si un texto parece ser un código SWIFT
     */
    static isValidSwiftCode(text: string): boolean;
    /**
     * Valida si un texto parece ser un número de cuenta bancaria
     */
    static isValidAccountNumber(text: string): boolean;
    /**
     * Extrae fechas en formato YYYY-MM-DD de un texto
     */
    static extractDates(text: string): string[];
    /**
     * Convierte una fecha en formato DD/MM/YYYY a YYYY-MM-DD
     */
    static convertDateFormat(dateString: string): string | null;
    /**
     * Encuentra el texto entre dos marcadores
     */
    static extractBetween(text: string, startMarker: string, endMarker: string): string | null;
    /**
     * Limpia caracteres especiales de nombres y mantiene solo letras, números y espacios
     */
    static sanitizeName(name: string): string;
    /**
     * Extrae códigos de moneda (USD, EUR, etc.) de un texto
     */
    static extractCurrencyCode(text: string): string | null;
    /**
     * Determina si un texto contiene información de Incoterms
     */
    static extractIncoterm(text: string): string | null;
    /**
     * Valida y normaliza un nombre de país
     */
    static normalizeCountryName(countryName: string): string;
    /**
     * Extrae términos de pago de un texto
     */
    static extractPaymentTerms(text: string): string | null;
    /**
     * Valida si un texto parece contener información válida de una operación
     */
    static isValidOperationText(text: string): boolean;
    /**
     * Extrae números de teléfono de un texto
     */
    static extractPhoneNumbers(text: string): string[];
    /**
     * Extrae direcciones de email de un texto
     */
    static extractEmails(text: string): string[];
}
//# sourceMappingURL=textUtils.d.ts.map