/**
 * Debug específico para el registro C095VK2905C
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = 'backend/src/data/integra_co_data.csv';
const filePath = path.join(__dirname, csvFile);

console.log('🔍 DEBUG: REGISTRO C095VK2905C');
console.log('='.repeat(50));

if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado:', csvFile);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Buscar el registro específico C095VK2905C
let targetLine = null;
let targetLineNumber = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('C095VK2905C')) {
        targetLine = lines[i];
        targetLineNumber = i + 1;
        console.log(`✅ Registro C095VK2905C encontrado en línea ${targetLineNumber}`);
        break;
    }
}

if (!targetLine) {
    console.log('❌ No se encontró el registro C095VK2905C');
    process.exit(1);
}

// Parsear CSV header
const headers = lines[0].split(',').map(h => h.trim());
console.log(`\n📋 Headers disponibles (${headers.length} columnas):`);
headers.forEach((header, index) => {
    if (header.includes('Info Gnal') || header.includes('Info por GIRO') || header.includes('Docu. Cliente')) {
        console.log(`   ${index}: "${header}"`);
    }
});

// Función de parsing CSV mejorada
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
                current += '"';
                i += 2;
            } else if (inQuotes && (nextChar === ',' || nextChar === undefined)) {
                inQuotes = false;
                i++;
            } else if (!inQuotes && (current === '' || current.trim() === '')) {
                inQuotes = true;
                i++;
            } else {
                current += char;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }
    values.push(current);
    
    return values.map(value => {
        if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
            const cleaned = value.slice(1, -1);
            return cleaned.replace(/""/g, '"').trim();
        }
        return value.trim();
    });
}

// Parsear el registro
const values = parseCSVLine(targetLine);
console.log(`\n📊 Registro parseado: ${values.length} columnas`);

// Buscar columnas específicas
const infoGnalIndex = headers.findIndex(h => h.includes('5. Info Gnal') || h.includes('Info Compra Int'));
const giroProveedorIndex = headers.findIndex(h => h.includes('10. Info por GIRO') || h.includes('Info por GIRO'));
const docuClienteIndex = headers.findIndex(h => h.includes('1.Docu. Cliente') || h.includes('Docu.Cliente'));

console.log(`\n🔍 CONTENIDO DE COLUMNAS RELEVANTES:`);

// Mostrar Info Gnal
if (infoGnalIndex >= 0 && infoGnalIndex < values.length) {
    const content = values[infoGnalIndex];
    console.log(`\n📄 "5. Info Gnal + Info Compra Int" (índice ${infoGnalIndex}):`);
    console.log(`   Longitud: ${content.length} caracteres`);
    console.log(`   Contenido:`);
    console.log('─'.repeat(80));
    console.log(content);
    console.log('─'.repeat(80));
    
    // Verificar patrones de giros
    const hasValorSolicitado = content.includes('VALOR SOLICITADO');
    const hasNumeroGiro = content.includes('NÚMERO DE GIRO');
    const hasPorcentajeGiro = content.includes('PORCENTAJE DE GIRO');
    const hasLiberacion = content.includes('Liberación');
    const hasCapital = content.includes('Capital');
    
    console.log(`   ✓ Contiene 'VALOR SOLICITADO': ${hasValorSolicitado}`);
    console.log(`   ✓ Contiene 'NÚMERO DE GIRO': ${hasNumeroGiro}`);
    console.log(`   ✓ Contiene 'PORCENTAJE DE GIRO': ${hasPorcentajeGiro}`);
    console.log(`   ✓ Contiene 'Liberación': ${hasLiberacion}`);
    console.log(`   ✓ Contiene 'Capital': ${hasCapital}`);
} else {
    console.log(`\n❌ No se pudo acceder a columna "5. Info Gnal + Info Compra Int" (índice ${infoGnalIndex})`);
    console.log(`   Total columnas parseadas: ${values.length}`);
    console.log(`   Headers disponibles: ${headers.length}`);
}

// Mostrar Info por GIRO Proveedor
if (giroProveedorIndex >= 0 && giroProveedorIndex < values.length) {
    const content = values[giroProveedorIndex];
    console.log(`\n💰 "10. Info por GIRO Proveedor" (índice ${giroProveedorIndex}):`);
    console.log(`   Contenido: "${content}"`);
} else {
    console.log(`\n❌ No se pudo acceder a columna "10. Info por GIRO Proveedor" (índice ${giroProveedorIndex})`);
}

// Mostrar Docu Cliente
if (docuClienteIndex >= 0 && docuClienteIndex < values.length) {
    const content = values[docuClienteIndex];
    console.log(`\n👤 "1.Docu. Cliente" (índice ${docuClienteIndex}):`);
    console.log(`   Contenido: "${content}"`);
} else {
    console.log(`\n❌ No se pudo acceder a columna "1.Docu. Cliente" (índice ${docuClienteIndex})`);
}

console.log('\n✅ DEBUG COMPLETADO');