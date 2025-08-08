/**
 * Utilidades para manejo de NIT/RFC en sistema de autenticación
 * Integra Control Tower MVP
 */

import { CSVRowData, OperationCard, mapCSVToOperationCard } from './csvMappers';

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
 * Soporte para RFC mexicano y NIT colombiano
 */
export function normalizeNit(nit: string): string {
  if (!nit || typeof nit !== 'string') {
    return '';
  }
  
  const normalized = nit
    .trim()
    .replace(/[\s\-\.]/g, '') // Remover espacios, guiones y puntos
    .toUpperCase();
    
  // Validar si es RFC mexicano válido (formato: AAAA######AAA)
  const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  if (rfcPattern.test(normalized)) {
    console.log(`📋 RFC mexicano normalizado: ${normalized}`);
    return normalized;
  }
  
  // Validar si es NIT colombiano (solo números)
  const nitPattern = /^[0-9]+$/;
  if (nitPattern.test(normalized)) {
    console.log(`📋 NIT colombiano normalizado: ${normalized}`);
    return normalized;
  }
  
  // Retornar normalizado para otros casos
  console.log(`📋 Identificador normalizado: ${normalized}`);
  return normalized;
}

/**
 * Extraer cliente, NIT y valor operación desde la columna "1.Docu. Cliente"
 * Formato esperado: "- CLIENTE: [Nombre]\n- NIT: [NIT]\n- VALOR OPERACIÓN: [Valor]" 
 */
export interface ClienteNitInfo {
  cliente: string;
  nit: string;
  valorOperacion?: number;
}

