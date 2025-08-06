/**
 * Script para encontrar el ID real del registro PRUEBA 2
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFile = 'backend/src/data/integra_co_data.csv';
const filePath = path.join(__dirname, csvFile);

console.log('🔍 BUSCANDO ID DE PRUEBA 2');
console.log('='.repeat(40));

if (!fs.existsSync(filePath)) {
    console.log('❌ Archivo no encontrado:', csvFile);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`📊 Total de líneas: ${lines.length}`);

// Buscar línea que contiene PRUEBA 2
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('PRUEBA 2')) {
        console.log(`\n✅ ENCONTRADO EN LÍNEA ${i + 1}:`);
        
        // Buscar hacia arrás hasta encontrar el inicio del registro (que empieza con <#C)
        let recordStart = i;
        while (recordStart > 0 && !lines[recordStart].startsWith('<#C')) {
            recordStart--;
        }
        
        if (lines[recordStart].startsWith('<#C')) {
            console.log(`📋 Línea del registro: ${recordStart + 1}`);
            
            // Extraer el ID (está después de <# y antes de |>)
            const idMatch = lines[recordStart].match(/<#([^|]+)\|>/);
            if (idMatch) {
                const realId = idMatch[1];
                console.log(`🆔 ID REAL: ${realId}`);
                
                // Extraer algunos campos para confirmar
                const recordLine = lines[recordStart];
                const columns = recordLine.split(',');
                
                console.log(`\n📄 INFORMACIÓN DEL REGISTRO:`);
                console.log(`   ID: ${realId}`);
                console.log(`   Proceso: ${columns[4] || 'No disponible'}`);
                console.log(`   Persona asignada: ${columns[32] || 'No disponible'}`);
                
                console.log(`\n🔗 URL para probar:`);
                console.log(`   http://localhost:3001/api/operations/${realId}`);
                
            } else {
                console.log('❌ No se pudo extraer el ID del registro');
            }
        } else {
            console.log('❌ No se encontró el inicio del registro');
        }
        
        break;
    }
}

console.log('\n✅ BÚSQUEDA COMPLETADA');