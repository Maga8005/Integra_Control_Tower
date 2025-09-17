/**
 * Funciones de mapeo específicas para conectar datos CSV con dashboard
 * Integra Control Tower MVP
 */

import { OperationDetail, EstadoProceso } from '../types/Operation';

// Create interfaces for legacy Operation compatibility
interface Operation {
  id: string;
  applicantId: string;
  status: ApplicationStatus;
  currentStage: ProcessStage;
  progress: number;
  cliente: string;
  valorTotal: number;
  moneda: string;
  ruta: string;
  assignedTo: string;
  currentStep: number;
  stepName: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion: Date;
  csvData: {
    proceso: string;
    infoGeneral: string;
    equipoComercial: string;
  };
}

type ProcessStage = 'application' | 'documentation' | 'review' | 'approval' | 'funding' | 'monitoring' | 'completion';
type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'funded' | 'completed';

// Interfaces para mapeo de datos CSV
export interface ParsedGeneralInfo {
  cliente: string;
  valor: number;
  ruta: string;
  moneda: string; // Moneda principal de compra
  monedas: {
    compra: string;          // Moneda de compra de mercancía
    flete?: string;          // Moneda del flete internacional
    gastosDestino?: string;  // Moneda de gastos en destino
    seguro?: string;         // Moneda del seguro
    liberacion?: string;     // Moneda del capital de liberación
  };
  costosLogisticos: {
    flete?: number;
    gastosDestino?: number;
    seguro?: number;
  };
  capitalLiberacion?: number;
}

export interface ProgressInfo {
  currentStep: number;
  percentage: number;
  stepName: string;
  isCompleted: boolean;
}

export interface CSVRowData {
  [key: string]: string;
}

// Interface para OperationCard del dashboard
export interface OperationCard {
  id: string;
  clientName: string;
  clientNit: string;
  totalValue: string;
  route: string;
  assignedPerson: string;
  progress: number;
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
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
        valor: 0,
        ruta: '',
        moneda: 'USD',
        monedas: {
          compra: 'USD'
        },
        costosLogisticos: {},
        capitalLiberacion: undefined
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

    // Extraer valor total usando patrones múltiples
    const valorPatterns = [
      /VALOR TOTAL DE COMPRA:\s*(\d+(?:[.,]\d+)?)/i,
      /VALOR TOTAL:\s*(\d+(?:[.,]\d+)?)/i,
      /MONTO:\s*(\d+(?:[.,]\d+)?)/i,
      /VALOR:\s*(\d+(?:[.,]\d+)?)/i
    ];
    
    let valor = 0;
    for (const pattern of valorPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        valor = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(valor)) break;
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

    // Extraer moneda de compra principal
    const monedaPatterns = [
      /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i,
      /MONEDA:\s*([A-Z]{3})/i,
      /CURRENCY:\s*([A-Z]{3})/i
    ];
    
