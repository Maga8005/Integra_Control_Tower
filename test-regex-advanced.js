/**
 * Test específico para Advanced Gear Incoterms
 */

const advancedGearText = `- CLIENTE: ADVANCED GEAR OILFIELD SERVICES SAS
- PAÍS IMPORTADOR: COLOMBIA
- PAÍS EXPORTADOR: CHINA
- VALOR TOTAL DE COMPRA: 98470
- MONEDA DE PAGO SOLICITADO: USD NA
- TÉRMINOS DE PAGO: 30% ADVANCE / 70% AGAINST BL COPY

*******DATOS BANCARIOS*******

- BENEFICIARIO: CHINA VIGOR DRILLING OIL TOOLS AND EQUIPMENT CO., LTD.
- BANCO: CHINA ZHESHANG BANK CO., LTD.(XI'AN BRANCH)
- DIRECCIÓN: No.16 FENGHUI SOUTH ROAD, YANTA DISTRICT , XI'AN,CHINA (710065)
- NÚMERO DE CUENTA: 7910000011420100035262
- SWIFT: ZJCBCN2N
*************************
- INCOTERM COMPRA: FOB - SHANGHAI
- INCOTERM VENTA: DAP - DAP
- OBSERVACIONES: `;

console.log('🧪 Test regex para Advanced Gear...');

// Test múltiples patrones
const patterns = [
  /I[NC]?COTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERM COMPRA:\s*([A-Z]{3,4})/i,
  /-\s*INCOTERM COMPRA:\s*([A-Z]{3,4})/i
];

const ventaPatterns = [
  /I[NC]?COTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERM VENTA:\s*([A-Z]{3,4})/i,
  /-\s*INCOTERM VENTA:\s*([A-Z]{3,4})/i
];

console.log('\n🔍 Probando patrones de COMPRA:');
patterns.forEach((pattern, i) => {
  const match = advancedGearText.match(pattern);
  console.log(`Patrón ${i + 1}: ${pattern}`);
  console.log(`Resultado: ${match ? match[1] : 'NO MATCH'}`);
  console.log('---');
});

console.log('\n🔍 Probando patrones de VENTA:');
ventaPatterns.forEach((pattern, i) => {
  const match = advancedGearText.match(pattern);
  console.log(`Patrón ${i + 1}: ${pattern}`);
  console.log(`Resultado: ${match ? match[1] : 'NO MATCH'}`);
  console.log('---');
});

// Test final con lógica exacta
console.log('\n🎯 Test con lógica final:');
let incotermCompra = '';
let incotermVenta = '';

for (const pattern of patterns) {
  const match = advancedGearText.match(pattern);
  if (match && match[1]) {
    incotermCompra = match[1].toUpperCase();
    console.log(`✅ Incoterm Compra encontrado: "${incotermCompra}"`);
    break;
  }
}

for (const pattern of ventaPatterns) {
  const match = advancedGearText.match(pattern);
  if (match && match[1]) {
    incotermVenta = match[1].toUpperCase();
    console.log(`✅ Incoterm Venta encontrado: "${incotermVenta}"`);
    break;
  }
}

console.log('\n🎯 Resultado final:');
console.log(`incotermCompra: ${incotermCompra || 'undefined'}`);
console.log(`incotermVenta: ${incotermVenta || 'undefined'}`);
console.log(`Display: ${incotermCompra && incotermVenta ? `${incotermCompra} / ${incotermVenta}` : 'FOB / CIF'}`);