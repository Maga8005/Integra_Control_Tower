/**
 * Script de prueba para validar extracción de giros y liberaciones
 * con datos reales del CSV
 */

import { parseOperationInfo, extractGiros, extractLiberaciones } from '../services/OperationInfoParser';

// Datos de ejemplo extraídos del CSV real
const SAMPLE_GIROS_DATA = `
- VALOR SOLICITADO: 75000
- NÚMERO DE GIRO: 1° Giro a Proveedor  
- PORCENTAJE DE GIRO: 70% del total

- VALOR SOLICITADO: 25000
- NÚMERO DE GIRO: 2° Giro a Proveedor
- PORCENTAJE DE GIRO: 30% del total
`;

const SAMPLE_LIBERACIONES_DATA = `
- Liberación 1 - Capital: 70,000 EUR - Fecha: 2025-07-01
- Liberación 2 - Capital: 50,000 EUR - Fecha: 2025-09-15

- Liberación 1 - Capital: 35,000 USD - Fecha: 2025-05-20  
- Liberación 2 - Capital: 30,000 USD - Fecha: 2025-07-25
- Liberación 3 - Capital: 25,000 USD - Fecha: 2025-09-30
`;

const COMPLEX_CSV_DATA = `
- CLIENTE: GLOBAL IMPORTS 
- PAÍS IMPORTADOR: MÉXICO 
- PAÍS EXPORTADOR: ALEMANIA 
- VALOR TOTAL DE COMPRA: 120,000 
- MONEDA DE PAGO SOLICITADO: EUR 
- TÉRMINOS DE PAGO: LIBERACIÓN COMPLETA 
*******DATOS BANCARIOS******* 
- BENEFICIARIO: BANCO INTERNACIONAL 
- BANCO: 1234567 
- DIRECCIÓN: HAMBURG 12345 
- NÚMERO DE CUENTA: 987654321 
- SWIFT: DEUTDEFF 
************************* 
- ICOTERM COMPRA: FOB - HAMBURG 
- ICOTERM VENTA: DAP - ZONA FRANCA 
- OBSERVACIONES: Liberación completa de mercancía mediante liberaciones parciales 
----------------------- 
- VALOR SOLICITADO: 120,000 
- NÚMERO DE GIRO: Liberación completa 
- PORCENTAJE DE GIRO: 100% del total 
--------------- 
- Liberación 1 - Capital: 70,000 EUR - Fecha: 2025-07-01 
- Liberación 2 - Capital: 50,000 EUR - Fecha: 2025-09-15 
--------- 
NPS 
- Inconvenientes: No 
- Descripción inconvenientes: Proceso completado exitosamente 
- Calificación (1 mala - 5 buena): 5
`;

console.log('🧪 INICIANDO PRUEBAS DE EXTRACCIÓN DE DATOS\n');

// Test 1: Extracción de giros
console.log('=== TEST 1: EXTRACCIÓN DE GIROS ===');
console.log('Datos de entrada:', SAMPLE_GIROS_DATA.trim());
const girosExtraidos = extractGiros(SAMPLE_GIROS_DATA);
console.log('\n📊 RESULTADOS - GIROS EXTRAÍDOS:');
girosExtraidos.forEach((giro, index) => {
  console.log(`  ${index + 1}. Valor: $${giro.valorSolicitado.toLocaleString()}`);
  console.log(`     Número: ${giro.numeroGiro}`);
  console.log(`     Porcentaje: ${giro.porcentajeGiro}`);
  console.log(`     Estado: ${giro.estado}\n`);
});

// Test 2: Extracción de liberaciones
console.log('\n=== TEST 2: EXTRACCIÓN DE LIBERACIONES ===');
console.log('Datos de entrada:', SAMPLE_LIBERACIONES_DATA.trim());
const liberacionesExtraidas = extractLiberaciones(SAMPLE_LIBERACIONES_DATA);
console.log('\n💰 RESULTADOS - LIBERACIONES EXTRAÍDAS:');
liberacionesExtraidas.forEach((lib, index) => {
  console.log(`  ${index + 1}. Liberación ${lib.numero}`);
  console.log(`     Capital: $${lib.capital.toLocaleString()}`);
  console.log(`     Fecha: ${lib.fecha}`);
  console.log(`     Estado: ${lib.estado}\n`);
});

// Test 3: Parsing completo con datos complejos
console.log('\n=== TEST 3: PARSING COMPLETO ===');
console.log('Datos de entrada:', COMPLEX_CSV_DATA.trim().substring(0, 200) + '...');
const resultadoCompleto = parseOperationInfo(COMPLEX_CSV_DATA);
console.log('\n🔍 RESULTADOS - PARSING COMPLETO:');
console.log(`Cliente: ${resultadoCompleto.cliente}`);
console.log(`País Importador: ${resultadoCompleto.paisImportador}`);
console.log(`País Exportador: ${resultadoCompleto.paisExportador}`);
console.log(`Valor Total: $${resultadoCompleto.valorTotalCompra.toLocaleString()}`);
console.log(`Moneda: ${resultadoCompleto.monedaPago}`);
console.log(`\nGiros encontrados: ${resultadoCompleto.giros.length}`);
resultadoCompleto.giros.forEach((giro, index) => {
  console.log(`  ${index + 1}. ${giro.numeroGiro} - $${giro.valorSolicitado.toLocaleString()} (${giro.porcentajeGiro})`);
});
console.log(`\nLiberaciones encontradas: ${resultadoCompleto.liberaciones.length}`);
resultadoCompleto.liberaciones.forEach((lib, index) => {
  console.log(`  ${index + 1}. Liberación ${lib.numero} - $${lib.capital.toLocaleString()} - ${lib.fecha}`);
});

console.log('\n✅ PRUEBAS COMPLETADAS');