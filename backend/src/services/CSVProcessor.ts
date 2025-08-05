/**
 * Procesador CSV para leer archivo real de operaciones Integra
 * Maneja las 19 filas reales con mapeo exacto de estados
 * Integra Control Tower MVP
 */

import fs from 'fs';
import path from 'path';
import { OperationDetail, Currency, EstadoProceso } from '../types/Operation';
import { parseOperationInfo } from './OperationInfoParser';
import { mapEstados } from './StateMapper';
import { generateTimeline } from './TimelineGenerator';
import { calculatePreciseProgress } from './ProgressCalculator';
import { validateCompleteTimeline } from './PhaseValidator';
import { generateRealisticDates, calculateMissingVencimientos, isVencimientoProximo, isVencimientoVencido } from '../utils/dateUtils';
import { extractClienteNitFromDocColumn } from '../utils/nitUtils';

export interface CSVRow {
  [key: string]: string;
}

export interface ProcessingResult {
  success: boolean;
  data?: OperationDetail[];
  rawData?: CSVRow[]; // NUEVO: Datos CSV en crudo
  errors: string[];
  warnings: string[];
  totalProcessed: number;
  validOperations: number;
  validationReport?: string;
  dateReport?: string;
}

export class CSVProcessor {
  private static readonly CSV_PATH = path.join(__dirname, '../../src/data/integra_updated_v4.csv');
  
  private static readonly REQUIRED_COLUMNS = [
    'Nombre',
    'Completado',
    'Persona asignada',
    'Proceso',
    '1.Docu. Cliente',
    '5. Info Gnal + Info Compra Int'
  ];
  

