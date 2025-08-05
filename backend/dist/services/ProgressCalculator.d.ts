/**
 * Calculador preciso de progreso para timeline de 5 fases
 * Lógica exacta para determinar porcentajes de progreso basado en estados CSV
 * Integra Control Tower MVP
 */
import { EstadoProceso } from '../types/Operation';
import { CSVRow } from './CSVProcessor';
import { ParsedOperationInfo } from './OperationInfoParser';
export interface PhaseProgress {
    phase: number;
    name: string;
    progress: number;
    estado: EstadoProceso;
    reason: string;
    dependencies: boolean;
}
export interface OverallProgress {
    totalProgress: number;
    completedPhases: number;
    currentPhase: number | null;
    nextPhase: number | null;
    phaseDetails: PhaseProgress[];
}
/**
 * Calcula el progreso exacto de cada una de las 5 fases
 */
export declare function calculatePreciseProgress(csvRow: CSVRow, parsedInfo: ParsedOperationInfo): OverallProgress;
//# sourceMappingURL=ProgressCalculator.d.ts.map