    let monedaCompra = 'USD';
    for (const pattern of monedaPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        monedaCompra = match[1].toUpperCase();
        break;
      }
    }

    // Extraer valor solicitado con su moneda
    const valorSolicitadoMatch = cleanText.match(/VALOR SOLICITADO:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})?/i);
    if (valorSolicitadoMatch && valorSolicitadoMatch[1]) {
      valor = parseFloat(valorSolicitadoMatch[1].replace(/,/g, ''));
      if (valorSolicitadoMatch[2]) {
        monedaCompra = valorSolicitadoMatch[2].toUpperCase();
      }
    }

    // Extraer costos logísticos con sus monedas
    const fleteMatch = cleanText.match(/FLETE INTERNACIONAL:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i);
    const gastosMatch = cleanText.match(/GASTOS EN DESTINO:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i);
    const seguroMatch = cleanText.match(/SEGURO:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i);

    const costosLogisticos = {
      flete: fleteMatch ? parseFloat(fleteMatch[1].replace(/,/g, '')) : undefined,
      gastosDestino: gastosMatch ? parseFloat(gastosMatch[1].replace(/,/g, '')) : undefined,
      seguro: seguroMatch ? parseFloat(seguroMatch[1].replace(/,/g, '')) : undefined
    };

    const monedas = {
      compra: monedaCompra,
      flete: fleteMatch?.[2]?.toUpperCase(),
      gastosDestino: gastosMatch?.[2]?.toUpperCase(),
      seguro: seguroMatch?.[2]?.toUpperCase(),
      liberacion: undefined as string | undefined
    };

    // Extraer capital de liberación con su moneda
    const capitalMatch = cleanText.match(/Capital:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i);
    let capitalLiberacion: number | undefined;
    if (capitalMatch) {
      capitalLiberacion = parseFloat(capitalMatch[1].replace(/,/g, ''));
      monedas.liberacion = capitalMatch[2]?.toUpperCase();
    }

    const result = {
      cliente: cliente || 'Cliente no especificado',
      valor: valor || 0,
      ruta: ruta || 'Ruta no especificada',
      moneda: monedaCompra, // Mantener compatibilidad
      monedas,
      costosLogisticos,
      capitalLiberacion
    };

    console.log('✅ Info general parseada:', {
      cliente: result.cliente,
      valor: result.valor,
      ruta: result.ruta,
      monedas: result.monedas,
      costosLogisticos: result.costosLogisticos,
      capitalLiberacion: result.capitalLiberacion
    });
    return result;

  } catch (error) {
    console.error('❌ Error parseando info general:', error);
    return {
      cliente: 'Error en parsing',
      valor: 0,
      ruta: 'Error en parsing',
      moneda: 'USD',
      monedas: {
        compra: 'USD'
      },
      costosLogisticos: {},
      capitalLiberacion: undefined
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
 * 3. Función para extraer cliente y NIT de la columna "1. Docu. Cliente"
 * Extrae el nombre del cliente y su NIT desde la documentación usando el formato estándar
 */
export function extractClientFromDocColumn(docuClienteValue: string): { cliente: string; nit: string } {
  console.log('👤 Extrayendo cliente de:', docuClienteValue?.substring(0, 50) + '...');
  
  try {
    if (!docuClienteValue || typeof docuClienteValue !== 'string') {
      return { cliente: '', nit: '' };
    }

    const cleanText = docuClienteValue.trim();
    console.log('🔍 Extrayendo información de:', cleanText);

    // Extraer CLIENTE usando patrón específico
    const clienteMatch = cleanText.match(/[-\s]*CLIENTE:\s*(.+?)(?=\n|$)/i);
    const cliente = clienteMatch ? clienteMatch[1].trim() : '';

    // Extraer NIT usando patrón específico  
    const nitMatch = cleanText.match(/[-\s]*NIT:\s*([0-9]+)/i);
    const nit = nitMatch ? nitMatch[1].trim() : '';

    console.log('✅ Cliente extraído:', cliente);
    console.log('✅ NIT extraído:', nit);

    return { cliente, nit };

  } catch (error) {
    console.error('❌ Error extrayendo cliente y NIT:', error);
    return { cliente: '', nit: '' };
  }
}

/**
 * 3b. Función para extraer NIT/RFC de la columna "1. Docu. Cliente" (legacy)
 * Extrae el NIT/RFC del cliente desde la documentación
 */
export function extractClientNit(docuClienteValue: string): string {
  console.log('🆔 Extrayendo NIT/RFC del cliente:', docuClienteValue?.substring(0, 50) + '...');
  
  try {
    if (!docuClienteValue || typeof docuClienteValue !== 'string') {
      return '';
    }

    const cleanText = docuClienteValue.trim();
    console.log('🔍 Extrayendo información de:', cleanText);

    // Extraer NIT usando patrón específico para el formato estándar
    // Formato esperado: "- CLIENTE: [Nombre]\n-NIT:[NIT]"
    const nitMatch = cleanText.match(/[-\s]*NIT:\s*([0-9]+)/i);
    const nit = nitMatch ? nitMatch[1].trim() : '';

    if (nit) {
      console.log('✅ NIT extraído:', nit);
      return nit;
    }

    console.log('⚠️ No se encontró NIT en formato estándar');
    return '';

  } catch (error) {
    console.error('❌ Error extrayendo NIT:', error);
    return '';
  }
}

/**
 * 4. Función principal de mapeo CSV a OperationCard para Dashboard
 * Combina todas las funciones anteriores para transformar una fila CSV completa
 */
export function mapCSVToOperationCard(csvRow: CSVRowData): OperationCard {
  console.log('🎯 Mapeando fila CSV a OperationCard para dashboard...');
  
  try {
    // Extraer campos específicos del CSV
    const infoGeneral = csvRow['5.Info Gnal + Info Compra Int'] || '';
    const proceso = csvRow['Proceso'] || '';
    const equipoComercial = csvRow['15. Equipo Comercial'] || '';
    const docuCliente = csvRow['1. Docu. Cliente'] || '';
    const operationId = csvRow['ID'] || csvRow['id'] || generateOperationId();

    // Parsear información general usando funciones existentes
    const parsedInfo = parseInfoGeneralColumn(infoGeneral);
    
    // NUEVO: Extraer cliente y NIT de la columna "1. Docu. Cliente"
    const clienteNitInfo = extractClientFromDocColumn(docuCliente);
    
    // Usar cliente de "1. Docu. Cliente" como prioridad, con fallback a Info General
    const clientName = clienteNitInfo.cliente || parsedInfo.cliente || 'Cliente no especificado';
    const clientNit = clienteNitInfo.nit;
    
    // Calcular progreso
    const progressInfo = calculateProgressFromProceso(proceso);

    // Determinar estado basado en el progreso
    let status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
    if (progressInfo.isCompleted) {
      status = 'completed';
    } else if (progressInfo.currentStep > 0) {
      status = 'in-progress';
    } else if (progressInfo.currentStep === 0 && proceso.toLowerCase().includes('hold')) {
      status = 'on-hold';
    } else {
      status = 'draft';
    }

    // Formatear valor total con moneda
    const formattedValue = parsedInfo.valor > 0 
      ? `$${parsedInfo.valor.toLocaleString()} ${parsedInfo.moneda}`
      : 'Valor no disponible';

    // Construir objeto OperationCard
    const operationCard: OperationCard = {
      id: operationId,
      clientName: clientName,
      clientNit: clientNit,
      totalValue: formattedValue,
      route: parsedInfo.ruta || 'Ruta no especificada',
      assignedPerson: equipoComercial || 'No asignado',
      progress: Math.round(progressInfo.percentage),
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('✅ OperationCard creada:', {
      id: operationCard.id,
      clientName: operationCard.clientName,
      clientNit: operationCard.clientNit,
      progress: operationCard.progress,
      status: operationCard.status
    });

    return operationCard;

  } catch (error) {
    console.error('❌ Error mapeando CSV a OperationCard:', error);
    
    // Retornar OperationCard por defecto en caso de error
    return {
      id: generateOperationId(),
      clientName: 'Error en mapeo',
      clientNit: 'Error NIT',
      totalValue: '$0 USD',
      route: 'Error en mapeo',
      assignedPerson: 'No asignado',
      progress: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * 5. Función principal de mapeo CSV a Dashboard (LEGACY - mantener para compatibilidad)
 * Combina todas las funciones anteriores para transformar una fila CSV completa
 */
export function mapCSVToDashboard(csvRow: CSVRowData): Operation {
  console.log('🔄 Mapeando fila CSV completa a Operation...');
  
  try {
    // Extraer campos específicos del CSV
    const infoGeneral = csvRow['5.Info Gnal + Info Compra Int'] || '';
    const proceso = csvRow['Proceso'] || '';
    const equipoComercial = csvRow['15. Equipo Comercial'] || '';
    const operationId = csvRow['ID'] || csvRow['id'] || generateOperationId();

    // Parsear información general
    const parsedInfo = parseInfoGeneralColumn(infoGeneral);
    
    // Calcular progreso
    const progressInfo = calculateProgressFromProceso(proceso);

    // Determinar estado de la aplicación basado en el progreso
    let status: ApplicationStatus;
    if (progressInfo.isCompleted) {
      status = 'completed';
    } else if (progressInfo.currentStep > 0) {
      status = 'under_review';
    } else {
      status = 'draft';
    }

    // Mapear a ProcessStage
    const stageMapping: { [key: number]: ProcessStage } = {
      0: 'application',
      1: 'application',
      2: 'documentation',
      3: 'review',
      4: 'approval', 
      5: 'funding',
      6: 'completion'
    };

    const currentStage = stageMapping[progressInfo.currentStep] || 'application';

    // Construir objeto Operation
    const operation: Operation = {
      id: operationId,
      applicantId: generateApplicantId(parsedInfo.cliente),
      status,
      currentStage,
      progress: progressInfo.percentage,
      
      // Información básica
      cliente: parsedInfo.cliente,
      valorTotal: parsedInfo.valor,
      moneda: parsedInfo.moneda as any, // Cast a Currency enum
      ruta: parsedInfo.ruta,
      
      // Asignación
      assignedTo: equipoComercial || 'No asignado',
      
      // Información de proceso
      currentStep: progressInfo.currentStep,
      stepName: progressInfo.stepName,
      
      // Fechas (generar fechas estimadas)
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedCompletion: generateEstimatedCompletion(progressInfo.currentStep),
      
      // Información adicional del CSV
      csvData: {
        proceso,
        infoGeneral: infoGeneral.substring(0, 500), // Truncar para almacenamiento
        equipoComercial
      }
    };

    console.log('✅ Operación mapeada:', {
      id: operation.id,
      cliente: operation.cliente,
      progress: operation.progress,
      status: operation.status
    });

    return operation;

  } catch (error) {
    console.error('❌ Error mapeando CSV a Operation:', error);
    
    // Retornar operación por defecto en caso de error
    return {
      id: generateOperationId(),
      applicantId: 'error-user',
      status: 'draft',
      currentStage: 'application',
      progress: 0,
      cliente: 'Error en mapeo',
      valorTotal: 0,
      moneda: 'USD' as any,
      ruta: 'Error en mapeo',
      assignedTo: 'No asignado',
      currentStep: 0,
      stepName: 'Error',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedCompletion: new Date(),
      csvData: {
        proceso: '',
        infoGeneral: '',
        equipoComercial: ''
      }
    };
  }
}

/**
 * 6. Función para mapear múltiples filas CSV a OperationCard
 * Procesa un array completo de datos CSV para el dashboard
 */
export function mapMultipleCSVToCards(csvRows: CSVRowData[]): OperationCard[] {
  console.log(`🎯 Mapeando ${csvRows.length} filas CSV a OperationCards...`);
  
  return csvRows.map((row, index) => {
    try {
      return mapCSVToOperationCard(row);
    } catch (error) {
      console.error(`❌ Error en fila ${index}:`, error);
      return mapCSVToOperationCard({}); // OperationCard por defecto
    }
  });
}

/**
 * 7. Función para mapear múltiples filas CSV (LEGACY)
 * Procesa un array completo de datos CSV
 */
export function mapMultipleCSVRows(csvRows: CSVRowData[]): Operation[] {
  console.log(`🔄 Mapeando ${csvRows.length} filas CSV...`);
  
  return csvRows.map((row, index) => {
    try {
      return mapCSVToDashboard(row);
    } catch (error) {
      console.error(`❌ Error en fila ${index}:`, error);
      return mapCSVToDashboard({}); // Operación por defecto
    }
  });
}

// Funciones auxiliares
function generateOperationId(): string {
  return `OP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function generateApplicantId(clientName: string): string {
  const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleanName}-${Date.now()}`;
}

function generateEstimatedCompletion(currentStep: number): Date {
  const today = new Date();
  const daysToAdd = Math.max(30 - (currentStep * 5), 7); // Menos días si está más avanzado
  today.setDate(today.getDate() + daysToAdd);
  return today;
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

  // Verificar campos críticos
  const criticalFields = [
    '5.Info Gnal + Info Compra Int',
    'Proceso',
    '15. Equipo Comercial'
  ];

  criticalFields.forEach(field => {
    if (!csvRow[field] || csvRow[field].trim() === '') {
      if (field === '5.Info Gnal + Info Compra Int') {
        errors.push(`Campo crítico faltante: ${field}`);
      } else {
        warnings.push(`Campo recomendado faltante: ${field}`);
      }
    }
  });

  // Validar que la info general tenga contenido mínimo
  const infoGeneral = csvRow['5.Info Gnal + Info Compra Int'] || '';
  if (infoGeneral.length < 50) {
    warnings.push('Información general muy breve, puede afectar el parsing');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 6. Función para obtener estadísticas de mapeo
 * Analiza el resultado del mapeo para generar reportes
 */
export function getMappingStatistics(operations: Operation[]): {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  byStage: Record<ProcessStage, number>;
  averageProgress: number;
  withErrors: number;
} {
  const stats = {
    total: operations.length,
    byStatus: {} as Record<ApplicationStatus, number>,
    byStage: {} as Record<ProcessStage, number>,
    averageProgress: 0,
    withErrors: 0
  };

  // Inicializar contadores
  const allStatuses: ApplicationStatus[] = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'funded', 'completed'];
  const allStages: ProcessStage[] = ['application', 'documentation', 'review', 'approval', 'funding', 'monitoring', 'completion'];
  
  allStatuses.forEach(status => stats.byStatus[status] = 0);
  allStages.forEach(stage => stats.byStage[stage] = 0);

  // Procesar operaciones
  let totalProgress = 0;
  operations.forEach(op => {
    stats.byStatus[op.status]++;
    stats.byStage[op.currentStage]++;
    totalProgress += op.progress;
    
    if (op.cliente.includes('Error') || op.ruta.includes('Error')) {
      stats.withErrors++;
    }
  });

  stats.averageProgress = operations.length > 0 ? totalProgress / operations.length : 0;

  return stats;
}