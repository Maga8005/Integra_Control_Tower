/**
 * Funciones de mapeo específicas para conectar datos CSV con dashboard
 * Integra Control Tower MVP - Soporte multi-país (Colombia y México)
 */

// No necesitamos estas importaciones para las funciones básicas

// Interfaces para mapeo de datos CSV
export interface ParsedGeneralInfo {
  cliente: string;
  proveedor: string;  // NUEVO: Proveedor internacional
  valor: number;
  ruta: string;
  moneda: string;
  incotermCompra?: string;  // NUEVO: Incoterm de compra
  incotermVenta?: string;   // NUEVO: Incoterm de venta
}

// Configuración de países soportados
export type CountryCode = 'CO' | 'MX';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  hasDocLegalXComp: boolean; // México no tiene columnas "8. ESTADO Doc Legal X Comp"
}

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  CO: {
    code: 'CO',
    name: 'Colombia',
    hasDocLegalXComp: true
  },
  MX: {
    code: 'MX', 
    name: 'México',
    hasDocLegalXComp: false
  }
};

export interface ProgressInfo {
  currentStep: number;
  percentage: number;
  stepName: string;
  isCompleted: boolean;
}

export interface CSVRowData {
  [key: string]: string;
}

// Import timeline types
import { Timeline, mapCompleteTimeline } from './timelineMapper';

// Import operation types for giros and liberaciones
import { GiroInfo, Liberacion, EstadoProceso } from '../types/Operation';

