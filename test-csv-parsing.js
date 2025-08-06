/**
 * Test específico para parsing CSV multiline
 */

const testData = `Nombre,Completado,Persona asignada,Fecha de vencimiento,Proceso,1. ESTADO Firma Cotización,1. Cotización PDF,5. ESTADO Compra Int,5. Doc Compra Int,3. ESTADO Doc Legal General,3. Doc Legales Integra,2. ESTADO factura Cuota Operacional,2. Factura Cuota Operacional,Item ID,6. Link de Cotización,6. GIRO #,7. Estrategia / Intereses,7. ESTADO Estrategia,8. ESTADO Doc Legal X Comp,8. Doc Legal X Comp,9. ESTADO Proforma / Factura final,9. Proforma / Factura final,10. ESTADO Giro Proveedor,10. Swift de Pago Proveedor,14.Monto Pre/Liberación,5. Proforma Proveedor,4. Soporte Pago CO Cliente,14. Fecha de Liberación,4. ESTADO pago Cuota Operacional,10. Info por GIRO Proveedor,5. Info Gnal + Info Compra Int,6. ESTADO Link Cotización,15. Equipo Comercial,1.Docu. Cliente
<#C095VK2905C|>,FALSE,,,7. Cierre de Operación,Listo,F095XLM05T7,Aprobada,F095YQRGZ1Q,Listo,F0960FLAD4L,Listo,F0960FAQQVA,C095VK2905C,"{""originalUrl"":""https:\\/\\/docs.google.com\\/spreadsheets\\/d\\/1vsvadtKRoLe7_XD5T-mJSmElX5cH11h3QXJDKjTlN_s\\/edit?gid=13204065#gid=13204065"",""attachment"":{},""displayAsUrl"":false}",Liberación 1,F096MHFPWM6,Listo,Listo,F096MHFPWM6,Listo - Factura Final,F096CFXL6QZ,Listo - Pago Confirmado,F0960L13K5J,30000 USD,F095VNWCH4N,F095XM73EAZ,2025-07-25,Listo,"- VALOR SOLICITADO: 70000
- NÚMERO DE GIRO: 2do Giro a Proveedor
- PORCENTAJE DE GIRO: 70% del total","- CLIENTE: MALE
- PAÍS IMPORTADOR: MÉXICO
- PAÍS EXPORTADOR: CHINA
- VALOR TOTAL DE COMPRA: 80000
- MONEDA DE PAGO SOLICITADO: USD NA
- TÉRMINOS DE PAGO: 30% ADVANCE / 70% AGAINST BL COPY

*******DATOS BANCARIOS*******

- BENEFICIARIO: BANCO BBVA
- BANCO: 4567896
- DIRECCIÓN: SHANGHAI 10256899 
- NÚMERO DE CUENTA: 46587966666
- SWIFT: BSHANGBB
*************************
- ICOTERM COMPRA: FOB - SHANGHAI
- ICOTERM VENTA: DAP - ZONA FRANCA
- OBSERVACIONES: 
-----------------------
- VALOR SOLICITADO: 20000
- NÚMERO DE GIRO: 1er Giro a Proveedor
- PORCENTAJE DE GIRO: 30% del total
--------------
- VALOR SOLICITADO: 60000
- NÚMERO DE GIRO: 2do Giro a Proveedor
- PORCENTAJE DE GIRO: 70% del total
---------------
- Liberación 1
- Capital: 
40000 USD
- Fecha: 2025-07-25
---------------
- Liberación 2
- Capital: 
20000 USD
- Fecha: 2025-08-07
---------
- Liberación 3
- Capital: 
20000 USD
- Fecha: 2025-09-11
---------
NPS
- Inconvenientes: No
- Descripción inconvenientes: Acabamos muchisimas gracias a todos!
- Calificación (1 mala - 5 buena): 5",Listo,andres.perdomo@finkargo.com,"- CLIENTE: PRUEBA 2
- NIT: 123456789
- VALOR OPERACIÓN: 80000"`;

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Comilla escapada ("" dentro de campo)
        current += '"';
        i += 2;
      } else if (inQuotes && (nextChar === ',' || nextChar === undefined)) {
        // Final de campo quoted
        inQuotes = false;
        i++;
      } else if (!inQuotes && (current === '' || current.trim() === '')) {
        // Inicio de campo quoted (solo si estamos al inicio del campo)
        inQuotes = true;
        i++;
      } else {
        // Comilla literal dentro de contenido
        current += char;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Separador de campo válido
      values.push(current);
      current = '';
      i++;
    } else {
      // Contenido normal (incluye saltos de línea dentro de quotes)
      current += char;
      i++;
    }
  }
  // Agregar último valor
  values.push(current);
  
  // Limpiar valores: remover comillas externas y espacios solo si son comillas balanceadas
  return values.map(value => {
    if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      const cleaned = value.slice(1, -1);
      return cleaned.replace(/""/g, '"').trim();
    }
    return value.trim();
  });
}

