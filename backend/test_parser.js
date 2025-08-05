// Script para probar el parser sin depender del servidor
const { parseOperationInfo } = require('./dist/services/OperationInfoParser');

const sampleData = `CLIENTE: MALE
PAÍS IMPORTADOR: MÉXICO
PAÍS EXPORTADOR: CHINA
VALOR TOTAL DE COMPRA: 100000
MONEDA DE PAGO SOLICITADO: USD NA
TÉRMINOS DE PAGO: 30% ADVANCE / 70% AGAINST BL COPY
DATOS BANCARIOS
BENEFICIARIO: BANCO BBVA
BANCO: 4567896
DIRECCIÓN: SHANGHAI 10256899
NÚMERO DE CUENTA: 46587966666
SWIFT: BSHANGBB



ICOTERM COMPRA: FOB - SHANGHAI
ICOTERM VENTA: DAP - ZONA FRANCA
OBSERVACIONES:



VALOR SOLICITADO: 30000
NÚMERO DE GIRO: 1er Giro a Proveedor
PORCENTAJE DE GIRO: 30% del total



VALOR SOLICITADO: 70000
NÚMERO DE GIRO: 2do Giro a Proveedor
PORCENTAJE DE GIRO: 70% del total



Liberación 1
Capital: 100000 USD
Fecha: 2025-07-25


NPS

Inconvenientes: No
Descripción inconvenientes: Acabamos muchisimas gracias a todos!
Calificación (1 mala - 5 buena): 5`;

console.log('🧪 Iniciando test del parser...\n');

try {
  const result = parseOperationInfo(sampleData);
  
  console.log('📋 RESULTADO DEL PARSING:\n');
  console.log(JSON.stringify(result, null, 2));
  
  console.log('\n✅ Test completado exitosamente!');
} catch (error) {
  console.error('❌ Error en el test:', error);
}