export function extractClienteNitFromDocColumn(docuClienteValue: string): ClienteNitInfo {
  if (!docuClienteValue || typeof docuClienteValue !== 'string') {
    return { cliente: '', nit: '' };
  }

  const cleanText = docuClienteValue.trim();
  console.log(`🔍 Extrayendo información de: "${cleanText}"`);

  // Extraer CLIENTE usando patrón específico
  const clienteMatch = cleanText.match(/[-\s]*CLIENTE:\s*(.+?)(?=\n|$)/i);
  const cliente = clienteMatch ? clienteMatch[1].trim() : '';

  // Extraer NIT/RFC usando patrones múltiples para soporte México y Colombia
  let nit = '';
  
  // Patrón 1: NIT Colombia (numérico)
  const nitColombiaMatch = cleanText.match(/[-\s]*NIT:\s*([0-9]+)/i);
  if (nitColombiaMatch) {
    nit = nitColombiaMatch[1].trim();
    console.log(`✅ NIT Colombia extraído: "${nit}"`);
  }
  
  // Patrón 2: RFC México (alfanumérico) - formato: AAAA######AAA
  if (!nit) {
    const rfcMexicoMatch = cleanText.match(/[-\s]*(?:RFC|NIT):\s*([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/i);
    if (rfcMexicoMatch) {
      nit = rfcMexicoMatch[1].trim().toUpperCase();
      console.log(`✅ RFC México extraído: "${nit}"`);
    }
  }
  
  // Patrón 3: Buscar RFC sin etiqueta (formato libre)
  if (!nit) {
    const rfcPatternMatch = cleanText.match(/([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/i);
    if (rfcPatternMatch) {
      nit = rfcPatternMatch[1].trim().toUpperCase();
      console.log(`✅ RFC México (patrón libre) extraído: "${nit}"`);
    }
  }
  
  // Patrón 4: NIT genérico (números con guiones)
  if (!nit) {
    const nitGenericoMatch = cleanText.match(/[-\s]*(?:RFC|NIT):\s*([0-9\-]+)/i);
    if (nitGenericoMatch) {
      nit = nitGenericoMatch[1].trim();
      console.log(`✅ NIT genérico extraído: "${nit}"`);
    }
  }

  // NUEVO: Extraer VALOR OPERACIÓN usando patrón específico
  const valorMatch = cleanText.match(/[-\s]*VALOR OPERACI[ÓO]N:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const valorOperacion = valorMatch ? parseFloat(valorMatch[1]) : undefined;

  console.log(`✅ Cliente extraído: "${cliente}"`);
  console.log(`✅ NIT/RFC extraído: "${nit}"`);
  console.log(`✅ Valor operación extraído: ${valorOperacion || 'N/A'}`);

  return { cliente, nit, valorOperacion };
}

/**
 * Extraer y normalizar NIT de la columna "1. Docu. Cliente" (método legacy)
 */
export function extractNitFromDocColumn(docuClienteValue: string): string[] {
  const { nit } = extractClienteNitFromDocColumn(docuClienteValue);
  return nit ? [nit] : [];
}

/**
 * Buscar operaciones por NIT en datos CSV
 */
export function findOperationsByNit(csvData: CSVRowData[], searchNit: string): {
  operations: OperationCard[];
  clientInfo: ClientInfo | null;
} {
  console.log(`🔍 Buscando operaciones para NIT: "${searchNit}"`);
  
  if (!csvData || csvData.length === 0) {
    console.log('❌ No hay datos CSV disponibles');
    return { operations: [], clientInfo: null };
  }

  const normalizedSearchNit = normalizeNit(searchNit);
  const matchingRows: CSVRowData[] = [];
  let clientName = '';

  // Buscar coincidencias exactas y parciales
  for (const row of csvData) {
    const docuCliente = row['1. Docu. Cliente'] || '';
    const extractedNits = extractNitFromDocColumn(docuCliente);
    
    // Buscar coincidencia exacta
    const exactMatch = extractedNits.some(nit => nit === normalizedSearchNit);
    
    // Buscar coincidencia parcial (NIT contiene o está contenido)
    const partialMatch = extractedNits.some(nit => 
      nit.includes(normalizedSearchNit) || normalizedSearchNit.includes(nit)
    );

    if (exactMatch || partialMatch) {
      matchingRows.push(row);
      
      // Extraer nombre del cliente si no lo tenemos
      if (!clientName) {
        const infoGeneral = row['5. Info Gnal + Info Compra Int'] || '';
        const clientePatterns = [
          /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i,
          /Cliente:\s*(.+?)(?=\n|País|$)/i,
          /NOMBRE CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i
        ];
        
        for (const pattern of clientePatterns) {
          const match = infoGeneral.match(pattern);
          if (match && match[1]) {
            clientName = match[1].trim();
            break;
          }
        }
      }
      
      console.log(`✅ Coincidencia encontrada: ${exactMatch ? 'exacta' : 'parcial'} para cliente: ${clientName}`);
    }
  }

  // Convertir filas CSV a OperationCards
  const operations = matchingRows.map(row => mapCSVToOperationCard(row));

  // Crear información del cliente
  const clientInfo: ClientInfo | null = operations.length > 0 ? {
    nit: searchNit,
    name: clientName || operations[0]?.clientName || 'Cliente no identificado',
    operationsCount: operations.length
  } : null;

  console.log(`📊 Resultado búsqueda: ${operations.length} operaciones encontradas para ${clientInfo?.name}`);
  
  return { operations, clientInfo };
}

/**
 * Generar JWT simple para demo (en producción usar librería como jsonwebtoken)
 */
export function generateClientToken(clientInfo: ClientInfo): string {
  // Simple token para demo - en producción usar JWT real
  const payload = {
    nit: clientInfo.nit,
    name: clientInfo.name,
    operationsCount: clientInfo.operationsCount,
    loginTime: Date.now(),
    type: 'client'
  };
  
  // Base64 encode (no es seguro para producción)
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  console.log(`🔐 Token generado para cliente: ${clientInfo.name}`);
  
  return token;
}

/**
 * Validar formato de NIT/RFC básico
 * Soporte para RFC mexicano (AAAA######AAA) y NIT colombiano (numérico)
 */
export function validateNitFormat(nit: string): { isValid: boolean; message: string; type: 'RFC' | 'NIT' | 'UNKNOWN' } {
  const normalizedNit = normalizeNit(nit);
  
  if (!normalizedNit) {
    return { isValid: false, message: 'NIT/RFC no puede estar vacío', type: 'UNKNOWN' };
  }
  
  // Validar RFC mexicano (formato: AAAA######AAA)
  const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  if (rfcPattern.test(normalizedNit)) {
    return { isValid: true, message: 'RFC mexicano válido', type: 'RFC' };
  }
  
  // Validar NIT colombiano (solo números, 8-10 dígitos)
  const nitPattern = /^[0-9]{8,10}$/;
  if (nitPattern.test(normalizedNit)) {
    return { isValid: true, message: 'NIT colombiano válido', type: 'NIT' };
  }
  
  // Validar NIT genérico (números con posible guión verificador)
  const nitGenericoPattern = /^[0-9]{6,12}$/;
  if (nitGenericoPattern.test(normalizedNit)) {
    return { isValid: true, message: 'NIT genérico válido', type: 'NIT' };
  }
  
  // Validaciones básicas de longitud
  if (normalizedNit.length < 6) {
    return { isValid: false, message: 'NIT/RFC debe tener al menos 6 caracteres', type: 'UNKNOWN' };
  }
  
  if (normalizedNit.length > 15) {
    return { isValid: false, message: 'NIT/RFC no puede tener más de 15 caracteres', type: 'UNKNOWN' };
  }
  
  // Validar que contenga al menos números o letras
  if (!/[0-9A-Z]/.test(normalizedNit)) {
    return { isValid: false, message: 'NIT/RFC debe contener números o letras', type: 'UNKNOWN' };
  }
  
  return { isValid: true, message: 'Formato válido (identificador genérico)', type: 'UNKNOWN' };
}