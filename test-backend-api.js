/**
 * Test para verificar qué datos devuelve el endpoint del backend
 */

import fetch from 'node-fetch';

async function testBackendAPI() {
  try {
    console.log('🌐 Testing backend API endpoint...');
    
    const response = await fetch('http://localhost:3001/api/operations');
    
    if (!response.ok) {
      console.error('❌ API Response not OK:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log('📊 Raw response structure:', JSON.stringify(data, null, 2));
    console.log('📊 Total operations:', data.data?.length || data.length || 0);
    
    // Determinar estructura de datos
    const operations = data.data || data || [];
    
    // Buscar la operación de Advanced Gear Oilfield
    const advancedGearOp = operations.find?.(op => 
      op.clientName?.includes('ADVANCED GEAR OILFIELD') || 
      op.clientName?.includes('Advanced Gear')
    );
    
    if (advancedGearOp) {
      console.log('\n🎯 Advanced Gear Oilfield Operation found:');
      console.log('ID:', advancedGearOp.id);
      console.log('Client Name:', advancedGearOp.clientName);
      console.log('Provider Name:', advancedGearOp.providerName);
      console.log('Route:', advancedGearOp.route);
      console.log('🔍 Incoterms:');
      console.log('  incotermCompra:', advancedGearOp.incotermCompra);
      console.log('  incotermVenta:', advancedGearOp.incotermVenta);
      console.log('  Display would be:', 
        advancedGearOp.incotermCompra && advancedGearOp.incotermVenta 
          ? `${advancedGearOp.incotermCompra} / ${advancedGearOp.incotermVenta}`
          : advancedGearOp.incotermCompra || advancedGearOp.incotermVenta || 'FOB / CIF'
      );
    } else {
      console.log('\n❌ Advanced Gear Oilfield operation not found');
      console.log('Available operations:');
      operations.slice(0, 3).forEach((op, index) => {
        console.log(`  ${index + 1}. ${op.clientName || 'No name'} (ID: ${op.id || 'No ID'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing backend API:', error.message);
  }
}

testBackendAPI();