/**
 * Script de testing para endpoints administrativos
 * Ejecutar: node test-admin-endpoints.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const ADMIN_KEY = 'admin-dev-key';

// Función helper para hacer requests
function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Función para mostrar resultados
function logResult(testName, result) {
  console.log(`\n🧪 ${testName}`);
  console.log(`📊 Status: ${result.statusCode}`);
  
  if (result.data && typeof result.data === 'object') {
    console.log(`✅ Success: ${result.data.success}`);
    console.log(`📝 Message: ${result.data.message}`);
    
    if (result.data.data) {
      if (Array.isArray(result.data.data.data)) {
        console.log(`📋 Records: ${result.data.data.data.length}`);
      }
      
      if (result.data.data.metadata) {
        const meta = result.data.data.metadata;
        console.log(`🔍 Fields: ${meta.totalFields || meta.fields?.length || 'N/A'}`);
        console.log(`⏰ Updated: ${meta.lastUpdated || 'N/A'}`);
      }
    }
  } else {
    console.log(`📄 Response: ${result.data}`);
  }
  
  if (result.error) {
    console.log(`❌ Error: ${result.error}`);
  }
}

// Tests principales
async function runTests() {
  console.log('🚀 Iniciando tests de endpoints administrativos...\n');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🔑 Admin Key: ${ADMIN_KEY}\n`);

  try {
    // Test 1: Verificar que el servidor está corriendo
    console.log('1️⃣ Verificando servidor...');
    try {
      const healthCheck = await makeRequest('/health');
      logResult('Health Check', healthCheck);
    } catch (error) {
      console.log('❌ Servidor no está corriendo. Inicia el servidor con: npm run dev');
      process.exit(1);
    }

    // Test 2: GET /api/admin/csv-fields
    console.log('\n2️⃣ Testing CSV Fields endpoint...');
    try {
      const fieldsResult = await makeRequest('/api/admin/csv-fields');
      logResult('CSV Fields', fieldsResult);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 3: GET /api/admin/csv-data
    console.log('\n3️⃣ Testing CSV Data endpoint...');
    try {
      const dataResult = await makeRequest('/api/admin/csv-data');
      logResult('CSV Data', dataResult);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 4: GET /api/admin/csv-data?pretty=true
    console.log('\n4️⃣ Testing CSV Data with pretty format...');
    try {
      const prettyResult = await makeRequest('/api/admin/csv-data?pretty=true');
      logResult('CSV Data (Pretty)', prettyResult);
      
      // Verificar que el JSON está formateado
      if (typeof prettyResult.data === 'string' && prettyResult.data.includes('  ')) {
        console.log('✅ Pretty format detectado');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 5: POST /api/admin/csv-refresh
    console.log('\n5️⃣ Testing CSV Refresh endpoint...');
    try {
      const refreshResult = await makeRequest('/api/admin/csv-refresh', 'POST');
      logResult('CSV Refresh', refreshResult);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 6: Test sin admin key (debe fallar)
    console.log('\n6️⃣ Testing sin admin key (debe fallar)...');
    try {
      const noAuthResult = await makeRequest('/api/admin/csv-data', 'GET', { 'x-admin-key': '' });
      logResult('Sin Autenticación', noAuthResult);
      
      if (noAuthResult.statusCode === 403) {
        console.log('✅ Acceso correctamente denegado');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    // Test 7: Verificar endpoint info API
    console.log('\n7️⃣ Verificando info de la API...');
    try {
      const apiInfo = await makeRequest('/api');
      logResult('API Info', apiInfo);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n🎉 Tests completados!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Verificar que el archivo CSV existe en: backend/src/data/integra_updated_v4.csv');
    console.log('   2. Probar endpoints desde el navegador:');
    console.log(`      - ${BASE_URL}/api/admin/csv-fields`);
    console.log(`      - ${BASE_URL}/api/admin/csv-data?pretty=true`);
    console.log('   3. Integrar en el frontend React');

  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

// Ejecutar tests
runTests().catch(console.error);