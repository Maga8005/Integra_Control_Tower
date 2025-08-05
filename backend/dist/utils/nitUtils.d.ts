/**
 * Utilidades para manejo de NIT/RFC en sistema de autenticación
 * Integra Control Tower MVP
 */
import { CSVRowData, OperationCard } from './csvMappers';
export interface ClientInfo {
    nit: string;
    name: string;
    operationsCount: number;
}
export interface ClientLoginResult {
    success: boolean;
    token?: string;
    client?: ClientInfo;
    operations?: OperationCard[];
    error?: string;
}
/**
 * Normalizar NIT/RFC para búsqueda consistente
 * Elimina espacios, guiones, puntos y convierte a mayúsculas
 */
export declare function normalizeNit(nit: string): string;
/**
 * Extraer cliente y NIT desde la columna "1.Docu. Cliente"
 * Formato esperado: "- CLIENTE: [Nombre]\n-NIT:[NIT]"
 */
export interface ClienteNitInfo {
    cliente: string;
    nit: string;
}
export declare function extractClienteNitFromDocColumn(docuClienteValue: string): ClienteNitInfo;
/**
 * Extraer y normalizar NIT de la columna "1. Docu. Cliente" (método legacy)
 */
export declare function extractNitFromDocColumn(docuClienteValue: string): string[];
/**
 * Buscar operaciones por NIT en datos CSV
 */
export declare function findOperationsByNit(csvData: CSVRowData[], searchNit: string): {
    operations: OperationCard[];
    clientInfo: ClientInfo | null;
};
/**
 * Generar JWT simple para demo (en producción usar librería como jsonwebtoken)
 */
export declare function generateClientToken(clientInfo: ClientInfo): string;
/**
 * Validar formato de NIT/RFC básico
 */
export declare function validateNitFormat(nit: string): {
    isValid: boolean;
    message: string;
};
//# sourceMappingURL=nitUtils.d.ts.map