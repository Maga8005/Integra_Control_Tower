/**
 * Debug específico para el parsing de PRUEBA-02-584638
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = 'backend/src/data/integra_co_data.csv';
const filePath = path.join(__dirname, csvFile);

console.log('🐛 DEBUG: PARSING DE PRUEBA-02-584638');
console.log('='.repeat(50));

if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado:', csvFile);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Buscar el registro que corresponde a PRUEBA 2
let targetLine = null;
let targetLineNumber = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('PRUEBA 2')) {
        // Buscar hacia atrás hasta encontrar el inicio del registro
        let recordStart = i;
        while (recordStart > 0 && !lines[recordStart].startsWith('<#C')) {
            recordStart--;
        }
        
        if (lines[recordStart].startsWith('<#C')) {
            targetLine = lines[recordStart];
            targetLineNumber = recordStart + 1;
            break;
        }
    }
}

if (!targetLine) {
    console.log('❌ No se encontró el registro PRUEBA 2');
    process.exit(1);
}

console.log(`✅ Registro encontrado en línea ${targetLineNumber}`);

// Obtener headers para identificar columnas
const headers = lines[0].split(',').map((h, idx) => ({ name: h.trim(), index: idx }));

// Encontrar las columnas relevantes
const infoGnalIndex = headers.findIndex(h => h.name.includes('5. Info Gnal') || h.name.includes('Info Compra Int'));
const giroProveedorIndex = headers.findIndex(h => h.name.includes('10. Info por GIRO') || h.name.includes('Info por GIRO'));
const clienteIndex = headers.findIndex(h => h.name.includes('1.Docu. Cliente') || h.name.includes('Docu.Cliente'));

console.log(`\n📋 ÍNDICES DE COLUMNAS:`);
console.log(`   "5. Info Gnal + Info Compra Int": ${infoGnalIndex}`);
console.log(`   "10. Info por GIRO Proveedor": ${giroProveedorIndex}`);
console.log(`   "1.Docu. Cliente": ${clienteIndex}`);

// Parsear la línea del registro
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

const columns = parseCSVLine(targetLine);

console.log(`\n📊 Total de columnas parseadas: ${columns.length}`);

// Mostrar contenido de las columnas relevantes
if (infoGnalIndex >= 0 && infoGnalIndex < columns.length) {
    console.log(`\n📄 CONTENIDO "5. Info Gnal + Info Compra Int" (columna ${infoGnalIndex}):`);
    console.log('─'.repeat(60));
    console.log(columns[infoGnalIndex]);
    console.log('─'.repeat(60));
} else {
    console.log(`\n❌ No se pudo acceder a columna "5. Info Gnal + Info Compra Int"`);
}

if (giroProveedorIndex >= 0 && giroProveedorIndex < columns.length) {
    console.log(`\n💰 CONTENIDO "10. Info por GIRO Proveedor" (columna ${giroProveedorIndex}):`);
    console.log('─'.repeat(60));
    console.log(columns[giroProveedorIndex]);
    console.log('─'.repeat(60));
} else {
    console.log(`\n❌ No se pudo acceder a columna "10. Info por GIRO Proveedor"`);
}

if (clienteIndex >= 0 && clienteIndex < columns.length) {
    console.log(`\n👤 CONTENIDO "1.Docu. Cliente" (columna ${clienteIndex}):`);
    console.log('─'.repeat(40));
    console.log(columns[clienteIndex]);
    console.log('─'.repeat(40));
} else {
    console.log(`\n❌ No se pudo acceder a columna "1.Docu. Cliente"`);
}

// Verificar si hay datos de giros y liberaciones
const infoGnalContent = columns[infoGnalIndex] || '';
const giroProveedorContent = columns[giroProveedorIndex] || '';

console.log(`\n🔍 ANÁLISIS DE CONTENIDO:`);

// Buscar giros en ambas columnas
const hasGirosInInfoGnal = infoGnalContent.includes('VALOR SOLICITADO') || infoGnalContent.includes('NÚMERO DE GIRO');
const hasGirosInGiroProveedor = giroProveedorContent.includes('VALOR SOLICITADO') || giroProveedorContent.includes('NÚMERO DE GIRO');

console.log(`   Giros en "Info Gnal": ${hasGirosInInfoGnal}`);
console.log(`   Giros en "Info por GIRO": ${hasGirosInGiroProveedor}`);

// Buscar liberaciones en ambas columnas
const hasLibInInfoGnal = infoGnalContent.includes('Liberación') && infoGnalContent.includes('Capital');
const hasLibInGiroProveedor = giroProveedorContent.includes('Liberación') && giroProveedorContent.includes('Capital');

console.log(`   Liberaciones en "Info Gnal": ${hasLibInInfoGnal}`);
console.log(`   Liberaciones en "Info por GIRO": ${hasLibInGiroProveedor}`);

console.log('\n✅ DEBUG COMPLETADO');