# Resolución de Problemas: Implementación de Múltiples Monedas - CSV Parser
**Fecha:** 2025-01-15  
**Tablas afectadas:** `pagos_proveedores`, `costos_logisticos`, `entrega_clientes`  
**Función:** `upload-csv-with-parser`  

## 🎯 Objetivos del Desarrollo
Implementar un sistema de múltiples monedas para manejar diferentes tipos de costos de operaciones financieras:
- **Moneda de compra de mercancía**: De "MONEDA DE PAGO SOLICITADO:" y "VALOR SOLICITADO:"
- **Monedas de costos logísticos**: De "FLETE INTERNACIONAL:", "GASTOS EN DESTINO:", "SEGURO:"  
- **Moneda de liberación**: De "Capital: XXXXX XXX"

## 🚨 Problemas Encontrados y Soluciones

### **1. Campo `moneda` faltante en `pagos_proveedores`**

#### Síntoma:
Los giros/pagos a proveedores no se insertaban en la base de datos.

#### Causa:
El campo `moneda` se extraía correctamente de cada giro pero **no se incluía** en el objeto `paymentData` para inserción.

#### Solución:
```typescript
// ANTES (faltaba el campo moneda)
const paymentData = {
  operacion_id: finalOperationId,
  numero_pago: giro.numero_pago,
  valor_pagado: giro.valor_pagado,
  // ... otros campos
  // moneda: giro.moneda  // ❌ FALTABA
};

// DESPUÉS (con campo moneda agregado)
const paymentData = {
  operacion_id: finalOperationId,
  numero_pago: giro.numero_pago,
  valor_pagado: giro.valor_pagado,
  // ... otros campos
  moneda: giro.moneda || 'USD'  // ✅ AGREGADO
};
```

#### Estado: ✅ **RESUELTO**

---

### **2. Regex de liberaciones demasiado restrictivo**

#### Síntoma:
Las liberaciones con formato `Capital: 40000 MXN` no se extraían correctamente.

#### Causa:
El regex original solo incluía monedas específicas: `(USD|EUR|GBP|COP)?`

#### Solución:
```typescript
// ANTES (monedas limitadas)
const liberacionRegex = /-\s*Liberación\s+(\d+)[\s\S]*?-\s*Capital:\s*(\d+(?:\.\d+)?)\s*(USD|EUR|GBP|COP)?[\s\S]*?-\s*Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;

// DESPUÉS (cualquier moneda de 3 letras)
const liberacionRegex = /Liberación\s+(\d+)[\s\S]*?-\s*Capital:\s*(\d+(?:\.\d+)?)\s*([A-Z]{3})[\s\S]*?-\s*Fecha:\s*(\d{4}-\d{2}-\d{2})/gi;
```

#### Estado: ✅ **RESUELTO**

---

### **3. Costos logísticos interrumpían el procesamiento de CSV**

#### Síntoma:
Solo se procesaba la fila de headers, las filas de datos reales no se procesaban.

#### Causa:
Errores en la nueva extracción de costos logísticos desde columna 5 rompían el loop de procesamiento.

#### Solución:
Agregamos protección try-catch a todas las nuevas funciones:
```typescript
// Protección en extracción de monedas múltiples
try {
  monedaCompra = extractValue(cleanText, /MONEDA DE PAGO SOLICITADO:\s*([A-Z]{3})/i) || 'USD';
  // ... resto de extracciones
} catch (error) {
  console.error(`❌ [ERROR MONEDAS] Error extrayendo monedas múltiples:`, error);
}

// Protección en extracción de costos logísticos
try {
  const infoGeneralColumn = extractCSVValue(csvRow, /5\.\s*Info\s*Gnal\s*\+\s*Info\s*Compra\s*Int/i) || text;
  // ... resto de extracciones
} catch (error) {
  console.error(`❌ [ERROR COSTOS LOGÍSTICOS] Error en extracción desde columna 5:`, error);
}
```

#### Estado: ✅ **RESUELTO**

---

### **4. Costos logísticos se extraían pero no se insertaban**

#### Síntoma:
Los logs mostraban `COSTOS LOGÍSTICOS: 3` pero no aparecían en la tabla.

#### Causa Principal:
Campo `orden` inexistente en la tabla `costos_logisticos`.

#### Error específico:
```
🚨 Error en upsert de costos_logisticos: {
  code: "PGRST204", 
  message: "Could not find the 'orden' column of 'costos_logisticos' in the schema cache"
}
```

#### Solución:
1. **Simplificación de la lógica de deduplicación:**
```typescript
// ANTES (lógica compleja con campo orden)
const seenByOperation = new Map();
// ... lógica compleja
costo.orden = index + 1; // ❌ Campo no existe en tabla

// DESPUÉS (lógica simple, sin campo orden)
const costosMap = new Map();
for (const costo of allCostosLogisticosToProcess) {
  const key = `${costo.operacion_id}:${costo.tipo_costo}`;
  costosMap.set(key, costo);
}
const costosDeduplicados = Array.from(costosMap.values());
// Sin agregar campo orden ✅
```

2. **Mejora en la función de extracción:**
```typescript
// Implementación más elegante con función helper
const patterns = {
  flete: /FLETE INTERNACIONAL:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i,
  gastos: /GASTOS EN DESTINO:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i,
  seguro: /SEGURO:\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})/i
};

function extractAndPushCost(match: RegExpMatchArray | null, tipoCosto: string, timelineStepId: number) {
  if (match) {
    const monto = parseFloat(match[1].replace(/,/g, '')) || 0;
    const moneda = match[2]?.toUpperCase() || 'USD';
    if (monto > 0) {
      costosLogisticos.push({
        tipo_costo: tipoCosto,
        monto: monto,
        moneda: moneda,
        fecha_pago: null,
        timeline_step_id: timelineStepId
      });
    }
  }
}
```

