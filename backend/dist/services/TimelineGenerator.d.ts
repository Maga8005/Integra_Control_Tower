/**
 * Generador de timeline de 5 fases exactas para operaciones Integra
 * Mapea los estados CSV a un timeline visual coherente
 * Integra Control Tower MVP
 */
import { TimelineEvent } from '../types/Operation';
import { CSVRow } from './CSVProcessor';
import { ParsedOperationInfo } from './OperationInfoParser';
export interface TimelinePhase {
    name: string;
    description: string;
    icon: string;
    dependencies: string[];
}
/**
 * Genera timeline de 5 fases basado en datos CSV y información parseada
 */
export declare function generateTimeline(csvRow: CSVRow, parsedInfo: ParsedOperationInfo): TimelineEvent[];
/**
 * Calcula el progreso general basado en el timeline
 */
export declare function calculateOverallProgress(timeline: TimelineEvent[]): number;
/**
 * Obtiene un resumen del estado del timeline
 */
export declare function getTimelineSummary(timeline: TimelineEvent[]): {
    completedPhases: number;
    inProgressPhases: number;
    pendingPhases: number;
    currentPhase: string | null;
    nextPhase: string | null;
    overallProgress: number;
};
/**
 * Valida que el timeline sea coherente (las fases sigan un orden lógico)
 */
export declare function validateTimelineCoherence(timeline: TimelineEvent[]): {
    isCoherent: boolean;
    issues: string[];
};
//# sourceMappingURL=TimelineGenerator.d.ts.map