/**
 * Script de testing para verificar la integración frontend-backend
 * Ejecutar: node test-frontend-integration.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Frontend-Backend Integration\n');

// Configuración
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';
const CSV_FILE_PATH = path.join(__dirname, 'backend', 'src', 'data', 'integra_updated_v4.csv');

// Helper para hacer requests HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'x-admin-key': 'admin-dev-key',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Tests principales
async function runIntegrationTests() {
  console.log('📋 Checklist de Integración Frontend-Backend\n');

  let allTestsPassed = true;

  // Test 1: Verificar archivo CSV
  console.log('1️⃣ Verificando archivo CSV...');
  if (fs.existsSync(CSV_FILE_PATH)) {
    const stats = fs.statSync(CSV_FILE_PATH);
    console.log(`   ✅ Archivo encontrado: ${(stats.size / 1024).toFixed(1)} KB`);
    
    // Contar líneas
    const content = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    console.log(`   ✅ Líneas en el archivo: ${lines.length} (incluyendo cabecera)`);
  } else {
    console.log(`   ❌ Archivo CSV no encontrado en: ${CSV_FILE_PATH}`);
    console.log(`   💡 Coloca el archivo integra_updated_v4.csv en esa ubicación`);
    allTestsPassed = false;
  }

  // Test 2: Verificar backend health
  console.log('\n2️⃣ Verificando backend...');
  try {
    const health = await makeRequest(`${BACKEND_URL}/health`);
    if (health.statusCode === 200 && health.data.success) {
      console.log(`   ✅ Backend corriendo en puerto 3001`);
      console.log(`   ✅ Base de datos: ${health.data.data.database ? 'Conectada' : 'Opcional'}`);
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.log(`   ❌ Backend no responde`);
    console.log(`   💡 Ejecuta: cd backend && npm run dev`);
    allTestsPassed = false;
  }

  // Test 3: Verificar endpoints admin
  console.log('\n3️⃣ Verificando endpoints admin...');
  try {
    const fields = await makeRequest(`${BACKEND_URL}/api/admin/csv-fields`);
    if (fields.statusCode === 200 && fields.data.success) {
      console.log(`   ✅ CSV Fields endpoint: ${fields.data.data.fields.length} campos`);
    } else {
      throw new Error('CSV Fields endpoint failed');
    }

    const csvData = await makeRequest(`${BACKEND_URL}/api/admin/csv-data`);
    if (csvData.statusCode === 200 && csvData.data.success) {
      console.log(`   ✅ CSV Data endpoint: ${csvData.data.data.data.length} registros`);
    } else {
      throw new Error('CSV Data endpoint failed');
    }
  } catch (error) {
    console.log(`   ❌ Endpoints admin no funcionan: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 4: Verificar endpoint de operaciones
  console.log('\n4️⃣ Verificando endpoint de operaciones...');
  try {
    const operations = await makeRequest(`${BACKEND_URL}/api/operations`);
    if (operations.statusCode === 200 && operations.data.success) {
      console.log(`   ✅ Operations endpoint: ${operations.data.data.data.length} operaciones procesadas`);
    } else {
      throw new Error('Operations endpoint failed');
    }
  } catch (error) {
    console.log(`   ❌ Endpoint de operaciones no funciona: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 5: Verificar CORS
  console.log('\n5️⃣ Verificando CORS...');
  try {
    const corsTest = await makeRequest(`${BACKEND_URL}/api/admin/csv-fields`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'x-admin-key': 'admin-dev-key'
      }
    });
    
    if (corsTest.headers['access-control-allow-origin']) {
      console.log(`   ✅ CORS configurado correctamente`);
    } else {
      console.log(`   ⚠️ CORS headers no encontrados, pero puede funcionar`);
    }
  } catch (error) {
    console.log(`   ❌ Error verificando CORS: ${error.message}`);
  }

  // Test 6: Verificar estructura de archivos frontend
  console.log('\n6️⃣ Verificando archivos frontend...');
  const frontendFiles = [
    'src/hooks/useCSVData.tsx',
    'src/components/ui/FKCSVDataViewer.tsx',
    'src/pages/CSVDataViewer.tsx',
    'src/components/ui/FKBackendStatus.tsx'
  ];

  let frontendFilesOk = true;
  frontendFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} no encontrado`);
      frontendFilesOk = false;
    }
  });

  if (frontendFilesOk) {
    console.log(`   ✅ Todos los archivos frontend están presentes`);
  } else {
    console.log(`   ❌ Faltan archivos frontend`);
    allTestsPassed = false;
  }

  // Resumen final
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('\n✅ El sistema está listo para usar:');
    console.log('   1. Backend corriendo en http://localhost:3001');
    console.log('   2. Datos CSV disponibles y procesándose');
    console.log('   3. Endpoints admin funcionando');
    console.log('   4. Archivos frontend presentes');
    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Inicia el frontend: npm run dev');
    console.log('   2. Ve a: http://localhost:5173');
    console.log('   3. Inicia sesión y haz clic en "Datos CSV"');
    console.log('   4. Explora los datos en ambas pestañas');
  } else {
    console.log('❌ ALGUNOS TESTS FALLARON');
    console.log('\n🔧 Pasos de solución:');
    console.log('   1. Asegúrate de que el backend esté corriendo');
    console.log('   2. Verifica que el archivo CSV esté en la ubicación correcta');
    console.log('   3. Ejecuta: cd backend && npm install && npm run dev');
    console.log('   4. Ejecuta: npm install && npm run dev (en el directorio raíz)');
  }
  console.log('='.repeat(50));
}

// Ejecutar tests
runIntegrationTests().catch(error => {
  console.error('❌ Error ejecutando tests:', error.message);
  process.exit(1);
});