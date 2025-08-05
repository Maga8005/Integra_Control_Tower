/**
 * Parser robusto para extraer información del campo "5. Info Gnal + Info Compra Int"
 * Integra Control Tower MVP
 */

import { ParsedOperationInfo, Currency, DatosBancarios, GiroInfo, Liberacion, EstadoProceso } from '../types/Operation';

export interface ParsingError {
  field: string;
  error: string;
  rawValue?: string;
}

export interface ParsingResult {
  success: boolean;
  data?: ParsedOperationInfo;
  errors: ParsingError[];
  warnings: string[];
}

/**
 * Función principal que parsea todo el texto de la operación
 */
export function parseOperationInfo(text: string): ParsedOperationInfo {
  console.log('🔍 Iniciando parsing de información de operación...');
  
  try {
    // Limpiar texto de entrada
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    console.log('📄 Texto limpio, extrayendo campos...');

    // Extraer información básica usando las funciones específicas
    const cliente = extractValue(cleanText, /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i) || '';
    const paisImportador = extractValue(cleanText, /PAÍS IMPORTADOR:\s*(.+?)(?=\n|PAÍS|$)/i) || '';
    const paisExportador = extractValue(cleanText, /PAÍS EXPORTADOR:\s*(.+?)(?=\n|VALOR|$)/i) || '';
    const valorTotalCompra = extractNumber(cleanText, /VALOR TOTAL DE COMPRA:\s*(\d+(?:\.\d+)?)/i);
    
    // Extraer moneda
    const monedaText = extractValue(cleanText, /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i) || 'USD';
    const monedaPago = (Currency as any)[monedaText] || Currency.USD;
    
    const terminosPago = extractValue(cleanText, /TÉRMINOS DE PAGO:\s*(.+?)(?=\nDATOS|$)/i) || '';
    // Extraer Incoterms - soportar ambas variantes: ICOTERM e INCOTERM
    const incotermCompra = extractValue(cleanText, /I[NC]?COTERMS? COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) || 
                          extractValue(cleanText, /INCOTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) || '';
    const incotermVenta = extractValue(cleanText, /I[NC]?COTERMS? VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) || 
                         extractValue(cleanText, /INCOTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i) || '';

    // Extraer datos usando funciones específicas
    const datosBancarios = extractDatosBancarios(cleanText);
    const giros = extractGiros(cleanText);
    const liberaciones = extractLiberaciones(cleanText);

    const result: ParsedOperationInfo = {
      cliente,
      paisImportador,
      paisExportador,
      valorTotalCompra,
      monedaPago,
      terminosPago,
      incotermCompra,
      incotermVenta,
      datosBancarios,
      giros,
      liberaciones
    };

    console.log('✅ Parsing completado exitosamente:', {
      cliente,
      valorTotal: valorTotalCompra,
      numGiros: giros.length,
      numLiberaciones: liberaciones.length
    });

    return result;

  } catch (error) {
    console.error('❌ Error durante el parsing:', error);
    
    // Retornar objeto con valores por defecto en caso de error
    return {
      cliente: '',
      paisImportador: '',
      paisExportador: '',
      valorTotalCompra: 0,
      monedaPago: Currency.USD,
      terminosPago: '',
      incotermCompra: '',
      incotermVenta: '',
      datosBancarios: {
        beneficiario: '',
        banco: '',
        direccion: '',
        numeroCuenta: '',
        swift: '',
        paisBanco: ''
      },
      giros: [],
      liberaciones: []
    };
  }
}

/**
 * Extrae información de giros del texto
 */