// Interface para OperationCard del dashboard
export interface OperationCard {
  id: string;
  clientName: string;
  clientNit: string;
  providerName: string;      // NUEVO: Nombre del proveedor internacional
  totalValue: string;        // Formato: "$75,000 USD"
  totalValueNumeric: number; // NUEVO: Valor numérico para cálculos
  route: string;
  assignedPerson: string;
  progress: number;
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
  currentPhaseName?: string; // NUEVO: Nombre de la fase actual del timeline
  timeline?: Timeline;       // NUEVO: Datos del timeline de 5 estados
  incotermCompra?: string;   // NUEVO: Incoterm de compra (ej: FOB, DAP)
  incotermVenta?: string;    // NUEVO: Incoterm de venta (ej: CIF, DDP)
  giros: GiroInfo[];         // NUEVO: Array de giros estructurados
  liberaciones: Liberacion[]; // NUEVO: Array de liberaciones estructuradas
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 1. Función para parsear la columna "5.Info Gnal + Info Compra Int"
 * Extrae cliente, valor total y ruta (países origen/destino)
 */
export function parseInfoGeneralColumn(infoGeneralValue: string): ParsedGeneralInfo {
  console.log('📋 Parseando columna Info General:', infoGeneralValue?.substring(0, 100) + '...');
  
  try {
    if (!infoGeneralValue || typeof infoGeneralValue !== 'string') {
      return {
        cliente: '',
        proveedor: '',
        valor: 0,
        ruta: '',
        moneda: 'USD'
      };
    }

    const cleanText = infoGeneralValue
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Extraer cliente usando patrones múltiples
    const clientePatterns = [
      /CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i,
      /Cliente:\s*(.+?)(?=\n|País|$)/i,
      /NOMBRE CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i
    ];
    
    let cliente = '';
    for (const pattern of clientePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        cliente = match[1].trim();
        break;
      }
    }

    // Extraer proveedor/beneficiario - solo el nombre, no toda la información
    const proveedorPatterns = [
      // Patrón que se detiene en la primera coma, salto de línea, o información adicional
      /BENEFICIARIO:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|BANCO|DIRECCION|ADDRESS|TEL|PHONE|\d{3,}|$)/i,
      /Beneficiario:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|Banco|Direccion|Address|Tel|Phone|\d{3,}|$)/i,
      /PROVEEDOR:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|BANCO|DIRECCION|ADDRESS|TEL|PHONE|\d{3,}|$)/i,
      /Proveedor:\s*([^,\n\-]+?)(?=[\s]*[\-,\n]|Banco|Direccion|Address|Tel|Phone|\d{3,}|$)/i,
      // Patrones más simples si los anteriores no funcionan
      /BENEFICIARIO:\s*([A-Za-z\s]{5,30})/i,
      /beneficiario:\s*([A-Za-z\s]{5,30})/i
    ];
    
    let proveedor = '';
    for (let i = 0; i < proveedorPatterns.length; i++) {
      const pattern = proveedorPatterns[i];
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        proveedor = match[1].trim()
          .replace(/,$/, '') // Remover coma al final
          .replace(/\s+/g, ' ') // Normalizar espacios
          .trim();
        
        // Validar que el resultado no sea muy largo (probablemente incluye info extra)
        if (proveedor.length <= 50 && proveedor.length >= 3) {
          console.log(`🏢 Proveedor extraído: "${proveedor}" con patrón ${i + 1}`);
          break;
        } else {
          console.log(`🚫 Proveedor descartado (muy largo): "${proveedor.substring(0, 100)}..."`);
          proveedor = ''; // Reset para probar siguiente patrón
        }
      }
    }
    
    // Log del texto para debugging
    if (!proveedor) {
      console.log('🔍 Texto completo para debugging beneficiario:', cleanText.substring(0, 800));
    }

    // Extraer valor total usando patrones múltiples más precisos
    const valorPatterns = [
      /VALOR TOTAL DE COMPRA:\s*([\d,\.]+)/i,
      /VALOR TOTAL:\s*([\d,\.]+)/i,
      /MONTO:\s*([\d,\.]+)/i,
      /VALOR:\s*([\d,\.]+)/i,
      // Patrones adicionales para casos específicos
      /COMPRA:\s*([\d,\.]+)/i,
      /([\d,\.]+)\s*USD/i,
      /([\d,\.]+)\s*EUR/i
    ];
    
    let valor = 0;
    for (const pattern of valorPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        // Limpiar el valor: remover comas, mantener solo números y punto decimal
        const cleanValue = match[1].replace(/,/g, '').replace(/[^\d\.]/g, '');
        const parsedValue = parseFloat(cleanValue);
        if (!isNaN(parsedValue) && parsedValue > 0) {
          valor = parsedValue;
          console.log(`💰 Valor extraído: ${valor} de "${match[1]}"`);
          break;
        }
      }
    }
    
    // Si no encontramos valor con patrones, buscar números grandes en el texto
    if (valor === 0) {
      const numberMatches = cleanText.match(/([\d,\.]+)/g);
      if (numberMatches) {
        for (const numStr of numberMatches) {
          const cleanNum = numStr.replace(/,/g, '').replace(/[^\d\.]/g, '');
          const num = parseFloat(cleanNum);
          if (!isNaN(num) && num >= 1000) { // Asumimos que valores de operaciones son >= 1000
            valor = num;
            console.log(`💰 Valor inferido: ${valor} de "${numStr}"`);
            break;
          }
        }
      }
    }

    // Extraer países para formar la ruta
    const paisImportadorPatterns = [
      /PAÍS IMPORTADOR:\s*(.+?)(?=\n|PAÍS|$)/i,
      /País Importador:\s*(.+?)(?=\n|País|$)/i,
      /DESTINO:\s*(.+?)(?=\n|ORIGEN|$)/i
    ];
    
    const paisExportadorPatterns = [
      /PAÍS EXPORTADOR:\s*(.+?)(?=\n|VALOR|$)/i,
      /País Exportador:\s*(.+?)(?=\n|Valor|$)/i,
      /ORIGEN:\s*(.+?)(?=\n|DESTINO|$)/i
    ];

    let paisImportador = '';
    let paisExportador = '';

    for (const pattern of paisImportadorPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        paisImportador = match[1].trim();
        break;
      }
    }

    for (const pattern of paisExportadorPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        paisExportador = match[1].trim();
        break;
      }
    }

    // Formar ruta
    const ruta = paisExportador && paisImportador 
      ? `${paisExportador} → ${paisImportador}`
      : paisExportador || paisImportador || '';

    // Extraer moneda
    const monedaPatterns = [
      /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i,
      /MONEDA:\s*([A-Z]{3})/i,
      /CURRENCY:\s*([A-Z]{3})/i
    ];
    
    let moneda = 'USD';
    for (const pattern of monedaPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        moneda = match[1].toUpperCase();
        break;
      }
    }

    // Extraer Incoterms - solo las siglas principales
    // Soportar ambas variantes: ICOTERM e INCOTERM
    const incotermPatterns = [
      /I[NC]?COTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
      /I[NC]?COTERMS COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i
    ];
    
    const incotermVentaPatterns = [
      /I[NC]?COTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
      /I[NC]?COTERMS VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i
    ];

    let incotermCompra = '';
    let incotermVenta = '';

    // Extraer Incoterm de compra
    for (const pattern of incotermPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        incotermCompra = match[1].toUpperCase();
        console.log(`📦 Incoterm Compra extraído: "${incotermCompra}"`);
        break;
      }
    }

    // Extraer Incoterm de venta
    for (const pattern of incotermVentaPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        incotermVenta = match[1].toUpperCase();
        console.log(`🚚 Incoterm Venta extraído: "${incotermVenta}"`);
        break;
      }
    }

    const result = {
      cliente: cliente || 'Cliente no especificado',
      proveedor: proveedor || 'Proveedor no especificado',
      valor: valor || 0,
      ruta: ruta || 'Ruta no especificada',
      moneda: moneda,
      incotermCompra: incotermCompra || undefined,
      incotermVenta: incotermVenta || undefined
    };

    console.log('✅ Info general parseada:', result);
    return result;

  } catch (error) {
    console.error('❌ Error parseando info general:', error);
    return {
      cliente: 'Error en parsing',
      proveedor: 'Error en parsing',
      valor: 0,
      ruta: 'Error en parsing',
      moneda: 'USD',
      incotermCompra: undefined,
      incotermVenta: undefined
    };
  }
}

