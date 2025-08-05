/**
 * Validador detallado de estados por fase
 * Verifica coherencia y dependencias entre las 5 fases del timeline
 * Integra Control Tower MVP
 */
import { CSVRow } from './CSVProcessor';
import { ParsedOperationInfo } from './OperationInfoParser';
import { PhaseProgress, OverallProgress } from './ProgressCalculator';
export interface ValidationResult {
    isValid: boolean;
    warnings: ValidationWarning[];
    errors: ValidationError[];
    suggestions: string[];
}
export interface ValidationWarning {
    phase: number;
    type: 'dependency' | 'inconsistency' | 'data_quality';
    message: string;
    severity: 'low' | 'medium' | 'high';
}
export interface ValidationError {
    phase: number;
    type: 'logical_error' | 'missing_data' | 'invalid_state';
    message: string;
    blocking: boolean;
}
export interface PhaseValidationContext {
    csvRow: CSVRow;
    parsedInfo: ParsedOperationInfo;
    phaseDetails: PhaseProgress[];
    overallProgress: OverallProgress;
}
/**
 * Valida la coherencia completa del timeline de 5 fases
 */
export declare function validateCompleteTimeline(context: PhaseValidationContext): ValidationResult;
/**
 * Genera un reporte de validación legible
 */
export declare function generateValidationReport(validation: ValidationResult): string;
//# sourceMappingURL=PhaseValidator.d.ts.map