export function extractGiros(text: string): GiroInfo[] {
  console.log('💰 Extrayendo información de giros...');
  
  try {
    const giros: GiroInfo[] = [];
    
    // Patrón más específico para encontrar SOLO bloques que contienen "VALOR SOLICITADO:"
    // Excluir explícitamente secciones bancarias
    const giroBlocks = text.split(/(?=VALOR SOLICITADO:)/i).filter(block => {
      const hasValorSolicitado = block.includes('VALOR SOLICITADO:');
      const isInBankingSection = block.includes('DATOS BANCARIOS') || 
                                block.includes('BENEFICIARIO:') || 
                                block.includes('NÚMERO DE CUENTA:') ||
                                block.includes('BANCO:');
      
      return hasValorSolicitado && !isInBankingSection;
    });

    console.log(`📊 Encontrados ${giroBlocks.length} bloques de giros válidos`);

    for (const block of giroBlocks) {
      // Solo extraer valores que estén inmediatamente después de "VALOR SOLICITADO:"
      const valorMatch = block.match(/VALOR SOLICITADO:\s*(\d+(?:\.\d+)?)/i);
      const valorSolicitado = valorMatch ? parseFloat(valorMatch[1]) : 0;
      
      const numeroGiro = extractValue(block, /NÚMERO DE GIRO:\s*(.+?)(?=\n|$)/i) || '';
      const porcentajeGiro = extractValue(block, /PORCENTAJE DE GIRO:\s*(.+?)(?=\n|$)/i) || '';

      // Validación más estricta: debe tener valor solicitado Y número de giro
      if (valorSolicitado > 0 && numeroGiro && !numeroGiro.includes('CUENTA')) {
        giros.push({
          valorSolicitado,
          numeroGiro: numeroGiro.trim(),
          porcentajeGiro: porcentajeGiro.trim(),
          estado: EstadoProceso.PENDIENTE,
          fechaVencimiento: null // Campo opcional - se calculará si es necesario
        });

        console.log(`💸 Giro extraído: ${numeroGiro} - $${valorSolicitado.toLocaleString()}`);
      } else {
        console.log(`⚠️ Bloque descartado - Valor: ${valorSolicitado}, Giro: "${numeroGiro}"`);
      }
    }

    if (giros.length === 0) {
      console.log('ℹ️ No se encontraron giros con "VALOR SOLICITADO" válidos en el texto');
    }

    return giros;

  } catch (error) {
    console.error('❌ Error extrayendo giros:', error);
    return [];
  }
}

/**
 * Extrae información de liberaciones del texto
 */
export function extractLiberaciones(text: string): Liberacion[] {
  console.log('📋 Extrayendo liberaciones ejecutadas...');
  
  try {
    const liberaciones: Liberacion[] = [];
    
    // Dividir texto en bloques usando separadores comunes (---, _____, etc.)
    const blocks = text.split(/(?:-{3,}|_{3,}|\n-{2,}\n)/);
    
    for (const block of blocks) {
      // Solo procesar bloques que contengan tanto "Liberación" como "Capital" y "Fecha"
      if (block.includes('Liberación') && block.includes('Capital') && block.includes('Fecha')) {
        
        // Extraer número de liberación
        const numeroMatch = block.match(/Liberación\s+(\d+)/i);
        const numero = numeroMatch ? parseInt(numeroMatch[1]) : liberaciones.length + 1;
        
        // Extraer capital - múltiples patrones para robustez
        const capitalPatterns = [
          /Capital:\s*\n(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
          /Capital:\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
          /Capital:\s*\n(\d+(?:,\d{3})*(?:\.\d+)?)/i,
          /Capital:\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i
        ];
        
        let capital = 0;
        for (const pattern of capitalPatterns) {
          const match = block.match(pattern);
          if (match && match[1]) {
            capital = parseFloat(match[1].replace(/,/g, ''));
            break;
          }
        }
        
        // Extraer fecha real (solo fechas pasadas o presentes, no futuras)
        const fechaMatch = block.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})/i);
        const fecha = fechaMatch ? fechaMatch[1] : '';
        
        // Solo agregar si tiene capital > 0 y fecha válida
        if (capital > 0 && fecha) {
          const fechaObj = new Date(fecha);
          const ahora = new Date();
          
          // Solo incluir si la fecha es pasada o presente (liberación ejecutada)
          if (fechaObj <= ahora) {
            liberaciones.push({
              numero,
              capital,
              fecha,
              estado: EstadoProceso.COMPLETADO // Solo ejecutadas
            });
            
            console.log(`💰 Liberación ejecutada: ${numero} - $${capital.toLocaleString()} USD - ${fecha}`);
          } else {
            console.log(`⏭️ Liberación futura ignorada: ${numero} - $${capital.toLocaleString()} USD - ${fecha}`);
          }
        }
      }
    }
    
    // Ordenar por fecha (más reciente primero)
    liberaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    
    if (liberaciones.length > 0) {
      const totalLiberado = liberaciones.reduce((sum, lib) => sum + lib.capital, 0);
      console.log(`✅ ${liberaciones.length} liberaciones ejecutadas. Total liberado: $${totalLiberado.toLocaleString()} USD`);
    } else {
      console.log('ℹ️ No se encontraron liberaciones ejecutadas');
    }

    return liberaciones;

  } catch (error) {
    console.error('❌ Error extrayendo liberaciones:', error);
    return [];
  }
}