/**
 * 2. Función para calcular progreso basado en la columna "Proceso"
 * Mapea los 6 pasos específicos con sus porcentajes exactos
 */
export function calculateProgressFromProceso(procesoValue: string): ProgressInfo {
  console.log('📊 Calculando progreso de proceso:', procesoValue);
  
  try {
    if (!procesoValue || typeof procesoValue !== 'string') {
      return {
        currentStep: 0,
        percentage: 0,
        stepName: 'Sin información',
        isCompleted: false
      };
    }

    const cleanProceso = procesoValue.toLowerCase().trim();

    // Definir los 6 pasos específicos con sus porcentajes
    const processSteps = [
      {
        step: 1,
        keywords: ['aprobación de cotización', 'cotización', 'aprobacion'],
        percentage: 16.67,
        name: 'Aprobación de Cotización'
      },
      {
        step: 2,
        keywords: ['docu legal gnal', 'cuota op', 'nego int', 'documentos legal', 'negociacion'],
        percentage: 33.33,
        name: 'Docu Legal Gnal / Cuota Op / Nego Int'
      },
      {
        step: 3,
        keywords: ['componente no 1', 'plataforma', 'giro 1', 'proveedor internacional'],
        percentage: 50.0,
        name: 'Componente No 1 Plataforma - Giro 1 Proveedor Internacional'
      },
      {
        step: 4,
        keywords: ['componente no 2', 'giro 2', 'segundo giro'],
        percentage: 66.67,
        name: 'Componente No 2 Plataforma y Giro 2 Proveedor Internacional'
      },
      {
        step: 5,
        keywords: ['componente financiamiento logístico', 'financiamiento logistico', 'logistica'],
        percentage: 83.33,
        name: 'Componente Financiamiento Logístico'
      },
      {
        step: 6,
        keywords: ['liberación de mercancía', 'liberacion', 'mercancia', 'completado'],
        percentage: 100.0,
        name: 'Liberación de Mercancía'
      }
    ];

    // Buscar coincidencia con los pasos
    for (const processStep of processSteps) {
      const hasMatch = processStep.keywords.some(keyword => 
        cleanProceso.includes(keyword.toLowerCase())
      );
      
      if (hasMatch) {
        console.log(`✅ Paso encontrado: ${processStep.step} - ${processStep.name} (${processStep.percentage}%)`);
        return {
          currentStep: processStep.step,
          percentage: Math.round(processStep.percentage * 100) / 100, // Redondear a 2 decimales
          stepName: processStep.name,
          isCompleted: processStep.step === 6
        };
      }
    }

    // Si no hay coincidencia exacta, intentar detectar progreso parcial
    if (cleanProceso.includes('en proceso') || cleanProceso.includes('proceso')) {
      return {
        currentStep: 1,
        percentage: 8.33, // Aproximadamente la mitad del primer paso
        stepName: 'En proceso',
        isCompleted: false
      };
    }

    if (cleanProceso.includes('iniciado') || cleanProceso.includes('comenzado')) {
      return {
        currentStep: 1,
        percentage: 5.0,
        stepName: 'Iniciado',
        isCompleted: false
      };
    }

    // Valor por defecto si no se encuentra información
    return {
      currentStep: 0,
      percentage: 0,
      stepName: 'Sin información de proceso',
      isCompleted: false
    };

  } catch (error) {
    console.error('❌ Error calculando progreso:', error);
    return {
      currentStep: 0,
      percentage: 0,
      stepName: 'Error en cálculo',
      isCompleted: false
    };
  }
}

