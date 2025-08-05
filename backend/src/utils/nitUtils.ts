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
 */
export function normalizeNit(nit: string): string {
  if (!nit || typeof nit !== 'string') {
    return '';
  }
  
  return nit
    .trim()
    .replace(/[\s\-\.]/g, '') // Remover espacios, guiones y puntos
    .toUpperCase();
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

  // Extraer NIT usando patrón específico  
  const nitMatch = cleanText.match(/[-\s]*NIT:\s*([0-9]+)/i);
  const nit = nitMatch ? nitMatch[1].trim() : '';

  // NUEVO: Extraer VALOR OPERACIÓN usando patrón específico
  const valorMatch = cleanText.match(/[-\s]*VALOR OPERACI[ÓO]N:\s*([0-9]+(?:\.[0-9]+)?)/i);
  const valorOperacion = valorMatch ? parseFloat(valorMatch[1]) : undefined;

  console.log(`✅ Cliente extraído: "${cliente}"`);
  console.log(`✅ NIT extraído: "${nit}"`);
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
 */
export function validateNitFormat(nit: string): { isValid: boolean; message: string } {
  const normalizedNit = normalizeNit(nit);
  
  if (!normalizedNit) {
    return { isValid: false, message: 'NIT/RFC no puede estar vacío' };
  }
  
  if (normalizedNit.length < 6) {
    return { isValid: false, message: 'NIT/RFC debe tener al menos 6 caracteres' };
  }
  
  if (normalizedNit.length > 15) {
    return { isValid: false, message: 'NIT/RFC no puede tener más de 15 caracteres' };
  }
  
  // Validar que contenga al menos números o letras
  if (!/[0-9A-Z]/.test(normalizedNit)) {
    return { isValid: false, message: 'NIT/RFC debe contener números o letras' };
  }
  
  return { isValid: true, message: 'Formato válido' };
}