"use strict";
/**
 * Generador de datos mock para Integra Control Tower
 * Útil para testing y desarrollo del MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDataGenerator = void 0;
const Operation_1 = require("../types/Operation");
class MockDataGenerator {
    static SAMPLE_CLIENTS = [
        'MALE IMPORT EXPORT',
        'COMERCIALIZADORA INTERNACIONAL SA',
        'IMPORTADORA DEL PACIFICO LTDA',
        'GLOBAL TRADE SOLUTIONS',
        'EMPRESAS UNIDAS DEL COMERCIO',
        'IMPORTACIONES Y EXPORTACIONES INTEGRALES'
    ];
    static SAMPLE_SUPPLIERS = [
        'SHANGHAI MANUFACTURING CO',
        'GUANGZHOU ELECTRONICS LTD',
        'SHENZHEN TECHNOLOGY INC',
        'BEIJING INDUSTRIAL GROUP',
        'TIANJIN EXPORT COMPANY',
        'NINGBO TRADING CORP'
    ];
    static SAMPLE_COUNTRIES = {
        importadores: ['MÉXICO', 'COLOMBIA', 'BRASIL', 'CHILE', 'PERÚ', 'ARGENTINA'],
        exportadores: ['CHINA', 'ALEMANIA', 'ESTADOS UNIDOS', 'JAPÓN', 'COREA DEL SUR', 'ITALIA']
    };
    static SAMPLE_BANKS = [
        { name: 'BANCO BBVA', swift: 'BBVAMXMM', country: 'MÉXICO' },
        { name: 'INDUSTRIAL AND COMMERCIAL BANK OF CHINA', swift: 'ICBKCNBJ', country: 'CHINA' },
        { name: 'BANCO SANTANDER', swift: 'BSCHESMM', country: 'ESPAÑA' },
        { name: 'HSBC BANK', swift: 'HSBCHKHH', country: 'HONG KONG' },
        { name: 'BANCO DE COLOMBIA', swift: 'COLOCOBM', country: 'COLOMBIA' }
    ];
    static SAMPLE_INCOTERMS = [
        'FOB - SHANGHAI',
        'CIF - PUERTO VALLARTA',
        'DAP - ZONA FRANCA',
        'FCA - GUANGZHOU',
        'CPT - MÉXICO DF',
        'EXW - FACTORY'
    ];
    static SAMPLE_PAYMENT_TERMS = [
        '30% ADVANCE / 70% AGAINST BL COPY',
        '50% ADVANCE / 50% ON DELIVERY',
        '100% LETTER OF CREDIT AT SIGHT',
        '25% ADVANCE / 75% AGAINST DOCUMENTS',
        'CASH AGAINST DOCUMENTS',
        '40% ADVANCE / 60% AFTER INSPECTION'
    ];
    static SAMPLE_PERSONAS = [
        'Carlos Rodríguez',
        'Ana María González',
        'José Luis Martínez',
        'María Elena Herrera',
        'Roberto Sánchez',
        'Lucía Fernández'
    ];
    /**
     * Genera una operación mock completa
     */
    static generateOperation(overrides) {
        const baseId = this.generateId();
        const valorTotal = this.randomBetween(50000, 500000);
        const moneda = this.randomFromArray(Object.values(Operation_1.Currency));
        const cliente = this.randomFromArray(this.SAMPLE_CLIENTS);
        const proveedor = this.randomFromArray(this.SAMPLE_SUPPLIERS);
        const operation = {
            id: baseId,
            numeroOperacion: `OP-${new Date().getFullYear()}-${baseId.slice(-6).toUpperCase()}`,
            // Información básica
            clienteCompleto: cliente,
            tipoEmpresa: this.randomFromArray(['IMPORTADORA', 'COMERCIALIZADORA', 'DISTRIBUIDORA']),
            proveedorBeneficiario: proveedor,
            paisProveedor: this.randomFromArray(this.SAMPLE_COUNTRIES.exportadores),
            valorTotal,
            moneda,
            progresoGeneral: this.randomBetween(15, 85),
            personaAsignada: this.randomFromArray(this.SAMPLE_PERSONAS),
            // Geografía y logística
            paisExportador: this.randomFromArray(this.SAMPLE_COUNTRIES.exportadores),
            paisImportador: this.randomFromArray(this.SAMPLE_COUNTRIES.importadores),
            rutaComercial: this.generateTradeRoute(),
            incoterms: this.randomFromArray(this.SAMPLE_INCOTERMS),
            // Información financiera
            montoTotal: valorTotal,
            montosLiberados: Math.floor(valorTotal * this.randomBetween(0, 0.7)),
            montosPendientes: 0, // Se calculará después
            // Extracostos
            extracostos: this.generateExtracostos(valorTotal),
            // Estados
            estados: this.generateEstados(),
            // Giros y liberaciones
            giros: this.generateGiros(valorTotal),
            liberaciones: this.generateLiberaciones(valorTotal),
            // Documentos
            documentos: this.generateDocumentos(),
            // Timeline
            timeline: this.generateTimeline(),
            // Fechas
            fechaCreacion: this.generatePastDate(30).toISOString(),
            ultimaActualizacion: this.generatePastDate(5).toISOString(),
            // Datos bancarios
            datosBancarios: this.generateBankingInfo(),
            // Información adicional
            observaciones: this.generateObservations(),
            alertas: this.generateAlertas()
        };
        // Calcular montos pendientes
        operation.montosPendientes = operation.montoTotal - operation.montosLiberados;
        // Aplicar overrides si se proporcionan
        return { ...operation, ...overrides };
    }
    /**
     * Genera múltiples operaciones mock
     */
    static generateOperations(count) {
        return Array.from({ length: count }, () => this.generateOperation());
    }
    /**
     * Genera datos bancarios mock
     */
    static generateBankingInfo() {
        const bank = this.randomFromArray(this.SAMPLE_BANKS);
        return {
            beneficiario: bank.name,
            banco: bank.name,
            direccion: `${this.generateAddress()}, ${bank.country}`,
            numeroCuenta: this.generateAccountNumber(),
            swift: bank.swift,
            paisBanco: bank.country
        };
    }
    /**
     * Genera giros mock basados en el valor total
     */
    static generateGiros(valorTotal) {
        const numGiros = this.randomBetween(1, 3);
        const giros = [];
        if (numGiros === 1) {
            giros.push({
                valorSolicitado: valorTotal,
                numeroGiro: 'Giro Único',
                porcentajeGiro: '100% del total',
                estado: this.randomFromArray(Object.values(Operation_1.EstadoProceso))
            });
        }
        else if (numGiros === 2) {
            const primerPorcentaje = this.randomBetween(25, 50);
            const segundoPorcentaje = 100 - primerPorcentaje;
            giros.push({
                valorSolicitado: Math.floor(valorTotal * primerPorcentaje / 100),
                numeroGiro: '1er Giro a Proveedor',
                porcentajeGiro: `${primerPorcentaje}% del total`,
                estado: Operation_1.EstadoProceso.COMPLETADO
            });
            giros.push({
                valorSolicitado: Math.floor(valorTotal * segundoPorcentaje / 100),
                numeroGiro: '2do Giro a Proveedor',
                porcentajeGiro: `${segundoPorcentaje}% del total`,
                estado: this.randomFromArray([Operation_1.EstadoProceso.PENDIENTE, Operation_1.EstadoProceso.EN_PROCESO])
            });
        }
        else {
            // 3 giros
            giros.push({
                valorSolicitado: Math.floor(valorTotal * 0.3),
                numeroGiro: '1er Giro - Anticipo',
                porcentajeGiro: '30% del total',
                estado: Operation_1.EstadoProceso.COMPLETADO
            });
            giros.push({
                valorSolicitado: Math.floor(valorTotal * 0.4),
                numeroGiro: '2do Giro - Progreso',
                porcentajeGiro: '40% del total',
                estado: Operation_1.EstadoProceso.EN_PROCESO
            });
            giros.push({
                valorSolicitado: Math.floor(valorTotal * 0.3),
                numeroGiro: '3er Giro - Final',
                porcentajeGiro: '30% del total',
                estado: Operation_1.EstadoProceso.PENDIENTE
            });
        }
        return giros;
    }
    /**
     * Genera liberaciones mock
     */
    static generateLiberaciones(valorTotal) {
        const numLiberaciones = this.randomBetween(1, 2);
        const liberaciones = [];
        for (let i = 0; i < numLiberaciones; i++) {
            liberaciones.push({
                numero: i + 1,
                capital: i === 0 ? valorTotal : Math.floor(valorTotal * 0.5),
                fecha: this.generateFutureDate(30 + (i * 15)).toISOString().split('T')[0],
                estado: i === 0 ? Operation_1.EstadoProceso.EN_PROCESO : Operation_1.EstadoProceso.PENDIENTE,
                documentosRequeridos: this.generateRequiredDocuments()
            });
        }
        return liberaciones;
    }
    /**
     * Genera extracostos mock
     */
    static generateExtracostos(valorTotal) {
        const comisionBancaria = Math.floor(valorTotal * 0.02);
        const gastosLogisticos = Math.floor(valorTotal * 0.03);
        const seguroCarga = Math.floor(valorTotal * 0.01);
        return {
            comisionBancaria,
            gastosLogisticos,
            seguroCarga,
            totalExtracostos: comisionBancaria + gastosLogisticos + seguroCarga,
            detalleGastos: [
                { concepto: 'Comisión bancaria internacional', valor: comisionBancaria, moneda: Operation_1.Currency.USD },
                { concepto: 'Gastos de logística y transporte', valor: gastosLogisticos, moneda: Operation_1.Currency.USD },
                { concepto: 'Seguro de carga marítima', valor: seguroCarga, moneda: Operation_1.Currency.USD }
            ]
        };
    }
    /**
     * Genera estados de proceso mock
     */
    static generateEstados() {
        return {
            cotizacion: Operation_1.EstadoProceso.COMPLETADO,
            documentosLegales: this.randomFromArray([Operation_1.EstadoProceso.COMPLETADO, Operation_1.EstadoProceso.EN_PROCESO]),
            cuotaOperacional: this.randomFromArray([Operation_1.EstadoProceso.EN_PROCESO, Operation_1.EstadoProceso.PENDIENTE]),
            compraInternacional: this.randomFromArray([Operation_1.EstadoProceso.EN_PROCESO, Operation_1.EstadoProceso.PENDIENTE]),
            giroProveedor: this.randomFromArray(Object.values(Operation_1.EstadoProceso)),
            facturaFinal: Operation_1.EstadoProceso.PENDIENTE
        };
    }
    /**
     * Genera timeline mock
     */
    static generateTimeline() {
        const eventos = [
            { fase: 'Cotización', descripcion: 'Cotización inicial generada', progreso: 100 },
            { fase: 'Documentación', descripcion: 'Documentos legales en revisión', progreso: 75 },
            { fase: 'Cuota Operacional', descripcion: 'Cálculo de cuota operacional', progreso: 50 },
            { fase: 'Compra Internacional', descripcion: 'Proceso de compra iniciado', progreso: 25 },
            { fase: 'Giro Proveedor', descripcion: 'Preparación de giro', progreso: 0 }
        ];
        return eventos.map((evento, index) => ({
            id: this.generateId(),
            fase: evento.fase,
            descripcion: evento.descripcion,
            estado: evento.progreso === 100 ? Operation_1.EstadoProceso.COMPLETADO :
                evento.progreso > 0 ? Operation_1.EstadoProceso.EN_PROCESO : Operation_1.EstadoProceso.PENDIENTE,
            progreso: evento.progreso,
            responsable: this.randomFromArray(this.SAMPLE_PERSONAS),
            fecha: this.generatePastDate(20 - (index * 3)).toISOString(),
            notas: index < 2 ? 'Proceso completado sin observaciones' : undefined
        }));
    }
    /**
     * Genera documentos mock
     */
    static generateDocumentos() {
        const tiposDocumentos = Object.values(Operation_1.TipoDocumento);
        const numDocumentos = this.randomBetween(2, 5);
        return Array.from({ length: numDocumentos }, (_, index) => ({
            id: this.generateId(),
            nombre: `${tiposDocumentos[index % tiposDocumentos.length]}_${Date.now()}.pdf`,
            tipo: tiposDocumentos[index % tiposDocumentos.length],
            url: `/documents/${this.generateId()}.pdf`,
            fechaSubida: this.generatePastDate(10).toISOString(),
            estado: this.randomFromArray(Object.values(Operation_1.EstadoProceso)),
            observaciones: index === 0 ? 'Documento principal de la operación' : undefined
        }));
    }
    /**
     * Genera observaciones mock
     */
    static generateObservations() {
        const observaciones = [
            'Operación estándar sin complicaciones',
            'Cliente requiere inspección adicional de mercancía',
            'Proveedor solicita modificación en términos de pago',
            'Documentación pendiente de legalización consular',
            'Mercancía sujeta a certificación de calidad',
            'Operación prioritaria para cierre de mes'
        ];
        return this.randomFromArray(observaciones);
    }
    /**
     * Genera alertas mock
     */
    static generateAlertas() {
        const alertas = [];
        if (Math.random() < 0.3) {
            alertas.push({
                tipo: 'warning',
                mensaje: 'Vencimiento de documentos próximo en 5 días',
                fecha: new Date().toISOString()
            });
        }
        if (Math.random() < 0.2) {
            alertas.push({
                tipo: 'info',
                mensaje: 'Actualización de estado disponible',
                fecha: this.generatePastDate(2).toISOString()
            });
        }
        return alertas;
    }
    /**
     * Métodos utilitarios privados
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    static randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    static generatePastDate(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - this.randomBetween(1, daysAgo));
        return date;
    }
    static generateFutureDate(daysAhead) {
        const date = new Date();
        date.setDate(date.getDate() + this.randomBetween(1, daysAhead));
        return date;
    }
    static generateAccountNumber() {
        return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    }
    static generateAddress() {
        const addresses = [
            'No. 123 Industrial District',
            'Building A, Tech Park Zone',
            'Floor 15, Commercial Plaza',
            'Suite 200, Business Center',
            'Warehouse Complex Unit 5'
        ];
        return this.randomFromArray(addresses);
    }
    static generateTradeRoute() {
        const rutas = [
            'SHANGHAI - PUERTO VALLARTA',
            'GUANGZHOU - VERACRUZ',
            'SHENZHEN - CARTAGENA',
            'NINGBO - BARRANQUILLA',
            'TIANJIN - BUENAVENTURA'
        ];
        return this.randomFromArray(rutas);
    }
    static generateRequiredDocuments() {
        const docs = ['Factura comercial', 'Bill of Lading', 'Certificado de origen', 'Packing List'];
        const numDocs = this.randomBetween(2, 4);
        return docs.slice(0, numDocs);
    }
    /**
     * Método público para generar texto raw de operación (similar al ejemplo)
     */
    static generateRawOperationText() {
        const cliente = this.randomFromArray(this.SAMPLE_CLIENTS);
        const paisImportador = this.randomFromArray(this.SAMPLE_COUNTRIES.importadores);
        const paisExportador = this.randomFromArray(this.SAMPLE_COUNTRIES.exportadores);
        const valorTotal = this.randomBetween(50000, 300000);
        const moneda = this.randomFromArray(['USD', 'EUR', 'GBP']);
        const terminos = this.randomFromArray(this.SAMPLE_PAYMENT_TERMS);
        const bank = this.randomFromArray(this.SAMPLE_BANKS);
        const incotermCompra = this.randomFromArray(this.SAMPLE_INCOTERMS);
        const incotermVenta = this.randomFromArray(this.SAMPLE_INCOTERMS);
        const primerGiro = Math.floor(valorTotal * 0.3);
        const segundoGiro = valorTotal - primerGiro;
        return `CLIENTE: ${cliente}
PAÍS IMPORTADOR: ${paisImportador}
PAÍS EXPORTADOR: ${paisExportador}
VALOR TOTAL DE COMPRA: ${valorTotal}
MONEDA DE PAGO SOLICITADO: ${moneda}
TÉRMINOS DE PAGO: ${terminos}
DATOS BANCARIOS
BENEFICIARIO: ${bank.name}
BANCO: ${bank.name}
DIRECCIÓN: ${this.generateAddress()}
NÚMERO DE CUENTA: ${this.generateAccountNumber()}
SWIFT: ${bank.swift}

ICOTERM COMPRA: ${incotermCompra}
ICOTERM VENTA: ${incotermVenta}
OBSERVACIONES: ${this.generateObservations()}

VALOR SOLICITADO: ${primerGiro}
NÚMERO DE GIRO: 1er Giro a Proveedor
PORCENTAJE DE GIRO: 30% del total

VALOR SOLICITADO: ${segundoGiro}
NÚMERO DE GIRO: 2do Giro a Proveedor
PORCENTAJE DE GIRO: 70% del total

Liberación 1
Capital: ${valorTotal} ${moneda}
Fecha: ${this.generateFutureDate(30).toISOString().split('T')[0]}

NPS
Inconvenientes: No
Descripción inconvenientes: Operación procesada exitosamente
Calificación (1 mala - 5 buena): ${this.randomBetween(4, 5)}`;
    }
}
exports.MockDataGenerator = MockDataGenerator;
//# sourceMappingURL=MockDataGenerator.js.map