/**
 * 3. Función para extraer NIT/RFC de la columna "1. Docu. Cliente"
 * Extrae el NIT/RFC del cliente desde la documentación
 */
export function extractClientNit(docuClienteValue: string): string {
  console.log('🆔 Extrayendo NIT/RFC del cliente:', docuClienteValue?.substring(0, 50) + '...');
  
  try {
    if (!docuClienteValue || typeof docuClienteValue !== 'string') {
      return 'Sin NIT';
    }

    const cleanText = docuClienteValue.trim();

    // Patrones para encontrar NIT/RFC/RUT
    const nitPatterns = [
      /NIT[:\s]*([0-9]{9,10}[\-]?[0-9]?)/i,
      /RFC[:\s]*([A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3})/i,
      /RUT[:\s]*([0-9]{1,2}\.[0-9]{3}\.[0-9]{3}[\-][0-9Kk])/i,
      /CÉDULA[:\s]*([0-9]{8,10})/i,
      /([0-9]{9,10}[\-][0-9])/g, // Patrón genérico NIT
      /([A-Z]{4}[0-9]{6}[A-Z0-9]{3})/g // Patrón genérico RFC
    ];

    for (const pattern of nitPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const nit = match[1].trim();
        console.log('✅ NIT/RFC encontrado:', nit);
        return nit;
      }
    }

    // Buscar números largos que puedan ser NITs
    const numberMatch = cleanText.match(/([0-9]{8,12})/); 
    if (numberMatch && numberMatch[1]) {
      const nit = numberMatch[1];
      console.log('✅ Posible NIT numérico encontrado:', nit);
      return nit;
    }

    // Si no se encuentra, buscar cualquier identificador alfanumérico
    const alphaMatch = cleanText.match(/([A-Z0-9]{8,15})/i);
    if (alphaMatch && alphaMatch[1]) {
      const id = alphaMatch[1].toUpperCase();
      console.log('✅ Identificador alfanumérico encontrado:', id);
      return id;
    }

    return 'Sin NIT';

  } catch (error) {
    console.error('❌ Error extrayendo NIT:', error);
    return 'Error NIT';
  }
}

/**
 * Detecta el país basado en la estructura del CSV
 * México: 32 columnas (sin "8. ESTADO Doc Legal X Comp" y "8. Doc Legal X Comp")
 * Colombia: 34 columnas (con todas las columnas)
 */
export function detectCountryFromCSV(csvRow: CSVRowData): CountryCode {
  const keys = Object.keys(csvRow);
  const hasDocLegalXComp = keys.some(key => key.includes('8. ESTADO Doc Legal X Comp'));
  
  const detectedCountry = hasDocLegalXComp ? 'CO' : 'MX';
  console.log(`🌎 País detectado: ${COUNTRY_CONFIGS[detectedCountry].name} (${keys.length} columnas, Doc Legal X Comp: ${hasDocLegalXComp})`);
  
  return detectedCountry;
}

/**
 * 4. Función principal de mapeo CSV a OperationCard para Dashboard
 * Combina todas las funciones anteriores para transformar una fila CSV completa
 * ACTUALIZADO: Soporte multi-país
 */
