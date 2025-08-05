# 🎯 Guía para Ver Datos del CSV en el Frontend

Esta guía te explica cómo ver los datos del archivo CSV procesados en el frontend de React.

## 🚀 Pasos para Ver los Datos

### 1. **Iniciar el Backend**
```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias (si no lo haces hecho)
npm install

# Iniciar el servidor backend
npm run dev
```

**✅ Verificar:** El backend debe estar corriendo en `http://localhost:3001`

### 2. **Verificar que el Archivo CSV Existe**
```bash
# Verificar que el archivo existe en:
backend/src/data/integra_updated_v4.csv
```

**⚠️ Importante:** Si no tienes el archivo CSV, colócalo en esa ubicación exacta.

### 3. **Iniciar el Frontend**
```bash
# En una nueva terminal, navegar al directorio raíz
cd .. # (si estás en backend)

# Instalar dependencias del frontend (si no lo has hecho)
npm install

# Iniciar el servidor frontend
npm run dev
```

**✅ Verificar:** El frontend debe estar corriendo en `http://localhost:5173`

### 4. **Acceder al Visor de Datos**

#### **Opción A: Desde el Dashboard**
1. Ve a `http://localhost:5173`
2. Inicia sesión (cualquier email/contraseña funciona en desarrollo)
3. En el dashboard, haz clic en el botón **"Datos CSV"** en la parte superior derecha
4. Se abrirá el visor completo de datos

#### **Opción B: Acceso Directo**
1. Ve directamente a `http://localhost:5173/csv-data`
2. Si no estás autenticado, te redirigirá al login primero

---

## 📊 Qué Puedes Ver en el Visor

### **Pestaña "Datos Raw CSV"**
- ✅ **Todos los datos originales** del archivo CSV sin procesar
- ✅ **Metadata completa**: total de registros, campos, fechas de actualización
- ✅ **Estadísticas de campos**: porcentaje de llenado de cada columna
- ✅ **Búsqueda**: filtra datos por cualquier contenido
- ✅ **Selección de campos**: muestra solo las columnas que necesites
- ✅ **Datos de debugging**: `_rowNumber` y `_rawLine` para auditoría

### **Pestaña "Operaciones Procesadas"**
- ✅ **Operaciones con timeline de 5 fases** calculado
- ✅ **Progreso preciso** con validaciones
- ✅ **Fechas calculadas** y vencimientos
- ✅ **Alertas automáticas** para vencimientos próximos
- ✅ **Datos procesados** listos para el dashboard

---

## 🔧 Funcionalidades del Visor

### **Controles Principales:**
- 🔄 **Refrescar CSV**: Recarga datos raw del archivo
- 🔄 **Refrescar Operaciones**: Reprocesa todas las operaciones
- 🔍 **Búsqueda en tiempo real**: Filtra cualquier contenido
- 🎯 **Filtros de campos**: Selecciona qué columnas mostrar
- 📊 **Estadísticas automáticas**: Calidad de datos por campo

### **Información Mostrada:**
```json
{
  "Registros CSV": "19",
  "Campos CSV": "7-15 (dependiendo del archivo)",
  "Operaciones Procesadas": "19",
  "Última Actualización": "En tiempo real"
}
```

### **Datos por Registro:**
- **Información del cliente** extraída del campo crítico
- **Valores financieros** parseados automáticamente
- **Estados de proceso** mapeados desde columnas CSV
- **Timeline de 5 fases** con progreso calculado
- **Fechas de vencimiento** calculadas si no existen
- **Validaciones** y warnings de coherencia

---

## 🎯 Casos de Uso Típicos

### **Para Desarrollo:**
1. **Verificar que los datos se están leyendo correctamente**
   - Ve a la pestaña "Datos Raw CSV"
   - Verifica que todas las 19 filas estén presentes
   - Confirma que las columnas críticas tienen datos

2. **Ver cómo se procesan las operaciones**
   - Ve a la pestaña "Operaciones Procesadas"
   - Observa el progreso calculado para cada operación
   - Verifica que el timeline de 5 fases sea coherente

3. **Debugging de problemas**
   - Usa la búsqueda para encontrar registros específicos
   - Compara datos raw vs procesados
   - Revisa las estadísticas de calidad de datos

### **Para Testing:**
1. **Prueba con diferentes archivos CSV**
   - Reemplaza el archivo en `backend/src/data/`
   - Haz clic en "Refrescar CSV"
   - Verifica que los nuevos datos se procesen correctamente

2. **Validación de reglas de negocio**
   - Verifica que los estados se mapeen correctamente
   - Confirma que las fechas de vencimiento sean realistas
   - Revisa que las alertas se generen apropiadamente

---

## 🚨 Solución de Problemas

### **Error: "No hay datos CSV disponibles"**
```bash
# Verificar que el backend esté corriendo
curl http://localhost:3001/health

# Verificar que el archivo CSV existe
ls -la backend/src/data/integra_updated_v4.csv

# Verificar los endpoints admin
curl http://localhost:3001/api/admin/csv-fields
```

### **Error: "Error de conexión"**
```bash
# Verificar CORS y backend
curl -H "x-admin-key: admin-dev-key" http://localhost:3001/api/admin/csv-data

# Verificar que el frontend puede conectar
# Abrir Developer Tools > Network tab
# Verificar requests a localhost:3001
```

### **Error: "Datos vacíos o malformados"**
1. Verifica que el archivo CSV tenga cabeceras
2. Confirma que está en formato UTF-8
3. Revisa que las columnas críticas existan:
   - `5. Info Gnal + Info Compra Int`
   - `Proceso`
   - Estados de proceso (1, 4, 9, 10)

### **Performance Lenta**
1. El cache se actualiza cada 10 minutos automáticamente
2. Usa "Refrescar CSV" solo cuando sea necesario
3. Los datos se muestran paginados (20 filas CSV, 10 operaciones)

---

## 📝 Estructura de Datos Visible

### **Campos Raw CSV Típicos:**
```
- "5. Info Gnal + Info Compra Int" (Campo crítico con toda la info)
- "15. Equipo Comercial" (Persona asignada)
- "Proceso" (Estado del proceso general)
- "1. ESTADO Firma Cotización"
- "4. ESTADO pago Cuota Operacional"
- "9. ESTADO Proforma / Factura final"
- "10. ESTADO Giro Proveedor"
```

### **Operaciones Procesadas Incluyen:**
```typescript
{
  id: string,
  clienteCompleto: string,
  valorTotal: number,
  moneda: string,
  progresoGeneral: number, // 0-100%
  personaAsignada?: string,
  preciseProgress: {
    totalProgress: number,
    completedPhases: number,
    phaseDetails: [...] // 5 fases detalladas
  },
  timeline: [...], // 5 eventos del timeline
  validation: {...}, // Validaciones y warnings
  dateRanges: [...] // Fechas calculadas realistas
}
```

---

## 🎉 ¡Listo para Usar!

Una vez que tengas el backend y frontend corriendo:

1. **Ve a** `http://localhost:5173`
2. **Inicia sesión** con cualquier credencial
3. **Haz clic en "Datos CSV"** en el dashboard
4. **Explora los datos** en ambas pestañas
5. **Usa las herramientas** de búsqueda y filtros

¡Los datos de tu archivo CSV ahora están completamente integrados en el frontend y listos para ser refinados según tus necesidades!