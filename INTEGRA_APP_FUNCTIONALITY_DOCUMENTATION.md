# Integra Control Tower - Documentación Funcional de la Aplicación

## Resumen Ejecutivo

**Integra Control Tower** es una aplicación web MVP desarrollada para gestionar operaciones de financiamiento de importación. La aplicación permite a los usuarios cargar archivos CSV que contienen datos logísticos y financieros de clientes importadores, procesa estos datos utilizando técnicas avanzadas de extracción con regex, y los presenta de manera estructurada y organizada en el frontend. Toda la información procesada se almacena en una base de datos Supabase para su consulta y análisis posterior.

## Arquitectura General

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Vite como build tool
- TailwindCSS para estilos
- React Router para navegación
- React Hook Form para formularios
- Lucide React para iconos

**Backend:**
- Node.js + Express con TypeScript
- Supabase como base de datos (PostgreSQL)
- CSV Parse para procesamiento de archivos
- Multer para carga de archivos
- Funciones Edge de Supabase para serverless computing

**Base de Datos:**
- Supabase (PostgreSQL)
- Almacenamiento de operaciones, clientes, documentos y estados de proceso

## Funcionalidad Principal: Procesamiento de Archivos CSV

### 1. Carga de Archivos CSV

**Ubicación:** `backend/src/services/CSVProcessor.ts`

La aplicación acepta archivos CSV que contienen información detallada sobre operaciones de importación. El sistema es capaz de procesar archivos CSV complejos con las siguientes características:

- **Soporte multi-país:** Detecta automáticamente si los datos corresponden a Colombia (NIT) o México (RFC)
- **Columnas principales requeridas:**
  - `Nombre`: Identificador único de la operación
  - `Completado`: Estado de finalización
  - `Persona asignada`: Responsable de la operación
  - `Proceso`: Descripción del estado actual del proceso
  - `5. Info Gnal + Info Compra Int`: Información general y comercial (campo crítico)
  - `1. Docu. Cliente` o `1.Docu. Cliente`: Documentación del cliente

### 2. Técnicas de Extracción con Regex

**Ubicación:** `backend/src/utils/nitUtils.ts`, `src/utils/csvMappers.ts`

#### A. Extracción de Información de Cliente y NIT/RFC

La aplicación utiliza múltiples patrones regex para extraer información crítica:

**Para NIT Colombia (numérico):**
```typescript
const nitColombiaMatch = cleanText.match(/[-\s]*NIT:\s*([0-9]+)/i);
```