export function mapCSVToOperationCard(csvRow: CSVRowData, countryCode?: CountryCode): OperationCard {
  // Detectar país si no se especifica
  const country = countryCode || detectCountryFromCSV(csvRow);
  const config = COUNTRY_CONFIGS[country];
  
  console.log(`🎯 Mapeando fila CSV a OperationCard para dashboard (${config.name})...`);
  
  try {
    // Extraer campos específicos del CSV
    const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || '';  // CORREGIDO
    const proceso = csvRow['Proceso'] || '';
    const equipoComercial = csvRow['15. Equipo Comercial'] || '';
    const docuCliente = csvRow['1. Docu. Cliente'] || '';
    const operationId = csvRow['ID'] || csvRow['id'] || generateConsistentOperationId(csvRow);

    // Parsear información general usando funciones existentes
    const parsedInfo = parseInfoGeneralColumn(infoGeneral);
    
    // Extraer NIT del cliente
    const clientNit = extractClientNit(docuCliente);
    
    // Extraer giros y liberaciones estructurados
    const giros = extractGirosFromInfoGeneral(infoGeneral);
    const liberaciones = extractLiberacionesFromInfoGeneral(infoGeneral);
    
    // Calcular progreso
    const progressInfo = calculateProgressFromProceso(proceso);

    // Generar timeline de 5 estados con configuración de país
    const timeline = mapCompleteTimeline(csvRow, country);
    
    // Usar progreso del timeline si está disponible, sino usar el calculado anterior
    const finalProgress = timeline ? timeline.overallProgress : Math.round(progressInfo.percentage);

    // Determinar estado basado en el progreso del timeline o el método anterior
    let status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
    let currentPhaseName: string | undefined;
    
    // Determinar la fase actual del timeline
    if (timeline && timeline.states) {
      const activePhase = timeline.states.find(state => state.status === 'in-progress');
      const completedPhases = timeline.states.filter(state => state.status === 'completed');
      
      if (activePhase) {
        currentPhaseName = activePhase.name;
        status = 'in-progress';
      } else if (completedPhases.length === timeline.states.length) {
        // Todas las fases completadas
        currentPhaseName = 'Completada';
        status = 'completed';
      } else if (completedPhases.length > 0) {
        // Hay fases completadas pero no todas
        const lastCompletedPhase = completedPhases[completedPhases.length - 1];
        const nextPhaseIndex = timeline.states.findIndex(state => state.id === lastCompletedPhase.id) + 1;
        if (nextPhaseIndex < timeline.states.length) {
          currentPhaseName = timeline.states[nextPhaseIndex].name;
          status = 'in-progress';
        } else {
          currentPhaseName = 'Completada';
          status = 'completed';
        }
      } else {
        currentPhaseName = timeline.states[0].name;
        status = 'draft';
      }
    } else {
      // Fallback al método anterior si no hay timeline
      if (progressInfo.isCompleted) {
        status = 'completed';
        currentPhaseName = 'Completada';
      } else if (progressInfo.currentStep > 0) {
        status = 'in-progress';
      } else if (progressInfo.currentStep === 0 && proceso.toLowerCase().includes('hold')) {
        status = 'on-hold';
      } else {
        status = 'draft';
      }
    }

    // Formatear valor total con moneda
    const formattedValue = parsedInfo.valor > 0 
      ? `$${parsedInfo.valor.toLocaleString()} ${parsedInfo.moneda}`
      : 'Valor no disponible';

    // Construir objeto OperationCard
    const operationCard: OperationCard = {
      id: operationId,
      clientName: parsedInfo.cliente || 'Cliente no especificado',
      clientNit: clientNit,
      providerName: parsedInfo.proveedor || 'Proveedor no especificado', // NUEVO: Proveedor
      totalValue: formattedValue,
      totalValueNumeric: parsedInfo.valor || 0, // NUEVO: Valor numérico
      route: parsedInfo.ruta || 'Ruta no especificada',
      assignedPerson: equipoComercial || 'No asignado',
      progress: finalProgress,
      status,
      currentPhaseName, // NUEVO: Nombre de la fase actual
      timeline: timeline, // NUEVO: Timeline de 5 estados
      incotermCompra: parsedInfo.incotermCompra, // NUEVO: Incoterm de compra
      incotermVenta: parsedInfo.incotermVenta,   // NUEVO: Incoterm de venta
      giros: giros, // NUEVO: Array de giros estructurados
      liberaciones: liberaciones, // NUEVO: Array de liberaciones estructuradas
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ OperationCard creada:', {
      id: operationCard.id,
      clientName: operationCard.clientName,
      clientNit: operationCard.clientNit,
      progress: operationCard.progress,
      status: operationCard.status,
      girosCount: operationCard.giros.length,
      liberacionesCount: operationCard.liberaciones.length
    });

    return operationCard;

  } catch (error) {
    console.error('❌ Error mapeando CSV a OperationCard:', error);
    
    // Retornar OperationCard por defecto en caso de error
    return {
      id: generateOperationId(),
      clientName: 'Error en mapeo',
      clientNit: 'Error NIT',
      providerName: 'Error en mapeo', // NUEVO: Proveedor
      totalValue: '$0 USD',
      totalValueNumeric: 0, // NUEVO: Valor numérico
      route: 'Error en mapeo',
      assignedPerson: 'No asignado',
      progress: 0,
      status: 'draft',
      incotermCompra: undefined, // NUEVO: Incoterm de compra
      incotermVenta: undefined,  // NUEVO: Incoterm de venta
      giros: [], // NUEVO: Array vacío de giros
      liberaciones: [], // NUEVO: Array vacío de liberaciones
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * 6. Función para mapear múltiples filas CSV a OperationCard
 * Procesa un array completo de datos CSV para el dashboard
 * ACTUALIZADO: Soporte multi-país
 */
export function mapMultipleCSVToCards(csvRows: CSVRowData[], countryCode?: CountryCode): OperationCard[] {
  // Detectar país del primer registro si no se especifica
  const country = countryCode || (csvRows.length > 0 ? detectCountryFromCSV(csvRows[0]) : 'CO');
  const config = COUNTRY_CONFIGS[country];
  
  console.log(`🎯 Mapeando ${csvRows.length} filas CSV a OperationCards (${config.name})...`);
  
  return csvRows.map((row, index) => {
    try {
      return mapCSVToOperationCard(row, country);
    } catch (error) {
      console.error(`❌ Error en fila ${index}:`, error);
      return mapCSVToOperationCard({}, country); // OperationCard por defecto
    }
  });
}

/**
 * Función para extraer datos de giros estructurados de la columna "5. Info Gnal + Info Compra Int"
 */
export function extractGirosFromInfoGeneral(infoGeneralValue: string): GiroInfo[] {
  console.log('💰 Extrayendo giros de Info General...');
  
  try {
    const giros: GiroInfo[] = [];
    
    if (!infoGeneralValue || typeof infoGeneralValue !== 'string') {
      return giros;
    }

    const cleanText = infoGeneralValue
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Dividir por secciones de giros usando "VALOR SOLICITADO:" como delimitador
    const giroSections = cleanText.split(/(?=- VALOR SOLICITADO:)/i).filter(section => 
      section.includes('VALOR SOLICITADO:')
    );

    console.log(`📊 Encontradas ${giroSections.length} secciones de giros`);

    giroSections.forEach((section, index) => {
      try {
        // Extraer valor solicitado
        const valorMatch = section.match(/VALOR SOLICITADO:\s*(\d+(?:\.\d+)?)/i);
        const valorSolicitado = valorMatch ? parseFloat(valorMatch[1]) : 0;

        // Extraer número de giro
        const numeroMatch = section.match(/NÚMERO DE GIRO:\s*(.+?)(?=\n|- PORCENTAJE|$)/i);
        const numeroGiro = numeroMatch ? numeroMatch[1].trim() : `Giro ${index + 1}`;

        // Extraer porcentaje de giro
        const porcentajeMatch = section.match(/PORCENTAJE DE GIRO:\s*(.+?)(?=\n|$)/i);
        const porcentajeGiro = porcentajeMatch ? porcentajeMatch[1].trim() : '';

        if (valorSolicitado > 0) {
          const giro: GiroInfo = {
            valorSolicitado,
            numeroGiro,
            porcentajeGiro,
            estado: EstadoProceso.PENDIENTE, // Se puede mejorar con lógica adicional
            fechaVencimiento: undefined
          };

          giros.push(giro);
          console.log(`💸 Giro extraído: ${giro.numeroGiro} - $${giro.valorSolicitado.toLocaleString()}`);
        }
      } catch (sectionError) {
        console.warn(`⚠️ Error procesando sección de giro ${index + 1}:`, sectionError);
      }
    });

    return giros;

  } catch (error) {
    console.error('❌ Error extrayendo giros:', error);
    return [];
  }
}

/**
 * Función para extraer datos de liberaciones estructuradas de la columna "5. Info Gnal + Info Compra Int"
 */
export function extractLiberacionesFromInfoGeneral(infoGeneralValue: string): Liberacion[] {
  console.log('🔓 Extrayendo liberaciones de Info General...');
  
  try {
    const liberaciones: Liberacion[] = [];
    
    if (!infoGeneralValue || typeof infoGeneralValue !== 'string') {
      return liberaciones;
    }

    const cleanText = infoGeneralValue
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    // Dividir por secciones de liberaciones usando "Liberación" como delimitador
    const liberacionSections = cleanText.split(/(?=- Liberación \d+)/i).filter(section => 
      section.match(/Liberación \d+/i)
    );

    console.log(`📊 Encontradas ${liberacionSections.length} secciones de liberaciones`);

    liberacionSections.forEach((section, index) => {
      try {
        // Extraer número de liberación
        const numeroMatch = section.match(/Liberación (\d+)/i);
        const numero = numeroMatch ? parseInt(numeroMatch[1]) : index + 1;

        // Extraer capital (puede estar en la siguiente línea)
        const capitalMatch = section.match(/Capital:\s*(\d+(?:\.\d+)?)\s*USD/i) || 
                           section.match(/(\d+(?:\.\d+)?)\s*USD/);
        const capital = capitalMatch ? parseFloat(capitalMatch[1]) : 0;

        // Extraer fecha
        const fechaMatch = section.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})/i);
        const fecha = fechaMatch ? fechaMatch[1] : '';

        if (capital > 0 && fecha) {
          const fechaObj = new Date(fecha);
          const ahora = new Date();
          
          const liberacion: Liberacion = {
            numero,
            capital,
            fecha,
            estado: fechaObj <= ahora ? EstadoProceso.COMPLETADO : EstadoProceso.PENDIENTE,
            documentosRequeridos: [] // Se puede expandir en el futuro
          };

          liberaciones.push(liberacion);
          console.log(`💰 Liberación extraída: #${liberacion.numero} - $${liberacion.capital.toLocaleString()} - ${liberacion.fecha}`);
        }
      } catch (sectionError) {
        console.warn(`⚠️ Error procesando sección de liberación ${index + 1}:`, sectionError);
      }
    });

    // Ordenar por número de liberación
    liberaciones.sort((a, b) => a.numero - b.numero);

    if (liberaciones.length > 0) {
      const totalLiberado = liberaciones
        .filter(lib => lib.estado === EstadoProceso.COMPLETADO)
        .reduce((sum, lib) => sum + lib.capital, 0);
      console.log(`✅ ${liberaciones.length} liberaciones procesadas. Total liberado: $${totalLiberado.toLocaleString()}`);
    }

    return liberaciones;

  } catch (error) {
    console.error('❌ Error extrayendo liberaciones:', error);
    return [];
  }
}

