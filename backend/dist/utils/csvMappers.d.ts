/**
 * Funciones de mapeo específicas para conectar datos CSV con dashboard
 * Integra Control Tower MVP
 */
export interface ParsedGeneralInfo {
    cliente: string;
    proveedor: string;
    valor: number;
    ruta: string;
    moneda: string;
}
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
 * 4. Función principal de mapeo CSV a OperationCard para Dashboard
 * Combina todas las funciones anteriores para transformar una fila CSV completa
 */
export declare function mapCSVToOperationCard(csvRow: CSVRowData): OperationCard;
/**
 * 6. Función para mapear múltiples filas CSV a OperationCard
 * Procesa un array completo de datos CSV para el dashboard
 */
export declare function mapMultipleCSVToCards(csvRows: CSVRowData[]): OperationCard[];
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