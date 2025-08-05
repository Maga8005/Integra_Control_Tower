/**
 * Utilidades para generación de fechas realistas en timeline
 * Simula fechas coherentes para las 5 fases del proceso Integra
 * Integra Control Tower MVP
 */
import { PhaseProgress } from '../services/ProgressCalculator';
import type { GiroInfo, Liberacion } from '../types/Operation';
export interface DateRange {
    start: Date;
    end: Date;
    estimated: Date;
    actual?: Date;
}
export interface PhaseDateConfig {
    name: string;
    baseDelayDays: number;
    variationDays: number;
    businessDaysOnly: boolean;
    dependencies: number[];
}
/**
 * Genera fechas realistas para todas las fases basado en progreso actual
 */
export declare function generateRealisticDates(phaseDetails: PhaseProgress[], baseDate?: Date): DateRange[];
/**
 * Verifica si una fecha es día hábil
 */
export declare function isBusinessDay(date: Date): boolean;
/**
 * Calcula días hábiles entre dos fechas
 */
export declare function calculateBusinessDaysBetween(startDate: Date, endDate: Date): number;
/**
 * Genera fechas festivas colombianas (simplificado)
 */
export declare function getColombianHolidays(year: number): Date[];
/**
 * Verifica si una fecha es festivo en Colombia
 */
export declare function isColombianHoliday(date: Date): boolean;
/**
 * Ajusta una fecha evitando fines de semana y festivos
 */
export declare function adjustToWorkingDay(date: Date, forward?: boolean): Date;
/**
 * Calcula duración realista de una fase basada en su progreso
 */
export declare function calculatePhaseDuration(phase: PhaseProgress, config: PhaseDateConfig): {
    estimatedDays: number;
    actualDays?: number;
};
/**
 * Genera reporte de timeline con fechas
 */
export declare function generateDateReport(phaseDetails: PhaseProgress[], dateRanges: DateRange[]): string;
/**
 * Calcula fecha de vencimiento para giros cuando no está disponible
 * Basado en términos de pago estándar (30-90 días)
 */
export declare function calculateGiroVencimiento(giro: GiroInfo, fechaBase?: Date, terminosPago?: string): string | null;
/**
 * Calcula fecha de vencimiento para liberaciones cuando no está disponible
 * Basado en la fecha de la liberación + buffer estándar
 */
export declare function calculateLiberacionVencimiento(liberacion: Liberacion, bufferDias?: number): string | null;
/**
 * Calcula todas las fechas de vencimiento faltantes en una operación
 */
export declare function calculateMissingVencimientos(giros: GiroInfo[], liberaciones: Liberacion[], terminosPago?: string, fechaBase?: Date): {
    girosConVencimiento: GiroInfo[];
    liberacionesConVencimiento: Liberacion[];
};
/**
 * Verifica si una fecha de vencimiento está próxima (dentro de N días)
 */
export declare function isVencimientoProximo(fechaVencimiento: string | null | undefined, diasAlerta?: number): boolean;
/**
 * Verifica si una fecha de vencimiento ya pasó
 */
export declare function isVencimientoVencido(fechaVencimiento: string | null | undefined): boolean;
//# sourceMappingURL=dateUtils.d.ts.map