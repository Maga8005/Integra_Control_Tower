/**
 * Script de prueba para verificar el fix del CSV parser
 */

const { CSVProcessor } = require('./dist/services/CSVProcessor');

async function testCSVFix() {
  console.log('🧪 Iniciando prueba del CSV parser mejorado...\n');
  
  try {
    // Obtener estadísticas del archivo
    const stats = await CSVProcessor.getProcessingStats();
    console.log('📊 Estadísticas del archivo CSV:');
    console.log(`   - Archivo existe: ${stats.fileExists}`);
    console.log(`   - Tamaño: ${stats.fileSize} bytes`);
    console.log(`   - Líneas estimadas: ${stats.estimatedRows}`);
    console.log(`   - Última modificación: ${stats.lastModified}\n`);
    
    // Procesar archivo CSV completo
    console.log('🔄 Procesando archivo CSV...');
    const result = await CSVProcessor.processCSVFile();
    
    console.log('\n📋 RESULTADO DEL PROCESAMIENTO:');
    console.log(`   ✅ Éxito: ${result.success}`);
    console.log(`   📄 Total procesado: ${result.totalProcessed} filas`);
    console.log(`   ✅ Operaciones válidas: ${result.validOperations}`);
    console.log(`   ❌ Errores: ${result.errors.length}`);
    console.log(`   ⚠️ Warnings: ${result.warnings.length}\n`);
    
    if (result.errors.length > 0) {
      console.log('❌ ERRORES ENCONTRADOS:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    if (result.warnings.length > 0) {
      console.log('⚠️ WARNINGS ENCONTRADOS:');
      result.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      if (result.warnings.length > 10) {
        console.log(`   ... y ${result.warnings.length - 10} más\n`);
      }
    }
    
    if (result.data && result.data.length > 0) {
      console.log('📊 MUESTRA DE OPERACIONES PROCESADAS:');
      result.data.slice(0, 3).forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.clienteCompleto}`);
        console.log(`      - Valor: $${op.valorTotal.toLocaleString()} ${op.moneda}`);
        console.log(`      - Progreso: ${op.progresoGeneral}%`);
        console.log(`      - Persona asignada: ${op.personaAsignada || 'No asignada'}`);
        console.log('');
      });
    }
    
    console.log('✅ Procesamiento completado exitosamente!');
    
    if (result.validationReport) {
      console.log('\n' + result.validationReport);
    }
    
    if (result.dateReport) {
      console.log('\n' + result.dateReport);
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error(error.stack);
  }
}

// Ejecutar prueba
testCSVFix();