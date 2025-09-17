# Documentación: Extracción y Procesamiento de Valores Monetarios con Decimales

## Resumen Ejecutivo

Este documento describe el proceso de extracción y subida de datos monetarios desde archivos CSV al sistema Integra Control Tower, con especial énfasis en el manejo correcto de valores decimales utilizando únicamente **punto (.)** como separador decimal.

## Contexto del Problema

### Problema Identificado
Los valores monetarios extraídos del CSV perdían sus decimales durante el procesamiento, resultando en:
- `3500.58` → `350.00`
- `5000.38` → `121.00`
- `12113.46` → `121.00`

### Causa Raíz
- Uso de `parseInt()` en lugar de `parseFloat()` para procesar valores monetarios
- Expresiones regulares que no capturaban decimales: `(\d+)` vs `(\d+(?:\.\d+)?)`
- Inconsistencias en el procesamiento entre diferentes funciones

## Estándar de Formato Decimal

### ✅ Formato Aceptado
**Solo se acepta punto (.) como separador decimal:**
- ✅ `1,767.45` (miles con coma, decimales con punto)
- ✅ `1767.45` (sin separador de miles, decimales con punto)

### ❌ Formatos NO Soportados
- ❌ `1.767,45` (formato europeo con coma decimal)
- ❌ `1767,45` (coma como separador decimal)

## Módulos Corregidos

### 1. Pagos de Clientes (`extractPagosClientes`)
**Columna CSV:** `1. Docu. Cliente`

**Valores extraídos:**
- CUOTA OPERACIONAL
- PRIMER ANTICIPO (10% ANTICIPO)
- SEGUNDO ANTICIPO (10% SEGUNDO ANTICIPO)

**Correcciones aplicadas:**
```typescript
// ANTES (incorrecto)
const cuotaMatch = docuClienteText.match(/CUOTA\s+OPERACIONAL[:\s]+([0-9,]+)\s*/i);
const monto = parseInt(cuotaMatch[1].replace(/,/g, ''));

// DESPUÉS (correcto)
const cuotaMatch = docuClienteText.match(/CUOTA\s+OPERACIONAL[:\s]+([0-9,]+(?:\.[0-9]+)?)\s*/i);
const monto = parseFloat(cuotaMatch[1].replace(/,/g, '')) || 0;
```

**Tabla destino:** `pagos_clientes`
- Campo: `monto` (tipo: `numeric`)

### 2. Pagos a Proveedores (`extractGiros`)
**Columna CSV:** `5. Info Gnal + Info`

**Valores extraídos:**
- VALOR SOLICITADO de cada giro

**Correcciones aplicadas:**
```typescript
// ANTES (incorrecto)
const valorMatch = giroBlock.match(/VALOR SOLICITADO:\s*(\d+)/i);
const valor = parseInt(valorMatch[1]);

// DESPUÉS (correcto)
const valorMatch = giroBlock.match(/VALOR SOLICITADO:\s*(\d+(?:\.\d+)?)/i);
const valor = parseFloat(valorMatch[1]) || 0;
```

**Tabla destino:** `pagos` (o tabla de giros)
- Campo: `valor_pagado` (tipo: `numeric`)

### 3. Entrega a Clientes (`extractLiberaciones`)
**Columna CSV:** Texto general

**Valores extraídos:**
- Capital de liberación
- Número de entrega

**Correcciones aplicadas:**
```typescript
// ANTES (incorrecto)
const liberacionRegex = /-\s*Liberación\s+(\d+)[\s\S]*?-\s*Capital:\s*(\d+)\s*/gi;
const numero = parseInt(match[1]);
const capital = parseInt(match[2]);

// DESPUÉS (correcto)
const liberacionRegex = /-\s*Liberación\s+(\d+)[\s\S]*?-\s*Capital:\s*(\d+(?:\.\d+)?)\s*/gi;
const numero = parseFloat(match[1]) || 0;
const capital = parseFloat(match[2]) || 0;
```

**Tabla destino:** `entrega_clientes`
- Campos: `numero_entrega`, `capital` (tipo: `numeric`)

### 4. Módulos Ya Correctos

Los siguientes módulos **YA** usaban `parseFloat()` correctamente:

#### Extracostos de Operación (`extractCostosLogisticos`)
**Columna CSV:** `14. Extracostos/Pagos Log`
```typescript
const monto = montoTexto ? parseFloat(montoTexto.replace(/[^\d.]/g, '')) : 0;
```