/**
 * Extrae datos bancarios del texto
 */
export function extractDatosBancarios(text: string): DatosBancarios {
  console.log('🏦 Extrayendo datos bancarios...');
  
  try {
    const beneficiario = extractValue(text, /BENEFICIARIO:\s*(.+?)(?=\n|BANCO|$)/i) || '';
    const banco = extractValue(text, /BANCO:\s*(.+?)(?=\n|DIRECCIÓN|$)/i) || '';
    const direccion = extractValue(text, /DIRECCIÓN:\s*(.+?)(?=\n|NÚMERO|$)/i) || '';
    const numeroCuenta = extractValue(text, /NÚMERO DE CUENTA:\s*(.+?)(?=\n|SWIFT|$)/i) || '';
    const swift = extractValue(text, /SWIFT:\s*(.+?)(?=\n|ICOTERM|$)/i) || '';

    const datosBancarios: DatosBancarios = {
      beneficiario: beneficiario.trim(),
      banco: banco.trim(),
      direccion: direccion.trim(),
      numeroCuenta: numeroCuenta.trim(),
      swift: swift.trim(),
      paisBanco: '' // Se puede inferir de otros campos
    };

    console.log('🏦 Datos bancarios extraídos:', {
      beneficiario: !!datosBancarios.beneficiario,
      banco: !!datosBancarios.banco,
      cuenta: !!datosBancarios.numeroCuenta
    });

    return datosBancarios;

  } catch (error) {
    console.error('❌ Error extrayendo datos bancarios:', error);
    return {
      beneficiario: '',
      banco: '',
      direccion: '',
      numeroCuenta: '',
      swift: '',
      paisBanco: ''
    };
  }
}

/**
 * Utilidad para extraer valores usando regex
 */
export function extractValue(text: string, regex: RegExp): string {
  try {
    const match = text.match(regex);
    const value = match && match[1] ? match[1].trim() : '';
    
    if (value) {
      console.log(`🔍 Valor extraído con regex ${regex.source}: "${value}"`);
    }
    
    return value;
  } catch (error) {
    console.error('❌ Error en extractValue:', error);
    return '';
  }
}

/**
 * Utilidad para extraer números usando regex
 */
export function extractNumber(text: string, regex: RegExp): number {
  try {
    const match = text.match(regex);
    const numberStr = match && match[1] ? match[1] : '0';
    const number = parseFloat(numberStr.replace(/,/g, '')) || 0;
    
    if (number > 0) {
      console.log(`🔢 Número extraído con regex ${regex.source}: ${number}`);
    }
    
    return number;
  } catch (error) {
    console.error('❌ Error en extractNumber:', error);
    return 0;
  }
}

