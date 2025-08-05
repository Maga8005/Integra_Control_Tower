/**
 * Test para verificar extracción de liberaciones
 */

// Datos de ejemplo de la fila 6 (MALE - operación completada)
const testData = `- CLIENTE: MALE
- PAÍS IMPORTADOR: MÉXICO
- PAÍS EXPORTADOR: CHINA
- VALOR TOTAL DE COMPRA: 100000
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
- VALOR SOLICITADO: 30000
- NÚMERO DE GIRO: 1er Giro a Proveedor
- PORCENTAJE DE GIRO: 30% del total
--------------
- VALOR SOLICITADO: 70000
- NÚMERO DE GIRO: 2do Giro a Proveedor
- PORCENTAJE DE GIRO: 70% del total
---------------
- Liberación 1
- Capital: 
60000 USD
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
---------`;

console.log('🧪 Test de extracción de liberaciones...');

// Simular la función extractLiberaciones mejorada
function testExtractLiberaciones(text) {
  const liberaciones = [];
  
  // Dividir texto en bloques usando separadores comunes
  const blocks = text.split(/(?:-{3,}|_{3,}|\n-{2,}\n)/);
  
  for (const block of blocks) {
    if (block.includes('Liberación') && block.includes('Capital') && block.includes('Fecha')) {
      
      // Extraer número de liberación
      const numeroMatch = block.match(/Liberación\s+(\d+)/i);
      const numero = numeroMatch ? parseInt(numeroMatch[1]) : liberaciones.length + 1;
      
      // Extraer capital
      const capitalPatterns = [
        /Capital:\s*\n(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
        /Capital:\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*USD/i,
        /Capital:\s*\n(\d+(?:,\d{3})*(?:\.\d+)?)/i,
        /Capital:\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i
      ];
      
      let capital = 0;
      for (const pattern of capitalPatterns) {
        const match = block.match(pattern);
        if (match && match[1]) {
          capital = parseFloat(match[1].replace(/,/g, ''));
          break;
        }
      }
      
      // Extraer fecha
      const fechaMatch = block.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})/i);
      const fecha = fechaMatch ? fechaMatch[1] : '';
      
      if (capital > 0 && fecha) {
        // Solo incluir fechas pasadas (ejecutadas)
        const fechaObj = new Date(fecha);
        const ahora = new Date();
        
        if (fechaObj <= ahora) {
          liberaciones.push({
            numero,
            capital,
            fecha,
            estado: 'COMPLETADO'
          });
          
          console.log(`💰 Liberación ejecutada: ${numero} - $${capital.toLocaleString()} USD - ${fecha}`);
        }
      }
    }
  }
  
  return liberaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

const result = testExtractLiberaciones(testData);

console.log('\n✅ Resultado del test:');
console.log(`📊 Total liberaciones ejecutadas: ${result.length}`);

if (result.length > 0) {
  const totalLiberado = result.reduce((sum, lib) => sum + lib.capital, 0);
  console.log(`💰 Total liberado: $${totalLiberado.toLocaleString()} USD`);
  console.log(`📈 Progreso: ${Math.round((totalLiberado / 100000) * 100)}% del valor total`);
  
  console.log('\n📋 Detalle de liberaciones:');
  result.forEach(lib => {
    console.log(`  - Liberación ${lib.numero}: $${lib.capital.toLocaleString()} USD (${lib.fecha})`);
  });
} else {
  console.log('❌ No se encontraron liberaciones ejecutadas');
}

console.log('\n🎯 Lo que se mostrará en el frontend:');
console.log('Sección: Información Financiera > Liberaciones Ejecutadas');
result.forEach(lib => {
  const fechaFormateada = new Date(lib.fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  });
  console.log(`  Liberación ${lib.numero}: $${lib.capital.toLocaleString()} USD (${fechaFormateada})`);
});