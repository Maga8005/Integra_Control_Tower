/**
 * Tests para OperationInfoParser con datos reales
 * Integra Control Tower MVP
 */

import { OperationInfoParser } from '../services/OperationInfoParser';
import { Currency, EstadoProceso } from '../types/Operation';

describe('OperationInfoParser', () => {
  // Datos de ejemplo proporcionados
  const SAMPLE_DATA = `CLIENTE: MALE
PAÍS IMPORTADOR: MÉXICO
PAÍS EXPORTADOR: CHINA
VALOR TOTAL DE COMPRA: 100000
MONEDA DE PAGO SOLICITADO: USD NA
TÉRMINOS DE PAGO: 30% ADVANCE / 70% AGAINST BL COPY
DATOS BANCARIOS
BENEFICIARIO: BANCO BBVA
BANCO: 4567896
DIRECCIÓN: SHANGHAI 10256899
NÚMERO DE CUENTA: 46587966666
SWIFT: BSHANGBB

ICOTERM COMPRA: FOB - SHANGHAI
ICOTERM VENTA: DAP - ZONA FRANCA
OBSERVACIONES:

VALOR SOLICITADO: 30000
NÚMERO DE GIRO: 1er Giro a Proveedor
PORCENTAJE DE GIRO: 30% del total

VALOR SOLICITADO: 70000
NÚMERO DE GIRO: 2do Giro a Proveedor
PORCENTAJE DE GIRO: 70% del total

Liberación 1
Capital: 100000 USD
Fecha: 2025-07-25

NPS

Inconvenientes: No
Descripción inconvenientes: Acabamos muchisimas gracias a todos!
Calificación (1 mala - 5 buena): 5`;

  describe('Parsing básico', () => {
    test('debe parsear información básica correctamente', () => {
      const result = OperationInfoParser.parse(SAMPLE_DATA);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.cliente).toBe('MALE');
        expect(result.data.paisImportador).toBe('MÉXICO');
        expect(result.data.paisExportador).toBe('CHINA');
        expect(result.data.valorTotalCompra).toBe(100000);
        expect(result.data.monedaPago).toBe(Currency.USD);
        expect(result.data.terminosPago).toBe('30% ADVANCE / 70% AGAINST BL COPY');
      }
    });

    test('debe extraer incoterms correctamente', () => {
      const result = OperationInfoParser.parse(SAMPLE_DATA);
      
      expect(result.data?.incotermCompra).toBe('FOB - SHANGHAI');
      expect(result.data?.incotermVenta).toBe('DAP - ZONA FRANCA');
    });
  });

  describe('Datos bancarios', () => {
    test('debe extraer datos bancarios correctamente', () => {
      const result = OperationInfoParser.parse(SAMPLE_DATA);
      
      expect(result.data?.datosBancarios).toBeDefined();
      
      const banking = result.data?.datosBancarios;
      if (banking) {
        expect(banking.beneficiario).toBe('BANCO BBVA');
        expect(banking.banco).toBe('4567896');
        expect(banking.direccion).toBe('SHANGHAI 10256899');
        expect(banking.numeroCuenta).toBe('46587966666');
        expect(banking.swift).toBe('BSHANGBB');
      }
    });

    test('debe validar formato de código SWIFT', () => {
      const invalidSwiftData = SAMPLE_DATA.replace('SWIFT: BSHANGBB', 'SWIFT: INVALID123');
      const result = OperationInfoParser.parse(invalidSwiftData);
      
      // Debería tener un error por SWIFT inválido
      const swiftError = result.errors.find(error => error.field === 'swift');
      expect(swiftError).toBeDefined();
    });
  });

  describe('Giros', () => {
    test('debe extraer giros correctamente', () => {
      const result = OperationInfoParser.parse(SAMPLE_DATA);
      
      expect(result.data?.giros).toBeDefined();
      expect(result.data?.giros.length).toBe(2);
      
      const giros = result.data?.giros;
      if (giros && giros.length >= 2) {
        // Primer giro
        expect(giros[0].valorSolicitado).toBe(30000);
        expect(giros[0].numeroGiro).toBe('1er Giro a Proveedor');
        expect(giros[0].porcentajeGiro).toBe('30% del total');
        expect(giros[0].estado).toBe(EstadoProceso.PENDIENTE);
        
        // Segundo giro
        expect(giros[1].valorSolicitado).toBe(70000);
        expect(giros[1].numeroGiro).toBe('2do Giro a Proveedor');
        expect(giros[1].porcentajeGiro).toBe('70% del total');
        expect(giros[1].estado).toBe(EstadoProceso.PENDIENTE);
      }
    });

    test('debe sumar el total de giros correctamente', () => {
      const result = OperationInfoParser.parse(SAMPLE_DATA);
      
      if (result.data?.giros) {
        const totalGiros = result.data.giros.reduce((sum, giro) => sum + giro.valorSolicitado, 0);
        expect(totalGiros).toBe(100000);
        expect(totalGiros).toBe(result.data.valorTotalCompra);
      }
    });
  });

  describe('Liberaciones', () => {
    test('debe extraer liberaciones correctamente', () => {
      const result = OperationInfoParser.parse(SAMPLE_DATA);
      
      expect(result.data?.liberaciones).toBeDefined();
      expect(result.data?.liberaciones.length).toBe(1);
      
      const liberacion = result.data?.liberaciones[0];
      if (liberacion) {
        expect(liberacion.numero).toBe(1);
        expect(liberacion.capital).toBe(100000);
        expect(liberacion.fecha).toBe('2025-07-25');
        expect(liberacion.estado).toBe(EstadoProceso.PENDIENTE);
      }
    });
  });

  describe('Manejo de errores', () => {
    test('debe manejar texto vacío', () => {
      const result = OperationInfoParser.parse('');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('debe manejar texto malformado', () => {
      const malformedData = 'CLIENTE MALE PAÍS MÉXICO VALOR ABC';
      const result = OperationInfoParser.parse(malformedData);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'valorTotalCompra')).toBe(true);
    });

    test('debe detectar campos faltantes', () => {
      const incompleteData = 'CLIENTE: TEST\nVALOR TOTAL DE COMPRA: 50000';
      const result = OperationInfoParser.parse(incompleteData);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'paisImportador')).toBe(true);
      expect(result.errors.some(error => error.field === 'paisExportador')).toBe(true);
    });
  });

  describe('Casos edge', () => {
    test('debe manejar valores con formato de miles', () => {
      const dataWithCommas = SAMPLE_DATA.replace('100000', '100,000');
      const result = OperationInfoParser.parse(dataWithCommas);
      
      expect(result.data?.valorTotalCompra).toBe(100000);
    });

    test('debe manejar diferentes formatos de moneda', () => {
      const eurData = SAMPLE_DATA.replace('USD NA', 'EUR');
      const result = OperationInfoParser.parse(eurData);
      
      expect(result.data?.monedaPago).toBe(Currency.EUR);
    });

    test('debe normalizar espacios extra', () => {
      const dataWithExtraSpaces = SAMPLE_DATA.replace('CLIENTE: MALE', 'CLIENTE:    MALE   ');
      const result = OperationInfoParser.parse(dataWithExtraSpaces);
      
      expect(result.data?.cliente).toBe('MALE');
    });

    test('debe manejar diferentes formatos de fecha', () => {
      const dataWithDifferentDate = SAMPLE_DATA.replace('2025-07-25', '25/07/2025');
      const result = OperationInfoParser.parse(dataWithDifferentDate);
      
      // Debería manejar el formato alternativo o dar warning
      expect(result.data?.liberaciones).toBeDefined();
    });
  });

  describe('Validaciones de negocio', () => {
    test('debe validar que el valor total sea positivo', () => {
      const negativeValueData = SAMPLE_DATA.replace('100000', '-100000');
      const result = OperationInfoParser.parse(negativeValueData);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'valorTotalCompra')).toBe(true);
    });

    test('debe validar consistencia entre giros y valor total', () => {
      const inconsistentData = SAMPLE_DATA.replace('VALOR SOLICITADO: 30000', 'VALOR SOLICITADO: 50000');
      const result = OperationInfoParser.parse(inconsistentData);
      
      if (result.data?.giros) {
        const totalGiros = result.data.giros.reduce((sum, giro) => sum + giro.valorSolicitado, 0);
        // Debería haber warning sobre inconsistencia
        expect(totalGiros).not.toBe(result.data.valorTotalCompra);
      }
    });
  });

  describe('Métodos utilitarios', () => {
    test('extractPercentage debe extraer porcentajes correctamente', () => {
      expect(OperationInfoParser.extractPercentage('30% del total')).toBe(30);
      expect(OperationInfoParser.extractPercentage('50.5% advance')).toBe(50.5);
      expect(OperationInfoParser.extractPercentage('sin porcentaje')).toBeNull();
    });

    test('extractMonetaryValue debe extraer valores monetarios', () => {
      expect(OperationInfoParser.extractMonetaryValue('USD 100,000.50')).toBe(100000.50);
      expect(OperationInfoParser.extractMonetaryValue('50000')).toBe(50000);
      expect(OperationInfoParser.extractMonetaryValue('no hay valor')).toBeNull();
    });

    test('isValidDate debe validar fechas', () => {
      expect(OperationInfoParser.isValidDate('2025-07-25')).toBe(true);
      expect(OperationInfoParser.isValidDate('2025-13-45')).toBe(false);
      expect(OperationInfoParser.isValidDate('fecha inválida')).toBe(false);
    });
  });

  describe('Casos reales adicionales', () => {
    test('debe manejar texto con caracteres especiales', () => {
      const dataWithSpecialChars = SAMPLE_DATA.replace('TÉRMINOS', 'TÉRMINOS');
      const result = OperationInfoParser.parse(dataWithSpecialChars);
      
      expect(result.success).toBe(true);
      expect(result.data?.terminosPago).toContain('30% ADVANCE');
    });

    test('debe ser resistente a cambios de formato menor', () => {
      const modifiedData = SAMPLE_DATA
        .replace('PAÍS IMPORTADOR:', 'País Importador:')
        .replace('VALOR TOTAL DE COMPRA:', 'Valor Total de Compra:');
      
      const result = OperationInfoParser.parse(modifiedData);
      
      // Debería extraer la información a pesar del cambio de caso
      expect(result.data?.paisImportador).toBe('MÉXICO');
      expect(result.data?.valorTotalCompra).toBe(100000);
    });
  });
});