function parseCSVContentRobust(content) {
  const lines = content.split('\n');
  const rows = [];
  
  if (lines.length < 2) {
    throw new Error('Archivo CSV debe tener al menos cabecera y una fila de datos');
  }

  // Extraer cabeceras desde la primera línea
  const headers = parseCSVLine(lines[0]);
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
        const values = parseCSVLine(currentRowText);
        
        // Solo procesar si tenemos al menos algunas columnas
        if (values.length >= Math.floor(headers.length * 0.5)) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
          console.log(`✅ Fila ${i} procesada: ${values.length} columnas`);
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
      const values = parseCSVLine(currentRowText);
      if (values.length >= Math.floor(headers.length * 0.5)) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
        console.log(`✅ Última fila procesada: ${values.length} columnas`);
      }
    } catch (error) {
      console.warn(`⚠️ Última fila incompleta descartada: ${error}`);
    }
  }

  return rows;
}

console.log('🧪 TEST DE PARSING CSV MULTILINE');
console.log('='.repeat(50));

try {
  const rows = parseCSVContentRobust(testData);
  
  console.log(`\n📊 RESULTADO:`);
  console.log(`   Filas parseadas: ${rows.length}`);
  
  if (rows.length > 0) {
    const row = rows[0];
    const keys = Object.keys(row);
    console.log(`   Columnas en fila 1: ${keys.length}`);
    
    // Buscar las columnas importantes
    const infoGnalColumn = row['5. Info Gnal + Info Compra Int'];
    const giroProveedorColumn = row['10. Info por GIRO Proveedor'];
    const docuClienteColumn = row['1.Docu. Cliente'];
    
    console.log(`\n📄 CONTENIDOS:`);
    console.log(`   "5. Info Gnal + Info Compra Int" existe: ${!!infoGnalColumn}`);
    if (infoGnalColumn) {
      console.log(`   Longitud: ${infoGnalColumn.length} caracteres`);
      console.log(`   Primeros 200 caracteres: ${infoGnalColumn.substring(0, 200)}...`);
    }
    
    console.log(`   "10. Info por GIRO Proveedor" existe: ${!!giroProveedorColumn}`);
    if (giroProveedorColumn) {
      console.log(`   Contenido: ${giroProveedorColumn}`);
    }
    
    console.log(`   "1.Docu. Cliente" existe: ${!!docuClienteColumn}`);
    if (docuClienteColumn) {
      console.log(`   Contenido: ${docuClienteColumn}`);
    }
    
    // Verificar si contiene datos de giros y liberaciones
    if (infoGnalColumn) {
      const hasGiros = infoGnalColumn.includes('VALOR SOLICITADO') && infoGnalColumn.includes('NÚMERO DE GIRO');
      const hasLiberaciones = infoGnalColumn.includes('Liberación') && infoGnalColumn.includes('Capital');
      console.log(`\n🔍 ANÁLISIS:`);
      console.log(`   Contiene giros: ${hasGiros}`);
      console.log(`   Contiene liberaciones: ${hasLiberaciones}`);
    }
  }
  
} catch (error) {
  console.error('❌ Error en test:', error);
}

console.log('\n✅ TEST COMPLETADO');