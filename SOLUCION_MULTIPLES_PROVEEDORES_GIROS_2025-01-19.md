# Solución: Procesamiento de Múltiples Proveedores y Giros en Sistema de Pagos

**Fecha**: 2025-01-19
**Sistema**: Integra Control Tower Light v6
**Módulo**: Procesamiento de pagos a proveedores (tabla `pagos_proveedores`)

## Problema Identificado

### Contexto
El sistema necesitaba procesar operaciones con múltiples proveedores de mercancía, donde cada proveedor podía tener uno o más giros (pagos). Los datos se extraían de archivos CSV con la siguiente estructura:

```
- CLIENTE: PRUEBA COFACE
- PAÍS IMPORTADOR: COLOMBIA
- PAÍS EXPORTADOR: CHINA
- VALOR TOTAL DE COMPRA: 8520
...
- NOMBRE PROVEEDOR MERCANCIA: CHINA MOTOR INC
- VALOR SOLICITADO: 3370 USD
- NÚMERO DE GIRO: 1er Giro a Proveedor
- PORCENTAJE DE GIRO: 30%
- FECHA SOLICITUD GIRO: 2025-09-15
- FECHA PAGO REALIZADO: 2025-09-16
---------------------------
- NOMBRE PROVEEDOR MERCANCIA: CHINA INDUSTRY INC
- VALOR SOLICITADO: 100000 USD
- NÚMERO DE GIRO: 1er Giro a Proveedor
- PORCENTAJE DE GIRO: 100%
- FECHA SOLICITUD GIRO: 2025-09-17
- FECHA PAGO REALIZADO: 2025-09-17
```

### Problemas Específicos

1. **Detección incompleta de bloques**: El regex no capturaba correctamente todos los bloques de giros cuando había múltiples proveedores.

2. **Pérdida de información del proveedor**: El campo `NOMBRE PROVEEDOR MERCANCIA` no se estaba extrayendo ni almacenando en la base de datos.

3. **Conflictos de duplicados**: Cuando dos proveedores tenían giros con el mismo número (ej: "1er Giro a Proveedor"), el sistema generaba un error:
   ```
   ON CONFLICT DO UPDATE command cannot affect row a second time
   ```
   Esto ocurría porque la tabla usaba la combinación `operacion_id + numero_pago` como clave única.

4. **Datos no persistidos**: Los giros se extraían correctamente pero no se insertaban en la tabla `pagos_proveedores`.

## Solución Implementada

### 1. Mejora en la Detección de Bloques de Giros

**Archivo**: `backend/supabase/functions/upload-csv-with-parser/index.ts`

**Cambio en la función `extractGiros`**:

```javascript
// ANTES: El regex no capturaba correctamente el final de cada bloque
let giroBlocks = text.match(/-\s*NOMBRE PROVEEDOR MERCANCIA:[\s\S]*?(?=-\s*NOMBRE PROVEEDOR MERCANCIA:|\*+|$)/gi);

// DESPUÉS: Detecta bloques que terminan con FECHA PAGO REALIZADO
let giroBlocks = text.match(/-\s*NOMBRE PROVEEDOR MERCANCIA:[\s\S]*?-\s*FECHA PAGO REALIZADO:\s*\d{4}-\d{2}-\d{2}/gi);
```

### 2. Extracción del Nombre del Proveedor

Se agregó la extracción del campo `NOMBRE PROVEEDOR MERCANCIA` dentro de cada bloque:

```javascript
// Extraer nombre del proveedor de cada bloque
const proveedorMatch = giroBlock.match(/NOMBRE PROVEEDOR MERCANCIA:\s*(.+?)(?=\n|$)/i);
let proveedor = proveedorMatch ? proveedorMatch[1].trim() : '';

// Agregar al objeto giro
const giroObj = {
  valor_total_compra: valorTotalCompra,
  numero_pago: numero,
  valor_pagado: valor,
  porcentaje_pago: porcentaje,
  estado: estado,
  fecha_solicitud: fechaSolicitud,
  fecha_pago_realizado: fechaPago,
  moneda: moneda,
  nombre_proveedor: proveedor // Campo agregado
};
```

### 3. Manejo de Duplicados con Números de Giro Únicos

Se implementó lógica para hacer únicos los números de giro cuando hay múltiples proveedores:

```javascript
// Si hay múltiples proveedores con el mismo número de giro, hacerlo único
let numeroGiroUnico = giro.numero_pago;
if (giro.nombre_proveedor && parsedInfo.giros.filter(g => g.numero_pago === giro.numero_pago).length > 1) {
  // Solo agregar el proveedor si hay múltiples giros con el mismo número
  numeroGiroUnico = `${giro.numero_pago} - ${giro.nombre_proveedor}`;
  console.log(`🔄 [GIRO ÚNICO] Cambiando "${giro.numero_pago}" a "${numeroGiroUnico}"`);
}
```

### 4. Deduplicación antes del Upsert

Se agregó un proceso de deduplicación antes de insertar en la base de datos:

```javascript
// Deduplicar array antes del upsert
const uniquePayments = new Map();
for (const payment of allPaymentsToProcess) {
  const key = `${payment.operacion_id}_${payment.numero_pago}`;
  if (!uniquePayments.has(key)) {
    uniquePayments.set(key, payment);
  } else {
    console.log(`⚠️ [DEDUP] Removiendo pago duplicado: ${payment.numero_pago}`);
  }
}
const dedupedPayments = Array.from(uniquePayments.values());

// Usar el array deduplicado para el upsert
const { data: insertData, error: upsertError } = await supabase
  .from('pagos_proveedores')
  .upsert(dedupedPayments, {
    onConflict: 'operacion_id,numero_pago',
    ignoreDuplicates: false
  });
```

### 5. Estructura de la Tabla pagos_proveedores

La tabla en Supabase ya contenía los campos necesarios:

```sql
- id (uuid)
- operacion_id (uuid)
- valor_pagado (numeric)
- numero_pago (text)
- porcentaje_pago (text)
- estado (text)
- fecha_pago (timestamptz)
- valor_total_compra (numeric)
- fecha_solicitud (timestamp)
- fecha_pago_realizado (timestamp)
- moneda (varchar)
- nombre_proveedor (text)       -- Campo crítico para múltiples proveedores
- terminos_pago (text)
- otros_terminos_pago (text)
```

## Resultado Final

Con estas modificaciones, el sistema ahora puede:

1. ✅ **Detectar correctamente** todos los bloques de giros de múltiples proveedores
2. ✅ **Extraer y almacenar** el nombre del proveedor para cada giro
3. ✅ **Evitar conflictos** usando números de giro únicos cuando es necesario
4. ✅ **Insertar exitosamente** todos los giros en la tabla `pagos_proveedores`

### Ejemplo de Datos Procesados

Para una operación con 3 giros de 2 proveedores diferentes:

| numero_pago | nombre_proveedor | valor_pagado | estado |
|------------|------------------|--------------|---------|
| 1er Giro a Proveedor - CHINA MOTOR INC | CHINA MOTOR INC | 3,370 USD | completado |
| 1er Giro a Proveedor - CHINA INDUSTRY INC | CHINA INDUSTRY INC | 100,000 USD | completado |
| 2do Giro a Proveedor - CHINA MOTOR INC | CHINA MOTOR INC | 7,863 USD | completado |

## Logs de Debug Agregados

Para facilitar el diagnóstico futuro, se agregaron los siguientes logs:

- `📦 [GIROS] Encontrados X bloques de giros`
- `✅ [GIRO X] NOMBRE PROVEEDOR encontrado: "nombre"`
- `🔄 [GIRO ÚNICO] Cambiando "numero" a "numero único"`
- `⚠️ [DUPLICADO EVITADO] Ya existe el pago X`
- `⚠️ [DEDUP] Removiendo pago duplicado: X`
- `🎯 [CHECKPOINT 3A] EJECUTANDO UPSERT DE X PAGOS`

## Archivos Modificados

- `/backend/supabase/functions/upload-csv-with-parser/index.ts`
  - Función `extractGiros`: Mejorado regex de detección de bloques
  - Función `extractGirosConProveedores`: Asociación de giros con proveedores
  - Procesamiento de pagos: Agregada lógica de deduplicación y números únicos

## Notas Importantes

- La solución mantiene retrocompatibilidad con operaciones de un solo proveedor
- Los números de giro solo se modifican cuando hay conflictos reales
- La deduplicación se realiza tanto durante el procesamiento como antes del upsert
- Los logs de debug se pueden comentar en producción para reducir ruido

## Autor

Sistema desarrollado y documentado por el equipo de Integra Control Tower.
Solución implementada con asistencia de Claude AI.