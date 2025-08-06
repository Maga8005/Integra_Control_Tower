/**
 * Script para encontrar específicamente la fila 7 con PRUEBA 2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = 'backend/src/data/integra_co_data.csv';
const filePath = path.join(__dirname, csvFile);

console.log('🔍 BUSCANDO FILA 7 CON PRUEBA 2 EN:', csvFile);
console.log('='.repeat(60));

if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado:', csvFile);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');

// Separar por líneas, pero manejar celdas que contienen saltos de línea
let isInQuotes = false;
let currentLine = '';
const lines = [];

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"' && (i === 0 || content[i-1] !== '\\')) {
        isInQuotes = !isInQuotes;
        currentLine += char;
    } else if (char === '\n' && !isInQuotes) {
        if (currentLine.trim()) {
            lines.push(currentLine);
        }
        currentLine = '';
    } else {
        currentLine += char;
    }
}

// Agregar la última línea si existe
if (currentLine.trim()) {
    lines.push(currentLine);
}

console.log(`📊 Total de líneas procesadas: ${lines.length}`);

if (lines.length < 8) {
    console.log('❌ El archivo no tiene suficientes líneas (necesita al menos 8)');
    process.exit(1);
}

// Obtener headers
const headers = lines[0].split(',').map((h, idx) => ({ name: h.trim(), index: idx }));
const infoColumnIndex = headers.findIndex(h => h.name.includes('5. Info Gnal') || h.name.includes('Info Compra Int'));
const clienteColumnIndex = headers.findIndex(h => h.name.includes('1.Docu. Cliente') || h.name.includes('Docu.Cliente'));

console.log(`📋 Índices de columnas:`);
console.log(`   "5. Info Gnal + Info Compra Int": ${infoColumnIndex}`);
console.log(`   "1.Docu. Cliente": ${clienteColumnIndex}`);

if (infoColumnIndex === -1 || clienteColumnIndex === -1) {
    console.log('❌ No se encontraron las columnas necesarias');
    console.log('📋 Headers disponibles:');
    headers.forEach((h, idx) => console.log(`   ${idx}: ${h.name}`));
    process.exit(1);
}

// Analizar la fila 7 (índice 7)
console.log(`\n🔍 ANALIZANDO FILA 7:`);
const row7 = lines[7];

console.log(`📄 Contenido completo de la fila 7 (primeros 200 chars):`);
console.log(row7.substring(0, 200) + '...');

// Parsear CSV más robusto
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        const nextChar = row[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add last field
    result.push(current.trim());
    return result;
}

const columns = parseCSVRow(row7);

console.log(`\n📊 Total de columnas parseadas: ${columns.length}`);

if (columns.length > Math.max(infoColumnIndex, clienteColumnIndex)) {
    const clienteColumn = columns[clienteColumnIndex] || '';
    const infoColumn = columns[infoColumnIndex] || '';
    
    console.log(`\n👤 CLIENTE (columna ${clienteColumnIndex}):`);
    console.log('─'.repeat(40));
    console.log(clienteColumn);
    console.log('─'.repeat(40));
    
    console.log(`\n📋 INFO GNAL + INFO COMPRA INT (columna ${infoColumnIndex}):`);
    console.log('─'.repeat(40));
    console.log(infoColumn);
    console.log('─'.repeat(40));
    
    // Verificar contenido
    const hasGiros = infoColumn.includes('VALOR SOLICITADO') || infoColumn.includes('NÚMERO DE GIRO');
    const hasLiberaciones = infoColumn.includes('Liberación') && infoColumn.includes('Capital');
    const isPrueba2 = clienteColumn.toLowerCase().includes('prueba');
    
    console.log(`\n🔍 ANÁLISIS DE CONTENIDO:`);
    console.log(`   ✅ Es PRUEBA?: ${isPrueba2}`);
    console.log(`   ✅ Tiene giros?: ${hasGiros}`);
    console.log(`   ✅ Tiene liberaciones?: ${hasLiberaciones}`);
    
    if (hasGiros) {
        console.log(`\n💰 DATOS DE GIROS ENCONTRADOS:`);
        const giroMatches = infoColumn.match(/VALOR SOLICITADO:\s*([0-9,]+)/g);
        if (giroMatches) {
            giroMatches.forEach((match, idx) => {
                console.log(`   Giro ${idx + 1}: ${match}`);
            });
        }
    }
    
    if (hasLiberaciones) {
        console.log(`\n💎 DATOS DE LIBERACIONES ENCONTRADAS:`);
        const liberacionMatches = infoColumn.match(/Liberación\s+(\d+)[^:]*Capital:\s*([0-9,]+)/g);
        if (liberacionMatches) {
            liberacionMatches.forEach((match, idx) => {
                console.log(`   Liberación ${idx + 1}: ${match}`);
            });
        }
    }
    
} else {
    console.log('❌ La fila no tiene suficientes columnas');
    console.log(`   Esperadas: ${Math.max(infoColumnIndex, clienteColumnIndex) + 1}`);
    console.log(`   Encontradas: ${columns.length}`);
}

console.log('\n✅ ANÁLISIS COMPLETADO');