// Funciones auxiliares
function generateOperationId(): string {
  return `OP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

// Generate consistent operation ID based on CSV row data
function generateConsistentOperationId(csvRow: CSVRowData): string {
  // Create a unique identifier based on stable CSV data
  const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || '';
  const docuCliente = csvRow['1. Docu. Cliente'] || '';
  const equipoComercial = csvRow['15. Equipo Comercial'] || '';
  
  // Extract client name and value for unique ID
  const parsedInfo = parseInfoGeneralColumn(infoGeneral);
  const clientNit = extractClientNit(docuCliente);
  
  // Create hash-like ID from stable data
  const dataString = `${parsedInfo.cliente}-${clientNit}-${parsedInfo.valor}-${equipoComercial}`;
  const hash = dataString
    .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
    .toUpperCase()
    .substring(0, 12); // Take first 12 characters
  
  // Add index based on client + value to ensure uniqueness
  const shortHash = Math.abs(hashCode(dataString)).toString(36).toUpperCase().substring(0, 4);
  
  return `OP-${hash}-${shortHash}`;
}

// Simple hash function for consistent ID generation
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * 5. Función para validar datos CSV antes del mapeo
 * Verifica que los campos críticos estén presentes
 */
export function validateCSVRow(csvRow: CSVRowData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar campos críticos - CORREGIR nombres exactos del CSV
  const criticalFields = [
    '5. Info Gnal + Info Compra Int',  // CORREGIDO: agregar espacio después del 5
    'Proceso',
    '15. Equipo Comercial'
  ];

  criticalFields.forEach(field => {
    if (!csvRow[field] || csvRow[field].trim() === '') {
      if (field === '5. Info Gnal + Info Compra Int') {
        // CAMBIO: Solo warning en lugar de error para ser menos estricto
        warnings.push(`Campo crítico con datos faltantes: ${field}`);
      } else {
        warnings.push(`Campo recomendado faltante: ${field}`);
      }
    }
  });

  // Validar que la info general tenga contenido mínimo
  const infoGeneral = csvRow['5. Info Gnal + Info Compra Int'] || '';  // CORREGIDO: nombre exacto
  if (infoGeneral.length < 20) {  // REDUCIDO: de 50 a 20 caracteres para ser menos estricto
    warnings.push('Información general muy breve, puede afectar el parsing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}