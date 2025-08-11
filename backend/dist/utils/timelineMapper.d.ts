/**
 * Mapeo específico de timeline de 5 estados basado en columnas CSV
 * Integra Control Tower MVP - Soporte multi-país (Colombia y México)
 */
import { CSVRowData, CountryCode } from './csvMappers';
export interface TimelineState {
    id: number;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'blocked';
    progress: number;
    description: string;
    completedAt?: string;
    notes?: string;
}
export interface Timeline {
    states: TimelineState[];
    currentState: number;
    overallProgress: number;
}
/**
 * Estado 1: Solicitud Enviada
 * Basado en columna "1. ESTADO Firma Cotización"
 */
export declare function mapState1_SolicitudEnviada(csvRow: CSVRowData, countryCode?: CountryCode): TimelineState;
/**
 * Estado 2: Documentos de Operación y Pago Cuota Operacional
 * Basado en columnas "2. ESTADO factura Cuota Operacional" y "4. ESTADO pago Cuota Operacional"
 * NOTA: Mismo comportamiento para Colombia y México
 */
export declare function mapState2_DocumentosYCuota(csvRow: CSVRowData, countryCode?: CountryCode): TimelineState;
/**
 * Estado 3: Procesamiento de Pago
 * COL: Incluye verificación de "8. ESTADO Doc Legal X Comp" si está disponible
 * MEX: Solo procesa información de pagos sin Doc Legal X Comp
 */
export declare function mapState3_ProcesamientoPago(csvRow: CSVRowData, countryCode?: CountryCode): TimelineState;
/**
 * Estado 4: Envío y Logística
 * NUEVA LÓGICA: Basado en datos de "Liberación" en "5. Info Gnal + Info Compra Int"
 * Completo cuando la suma de liberaciones es igual o cercana al valor total
 * NOTA: Mismo comportamiento para Colombia y México
 */
export declare function mapState4_EnvioYLogistica(csvRow: CSVRowData, countryCode?: CountryCode): TimelineState;
/**
 * Estado 5: Operación Completada
 * Basado en la evaluación general de todos los estados anteriores
 * Se considera completada cuando todos los estados previos están al 100%
 */
export declare function mapState5_OperacionCompletada(csvRow: CSVRowData, countryCode?: CountryCode): TimelineState;
/**
 * Función principal que mapea todos los estados del timeline
 * ACTUALIZADO: Soporte multi-país
 */
export declare function mapCompleteTimeline(csvRow: CSVRowData, countryCode?: CountryCode): Timeline;
//# sourceMappingURL=timelineMapper.d.ts.map