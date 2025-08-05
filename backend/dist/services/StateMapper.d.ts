/**
 * Mapeo exacto de estados CSV a timeline de 5 fases
 * Lógica crítica para determinar estados basado en campos específicos del CSV
 * Integra Control Tower MVP
 */
import { EstadoProceso, EstadosProceso } from '../types/Operation';
import { CSVRow } from './CSVProcessor';
import { ParsedOperationInfo } from './OperationInfoParser';
export interface StateAnalysis {
    estados: EstadosProceso;
    analysis: {
        [key: string]: {
            condition: string;
            result: EstadoProceso;
            reason: string;
        };
    };
}
/**
 * Mapea estados CSV a los 6 estados principales del sistema
 */
export declare function mapEstados(csvRow: CSVRow): EstadosProceso;
/**
 * Análisis detallado de estados con explicaciones
 */
export declare function analyzeStates(csvRow: CSVRow, parsedInfo: ParsedOperationInfo): StateAnalysis;
/**
 * Calcula el progreso de giros/pagos basado en los datos parseados
 */
export declare function calculatePaymentProgress(parsedInfo: ParsedOperationInfo): {
    progress: number;
    totalValue: number;
    paidValue: number;
    pendingValue: number;
};
/**
 * Verifica si las liberaciones coinciden con el valor total
 */
export declare function validateLiberations(parsedInfo: ParsedOperationInfo, tolerance?: number): {
    isComplete: boolean;
    totalValue: number;
    liberatedValue: number;
    difference: number;
};
//# sourceMappingURL=StateMapper.d.ts.map