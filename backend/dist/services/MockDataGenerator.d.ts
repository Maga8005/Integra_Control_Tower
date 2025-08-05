/**
 * Generador de datos mock para Integra Control Tower
 * Útil para testing y desarrollo del MVP
 */
import { OperationDetail } from '../types/Operation';
export declare class MockDataGenerator {
    private static readonly SAMPLE_CLIENTS;
    private static readonly SAMPLE_SUPPLIERS;
    private static readonly SAMPLE_COUNTRIES;
    private static readonly SAMPLE_BANKS;
    private static readonly SAMPLE_INCOTERMS;
    private static readonly SAMPLE_PAYMENT_TERMS;
    private static readonly SAMPLE_PERSONAS;
    /**
     * Genera una operación mock completa
     */
    static generateOperation(overrides?: Partial<OperationDetail>): OperationDetail;
    /**
     * Genera múltiples operaciones mock
     */
    static generateOperations(count: number): OperationDetail[];
    /**
     * Genera datos bancarios mock
     */
    private static generateBankingInfo;
    /**
     * Genera giros mock basados en el valor total
     */
    private static generateGiros;
    /**
     * Genera liberaciones mock
     */
    private static generateLiberaciones;
    /**
     * Genera extracostos mock
     */
    private static generateExtracostos;
    /**
     * Genera estados de proceso mock
     */
    private static generateEstados;
    /**
     * Genera timeline mock
     */
    private static generateTimeline;
    /**
     * Genera documentos mock
     */
    private static generateDocumentos;
    /**
     * Genera observaciones mock
     */
    private static generateObservations;
    /**
     * Genera alertas mock
     */
    private static generateAlertas;
    /**
     * Métodos utilitarios privados
     */
    private static generateId;
    private static randomBetween;
    private static randomFromArray;
    private static generatePastDate;
    private static generateFutureDate;
    private static generateAccountNumber;
    private static generateAddress;
    private static generateTradeRoute;
    private static generateRequiredDocuments;
    /**
     * Método público para generar texto raw de operación (similar al ejemplo)
     */
    static generateRawOperationText(): string;
}
//# sourceMappingURL=MockDataGenerator.d.ts.map