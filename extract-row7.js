/**
 * Script para extraer la fila 7 específica del CSV y mostrar su contenido
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILES = [
  'backend/src/data/integra_co_data.csv',
  'backend/src/data/integra_mx_data.csv', 
  'backend/src/data/integra_updated_v4.csv'
];

console.log('🔍 BUSCANDO FILA 7 CON CLIENTE "PRUEBA 2"\n');

for (const csvFile of CSV_FILES) {
  const filePath = path.join(__dirname, csvFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${csvFile}`);
    continue;
  }
  
  console.log(`\n📄 ANALIZANDO: ${csvFile}`);
  console.log('='.repeat(60));
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Obtener headers para encontrar índices de columnas
  const headers = lines[0].split(',');
  const infoColumnIndex = headers.findIndex(h => h.includes('5. Info Gnal') || h.includes('Info Compra Int'));
  const clienteColumnIndex = headers.findIndex(h => h.includes('1.Docu. Cliente') || h.includes('Docu.Cliente'));
  
  console.log(`Índice columna "5. Info Gnal + Info Compra Int": ${infoColumnIndex}`);
  console.log(`Índice columna "1.Docu. Cliente": ${clienteColumnIndex}`);
  
  if (infoColumnIndex === -1 || clienteColumnIndex === -1) {
    console.log('❌ No se encontraron las columnas necesarias');
    continue;
  }
  
  // Revisar fila 7 (índice 7, porque incluimos el header)
  if (lines.length > 7) {
    console.log(`\n📋 FILA 7 (línea ${7}):`);
    const row7 = lines[7];
    
    // Usar regex más robusto para dividir CSV respetando comillas
    const columns = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row7.length; i++) {
      const char = row7[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        current += char;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    console.log(`Total columnas en fila: ${columns.length}`);
    
    if (columns.length > Math.max(infoColumnIndex, clienteColumnIndex)) {
      const infoColumn = columns[infoColumnIndex] || '';
      const clienteColumn = columns[clienteColumnIndex] || '';
      
      console.log(`\n📝 CLIENTE (columna ${clienteColumnIndex}):`);
      console.log(clienteColumn.substring(0, 200));
      
      console.log(`\n📝 INFO COMPRA INT (columna ${infoColumnIndex}):`);
      console.log(infoColumn.substring(0, 500));
      
      // Verificar si contiene datos de giros y liberaciones
      const hasGiros = infoColumn.includes('VALOR SOLICITADO') || infoColumn.includes('NÚMERO DE GIRO');
      const hasLiberaciones = infoColumn.includes('Liberación') && infoColumn.includes('Capital');
      
      console.log(`\n🔍 ANÁLISIS:`);
      console.log(`   Cliente contiene "PRUEBA": ${clienteColumn.toLowerCase().includes('prueba')}`);
      console.log(`   Tiene giros: ${hasGiros}`);
      console.log(`   Tiene liberaciones: ${hasLiberaciones}`);
      
      if (hasGiros || hasLiberaciones) {
        console.log(`\n✅ CONTENIDO COMPLETO DE "5. Info Gnal + Info Compra Int":`);
        console.log('─'.repeat(80));
        console.log(infoColumn);
        console.log('─'.repeat(80));
      }
    } else {
      console.log('❌ La fila no tiene suficientes columnas');
    }
  } else {
    console.log('❌ El archivo no tiene suficientes filas (menos de 7)');
  }
}

console.log('\n✅ BÚSQUEDA COMPLETADA');