// Clase legacy para compatibilidad con tests existentes
export class OperationInfoParser {
  private static readonly FIELD_PATTERNS = {
    CLIENTE: /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i,
    PAIS_IMPORTADOR: /PAÍS IMPORTADOR:\s*(.+?)(?=\n|PAÍS|$)/i,
    PAIS_EXPORTADOR: /PAÍS EXPORTADOR:\s*(.+?)(?=\n|VALOR|$)/i,
    VALOR_TOTAL: /VALOR TOTAL DE COMPRA:\s*(\d+(?:\.\d+)?)/i,
    MONEDA_PAGO: /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i,
    TERMINOS_PAGO: /TÉRMINOS DE PAGO:\s*(.+?)(?=\nDATOS|$)/i,
    INCOTERM_COMPRA: /ICOTERM COMPRA:\s*(.+?)(?=\n|ICOTERM|$)/i,
    INCOTERM_VENTA: /ICOTERM VENTA:\s*(.+?)(?=\n|OBSERVACIONES|$)/i,
    
    // Datos bancarios
    BENEFICIARIO: /BENEFICIARIO:\s*(.+?)(?=\n|BANCO|$)/i,
    BANCO: /BANCO:\s*(.+?)(?=\n|DIRECCIÓN|$)/i,
    DIRECCION: /DIRECCIÓN:\s*(.+?)(?=\n|NÚMERO|$)/i,
    NUMERO_CUENTA: /NÚMERO DE CUENTA:\s*(.+?)(?=\n|SWIFT|$)/i,
    SWIFT: /SWIFT:\s*(.+?)(?=\n|ICOTERM|$)/i,
  };

  private static readonly CURRENCY_MAP: Record<string, Currency> = {
    'USD': Currency.USD,
    'EUR': Currency.EUR,
    'GBP': Currency.GBP,
    'COP': Currency.COP,
  };

