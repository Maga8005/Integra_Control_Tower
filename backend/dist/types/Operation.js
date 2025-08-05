"use strict";
/**
 * Definiciones TypeScript para el sistema de operaciones de importación
 * Integra Control Tower MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoDocumento = exports.Currency = exports.EstadoProceso = void 0;
// Enum para estados de procesos
var EstadoProceso;
(function (EstadoProceso) {
    EstadoProceso["PENDIENTE"] = "pendiente";
    EstadoProceso["EN_PROCESO"] = "en_proceso";
    EstadoProceso["COMPLETADO"] = "completado";
    EstadoProceso["RECHAZADO"] = "rechazado";
})(EstadoProceso || (exports.EstadoProceso = EstadoProceso = {}));
// Enum para monedas soportadas
var Currency;
(function (Currency) {
    Currency["USD"] = "USD";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["COP"] = "COP";
})(Currency || (exports.Currency = Currency = {}));
// Enum para tipos de documentos
var TipoDocumento;
(function (TipoDocumento) {
    TipoDocumento["FACTURA"] = "factura";
    TipoDocumento["BILL_OF_LADING"] = "bill_of_lading";
    TipoDocumento["CERTIFICADO_SEGURO"] = "certificado_seguro";
    TipoDocumento["CERTIFICADO_ORIGEN"] = "certificado_origen";
    TipoDocumento["PACKING_LIST"] = "packing_list";
})(TipoDocumento || (exports.TipoDocumento = TipoDocumento = {}));
//# sourceMappingURL=Operation.js.map