  /**
   * Procesa el archivo CSV completo y convierte a OperationDetail[]
   */
  public static async processCSVFile(): Promise<ProcessingResult> {
    console.log('📄 Iniciando procesamiento de archivo CSV...');
    
    try {
      // Verificar que el archivo existe
      if (!fs.existsSync(this.CSV_PATH)) {
        throw new Error(`Archivo CSV no encontrado en: ${this.CSV_PATH}`);
      }

      // Leer archivo CSV
      const csvContent = fs.readFileSync(this.CSV_PATH, 'utf-8');
      const rows = this.parseCSVContentRobust(csvContent);
      
      console.log(`📊 Archivo CSV leído: ${rows.length} filas encontradas`);

      // Procesar cada fila
      const operations: OperationDetail[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      let validOperations = 0;
      let validationReport = '';
      let dateReport = '';

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          if (!row) continue;
          const operation = this.processCSVRow(row, i + 1);
          if (operation) {
            operations.push(operation);
            validOperations++;
            console.log(`✅ Fila ${i + 1} procesada: ${operation.clienteCompleto}`);
          }
        } catch (error) {
          const errorMsg = `Error en fila ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`🎯 Procesamiento completo: ${validOperations}/${rows.length} operaciones válidas`);

      // Generar reportes de validación y fechas si hay operaciones válidas
      if (operations.length > 0) {
        console.log('📋 Generando reportes de validación y fechas...');
        
        // Generar reporte consolidado de validación
        const validationSummary = this.generateConsolidatedValidationReport(operations);
        validationReport = validationSummary.report;
        warnings.push(...validationSummary.warnings);
        
        // Generar reporte de fechas
        dateReport = this.generateConsolidatedDateReport(operations);
      }

      return {
        success: errors.length === 0,
        data: operations,
        rawData: rows, // NUEVO: Incluir datos CSV crudos
        errors,
        warnings,
        totalProcessed: rows.length,
        validOperations,
        validationReport,
        dateReport
      };

    } catch (error) {
      console.error('❌ Error crítico procesando CSV:', error);
      return {
        success: false,
        rawData: [], // NUEVO: Array vacío en caso de error
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        warnings: [],
        totalProcessed: 0,
        validOperations: 0
      };
    }
  }

  /**
   * Procesa una fila individual del CSV
   */
  public static processCSVRow(row: CSVRow, rowNumber: number): OperationDetail | null {
    console.log(`🔄 Procesando fila ${rowNumber}...`);

    // Validar columnas requeridas
    const missingColumns = this.validateRequiredColumns(row);
    if (missingColumns.length > 0) {
      throw new Error(`Columnas faltantes: ${missingColumns.join(', ')}`);
    }

    // 1. Parsear el campo "5. Info Gnal + Info Compra Int" (ahora opcional)
    const infoGralText = row['5. Info Gnal + Info Compra Int'] || '';
    let parsedInfo;
    
    if (infoGralText.trim()) {
      parsedInfo = parseOperationInfo(infoGralText);
    } else {
      console.warn(`⚠️ Fila ${rowNumber}: Campo "5. Info Gnal + Info Compra Int" está vacío, usando valores por defecto`);
      // Crear objeto con valores por defecto cuando no hay info general
      parsedInfo = {
        cliente: '',
        paisImportador: 'Colombia', // Asumir Colombia por defecto
        paisExportador: 'No especificado',
        valorTotalCompra: 0,
        monedaPago: 'USD' as any, // Cast to Currency enum
        terminosPago: '',
        giros: [], // Array vacío para evitar errores de reduce
        liberaciones: [], // Array vacío para evitar errores de reduce
        incotermCompra: '',
        incotermVenta: '',
        datosBancarios: {
          beneficiario: 'No especificado',
          banco: '',
          numeroCuenta: '',
          swift: '',
          direccion: ''
        }
      };
    }
    
    // NUEVO: Extraer cliente y NIT de la columna "1.Docu. Cliente"
    const docuClienteText = row['1.Docu. Cliente'] || '';
    const clienteNitInfo = extractClienteNitFromDocColumn(docuClienteText);
    
    // Usar cliente extraído de "1.Docu. Cliente" como prioridad, con fallbacks
    const clientName = clienteNitInfo.cliente || parsedInfo.cliente || row['Nombre'] || 'Cliente no especificado';
    const clientNit = clienteNitInfo.nit || '';
    const valorOperacion = clienteNitInfo.valorOperacion; // NUEVO: Valor de la operación
    
    if (!clientName || clientName === 'Cliente no especificado' || clientName.trim() === '') {
      console.warn(`⚠️ Fila ${rowNumber}: Información crítica faltante (cliente). Docu Cliente: "${docuClienteText}"`);
      return null;
    }
    
    console.log(`👤 Cliente identificado: ${clientName} (NIT: ${clientNit || 'N/A'})`);
    console.log(`💰 Valor operación: ${valorOperacion || 'N/A'}`);
    
    
    // Si no se puede obtener el valor de la información parseada, intentar obtenerlo de otros campos
    const valorTotal = parsedInfo.valorTotalCompra || this.extractValueFromText(infoGralText) || 0;

    // 2. Calcular progreso preciso usando la nueva lógica
    const preciseProgress = calculatePreciseProgress(row, parsedInfo);
    
    // 3. Generar timeline de 5 fases usando los datos CSV
    const timeline = generateTimeline(row, parsedInfo);
    
    // 4. Mapear estados individuales de los campos CSV
    const estados = mapEstados(row);
    
    // 5. Validar coherencia del timeline
    const validationContext = {
      csvRow: row,
      parsedInfo,
      phaseDetails: preciseProgress.phaseDetails,
      overallProgress: preciseProgress
    };
    const validation = validateCompleteTimeline(validationContext);
    
    // 6. Generar fechas realistas
    const dateRanges = generateRealisticDates(preciseProgress.phaseDetails);
    
    // 7. Calcular fechas de vencimiento faltantes
    const { girosConVencimiento, liberacionesConVencimiento } = calculateMissingVencimientos(
      parsedInfo.giros,
      parsedInfo.liberaciones,
      parsedInfo.terminosPago
    );
    
    // 8. Usar progreso preciso en lugar del cálculo anterior
    const progresoGeneral = preciseProgress.totalProgress;

    // 9. Generar ID único para la operación
    const operationId = this.generateOperationId(clientName, rowNumber);
    
    // 10. Determinar moneda (por defecto USD si no se puede determinar)
    const moneda = parsedInfo.monedaPago || Currency.USD;

    // 11. Extraer persona asignada (campo opcional)
    const personaAsignada = row['15. Equipo Comercial'] || 
                           row['Persona asignada'] || 
                           'Sin asignar';

    // 12. Construir OperationDetail completa con nueva lógica de precisión
    const operation: OperationDetail = {
      // Identificadores
      id: operationId,
      numeroOperacion: this.generateOperationNumber(rowNumber),
      
      // Información básica (usar clientName que incluye fallback a campo "Nombre")
      clienteCompleto: clientName,
      clienteNit: clientNit, // NUEVO: NIT extraído de "1.Docu. Cliente"
      tipoEmpresa: this.inferCompanyType(clientName),
      proveedorBeneficiario: parsedInfo.datosBancarios.beneficiario || 'No especificado',
      paisProveedor: parsedInfo.paisExportador || 'No especificado',
      valorTotal: valorTotal, // Valor de compra de mercancía
      valorOperacion: valorOperacion, // NUEVO: Valor total de la operación
      moneda: moneda,
      progresoGeneral: progresoGeneral,
      personaAsignada: personaAsignada, // Campo opcional
      
      // Geografía y logística
      paisExportador: parsedInfo.paisExportador || 'No especificado',
      paisImportador: parsedInfo.paisImportador || 'No especificado',
      rutaComercial: this.generateTradeRoute(parsedInfo.paisExportador, parsedInfo.paisImportador),
      incoterms: this.formatIncoterms(parsedInfo.incotermCompra, parsedInfo.incotermVenta),
      
      // Información financiera
      montoTotal: valorTotal,
      montosLiberados: this.calculateReleasedAmounts(parsedInfo.liberaciones),
      montosPendientes: 0, // Se calculará después
      
      // Extracostos (estimados)
      extracostos: this.estimateExtraCosts(parsedInfo.valorTotalCompra),
      
      // Estados mapeados desde CSV
      estados: estados,
      
      // Giros y liberaciones con fechas de vencimiento calculadas
      giros: girosConVencimiento,
      liberaciones: liberacionesConVencimiento,
      
      // Documentos (placeholder)
      documentos: [],
      
      // Timeline generado
      timeline: timeline,
      
      // Fechas
      fechaCreacion: this.estimateCreationDate(row).toISOString(),
      ultimaActualizacion: new Date().toISOString(),
      
      // Datos bancarios
      datosBancarios: parsedInfo.datosBancarios,
      
      // Información adicional
      observaciones: this.extractObservations(row),
      alertas: this.generateAlerts(estados, progresoGeneral, girosConVencimiento, liberacionesConVencimiento),
      
      // Nuevos campos de precisión
      preciseProgress: preciseProgress,
      validation: validation,
      dateRanges: dateRanges,
      validationWarnings: validation.warnings.length,
      validationErrors: validation.errors.length
    };

    // Calcular montos pendientes
    operation.montosPendientes = operation.montoTotal - operation.montosLiberados;

    // Log de resumen con nueva información de precisión
    console.log(`✅ Operación creada: ${operation.clienteCompleto} - $${operation.valorTotal.toLocaleString()}`);
    console.log(`   📊 Progreso preciso: ${preciseProgress.totalProgress}% (${preciseProgress.completedPhases}/5 fases completas)`);
    console.log(`   ⚠️ Validación: ${validation.warnings.length} warnings, ${validation.errors.length} errors`);
    
    // Mostrar warnings críticos
    const criticalWarnings = validation.warnings.filter(w => w.severity === 'high');
    if (criticalWarnings.length > 0) {
      console.warn(`   🚨 Warnings críticos: ${criticalWarnings.length}`);
      criticalWarnings.forEach(w => {
        console.warn(`      [Fase ${w.phase}] ${w.message}`);
      });
    }
    
    return operation;
  }

  /**
   * Parsea el contenido CSV crudo
   */
  private static parseCSVContent(content: string): CSVRow[] {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Archivo CSV debe tener al menos cabecera y una fila de datos');
    }

    // Extraer cabeceras
    const headers = this.parseCSVLine(lines[0]);
    console.log(`📋 Cabeceras CSV encontradas: ${headers.length} columnas`);

    // Parsear filas de datos
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        console.warn(`⚠️ Fila ${i}: Número de columnas inconsistente (${values.length} vs ${headers.length})`);
      }

      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parsea una línea CSV manejando comillas, comas y multilinea robusto
   */
  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Comilla escapada
          current += '"';
          i += 2;
        } else {
          // Cambiar estado de comillas
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Separador de campo
        values.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Agregar último valor
    values.push(current.trim());
    
    return values;
  }

  /**
   * Parsea contenido CSV con manejo robusto de multilinea
   */
  private static parseCSVContentRobust(content: string): CSVRow[] {
    const lines = content.split('\n');
    const rows: CSVRow[] = [];
    
    if (lines.length < 2) {
      throw new Error('Archivo CSV debe tener al menos cabecera y una fila de datos');
    }

    // Extraer cabeceras desde la primera línea
    const headers = this.parseCSVLine(lines[0]);
    console.log(`📋 Cabeceras CSV encontradas: ${headers.length} columnas`);

    // Procesar líneas manejando multilinea
    let currentRowText = '';
    let inMultilineField = false;
    let quoteCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Contar comillas en la línea actual
      const lineQuotes = (line.match(/"/g) || []).length;
      quoteCount += lineQuotes;
      
      // Agregar línea al texto actual
      if (currentRowText) {
        currentRowText += '\n' + line;
      } else {
        currentRowText = line;
      }
      
      // Si tenemos un número par de comillas, la fila está completa
      if (quoteCount % 2 === 0) {
        try {
          const values = this.parseCSVLine(currentRowText);
          
          // Solo procesar si tenemos al menos algunas columnas
          if (values.length >= Math.floor(headers.length * 0.5)) {
            const row: CSVRow = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            rows.push(row);
          } else {
            console.warn(`⚠️ Fila ${i} descartada: muy pocas columnas (${values.length} vs ${headers.length})`);
          }
        } catch (error) {
          console.error(`❌ Error parseando fila ${i}: ${error}`);
        }
        
        // Reset para la siguiente fila
        currentRowText = '';
        quoteCount = 0;
        inMultilineField = false;
      } else {
        inMultilineField = true;
      }
    }
    
    // Si queda contenido sin procesar, intentar parsearlo
    if (currentRowText.trim()) {
      try {
        const values = this.parseCSVLine(currentRowText);
        if (values.length >= Math.floor(headers.length * 0.5)) {
          const row: CSVRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
      } catch (error) {
        console.warn(`⚠️ Última fila incompleta descartada: ${error}`);
      }
    }

    return rows;
  }

  /**
   * Valida que las columnas requeridas estén presentes
   */
  private static validateRequiredColumns(row: CSVRow): string[] {
    return this.REQUIRED_COLUMNS.filter(column => !(column in row));
  }

  /**
   * Genera ID único para la operación
   */
  private static generateOperationId(cliente: string, rowNumber: number): string {
    const cleanClient = cliente.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${cleanClient}-${rowNumber.toString().padStart(2, '0')}-${timestamp}`;
  }

  /**
   * Genera número de operación
   */
  private static generateOperationNumber(rowNumber: number): string {
    const year = new Date().getFullYear();
    return `OP-${year}-${rowNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Infiere tipo de empresa basado en el nombre
   */
  private static inferCompanyType(clientName: string): string {
    const name = clientName.toUpperCase();
    
    if (name.includes('IMPORT')) return 'IMPORTADORA';
    if (name.includes('EXPORT')) return 'EXPORTADORA';
    if (name.includes('COMERCIALIZ')) return 'COMERCIALIZADORA';
    if (name.includes('DISTRIBU')) return 'DISTRIBUIDORA';
    if (name.includes('SA') || name.includes('SAS') || name.includes('LTDA')) return 'EMPRESA';
    
    return 'COMERCIAL';
  }

  /**
   * Genera ruta comercial
   */
  private static generateTradeRoute(origen?: string, destino?: string): string {
    if (!origen || !destino) return 'Ruta no especificada';
    return `${origen} → ${destino}`;
  }

  /**
   * Calcula montos liberados
   */
  private static calculateReleasedAmounts(liberaciones: any[]): number {
    return liberaciones.reduce((total, lib) => total + (lib.capital || 0), 0);
  }

  /**
   * Estima costos extra
   */
  private static estimateExtraCosts(valorTotal: number) {
    const comisionBancaria = Math.floor(valorTotal * 0.02);
    const gastosLogisticos = Math.floor(valorTotal * 0.03);
    const seguroCarga = Math.floor(valorTotal * 0.01);
    
    return {
      comisionBancaria,
      gastosLogisticos,
      seguroCarga,
      totalExtracostos: comisionBancaria + gastosLogisticos + seguroCarga
    };
  }

  /**
   * Estima fecha de creación basada en datos CSV
   */
  private static estimateCreationDate(row: CSVRow): Date {
    // Por ahora usar fecha actual menos días aleatorios
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  /**
   * Extrae observaciones relevantes
   */
  private static extractObservations(row: CSVRow): string {
    const observations: string[] = [];
    
    // Buscar campos que puedan contener observaciones
    Object.keys(row).forEach(key => {
      if (key.toLowerCase().includes('observ') || key.toLowerCase().includes('nota')) {
        const value = row[key];
        if (value && value.trim()) {
          observations.push(value.trim());
        }
      }
    });

    return observations.length > 0 ? observations.join('; ') : 'Sin observaciones específicas';
  }

  /**
   * Genera alertas basadas en estados y fechas de vencimiento
   */
  private static generateAlerts(
    estados: any, 
    progreso: number,
    giros: any[] = [],
    liberaciones: any[] = []
  ) {
    const alertas = [];
    
    if (progreso < 25) {
      alertas.push({
        tipo: 'info' as const,
        mensaje: 'Operación en etapa inicial',
        fecha: new Date().toISOString()
      });
    }
    
    if (estados.cuotaOperacional === EstadoProceso.PENDIENTE) {
      alertas.push({
        tipo: 'warning' as const,
        mensaje: 'Cuota operacional pendiente de pago',
        fecha: new Date().toISOString()
      });
    }

    // Alertas de vencimientos próximos
    giros.forEach((giro, index) => {
      if (isVencimientoProximo(giro.fechaVencimiento)) {
        alertas.push({
          tipo: 'warning' as const,
          mensaje: `Giro ${index + 1} vence próximamente: ${giro.fechaVencimiento}`,
          fecha: new Date().toISOString()
        });
      }
      
      if (isVencimientoVencido(giro.fechaVencimiento)) {
        alertas.push({
          tipo: 'error' as const,
          mensaje: `Giro ${index + 1} VENCIDO: ${giro.fechaVencimiento}`,
          fecha: new Date().toISOString()
        });
      }
    });

    // Alertas de liberaciones próximas
    liberaciones.forEach((liberacion, index) => {
      if (isVencimientoProximo(liberacion.fechaVencimiento)) {
        alertas.push({
          tipo: 'warning' as const,
          mensaje: `Liberación ${index + 1} vence próximamente: ${liberacion.fechaVencimiento}`,
          fecha: new Date().toISOString()
        });
      }
      
      if (isVencimientoVencido(liberacion.fechaVencimiento)) {
        alertas.push({
          tipo: 'error' as const,
          mensaje: `Liberación ${index + 1} VENCIDA: ${liberacion.fechaVencimiento}`,
          fecha: new Date().toISOString()
        });
      }
    });

    return alertas;
  }

  /**
   * Obtiene estadísticas del procesamiento
   */
  public static async getProcessingStats(): Promise<{
    fileExists: boolean;
    fileSize?: number;
    estimatedRows?: number;
    lastModified?: string;
  }> {
    try {
      if (!fs.existsSync(this.CSV_PATH)) {
        return { fileExists: false };
      }

      const stats = fs.statSync(this.CSV_PATH);
      const content = fs.readFileSync(this.CSV_PATH, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      return {
        fileExists: true,
        fileSize: stats.size,
        estimatedRows: Math.max(0, lines.length - 1), // -1 para excluir cabecera
        lastModified: stats.mtime.toISOString()
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas del archivo:', error);
      return { fileExists: false };
    }
  }

  /**
   * Genera reporte consolidado de validación para todas las operaciones
   */
  private static generateConsolidatedValidationReport(operations: OperationDetail[]): {
    report: string;
    warnings: string[];
  } {
    console.log('🔍 Generando reporte consolidado de validación...');
    
    let report = '\n🔍 REPORTE CONSOLIDADO DE VALIDACIÓN\n';
    report += '=====================================\n\n';
    
    const warnings: string[] = [];
    let totalWarnings = 0;
    let totalErrors = 0;
    let validOperations = 0;
    
    operations.forEach((operation, index) => {
      if (operation.validation) {
        const opWarnings = operation.validation.warnings.length;
        const opErrors = operation.validation.errors.length;
        
        totalWarnings += opWarnings;
        totalErrors += opErrors;
        
        if (operation.validation.isValid) {
          validOperations++;
        }
        
        // Agregar warnings críticos al resumen
        const criticalWarnings = operation.validation.warnings.filter(w => w.severity === 'high');
        criticalWarnings.forEach(w => {
          warnings.push(`${operation.clienteCompleto}: [Fase ${w.phase}] ${w.message}`);
        });
        
        // Agregar errores bloqueantes
        const blockingErrors = operation.validation.errors.filter(e => e.blocking);
        blockingErrors.forEach(e => {
          warnings.push(`ERROR - ${operation.clienteCompleto}: [Fase ${e.phase}] ${e.message}`);
        });
      }
    });
    
    report += `📊 RESUMEN GENERAL:\n`;
    report += `   Total operaciones: ${operations.length}\n`;
    report += `   Operaciones válidas: ${validOperations}\n`;
    report += `   Total warnings: ${totalWarnings}\n`;
    report += `   Total errors: ${totalErrors}\n`;
    report += `   Tasa de validez: ${((validOperations / operations.length) * 100).toFixed(1)}%\n\n`;
    
    if (warnings.length > 0) {
      report += `⚠️ ISSUES CRÍTICOS (Top 10):\n`;
      warnings.slice(0, 10).forEach(warning => {
        report += `   • ${warning}\n`;
      });
      
      if (warnings.length > 10) {
        report += `   ... y ${warnings.length - 10} más\n`;
      }
    }
    
    report += '\n=====================================\n';
    
    return { report, warnings: warnings.slice(0, 20) }; // Limitar warnings
  }

  /**
   * Genera reporte consolidado de fechas para todas las operaciones
   */
  private static generateConsolidatedDateReport(operations: OperationDetail[]): string {
    console.log('📅 Generando reporte consolidado de fechas...');
    
    let report = '\n📅 REPORTE CONSOLIDADO DE FECHAS\n';
    report += '==================================\n\n';
    
    const now = new Date();
    let onTimeOperations = 0;
    let delayedOperations = 0;
    let completedOperations = 0;
    
    operations.forEach(operation => {
      if (operation.dateRanges && operation.preciseProgress) {
        const isCompleted = operation.preciseProgress.completedPhases === 5;
        if (isCompleted) completedOperations++;
        
        // Analizar si hay retrasos
        const hasDelays = operation.dateRanges.some(range => {
          if (range.actual && range.estimated) {
            return range.actual > range.estimated;
          }
          return range.estimated < now && !range.actual;
        });
        
        if (hasDelays) {
          delayedOperations++;
        } else {
          onTimeOperations++;
        }
      }
    });
    
    report += `📊 RESUMEN DE TIEMPOS:\n`;
    report += `   Total operaciones: ${operations.length}\n`;
    report += `   Operaciones completas: ${completedOperations}\n`;
    report += `   En tiempo: ${onTimeOperations}\n`;
    report += `   Con retrasos: ${delayedOperations}\n`;
    report += `   Eficiencia temporal: ${((onTimeOperations / operations.length) * 100).toFixed(1)}%\n\n`;
    
    // Top operaciones con retrasos
    const delayedOps = operations.filter(op => {
      if (!op.dateRanges || !op.preciseProgress) return false;
      return op.dateRanges.some(range => {
        if (range.actual && range.estimated) {
          return range.actual > range.estimated;
        }
        return false;
      });
    }).slice(0, 5);
    
    if (delayedOps.length > 0) {
      report += `⏰ OPERACIONES CON RETRASOS (Top 5):\n`;
      delayedOps.forEach(op => {
        report += `   • ${op.clienteCompleto} (${op.preciseProgress?.completedPhases}/5 fases)\n`;
      });
    }
    
    report += '\n==================================\n';
    
    return report;
  }

  /**
   * Extrae valor monetario de un texto cuando el parser principal falla
   */
  private static extractValueFromText(text: string): number {
    // Buscar patrones como "VALOR TOTAL: 98470" o "$98,470"
    const patterns = [
      /VALOR\s+TOTAL[:\s]+(\d+(?:\.\d+)?)/i,
      /\$[\s,]*(\d+(?:,\d{3})*(?:\.\d+)?)/,
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
      /(\d+(?:\.\d+)?)\s*(?:USD|DOLLARS?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }

    return 0;
  }

  /**
   * Formatea Incoterms para mostrar correctamente en el frontend
   */
  private static formatIncoterms(incotermCompra?: string, incotermVenta?: string): string {
    // Si ambos están disponibles, mostrar como "FOB / DAP"
    if (incotermCompra && incotermVenta) {
      return `${incotermCompra} / ${incotermVenta}`;
    }
    
    // Si solo uno está disponible, mostrar solo ese
    if (incotermCompra) {
      return incotermCompra;
    }
    
    if (incotermVenta) {
      return incotermVenta;
    }
    
    // Fallback si ninguno está disponible
    return 'FOB / CIF';
  }
}