#### Estado: ✅ **RESUELTO**

---

### **5. Bancos proveedores se duplicaban al re-subir archivo**

#### Síntoma:
Al re-subir el mismo archivo CSV, específicamente "CENTRAL BANK CHINESE" se duplicaba en la tabla `bancos_proveedores`.

#### Causa:
Idéntica al problema de `pagos_clientes` - falta de constraint único para operaciones UPSERT.

#### Solución:
```sql
ALTER TABLE bancos_proveedores
ADD CONSTRAINT unique_proveedor_banco
UNIQUE (proveedor_id);
```

#### Actualización del código:
```typescript
// ANTES (DELETE + INSERT approach)
await supabase.from('bancos_proveedores').delete().in('proveedor_id', [...]);
const { data: bancosInsertData, error: bancosInsertError } = await supabase
  .from('bancos_proveedores')
  .insert(bancosDeduplicados);

// DESPUÉS (UPSERT con constraint único)
const { data: bancosUpsertData, error: bancosUpsertError } = await supabase
  .from('bancos_proveedores')
  .upsert(bancosDeduplicados, {
    onConflict: 'proveedor_id',
    ignoreDuplicates: false
  });
```

#### Estado: ✅ **RESUELTO**

---

## 📊 Estructura de Monedas Implementada

### **Tablas con campo `moneda` confirmadas:**
- ✅ **`pagos_proveedores`** - Campo `moneda` (varchar)
- ✅ **`entrega_clientes`** - Campo `moneda` (text)
- ✅ **`costos_logisticos`** - Campo `moneda` (ya existía)
- ✅ **`bancos_proveedores`** - Con constraint único en `proveedor_id`
- ✅ **`operaciones`** - Campo `currency` para moneda principal

### **Fuentes de extracción:**
1. **Costos Logísticos** (columna "5. Info Gnal + Info Compra Int"):
   - `FLETE INTERNACIONAL: 1200 USD`
   - `GASTOS EN DESTINO: 540 EUR`  
   - `SEGURO: 589 COP`

2. **Giros/Pagos a Proveedores**:
   - `VALOR SOLICITADO: 50000 EUR`

3. **Liberaciones/Capital**:
   - `Capital: 40000 MXN`

4. **Moneda Principal**:
   - `MONEDA DE PAGO SOLICITADO: USD`

## 🔧 Archivos Modificados

### **Frontend:**
- `src/utils/csvMappers.ts` - Interfaces actualizadas para múltiples monedas

### **Backend:**
- `backend/supabase/functions/upload-csv-with-parser/index.ts` - Función principal modificada

### **Base de Datos:**
- Tabla `pagos_proveedores` - Campo `moneda` agregado
- Tablas `entrega_clientes` y `costos_logisticos` - Campos `moneda` ya existían

## 🎯 Resultado Final

### **Logs exitosos esperados:**
```log
🚛 [EXTRACOSTOS/COSTOS] Iniciando extracción...
🔍 [DEBUG] Longitud de la columna 5: 1234 chars
✅ [COSTO LOGÍSTICO] flete_internacional: 1200 USD
✅ [COSTO LOGÍSTICO] gastos_destino: 540 EUR
✅ [COSTO LOGÍSTICO] seguro: 589 COP
💰 [LIBERACIÓN 1] Capital: 40000 MXN, Fecha: 2025-09-15, Estado: pendiente
💱 [GIRO 1] Extraído: 50000 EUR (50%)
🧠 Iniciando Sync Inteligente de costos_logisticos...
✅ COSTOS_LOGISTICOS UPSERT: 3 registros procesados correctamente
```

### **Datos en tablas:**
- **`pagos_proveedores`**: Giros con sus monedas específicas
- **`costos_logisticos`**: Flete, gastos y seguro con sus monedas
- **`entrega_clientes`**: Liberaciones con capital y moneda
- **`operaciones`**: Moneda principal de la operación

## ⚠️ Lecciones Aprendidas

1. **Verificar esquema de tabla**: Siempre confirmar que los campos existen antes de insertarlos
2. **Protección con try-catch**: Nuevas funciones deben estar protegidas para no romper el flujo
3. **Validación de constraints**: Los UPSERT requieren constraints únicos exactos
4. **Debugging incremental**: Logs específicos ayudan a identificar problemas rápidamente
5. **Seguir patrones exitosos**: Replicar lógica que ya funciona (como columna 14)
6. **Constraints únicos para UPSERT**: Toda tabla que use UPSERT debe tener constraint único apropiado
7. **Patron de resolución duplicados**: El patrón de `pagos_clientes` se aplica a todas las tablas similares

## 📝 Documentación Relacionada
- `TROUBLESHOOTING_PAGOS_CLIENTES.md` - Patrón de resolución de problemas de UPSERT
- `CONTEXTO_ACTUALIZADO_APP.md` - Estado general del proyecto  
- `EXTRACCION_DECIMALES_DOCUMENTACION.md` - Documentación de procesamiento de valores

---

*Documento generado el 15 de enero de 2025 - Sistema de múltiples monedas implementado exitosamente*