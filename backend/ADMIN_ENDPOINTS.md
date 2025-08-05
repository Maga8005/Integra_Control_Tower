# 🔧 Admin Endpoints - Acceso a Datos Raw del CSV

Endpoints administrativos para acceder a los datos procesados del CSV y facilitar el desarrollo frontend.

## 🚀 Endpoints Disponibles

### 1. **GET /api/admin/csv-data**
Retorna todos los datos raw del CSV procesado con metadata completa.

#### Parámetros Query Opcionales:
- `?pretty=true` - Formatea JSON para mejor legibilidad
- `?admin=admin-dev-key` - Key de acceso admin (desarrollo)

#### Ejemplo Request:
```bash
# Datos básicos
curl http://localhost:3001/api/admin/csv-data

# Con formato pretty
curl http://localhost:3001/api/admin/csv-data?pretty=true

# Con key de admin
curl -H "x-admin-key: admin-dev-key" http://localhost:3001/api/admin/csv-data
```

#### Ejemplo Response:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "5. Info Gnal + Info Compra Int": "CLIENTE: ABC IMPORT...",
        "15. Equipo Comercial": "Juan Pérez",
        "Proceso": "1. Aprobación de Cotización",
        "_rowNumber": 1,
        "_rawLine": "\"ABC IMPORT\",\"Juan Pérez\"..."
      }
    ],
    "metadata": {
      "totalRecords": 19,
      "fields": ["5. Info Gnal + Info Compra Int", "15. Equipo Comercial", ...],
      "lastUpdated": "2025-01-29T10:00:00Z",
      "fileInfo": {
        "exists": true,
        "size": 45632,
        "sizeFormatted": "44.56 KB",
        "lastModified": "2025-01-29T09:30:00Z"
      },
      "processingStats": {
        "cacheStatus": "cached",
        "cacheAge": 120
      }
    }
  },
  "message": "Datos CSV obtenidos exitosamente",
  "timestamp": "2025-01-29T10:15:00Z"
}
```

---

### 2. **GET /api/admin/csv-fields**
Retorna únicamente los nombres de las columnas disponibles en el CSV.

#### Ejemplo Request:
```bash
curl http://localhost:3001/api/admin/csv-fields
```

#### Ejemplo Response:
```json
{
  "success": true,
  "data": {
    "fields": [
      "5. Info Gnal + Info Compra Int",
      "15. Equipo Comercial",
      "Proceso",
      "1. ESTADO Firma Cotización",
      "4. ESTADO pago Cuota Operacional",
      "9. ESTADO Proforma / Factura final",
      "10. ESTADO Giro Proveedor"
    ],
    "metadata": {
      "totalFields": 7,
      "requiredFields": [
        "5. Info Gnal + Info Compra Int",
        "Proceso",
        "1. ESTADO Firma Cotización",
        "4. ESTADO pago Cuota Operacional",
        "9. ESTADO Proforma / Factura final",
        "10. ESTADO Giro Proveedor"
      ],
      "optionalFields": [
        "15. Equipo Comercial",
        "Completado",
        "Persona asignada",
        "Fecha de vencimiento"
      ],
      "lastUpdated": "2025-01-29T10:00:00Z"
    }
  },
  "message": "Campos CSV obtenidos exitosamente",
  "timestamp": "2025-01-29T10:15:00Z"
}
```

---

### 3. **POST /api/admin/csv-refresh**
Fuerza la recarga del cache del CSV para obtener datos actualizados.

#### Ejemplo Request:
```bash
curl -X POST http://localhost:3001/api/admin/csv-refresh \
  -H "x-admin-key: admin-dev-key"
