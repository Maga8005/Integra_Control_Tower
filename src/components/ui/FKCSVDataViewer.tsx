import { useState, useMemo, useRef } from 'react';
import { 
  RefreshCw, 
  Database, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  FileText
} from 'lucide-react';
import { useCSVData } from '../../hooks/useCSVData';
import { cn } from '../../utils/cn';
import FKBackendStatus from './FKBackendStatus';
import { environment, supabaseHeaders } from '../../config/environment';

// Función utilitaria para extraer RFC/NIT del texto
interface ParsedRFC {
  rfc: string;
  type: 'RFC' | 'NIT' | 'UNKNOWN';
}

function extractRFCFromText(docuClienteValue: string): ParsedRFC {
  if (!docuClienteValue || typeof docuClienteValue !== 'string') {
    return { rfc: '', type: 'UNKNOWN' };
  }

  const cleanText = docuClienteValue.trim();
  
  // Patrón 1: NIT Colombia (numérico)
  const nitColombiaMatch = cleanText.match(/[-\s]*NIT:\s*([0-9]+)/i);
  if (nitColombiaMatch) {
    return { rfc: nitColombiaMatch[1].trim(), type: 'NIT' };
  }
  
  // Patrón 2: RFC México (alfanumérico) - formato: AAAA######AAA
  const rfcMexicoMatch = cleanText.match(/[-\s]*(?:RFC|NIT):\s*([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/i);
  if (rfcMexicoMatch) {
    return { rfc: rfcMexicoMatch[1].trim().toUpperCase(), type: 'RFC' };
  }
  
  // Patrón 3: Buscar RFC sin etiqueta (formato libre)
  const rfcPatternMatch = cleanText.match(/([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/i);
  if (rfcPatternMatch) {
    return { rfc: rfcPatternMatch[1].trim().toUpperCase(), type: 'RFC' };
  }
  
  // Patrón 4: NIT genérico (números con guiones)
  const nitGenericoMatch = cleanText.match(/[-\s]*(?:RFC|NIT):\s*([0-9\-]+)/i);
  if (nitGenericoMatch) {
    return { rfc: nitGenericoMatch[1].trim(), type: 'NIT' };
  }

  return { rfc: '', type: 'UNKNOWN' };
}

interface FKCSVDataViewerProps {
  className?: string;
}

export default function FKCSVDataViewer({ className }: FKCSVDataViewerProps) {
  // Country selection state with persistence (sincronizado globalmente)
  const [selectedCountry, setSelectedCountry] = useState<'CO' | 'MX'>(() => {
    // Recuperar país seleccionado del sessionStorage (clave compartida)
    const savedCountry = sessionStorage.getItem('integra_selectedCountry');
    return (savedCountry === 'MX' || savedCountry === 'CO') ? savedCountry : 'CO';
  });
  
  // Persistir país seleccionado cuando cambie (sincronizado globalmente)
  const handleCountryChange = (newCountry: 'CO' | 'MX') => {
    setSelectedCountry(newCountry);
    sessionStorage.setItem('integra_selectedCountry', newCountry);
    console.log(`🌍 CSV Viewer - País cambiado a: ${newCountry}`);
  };
  
  const {
    csvData,
    csvFields,
    csvMetadata,
    processedOperations,
    operationsMetadata,
    isLoadingCSV,
    isLoadingOperations,
    csvError,
    operationsError,
    refreshCSVData,
    refreshOperations,
    hasData,
    lastUpdated
  } = useCSVData(selectedCountry);

  // Local state
  const [activeTab, setActiveTab] = useState<'csv' | 'processed'>('csv');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  
  // CSV Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Test Parser with sample data
  const testParserWithSampleData = async () => {
    setIsUploading(true);
    setUploadError(null);
    setUploadStatus('Probando parser con datos de ejemplo...');

    try {
      // Sample CSV data exactly like our tests
      const sampleCSV = `"1. Numero de operación","2. Cliente","5. Info Gnal + Info Compra Int","10. ESTADO Giro Proveedor","Docu. Cliente"
"OP-TEST-001","EMPRESA PRUEBA","CLIENTE: MALE
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

VALOR SOLICITADO: 30000
NÚMERO DE GIRO: 1er Giro a Proveedor
PORCENTAJE DE GIRO: 30% del total

VALOR SOLICITADO: 70000
NÚMERO DE GIRO: 2do Giro a Proveedor  
PORCENTAJE DE GIRO: 70% del total

Liberación 1
Capital: 100000 USD
Fecha: 2025-07-25","Listo","12345678-9"`;

      console.log('🧪 Probando parser con datos de ejemplo...');

      const response = await fetch(`${environment.apiBaseUrl}/upload-csv-with-parser`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          csvContent: sampleCSV,
          country: selectedCountry,
          fileName: 'test_parser_sample.csv'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const operations = result.data?.operations || [];
        const girosTotales = operations.reduce((sum: number, op: any) => sum + (op.giros_count || 0), 0);
        const liberacionesTotales = operations.reduce((sum: number, op: any) => sum + (op.liberaciones_count || 0), 0);
        const creadas = result.data?.created || 0;
        const actualizadas = result.data?.updated || 0;
        const eliminadas = result.data?.deleted || 0;
        const action = operations[0]?.action;
        
        setUploadStatus(
          `🧪 Test del parser completado exitosamente:\n` +
          `✅ ${result.data.processed} operaciones procesadas\n` +
          `${action === 'updated' ? '🔄 Operación actualizada' : '➕ Nueva operación creada'}\n` +
          `${eliminadas > 0 ? `🗑️ ${eliminadas} operaciones eliminadas\n` : ''}` +
          `👤 Cliente detectado: ${operations[0]?.cliente || 'N/A'}\n` +
          `💰 Valor: $${operations[0]?.valor_total?.toLocaleString() || 'N/A'} ${operations[0]?.moneda || ''}\n` +
          `💸 ${girosTotales} giros extraídos\n` +
          `📈 ${liberacionesTotales} liberaciones detectadas\n` +
          `🎯 Sync inteligente funcionando perfectamente!`
        );
        
        // Refresh data to show new test record
        setTimeout(() => {
          refreshCSVData();
          refreshOperations();
        }, 1000);
        
        setTimeout(() => {
          setUploadStatus(null);
        }, 10000);
      } else {
        throw new Error(result.message || 'Error en el test del parser');
      }

    } catch (error) {
      console.error('❌ Error testing parser:', error);
      setUploadError(error instanceof Error ? error.message : 'Error desconocido probando parser');
    } finally {
      setIsUploading(false);
    }
  };

  // CSV Upload function
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setUploadError('Por favor selecciona un archivo CSV válido');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadStatus('Subiendo archivo...');

    try {
      // Read file content as text
      const csvContent = await file.text();
      
      console.log(`📤 Subiendo archivo CSV para ${selectedCountry}:`, file.name);
      console.log(`📄 Contenido CSV: ${csvContent.length} caracteres`);

      // Upload to Supabase Edge Function with new parser as JSON
      const response = await fetch(`${environment.apiBaseUrl}/upload-csv-with-parser`, {
        method: 'POST',
        headers: {
          ...supabaseHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          csvContent: csvContent,
          country: selectedCountry,
          fileName: file.name
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Detailed success message with parser results
        const operations = result.data?.operations || [];
        const girosTotales = operations.reduce((sum: number, op: any) => sum + (op.giros_count || 0), 0);
        const liberacionesTotales = operations.reduce((sum: number, op: any) => sum + (op.liberaciones_count || 0), 0);
        const creadas = result.data?.created || 0;
        const actualizadas = result.data?.updated || 0;
        const eliminadas = result.data?.deleted || 0;
        const mockEliminadas = result.data?.deletedMock || 0;
        const obsoletasEliminadas = result.data?.deletedObsolete || 0;
        
        let eliminadasMsg = '';
        if (eliminadas > 0) {
          if (mockEliminadas > 0 && obsoletasEliminadas > 0) {
            eliminadasMsg = `🗑️ ${eliminadas} eliminadas (${mockEliminadas} mock + ${obsoletasEliminadas} obsoletas)\n`;
          } else if (mockEliminadas > 0) {
            eliminadasMsg = `🧹 ${mockEliminadas} operaciones mock limpiadas\n`;
          } else {
            eliminadasMsg = `🗑️ ${eliminadas} operaciones eliminadas (ya no en CSV)\n`;
          }
        }
        
        setUploadStatus(
          `✅ Sync completo con TU parser original:\n` +
          `📊 ${result.data.processed} operaciones procesadas de ${result.data.total} registros\n` +
          `➕ ${creadas} operaciones nuevas creadas\n` +
          `🔄 ${actualizadas} operaciones existentes actualizadas\n` +
          eliminadasMsg +
          `💸 ${girosTotales} giros extraídos\n` +
          `📈 ${liberacionesTotales} liberaciones detectadas\n` +
          `🔧 Fuente: ${result.metadata?.source || 'N/A'}`
        );
        
        // Refresh data after successful upload
        setTimeout(() => {
          refreshCSVData();
          refreshOperations();
        }, 1000);
        
        // Clear status after 8 seconds (más tiempo para leer los detalles)
        setTimeout(() => {
          setUploadStatus(null);
        }, 8000);
      } else {
        throw new Error(result.message || 'Error procesando el archivo');
      }

    } catch (error) {
      console.error('❌ Error uploading CSV:', error);
      setUploadError(error instanceof Error ? error.message : 'Error desconocido subiendo archivo');
    } finally {
      setIsUploading(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  // Filter data based on search
  const filteredCSVData = useMemo(() => {
    if (!csvData || !searchFilter) return csvData;
    
    return csvData.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchFilter.toLowerCase())
      )
    );
  }, [csvData, searchFilter]);

  // Get displayed fields
  const displayedFields = useMemo(() => {
    if (!csvFields) return [];
    if (selectedFields.size === 0) return csvFields;
    return csvFields.filter(field => selectedFields.has(field));
  }, [csvFields, selectedFields]);

  // Stats for CSV data
  const csvStats = useMemo(() => {
    if (!csvData || !csvFields) return null;
    
    const nonEmptyRows = csvData.filter(row => 
      Object.values(row).some(value => String(value).trim() !== '')
    );
    
    const fieldStats = csvFields.map(field => {
      const nonEmptyValues = csvData.filter(row => 
        String(row[field] || '').trim() !== ''
      ).length;
      
      return {
        field,
        fillRate: ((nonEmptyValues / csvData.length) * 100).toFixed(1),
        nonEmptyValues
      };
    });

    return {
      totalRows: csvData.length,
      nonEmptyRows: nonEmptyRows.length,
      totalFields: csvFields.length,
      fieldStats: fieldStats.sort((a, b) => parseFloat(b.fillRate) - parseFloat(a.fillRate))
    };
  }, [csvData, csvFields]);

  if (!hasData && (isLoadingCSV || isLoadingOperations)) {
    return (
      <div className={cn("p-6", className)}>
        <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
            <span className="text-lg font-medium text-gray-900">
              Cargando datos del CSV...
            </span>
          </div>
          <p className="text-center text-gray-600 mt-2">
            Conectando con el backend y procesando archivo CSV
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-primary-700 flex items-center gap-3">
            <Database className="h-8 w-8" />
            Visor de Datos CSV
          </h1>
          <p className="text-gray-600 mt-1">
            Explora los datos raw del CSV y las operaciones procesadas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Country Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">País:</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                const newCountry = e.target.value as 'CO' | 'MX';
                handleCountryChange(newCountry);
              }}
              disabled={isLoadingCSV}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="CO">🇨🇴 Colombia</option>
              <option value="MX">🇲🇽 México</option>
            </select>
          </div>
          
          <button
            onClick={refreshCSVData}
            disabled={isLoadingCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingCSV && "animate-spin")} />
            Refrescar CSV
          </button>
          
          <button
            onClick={refreshOperations}
            disabled={isLoadingOperations}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingOperations && "animate-spin")} />
            Refrescar Operaciones
          </button>
          
          {/* Test Parser Button */}
          <button
            onClick={testParserWithSampleData}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="h-4 w-4" />
            Probar Parser
          </button>

          {/* CSV Upload Button - DESHABILITADO: Usar Admin Dashboard */}
          <div className="relative opacity-50">
            <button
              disabled={true}
              className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              Subir desde Admin Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Backend Status */}
      <FKBackendStatus showDetails={true} className="mb-6" />

      {/* Upload Status Messages */}
      {uploadStatus && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 font-medium">
            <CheckCircle className="h-5 w-5" />
            {uploadStatus}
          </div>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 font-medium">
            <AlertCircle className="h-5 w-5" />
            Error de Upload: {uploadError}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(csvError || operationsError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
            <AlertCircle className="h-5 w-5" />
            Errores de Conexión
          </div>
          {csvError && (
            <p className="text-red-700 text-sm mb-1">CSV: {csvError}</p>
          )}
          {operationsError && (
            <p className="text-red-700 text-sm">Operaciones: {operationsError}</p>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registros CSV</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">
                {csvData?.length || 0}
              </p>
            </div>
            <Database className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Campos CSV</p>
              <p className="text-3xl font-bold text-secondary-600 mt-1">
                {csvFields?.length || 0}
              </p>
            </div>
            <Filter className="h-8 w-8 text-secondary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Operaciones Procesadas</p>
              <p className="text-3xl font-bold text-success-600 mt-1">
                {processedOperations?.length || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Última Actualización</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {lastUpdated ? new Date(lastUpdated).toLocaleString('es-ES') : 'N/A'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('csv')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'csv'
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Datos Raw CSV ({csvData?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('processed')}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'processed'
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              Operaciones Procesadas ({processedOperations?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'csv' && (
            <CSVDataTab
              csvData={filteredCSVData}
              csvFields={csvFields}
              csvStats={csvStats}
              expandedRows={expandedRows}
              searchFilter={searchFilter}
              selectedFields={selectedFields}
              displayedFields={displayedFields}
              onToggleRowExpansion={toggleRowExpansion}
              onSearchChange={setSearchFilter}
              onFieldToggle={(field) => {
                const newSelected = new Set(selectedFields);
                if (newSelected.has(field)) {
                  newSelected.delete(field);
                } else {
                  newSelected.add(field);
                }
                setSelectedFields(newSelected);
              }}
            />
          )}

          {activeTab === 'processed' && (
            <ProcessedDataTab
              processedOperations={processedOperations}
              operationsMetadata={operationsMetadata}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// CSV Data Tab Component
interface CSVDataTabProps {
  csvData: any[] | null;
  csvFields: string[] | null;
  csvStats: any;
  expandedRows: Set<number>;
  searchFilter: string;
  selectedFields: Set<string>;
  displayedFields: string[];
  onToggleRowExpansion: (rowIndex: number) => void;
  onSearchChange: (search: string) => void;
  onFieldToggle: (field: string) => void;
}

function CSVDataTab({
  csvData,
  csvFields,
  csvStats,
  expandedRows,
  searchFilter,
  selectedFields,
  displayedFields,
  onToggleRowExpansion,
  onSearchChange,
  onFieldToggle
}: CSVDataTabProps) {
  if (!csvData || !csvFields) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos CSV disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en los datos..."
              value={searchFilter}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Campos mostrados:</span>
          <span className="text-sm font-medium text-primary-600">
            {selectedFields.size === 0 ? 'Todos' : selectedFields.size}
          </span>
        </div>
      </div>

      {/* Field Statistics */}
      {csvStats && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Estadísticas de Campos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {csvStats.fieldStats.slice(0, 6).map((stat: any) => (
              <div
                key={stat.field}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedFields.has(stat.field) || selectedFields.size === 0
                    ? "bg-primary-50 border-primary-200"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
                onClick={() => onFieldToggle(stat.field)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {stat.field}
                  </span>
                  <span className="text-xs text-gray-500">
                    {stat.fillRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-primary-600 h-1 rounded-full"
                    style={{ width: `${stat.fillRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {/* Columna especial para NIT parseado */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="text-primary-600 font-semibold">
                    NIT Parseado
                  </span>
                </div>
              </th>
              {displayedFields.map((field) => (
                <th
                  key={field}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-32" title={field}>
                      {field}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {csvData.slice(0, 20).map((row, index) => {
              // Extraer RFC/NIT de la columna "1.Docu. Cliente"
              const docuCliente = row['1.Docu. Cliente'] || row['1. Docu. Cliente'] || '';
              const parsedRFC = extractRFCFromText(docuCliente);
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => onToggleRowExpansion(index)}
                      className="flex items-center gap-1 hover:text-primary-600"
                    >
                      {expandedRows.has(index) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {row._rowNumber || index + 1}
                    </button>
                  </td>
                  
                  {/* Celda especial para NIT parseado */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {parsedRFC.rfc ? (
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-mono text-xs px-2 py-1 rounded",
                            parsedRFC.type === 'RFC' 
                              ? "bg-green-100 text-green-800" 
                              : "bg-blue-100 text-blue-800"
                          )}>
                            {parsedRFC.rfc}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {parsedRFC.type === 'RFC' ? 'México' : 'Colombia'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin NIT</span>
                      )}
                    </div>
                  </td>
                  
                  {displayedFields.map((field) => (
                    <td key={field} className="px-4 py-3 text-sm text-gray-900">
                      <div className="max-w-48 truncate" title={String(row[field] || '')}>
                        {String(row[field] || '-')}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {csvData.length > 20 && (
        <div className="text-center py-4">
          <p className="text-gray-500">
            Mostrando las primeras 20 filas de {csvData.length} registros totales
          </p>
        </div>
      )}
    </div>
  );
}

// Processed Data Tab Component
interface ProcessedDataTabProps {
  processedOperations: any[] | null;
  operationsMetadata: any;
}

function ProcessedDataTab({ processedOperations, operationsMetadata }: ProcessedDataTabProps) {
  if (!processedOperations) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay operaciones procesadas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operations Summary */}
      <div className="bg-primary-50 rounded-lg p-4">
        <h4 className="font-medium text-primary-900 mb-2">Resumen de Operaciones</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-primary-700">Total:</p>
            <p className="text-lg font-bold text-primary-900">
              {processedOperations.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Completadas:</p>
            <p className="text-lg font-bold text-primary-900">
              {processedOperations.filter(op => op.progresoGeneral === 100).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">En Proceso:</p>
            <p className="text-lg font-bold text-primary-900">
              {processedOperations.filter(op => op.progresoGeneral > 0 && op.progresoGeneral < 100).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-primary-700">Pendientes:</p>
            <p className="text-lg font-bold text-primary-900">
              {processedOperations.filter(op => op.progresoGeneral === 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Operations List */}
      <div className="space-y-4">
        {processedOperations.slice(0, 10).map((operation, index) => (
          <div key={operation.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900">
                {operation.clienteCompleto || `Operación ${index + 1}`}
              </h5>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  ${operation.valorTotal?.toLocaleString()} {operation.moneda}
                </span>
                <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                  {operation.progresoGeneral}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Persona asignada:</span>
                <p className="font-medium">{operation.personaAsignada || 'No asignada'}</p>
              </div>
              <div>
                <span className="text-gray-600">País exportador:</span>
                <p className="font-medium">{operation.paisExportador || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600">Fases completadas:</span>
                <p className="font-medium">
                  {operation.preciseProgress?.completedPhases || 0}/5
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${operation.progresoGeneral || 0}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {processedOperations.length > 10 && (
        <div className="text-center py-4">
          <p className="text-gray-500">
            Mostrando las primeras 10 operaciones de {processedOperations.length} totales
          </p>
        </div>
      )}
    </div>
  );
}