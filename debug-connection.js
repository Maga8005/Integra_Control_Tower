/**
 * Script de diagnóstico para identificar problemas de conexión
 * Ejecutar: node debug-connection.js
 */

const http = require('http');

async function testConnection(url, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   URL: ${url}`);
  
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'x-admin-key': 'admin-dev-key',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`   ✅ Status: ${res.statusCode}`);
          console.log(`   ✅ Success: ${jsonData.success}`);
          if (jsonData.data && jsonData.data.data) {
            console.log(`   ✅ Records: ${jsonData.data.data.length}`);
          }
          if (jsonData.data && jsonData.data.fields) {
            console.log(`   ✅ Fields: ${jsonData.data.fields.length}`);
          }
          resolve({ success: true, status: res.statusCode, data: jsonData });
        } catch (error) {
          console.log(`   ⚠️ Status: ${res.statusCode}`);
          console.log(`   ⚠️ Response: ${data.substring(0, 200)}...`);
          resolve({ success: false, status: res.statusCode, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Connection Error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`   ❌ Timeout: Request took too long`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.log('🚨 DIAGNÓSTICO DE CONEXIÓN FRONTEND-BACKEND');
  console.log('='.repeat(60));

  // Test 1: Backend Health
  await testConnection('http://localhost:3001/health', 'Backend Health Check');

  // Test 2: API Info
  await testConnection('http://localhost:3001/api', 'API Info Endpoint');

  // Test 3: CSV Fields
  await testConnection('http://localhost:3001/api/admin/csv-fields', 'CSV Fields Admin Endpoint');

  // Test 4: CSV Data
  await testConnection('http://localhost:3001/api/admin/csv-data', 'CSV Data Admin Endpoint');

  // Test 5: Operations
  await testConnection('http://localhost:3001/api/operations', 'Operations Endpoint');

  // Test 6: Operations Stats
  await testConnection('http://localhost:3001/api/operations/stats', 'Operations Stats Endpoint');

  console.log('\n' + '='.repeat(60));
  console.log('🔧 PRÓXIMOS PASOS BASADOS EN RESULTADOS:');
  console.log('');
  console.log('Si todos los tests pasan:');
  console.log('  → El problema está en el frontend (CORS, fetch config, etc.)');
  console.log('');
  console.log('Si fallan los endpoints admin:');
  console.log('  → Problema con autenticación admin o archivo CSV faltante');
  console.log('');
  console.log('Si falla health check:');
  console.log('  → Backend no está corriendo correctamente en puerto 3001');
  console.log('');
  console.log('Si falla operations:');
  console.log('  → Problema procesando el archivo CSV');
  console.log('='.repeat(60));
}

runDiagnostics().catch(console.error);