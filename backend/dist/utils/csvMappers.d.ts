/**
 * Funciones de mapeo específicas para conectar datos CSV con dashboard
 * Integra Control Tower MVP - Soporte multi-país (Colombia y México)
 */
export interface ParsedGeneralInfo {
    cliente: string;
    proveedor: string;
    valor: number;
    ruta: string;
    moneda: string;
    incotermCompra?: string;
    incotermVenta?: string;
}
export type CountryCode = 'CO' | 'MX';
export interface CountryConfig {
    code: CountryCode;
    name: string;
    hasDocLegalXComp: boolean;
}
export declare const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig>;
export interface ProgressInfo {
    currentStep: number;
    percentage: number;
    stepName: string;
    isCompleted: boolean;
}
export interface CSVRowData {
    [key: string]: string;
}
import { Timeline } from './timelineMapper';
import { GiroInfo, Liberacion } from '../types/Operation';
export interface OperationCard {
    id: string;
    clientName: string;
    clientNit: string;
    providerName: string;
    totalValue: string;
    totalValueNumeric: number;
    route: string;
    assignedPerson: string;
    progress: number;
    status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
    currentPhaseName?: string;
    timeline?: Timeline;
    incotermCompra?: string;
    incotermVenta?: string;
    giros: GiroInfo[];
    liberaciones: Liberacion[];
    createdAt?: string;
    updatedAt?: string;
}
/**
 * 1. Función para parsear la columna "5.Info Gnal + Info Compra Int"
 * Extrae cliente, valor total y ruta (países origen/destino)
 */
export declare function parseInfoGeneralColumn(infoGeneralValue: string): ParsedGeneralInfo;
/**
 * 2. Función para calcular progreso basado en la columna "Proceso"
 * Mapea los 6 pasos específicos con sus porcentajes exactos
 */
export declare function calculateProgressFromProceso(procesoValue: string): ProgressInfo;
/**
 * 3. Función para extraer NIT/RFC de la columna "1. Docu. Cliente"
 * Extrae el NIT/RFC del cliente desde la documentación
 */
export declare function extractClientNit(docuClienteValue: string): string;
/**
 * Detecta el país basado en la estructura del CSV
 * México: 32 columnas (sin "8. ESTADO Doc Legal X Comp" y "8. Doc Legal X Comp")
 * Colombia: 34 columnas (con todas las columnas)
 */
export declare function detectCountryFromCSV(csvRow: CSVRowData): CountryCode;
/**
 * 4. Función principal de mapeo CSV a OperationCard para Dashboard
 * Combina todas las funciones anteriores para transformar una fila CSV completa
 * ACTUALIZADO: Soporte multi-país
 */
export declare function mapCSVToOperationCard(csvRow: CSVRowData, countryCode?: CountryCode): OperationCard;
/**
 * 6. Función para mapear múltiples filas CSV a OperationCard
 * Procesa un array completo de datos CSV para el dashboard
 * ACTUALIZADO: Soporte multi-país
 */
export declare function mapMultipleCSVToCards(csvRows: CSVRowData[], countryCode?: CountryCode): OperationCard[];
/**
 * Función para extraer datos de giros estructurados de la columna "5. Info Gnal + Info Compra Int"
 */
export declare function extractGirosFromInfoGeneral(infoGeneralValue: string): GiroInfo[];
/**
 * Función para extraer datos de liberaciones estructuradas de la columna "5. Info Gnal + Info Compra Int"
 */
export declare function extractLiberacionesFromInfoGeneral(infoGeneralValue: string): Liberacion[];
/**
 * 5. Función para validar datos CSV antes del mapeo
 * Verifica que los campos críticos estén presentes
 */
export declare function validateCSVRow(csvRow: CSVRowData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
//# sourceMappingURL=csvMappers.d.ts.map