```

#### Ejemplo Response:
```json
{
  "success": true,
  "data": {
    "totalRecords": 19,
    "totalFields": 7,
    "refreshedAt": "2025-01-29T10:20:00Z"
  },
  "message": "Cache CSV refrescado exitosamente",
  "timestamp": "2025-01-29T10:20:00Z"
}
```

---

## 🔐 Autenticación (Desarrollo)

### Métodos de Acceso:

1. **Header de Admin:**
   ```bash
   -H "x-admin-key: admin-dev-key"
   ```

2. **Query Parameter:**
   ```bash
   ?admin=admin-dev-key
   ```

3. **Acceso Local (Desarrollo):**
   - Automático desde `localhost` cuando `NODE_ENV=development`

### Respuesta de Acceso Denegado:
```json
{
  "success": false,
  "message": "Acceso denegado - Se requieren permisos de administrador",
  "errors": ["Se requiere autenticación de administrador"],
  "timestamp": "2025-01-29T10:15:00Z"
}
```

---

## 📊 Características Especiales

### 1. **Cache Inteligente**
- ⏱️ Cache de 10 minutos para datos CSV
- 🔄 Recarga automática al expirar
- 📈 Estadísticas de cache en metadata

### 2. **Metadata Enriquecida**
- 📁 Información del archivo (tamaño, fechas)
- 🔢 Contadores de registros y campos
- ⚙️ Estado del procesamiento y cache

### 3. **Formato Pretty**
- 🎨 JSON indentado con `?pretty=true`
- 📖 Ideal para debugging y desarrollo
- 🚀 Formato compacto por defecto

### 4. **Datos Raw Completos**
- 📋 Todos los campos del CSV original
- 🔍 Metadata adicional (`_rowNumber`, `_rawLine`)
- 🎯 Sin procesamiento ni transformaciones

---

## 🛠️ Uso para Desarrollo Frontend

### React/TypeScript Example:
```typescript
interface CSVDataResponse {
  data: {
    data: any[];
    metadata: {
      totalRecords: number;
      fields: string[];
      lastUpdated: string;
      fileInfo: any;
      processingStats: any;
    };
  };
}

const fetchCSVData = async (): Promise<CSVDataResponse> => {
  const response = await fetch('/api/admin/csv-data?pretty=true', {
    headers: {
      'x-admin-key': 'admin-dev-key'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSV data');
  }
  
  return response.json();
};

// Usar en componente
const { data: csvData } = await fetchCSVData();
console.log('Total records:', csvData.metadata.totalRecords);
console.log('Available fields:', csvData.metadata.fields);
csvData.data.forEach(row => {
  console.log('Row:', row._rowNumber, row);
});
```

### Campos Útiles para el Frontend:
- **`_rowNumber`**: Número de fila para debugging
- **`_rawLine`**: Línea CSV original para auditoría
- **`metadata.fields`**: Lista de columnas disponibles
- **`metadata.totalRecords`**: Total de registros
- **`fileInfo.lastModified`**: Última actualización del archivo

---

## 🔧 Testing

### Test básico de endpoints:
```bash
# 1. Verificar campos disponibles
curl http://localhost:3001/api/admin/csv-fields

# 2. Obtener datos completos
curl http://localhost:3001/api/admin/csv-data?pretty=true

# 3. Refrescar cache
curl -X POST http://localhost:3001/api/admin/csv-refresh

# 4. Verificar endpoints desde el navegador
open http://localhost:3001/api/admin/csv-fields
```

### Verificar en el navegador:
- `http://localhost:3001/api/admin/csv-fields`
- `http://localhost:3001/api/admin/csv-data?pretty=true`

---

## ⚠️ Notas Importantes

1. **Desarrollo Only**: Estos endpoints están diseñados para desarrollo y testing
2. **Sin Autenticación Real**: La autenticación actual es placeholder
3. **Cache**: Los datos se cachean por 10 minutos para rendimiento
4. **Datos Raw**: Los datos no están procesados ni transformados
5. **Localhost**: Acceso automático desde localhost en desarrollo

## 🚀 Próximos Pasos

1. **Autenticación Real**: Implementar JWT y roles
2. **Paginación**: Para CSVs grandes
3. **Filtros**: Filtrar por campos específicos
4. **Export**: Descargar datos en diferentes formatos
5. **Logs**: Auditoría de accesos admin