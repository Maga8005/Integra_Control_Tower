# 📁 Directorio de Datos CSV

## 📋 Instrucciones para Archivo CSV

**UBICACIÓN REQUERIDA:**
Coloca el archivo `integra_updated_v4.csv` en esta carpeta:
```
backend/src/data/integra_updated_v4.csv
```

## 🔧 Formato CSV Esperado

El procesador CSV espera las siguientes **columnas obligatorias**:

### Columnas Críticas:
- `5. Info Gnal + Info Compra Int` - **Campo principal** con información parseada
- `15. Equipo Comercial` - Persona asignada a la operación
- `Proceso` - Estado del proceso general
- `1. ESTADO Firma Cotización` - Estado de la cotización
- `4. ESTADO pago Cuota Operacional` - Estado del pago de cuota
- `9. ESTADO Proforma / Factura final` - Estado de la factura
- `10. ESTADO Giro Proveedor` - Estado del giro al proveedor

## 🎯 Mapeo de Estados

### **Fase 1: Solicitud Enviada**
- ✅ **COMPLETADO**: `Proceso` contiene "1. Aprobación de Cotización" **O** `1. ESTADO Firma Cotización` = "Listo"

### **Fase 2: Documentos y Cuota Operacional**
- ✅ **COMPLETADO**: `4. ESTADO pago Cuota Operacional` = "Listo"

### **Fase 3: Procesamiento de Pago**
- ✅ **COMPLETADO**: Progreso de giros = 100% **Y** `10. ESTADO Giro Proveedor` = "Listo - Pago Confirmado"

### **Fase 4: Envío y Logística**
- ✅ **COMPLETADO**: `9. ESTADO Proforma / Factura final` = "Listo - Factura Final" **Y** presencia de liberaciones

### **Fase 5: Operación Completada**
- ✅ **COMPLETADO**: Suma de liberaciones ≈ Valor total de compra (±1000 tolerancia)

## 📊 Endpoints Disponibles

Una vez colocado el archivo CSV, estos endpoints estarán disponibles:

### **Operaciones Principales:**
- `GET /api/operations` - Lista todas las operaciones (con paginación y filtros)
- `GET /api/operations/:id` - Obtiene operación específica
- `GET /api/operations/stats` - Estadísticas generales

### **Gestión CSV:**
- `GET /api/operations/csv/info` - Información del archivo CSV
- `POST /api/operations/reload` - Recargar operaciones desde CSV

### **Testing:**
- `POST /api/test/parse` - Probar parser con texto individual

## 🔍 Ejemplo de Uso

```bash
# 1. Verificar que el archivo CSV está presente
curl http://localhost:3001/api/operations/csv/info

# 2. Cargar operaciones desde CSV
curl -X POST http://localhost:3001/api/operations/reload

# 3. Obtener todas las operaciones
curl http://localhost:3001/api/operations

# 4. Obtener estadísticas
curl http://localhost:3001/api/operations/stats
```

## ⚠️ Importante

- **El archivo debe estar en formato UTF-8**
- **Las columnas deben tener exactamente los nombres especificados**
- **El campo "5. Info Gnal + Info Compra Int" debe contener el texto completo de la operación**
- **El sistema cachea las operaciones por 5 minutos para mejor rendimiento**

## 🐛 Troubleshooting

Si tienes problemas:

1. **Verifica la ubicación:** `backend/src/data/integra_updated_v4.csv`
2. **Revisa el formato:** UTF-8, separado por comas
3. **Consulta logs:** El backend mostrará logs detallados del procesamiento
4. **Usa reload:** `POST /api/operations/reload` para forzar recarga

---

**¡Una vez colocado el archivo CSV, el sistema procesará automáticamente las 19 filas y generará el timeline de 5 fases para cada operación!**