  /**
   * Parser principal que procesa el texto completo
   */
  public static parse(rawText: string): ParsingResult {
    const errors: ParsingError[] = [];
    const warnings: string[] = [];

    try {
      // Limpiar el texto de entrada
      const cleanText = this.cleanInputText(rawText);

      // Extraer campos básicos
      const basicInfo = this.extractBasicInfo(cleanText, errors);
      
      // Extraer datos bancarios
      const bankingInfo = this.extractBankingInfo(cleanText, errors);
      
      // Extraer giros
      const giros = this.extractGiros(cleanText, errors, warnings);
      
      // Extraer liberaciones
      const liberaciones = this.extractLiberaciones(cleanText, errors, warnings);

      // Validar información crítica
      this.validateCriticalInfo(basicInfo, bankingInfo, errors);

      // Construir resultado
      const parsedData: ParsedOperationInfo = {
        cliente: basicInfo.cliente || '',
        paisImportador: basicInfo.paisImportador || '',
        paisExportador: basicInfo.paisExportador || '',
        valorTotalCompra: basicInfo.valorTotalCompra || 0,
        monedaPago: basicInfo.monedaPago || Currency.USD,
        terminosPago: basicInfo.terminosPago || '',
        incotermCompra: basicInfo.incotermCompra || '',
        incotermVenta: basicInfo.incotermVenta || '',
        datosBancarios: bankingInfo,
        giros,
        liberaciones
      };

      return {
        success: errors.length === 0,
        data: parsedData,
        errors,
        warnings
      };

    } catch (error) {
      errors.push({
        field: 'general',
        error: `Error inesperado durante el parsing: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });

      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Limpia el texto de entrada eliminando caracteres especiales y normalizando espacios
   */
  private static cleanInputText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
      .replace(/\r/g, '\n')    // Convertir \r a \n
      .replace(/\n{3,}/g, '\n\n') // Reducir múltiples saltos de línea
      .replace(/\s+$/gm, '')   // Eliminar espacios al final de líneas
      .trim();
  }

  /**
   * Extrae información básica de la operación
   */
  private static extractBasicInfo(text: string, errors: ParsingError[]) {
    const info: any = {};

    // Cliente
    const clienteMatch = text.match(this.FIELD_PATTERNS.CLIENTE);
    if (clienteMatch) {
      info.cliente = clienteMatch[1].trim();
    } else {
      errors.push({ field: 'cliente', error: 'Campo CLIENTE no encontrado o vacío' });
    }

    // País importador
    const paisImportadorMatch = text.match(this.FIELD_PATTERNS.PAIS_IMPORTADOR);
    if (paisImportadorMatch) {
      info.paisImportador = paisImportadorMatch[1].trim();
    } else {
      errors.push({ field: 'paisImportador', error: 'Campo PAÍS IMPORTADOR no encontrado' });
    }

    // País exportador
    const paisExportadorMatch = text.match(this.FIELD_PATTERNS.PAIS_EXPORTADOR);
    if (paisExportadorMatch) {
      info.paisExportador = paisExportadorMatch[1].trim();
    } else {
      errors.push({ field: 'paisExportador', error: 'Campo PAÍS EXPORTADOR no encontrado' });
    }

    // Valor total
    const valorMatch = text.match(this.FIELD_PATTERNS.VALOR_TOTAL);
    if (valorMatch) {
      info.valorTotalCompra = parseFloat(valorMatch[1]);
    } else {
      errors.push({ field: 'valorTotalCompra', error: 'Campo VALOR TOTAL DE COMPRA no encontrado o inválido' });
    }

    // Moneda
    const monedaMatch = text.match(this.FIELD_PATTERNS.MONEDA_PAGO);
    if (monedaMatch) {
      const monedaCode = monedaMatch[1].trim();
      info.monedaPago = this.CURRENCY_MAP[monedaCode] || Currency.USD;
    } else {
      errors.push({ field: 'monedaPago', error: 'Campo MONEDA DE PAGO no encontrado, usando USD por defecto' });
      info.monedaPago = Currency.USD;
    }

    // Términos de pago
    const terminosMatch = text.match(this.FIELD_PATTERNS.TERMINOS_PAGO);
    if (terminosMatch) {
      info.terminosPago = terminosMatch[1].trim();
    } else {
      errors.push({ field: 'terminosPago', error: 'Campo TÉRMINOS DE PAGO no encontrado' });
    }

    // Incoterms
    const incotermCompraMatch = text.match(this.FIELD_PATTERNS.INCOTERM_COMPRA);
    if (incotermCompraMatch) {
      info.incotermCompra = incotermCompraMatch[1].trim();
    }

    const incotermVentaMatch = text.match(this.FIELD_PATTERNS.INCOTERM_VENTA);
    if (incotermVentaMatch) {
      info.incotermVenta = incotermVentaMatch[1].trim();
    }

    return info;
  }

  /**
   * Extrae información bancaria
   */
  private static extractBankingInfo(text: string, errors: ParsingError[]): DatosBancarios {
    const beneficiarioMatch = text.match(this.FIELD_PATTERNS.BENEFICIARIO);
    const bancoMatch = text.match(this.FIELD_PATTERNS.BANCO);
    const direccionMatch = text.match(this.FIELD_PATTERNS.DIRECCION);
    const numeroCuentaMatch = text.match(this.FIELD_PATTERNS.NUMERO_CUENTA);
    const swiftMatch = text.match(this.FIELD_PATTERNS.SWIFT);

    const bankingInfo: DatosBancarios = {
      beneficiario: beneficiarioMatch ? beneficiarioMatch[1].trim() : '',
      banco: bancoMatch ? bancoMatch[1].trim() : '',
      direccion: direccionMatch ? direccionMatch[1].trim() : '',
      numeroCuenta: numeroCuentaMatch ? numeroCuentaMatch[1].trim() : '',
      swift: swiftMatch ? swiftMatch[1].trim() : '',
      paisBanco: '' // Se puede inferir de la dirección o país exportador
    };

    // Validar campos críticos de datos bancarios
    if (!bankingInfo.beneficiario) {
      errors.push({ field: 'beneficiario', error: 'Beneficiario bancario no encontrado' });
    }
    if (!bankingInfo.banco) {
      errors.push({ field: 'banco', error: 'Nombre del banco no encontrado' });
    }
    if (!bankingInfo.numeroCuenta) {
      errors.push({ field: 'numeroCuenta', error: 'Número de cuenta no encontrado' });
    }

    return bankingInfo;
  }

  /**
   * Extrae información de giros
   */
  private static extractGiros(text: string, errors: ParsingError[], warnings: string[]): GiroInfo[] {
    const giros: GiroInfo[] = [];
    
    // Buscar bloques de giros usando patrones más flexibles
    const giroPatterns = [
      /VALOR SOLICITADO:\s*(\d+(?:\.\d+)?)\s*\n.*?NÚMERO DE GIRO:\s*(.+?)\s*\n.*?PORCENTAJE DE GIRO:\s*(.+?)(?=\n\n|VALOR SOLICITADO|Liberación|$)/gis,
    ];

    for (const pattern of giroPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        try {
          const valorSolicitado = parseFloat(match[1]);
          const numeroGiro = match[2].trim();
          const porcentajeGiro = match[3].trim();

          if (!isNaN(valorSolicitado) && numeroGiro && porcentajeGiro) {
            giros.push({
              valorSolicitado,
              numeroGiro,
              porcentajeGiro,
              estado: EstadoProceso.PENDIENTE
            });
          } else {
            warnings.push(`Giro con datos incompletos encontrado: valor=${match[1]}, numero=${match[2]}, porcentaje=${match[3]}`);
          }
        } catch (error) {
          warnings.push(`Error procesando giro: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    }

    if (giros.length === 0) {
      errors.push({ field: 'giros', error: 'No se encontraron giros válidos en el texto' });
    }

    return giros;
  }

  /**
   * Extrae información de liberaciones
   */
  private static extractLiberaciones(text: string, errors: ParsingError[], warnings: string[]): Liberacion[] {
    const liberaciones: Liberacion[] = [];
    
    // Patrón para encontrar liberaciones
    const liberacionPattern = /Liberación\s+(\d+)\s*\n.*?Capital:\s*(\d+(?:\.\d+)?)\s*[A-Z]{3}\s*\n.*?Fecha:\s*(\d{4}-\d{2}-\d{2})/gis;
    
    let match;
    while ((match = liberacionPattern.exec(text)) !== null) {
      try {
        const numero = parseInt(match[1]);
        const capital = parseFloat(match[2]);
        const fecha = match[3].trim();

        if (!isNaN(numero) && !isNaN(capital) && fecha) {
          liberaciones.push({
            numero,
            capital,
            fecha,
            estado: EstadoProceso.PENDIENTE
          });
        } else {
          warnings.push(`Liberación con datos inválidos: numero=${match[1]}, capital=${match[2]}, fecha=${match[3]}`);
        }
      } catch (error) {
        warnings.push(`Error procesando liberación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    if (liberaciones.length === 0) {
      warnings.push('No se encontraron liberaciones en el texto');
    }

    return liberaciones;
  }

  /**
   * Valida que la información crítica esté presente
   */
  private static validateCriticalInfo(basicInfo: any, bankingInfo: DatosBancarios, errors: ParsingError[]): void {
    // Validar campos obligatorios
    const requiredFields = ['cliente', 'paisImportador', 'paisExportador', 'valorTotalCompra'];
    
    for (const field of requiredFields) {
      if (!basicInfo[field] || (typeof basicInfo[field] === 'string' && basicInfo[field].trim() === '')) {
        errors.push({ field, error: `Campo obligatorio ${field} está vacío o no encontrado` });
      }
    }

    // Validar valor total > 0
    if (basicInfo.valorTotalCompra && basicInfo.valorTotalCompra <= 0) {
      errors.push({ field: 'valorTotalCompra', error: 'El valor total debe ser mayor que 0' });
    }

    // Validar formato de datos bancarios críticos
    if (bankingInfo.numeroCuenta && !/^\d+$/.test(bankingInfo.numeroCuenta.replace(/\s/g, ''))) {
      errors.push({ field: 'numeroCuenta', error: 'Número de cuenta contiene caracteres no numéricos' });
    }

    if (bankingInfo.swift && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bankingInfo.swift)) {
      errors.push({ field: 'swift', error: 'Código SWIFT no tiene formato válido' });
    }
  }

  /**
   * Método utilitario para extraer porcentajes de texto
   */
  public static extractPercentage(text: string): number | null {
    const percentageMatch = text.match(/(\d+(?:\.\d+)?)%/);
    return percentageMatch ? parseFloat(percentageMatch[1]) : null;
  }

  /**
   * Método utilitario para extraer valores monetarios
   */
  public static extractMonetaryValue(text: string): number | null {
    const valueMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (valueMatch) {
      return parseFloat(valueMatch[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Método para validar formato de fecha
   */
  public static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}