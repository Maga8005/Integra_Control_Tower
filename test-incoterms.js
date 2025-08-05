/**
 * Test script para verificar extracción de Incoterms
 */

// Datos reales de Advanced Gear Oilfield desde el CSV
const advancedGearData = `- CLIENTE: ADVANCED GEAR OILFIELD SERVICES SAS
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

console.log('🧪 Testing Incoterms extraction...');
console.log('📄 Data length:', advancedGearData.length);

// Test regex patterns
const incotermPatterns = [
  /ICOTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERM COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERMS COMPRA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i
];

const incotermVentaPatterns = [
  /ICOTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERM VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i,
  /INCOTERMS VENTA:\s*([A-Z]{3,4})(?:\s*[-\s]|$)/i
];

console.log('\n🔍 Testing Incoterm Compra patterns:');
for (let i = 0; i < incotermPatterns.length; i++) {
  const match = advancedGearData.match(incotermPatterns[i]);
  console.log(`Pattern ${i + 1}:`, incotermPatterns[i]);
  console.log(`Match:`, match ? match[1] : 'NO MATCH');
}

console.log('\n🔍 Testing Incoterm Venta patterns:');
for (let i = 0; i < incotermVentaPatterns.length; i++) {
  const match = advancedGearData.match(incotermVentaPatterns[i]);
  console.log(`Pattern ${i + 1}:`, incotermVentaPatterns[i]);
  console.log(`Match:`, match ? match[1] : 'NO MATCH');
}

// Test the actual parsing function logic
function testParsing() {
  console.log('\n🎯 Testing complete parsing logic:');
  
  const cleanText = advancedGearData
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  let incotermCompra = '';
  let incotermVenta = '';

  // Extraer Incoterm de compra
  for (const pattern of incotermPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      incotermCompra = match[1].toUpperCase();
      console.log(`📦 Incoterm Compra extraído: "${incotermCompra}"`);
      break;
    }
  }

  // Extraer Incoterm de venta
  for (const pattern of incotermVentaPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      incotermVenta = match[1].toUpperCase();
      console.log(`🚚 Incoterm Venta extraído: "${incotermVenta}"`);
      break;
    }
  }

  console.log('\n✅ Final result:');
  console.log('incotermCompra:', incotermCompra || 'undefined');
  console.log('incotermVenta:', incotermVenta || 'undefined');
  console.log('Display:', incotermCompra && incotermVenta 
    ? `${incotermCompra} / ${incotermVenta}`
    : incotermCompra || incotermVenta || 'FOB / CIF');
}

testParsing();