**Para RFC México (alfanumérico - formato AAAA######AAA):**
```typescript
const rfcMexicoMatch = cleanText.match(/[-\s]*(?:RFC|NIT):\s*([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/i);
```

**Para valores de operación:**
```typescript
const valorMatch = cleanText.match(/[-\s]*VALOR OPERACI[ÓO]N:\s*([0-9]+(?:\.[0-9]+)?)/i);
```

#### B. Extracción de Información General

**Ubicación:** `src/utils/csvMappers.ts` - función `parseInfoGeneralColumn`

Extrae información compleja de la columna "Info General" usando múltiples patrones:

- **Cliente:** `/CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i`
- **Valor total:** `/VALOR TOTAL DE COMPRA:\s*(\d+(?:[.,]\d+)?)/i`
- **Países:** Patrones separados para importador y exportador
- **Moneda:** `/MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i`

#### C. Cálculo de Progreso Basado en Procesos

La aplicación mapea descripciones textuales de procesos a porcentajes específicos:

```typescript
const processSteps = [
  {
    step: 1,
    keywords: ['aprobación de cotización', 'cotización', 'aprobacion'],
    percentage: 16.67,
    name: 'Aprobación de Cotización'
  },
  {
    step: 2,
    keywords: ['docu legal gnal', 'cuota op', 'nego int'],
    percentage: 33.33,
    name: 'Docu Legal Gnal / Cuota Op / Nego Int'
  },
  // ... hasta 6 pasos con 100%
];
```

### 3. Procesamiento Robusto de CSV

**Ubicación:** `backend/src/services/CSVProcessor.ts` - método `parseCSVContentRobust`

El sistema maneja archivos CSV complejos con:

- **Campos multilínea:** Contenido que abarca múltiples líneas dentro de comillas
- **Comillas escapadas:** Manejo de comillas dobles dentro de campos
- **Separadores complejos:** Comas dentro de campos quoted
- **Validación de integridad:** Verificación de número de columnas por fila

```typescript
private static parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Comilla escapada
        current += '"';
        i += 2;
      } else if (inQuotes && (nextChar === ',' || nextChar === undefined)) {
        // Final de campo quoted
        inQuotes = false;
        i++;
      }
      // ... lógica adicional
    }
    // ... resto de la lógica de parsing
  }
}
```

## Integración con Supabase

### Configuración de Base de Datos

**Ubicación:** `src/config/environment.ts`

La aplicación se conecta a Supabase usando Edge Functions:

```typescript
const SUPABASE_FUNCTIONS_URL = 'https://gfdaygaujovmyuqtehrv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabaseHeaders = {
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
};
```

### Estructura de Datos

Las operaciones procesadas se almacenan con la siguiente estructura:

```typescript
interface OperationDetail {
  // Identificadores
  id: string;
  numeroOperacion: string;
  
  // Información del cliente
  clienteCompleto: string;
  clienteNit: string;
  tipoEmpresa: string;
  
  // Información financiera
  valorTotal: number;
  valorOperacion?: number;
  moneda: Currency;
  progresoGeneral: number;
  
  // Información geográfica
  paisExportador: string;
  paisImportador: string;
  rutaComercial: string;
  
  // Estados y timeline
  estados: any;
  timeline: any[];
  preciseProgress: any;
  validation: any;
}
```

### Operaciones CRUD

**Consulta de operaciones:**
```typescript
const response = await fetch(`${environment.apiBaseUrl}/admin-dashboard?country=${countryCode}`, {
  headers: supabaseHeaders
});
```

## Frontend: Presentación y Visualización

### 1. Dashboard Principal

**Ubicación:** `src/components/ui/FKDashboard.tsx`

El dashboard presenta estadísticas en tiempo real:

- **Métricas agregadas:** Total de operaciones, operaciones activas, completadas, valor del portafolio
- **Filtros interactivos:** Por estado (draft, in-progress, completed, on-hold) y por fase del proceso
- **Tarjetas de operación:** Información resumida con progreso visual

### 2. Visualizador de Datos CSV

**Ubicación:** `src/components/ui/FKCSVDataViewer.tsx`

Componente especializado para inspeccionar datos CSV:

- **Vista dual:** Datos raw del CSV y operaciones procesadas
- **Extracción de NIT en tiempo real:** Usa regex para mostrar NIT/RFC parseado
- **Estadísticas de campos:** Análisis de completitud de datos
- **Búsqueda y filtros:** Búsqueda de texto libre y filtros por campos

```typescript
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
  
  // Patrón 2: RFC México (alfanumérico)
  const rfcMexicoMatch = cleanText.match(/[-\s]*(?:RFC|NIT):\s*([A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3})/i);
  if (rfcMexicoMatch) {
    return { rfc: rfcMexicoMatch[1].trim().toUpperCase(), type: 'RFC' };
  }
}
```

### 3. Gestión de Estado Global

**Ubicación:** `src/hooks/useCSVData.tsx`

Hook personalizado que maneja:

- **Carga de datos:** Desde Supabase con reintentos automáticos
- **Cache local:** Optimización de rendimiento
- **Sincronización:** Entre datos CSV raw y operaciones procesadas
- **Estados de loading:** Feedback visual para el usuario

## Características Avanzadas

### 1. Detección Automática de País

El sistema detecta automáticamente si los datos pertenecen a Colombia o México basándose en:

- **Formato de identificadores:** NIT (numérico) para Colombia, RFC (alfanumérico) para México
- **Estructura de datos:** Patrones específicos por país
- **Configuración adaptativa:** `COUNTRY_CONFIGS` para personalización por país

### 2. Validación y Reportes

**Ubicación:** `backend/src/services/CSVProcessor.ts`

- **Validación de datos:** Verifica integridad y coherencia
- **Reportes consolidados:** Estadísticas de procesamiento y validación
- **Alertas automáticas:** Detección de vencimientos y problemas

### 3. Sistema de Timeline

Cada operación incluye un timeline de 5 fases:

1. **Aprobación de Cotización** (16.67%)
2. **Documentación Legal / Cuota Operacional** (33.33%)
3. **Primer Giro a Proveedor** (50%)
4. **Segundo Giro a Proveedor** (66.67%)
5. **Financiamiento Logístico** (83.33%)
6. **Liberación de Mercancía** (100%)

### 4. Autenticación por NIT/RFC

Los clientes pueden acceder al sistema ingresando su NIT/RFC:

```typescript
export function findOperationsByNit(csvData: CSVRowData[], searchNit: string): {
  operations: OperationCard[];
  clientInfo: ClientInfo | null;
} {
  const normalizedSearchNit = normalizeNit(searchNit);
  const matchingRows: CSVRowData[] = [];

  for (const row of csvData) {
    const docuCliente = row['1. Docu. Cliente'] || '';
    const extractedNits = extractNitFromDocColumn(docuCliente);
    
    const exactMatch = extractedNits.some(nit => nit === normalizedSearchNit);
    if (exactMatch) {
      matchingRows.push(row);
    }
  }
}
```

## Flujo de Datos Completo

### 1. Carga Inicial
1. Usuario carga archivo CSV
2. Backend procesa usando `CSVProcessor.processCSVFile()`
3. Datos se almacenan en Supabase
4. Frontend recibe confirmación

### 2. Procesamiento
1. `parseCSVContentRobust()` parsea el CSV manejando campos complejos
2. `extractClienteNitFromDocColumn()` extrae información del cliente usando regex
3. `calculateProgressFromProceso()` mapea descripciones a porcentajes
4. `generateTimeline()` crea timeline de 5 fases
5. Datos se validan con `validateCompleteTimeline()`

### 3. Presentación
1. `useCSVData` hook carga datos desde Supabase
2. `FKCSVDataViewer` muestra datos raw y procesados
3. `FKDashboard` presenta estadísticas y operaciones
4. Filtros y búsquedas en tiempo real

### 4. Consulta por Cliente
1. Cliente ingresa NIT/RFC en login
2. Sistema normaliza identificador
3. `findOperationsByNit()` busca coincidencias exactas
4. Dashboard filtrado muestra solo operaciones del cliente

## Casos de Uso Principales

### 1. Administrador del Sistema
- Carga archivos CSV masivos
- Monitorea todas las operaciones
- Genera reportes consolidados
- Gestiona usuarios y permisos

### 2. Cliente Importador
- Accede con su NIT/RFC
- Visualiza sus operaciones específicas
- Monitorea progreso en tiempo real
- Consulta documentos requeridos

### 3. Equipo Comercial
- Gestiona operaciones asignadas
- Actualiza estados de proceso
- Coordina con clientes
- Genera reportes por cartera

## Métricas y Analíticas

La aplicación proporciona métricas en tiempo real:

- **Operaciones totales:** Contador global
- **Tasa de completación:** Porcentaje de operaciones finalizadas
- **Valor del portafolio:** Suma total de valores en operación
- **Distribución por estado:** Análisis de pipeline
- **Eficiencia temporal:** Comparación de tiempos estimados vs reales
- **Calidad de datos:** Porcentaje de campos completados correctamente

## Seguridad y Validación

### Validación de Datos
- **Sanitización de entrada:** Limpieza de datos CSV
- **Validación de formato:** Verificación de NIT/RFC
- **Integridad referencial:** Validación de relaciones entre entidades

### Seguridad
- **Autenticación JWT:** Tokens seguros para sesiones
- **Autorización por roles:** Control de acceso basado en roles
- **Conexión SSL:** Comunicación encriptada con Supabase
- **Rate limiting:** Protección contra abuso de APIs

## Escalabilidad y Rendimiento

### Optimizaciones Implementadas
- **Procesamiento asíncrono:** Carga de archivos en background
- **Paginación:** Manejo de grandes volúmenes de datos
- **Cache inteligente:** Optimización de consultas frecuentes
- **Lazy loading:** Carga de componentes bajo demanda

### Preparación para Escala
- **Arquitectura serverless:** Supabase Edge Functions
- **Base de datos optimizada:** Índices en campos críticos
- **CDN ready:** Archivos estáticos optimizados
- **Monitoreo:** Logs estructurados para debugging

---

## Conclusión

**Integra Control Tower** representa una solución integral para la gestión de operaciones de financiamiento de importación. Su fortaleza principal radica en la capacidad de procesar archivos CSV complejos usando técnicas avanzadas de regex para extraer datos estructurados, combinada con una interfaz moderna y intuitiva que presenta la información de manera organizada y actionable.

La arquitectura basada en React + Supabase proporciona una base sólida para escalabilidad futura, mientras que las funcionalidades de filtrado, búsqueda y visualización permiten tanto a administradores como a clientes finales acceder eficientemente a la información que necesitan para tomar decisiones informadas sobre sus operaciones de importación.