#### Costos Logísticos (`extractCostosLogisticos`)
**Columna CSV:** `14. Extracostos/Pagos Log`
```typescript
const monto = montoTexto ? parseFloat(montoTexto.replace(/[^\d.]/g, '')) : 0;
```

#### Reembolsos de Operación (`extractReembolsos`)
**Columna CSV:** `15. Reembolsos`
```typescript
const monto = montoTexto ? parseFloat(montoTexto.replace(/[^\d.]/g, '')) : 0;
```

## Patrón de Expresiones Regulares

### Regex Estándar para Valores Monetarios
```typescript
// Patrón que captura decimales con punto
([0-9,]+(?:\.[0-9]+)?)

// Desglose:
// [0-9,]+     - Uno o más dígitos y comas (separadores de miles)
// (?:         - Grupo no capturador
//   \.        - Punto literal (separador decimal)
//   [0-9]+    - Uno o más dígitos después del punto
// )?          - El grupo decimal es opcional
```

### Procesamiento Estándar
```typescript
// Función de limpieza y conversión
const monto = parseFloat(valorMatch[1].replace(/,/g, '')) || 0;

// Desglose:
// .replace(/,/g, '') - Eliminar todas las comas (separadores de miles)
// parseFloat()       - Convertir a número decimal
// || 0              - Valor por defecto si la conversión falla
```

## Flujo de Datos

### 1. Extracción desde CSV
```
CSV Row → extractXXX() function → Regex Match → parseFloat() → Decimal Value
```

### 2. Construcción de Objeto de Datos
```typescript
const objetoDatos = {
  operacion_id: finalOperationId,
  monto: valorDecimal, // Ya procesado con parseFloat()
  // ... otros campos
};
```

### 3. Inserción en Base de Datos
```typescript
// UPSERT a Supabase
const { data, error } = await supabase
  .from('tabla_destino')
  .upsert(objetoDatos)
  .select();
```

### 4. Estructura de Campos en BD
Todos los campos monetarios en las tablas de Supabase usan tipo `numeric` que preserva decimales:
- `pagos_clientes.monto`: `numeric`
- `extracostos_operacion.monto`: `numeric` 
- `costos_logisticos.monto`: `numeric`
- `reembolsos_operacion.monto_reembolso`: `numeric`

## Casos de Prueba

### Entrada de Datos
```
CUOTA OPERACIONAL: 12,113.46 USD
PRIMER ANTICIPO: 3,500.58 USD
VALOR SOLICITADO: 29,541.25
```

### Salida Esperada
```
monto: 12113.46
monto: 3500.58
valor_pagado: 29541.25
```

### Verificación en BD
```sql
-- Consulta para verificar decimales
SELECT monto, tipo_pago FROM pagos_clientes WHERE operacion_id = 'xxx';

-- Resultado esperado:
-- monto: 12113.46 | tipo_pago: cuota_operacional
-- monto: 3500.58  | tipo_pago: primer_anticipo
```

## Mantenimiento y Mejores Prácticas

### ✅ Hacer
1. Usar siempre `parseFloat()` para valores monetarios
2. Incluir regex que capture decimales: `(\d+(?:\.\d+)?)`
3. Limpiar separadores de miles con `.replace(/,/g, '')`
4. Usar valor por defecto: `|| 0`

### ❌ No Hacer
1. No usar `parseInt()` para valores monetarios
2. No usar regex sin soporte decimal: `(\d+)`
3. No asumir formatos diferentes al punto decimal

### Función de Utilidad Recomendada
```typescript
function parseMonetaryValue(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Limpiar moneda
  let cleanNumber = text.replace(/USD|EUR|GBP|COP/gi, '').trim();
  
  // Solo reconocer PUNTO como separador decimal
  // Limpiar separadores de miles (comas)
  const cleanForParsing = cleanNumber.replace(/,/g, '');
  
  return parseFloat(cleanForParsing) || 0;
}
```

## Fecha de Implementación
- **Identificación del problema:** 2025-01-04
- **Correcciones aplicadas:** 2025-01-04
- **Documentación creada:** 2025-01-04

## Estado Actual
✅ **COMPLETO** - Todos los módulos de extracción preservan correctamente los decimales usando punto como separador.