/**
 * Script para arreglar el archivo CSV malformado
 * Convierte campos multilinea a una sola línea con delimitadores apropiados
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'src/data/integra_updated_v4.csv');
const backupPath = path.join(__dirname, 'src/data/integra_updated_v4_backup.csv');

function fixCSV() {
  console.log('🔧 Iniciando corrección del archivo CSV...');
  
  try {
    // Leer archivo original
    const content = fs.readFileSync(csvPath, 'utf-8');
    console.log('📄 Archivo CSV leído');
    
    // Crear backup
    fs.writeFileSync(backupPath, content);
    console.log('💾 Backup creado en:', backupPath);
    
    // Dividir en líneas
    const lines = content.split('\n');
    console.log(`📊 Total líneas encontradas: ${lines.length}`);
    
    // Procesar líneas
    const fixedLines = [];
    let currentRow = '';
    let inMultilineField = false;
    let quoteCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue; // Saltar líneas vacías
      
      // Contar comillas en la línea
      const lineQuotes = (line.match(/"/g) || []).length;
      quoteCount += lineQuotes;
      
      // Agregar línea al row actual
      if (currentRow) {
        // Reemplazar saltos de línea con espacios dentro de campos
        currentRow += ' ' + line;
      } else {
        currentRow = line;
      }
      
      // Si tenemos número par de comillas, la fila está completa
      if (quoteCount % 2 === 0) {
        // Limpiar la línea: eliminar saltos innecesarios y normalizar espacios
        const cleanedRow = currentRow
          .replace(/\s+/g, ' ')  // Múltiples espacios -> un espacio
          .replace(/,\s*"/g, ',"')  // Limpiar espacios antes de comillas
          .replace(/"\s*,/g, '",')  // Limpiar espacios después de comillas
          .trim();
        
        fixedLines.push(cleanedRow);
        
        // Reset para siguiente fila
        currentRow = '';
        quoteCount = 0;
        inMultilineField = false;
        
        if (i > 0 && (i + 1) % 5 === 0) {
          console.log(`⚙️ Procesadas ${i + 1} líneas...`);
        }
      } else {
        inMultilineField = true;
      }
    }
    
    // Si queda contenido sin procesar
    if (currentRow.trim()) {
      const cleanedRow = currentRow
        .replace(/\s+/g, ' ')
        .replace(/,\s*"/g, ',"')
        .replace(/"\s*,/g, '",')
        .trim();
      fixedLines.push(cleanedRow);
    }
    
    // Escribir archivo corregido
    const fixedContent = fixedLines.join('\n');
    fs.writeFileSync(csvPath, fixedContent);
    
    console.log('✅ Archivo CSV corregido exitosamente!');
    console.log(`📊 Líneas originales: ${lines.length}`);
    console.log(`📊 Líneas finales: ${fixedLines.length}`);
    console.log(`💾 Backup disponible en: ${backupPath}`);
    
    // Mostrar muestra de las primeras líneas corregidas
    console.log('\n📋 Muestra de líneas corregidas:');
    fixedLines.slice(0, 5).forEach((line, index) => {
      const preview = line.length > 100 ? line.substring(0, 100) + '...' : line;
      console.log(`   ${index + 1}: ${preview}`);
    });
    
  } catch (error) {
    console.error('❌ Error corrigiendo el archivo CSV:', error);
    
    // Restaurar backup si existe
    if (fs.existsSync(backupPath)) {
      try {
        const backupContent = fs.readFileSync(backupPath, 'utf-8');
        fs.writeFileSync(csvPath, backupContent);
        console.log('🔄 Archivo original restaurado desde backup');
      } catch (restoreError) {
        console.error('❌ Error restaurando backup:', restoreError);
      }
    }
  }
}

// Ejecutar corrección
fixCSV();