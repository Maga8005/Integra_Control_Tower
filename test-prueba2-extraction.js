/**
 * Test específico para PRUEBA 2 extraction
 */

import { parseOperationInfo } from './backend/src/services/OperationInfoParser.js';

const PRUEBA2_DATA = `- CLIENTE: MALE
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
- Calificación (1 mala - 5 buena): 5`;

console.log('🧪 PROBANDO EXTRACCIÓN ESPECÍFICA PARA PRUEBA 2');
console.log('='.repeat(60));

console.log('\n📋 Datos de entrada (PRUEBA 2):');
console.log(PRUEBA2_DATA.substring(0, 300) + '...\n');

try {
  const result = parseOperationInfo(PRUEBA2_DATA);
  
  console.log('✅ RESULTADOS DE LA EXTRACCIÓN:');
  console.log(`   Cliente: ${result.cliente}`);
  console.log(`   País Importador: ${result.paisImportador}`);  
  console.log(`   País Exportador: ${result.paisExportador}`);
  console.log(`   Valor Total: $${result.valorTotalCompra.toLocaleString()}`);
  console.log(`   Moneda: ${result.monedaPago}`);
  
  console.log(`\n💰 GIROS EXTRAÍDOS (${result.giros.length} encontrados):`);
  result.giros.forEach((giro, index) => {
    console.log(`   ${index + 1}. Valor: $${giro.valorSolicitado.toLocaleString()}`);
    console.log(`      Número: ${giro.numeroGiro}`);
    console.log(`      Porcentaje: ${giro.porcentajeGiro}`);
    console.log(`      Estado: ${giro.estado}\n`);
  });
  
  console.log(`💎 LIBERACIONES EXTRAÍDAS (${result.liberaciones.length} encontradas):`);
  result.liberaciones.forEach((liberacion, index) => {
    console.log(`   ${index + 1}. Liberación ${liberacion.numero}`);
    console.log(`      Capital: $${liberacion.capital.toLocaleString()}`);
    console.log(`      Fecha: ${liberacion.fecha}`);
    console.log(`      Estado: ${liberacion.estado}\n`);
  });
  
  // Verificar totales
  const totalGiros = result.giros.reduce((sum, g) => sum + g.valorSolicitado, 0);
  const totalLiberaciones = result.liberaciones.reduce((sum, l) => sum + l.capital, 0);
  
  console.log(`📊 RESUMEN:`);
  console.log(`   Total en giros: $${totalGiros.toLocaleString()}`);
  console.log(`   Total en liberaciones: $${totalLiberaciones.toLocaleString()}`);
  console.log(`   Valor total compra: $${result.valorTotalCompra.toLocaleString()}`);
  
  if (totalGiros === result.valorTotalCompra) {
    console.log('✅ Los giros suman el valor total de compra');
  } else {
    console.log('⚠️ Los giros NO suman el valor total de compra');
  }
  
} catch (error) {
  console.error('❌ Error durante la extracción:', error);
}

console.log('\n✅ PRUEBA COMPLETADA');