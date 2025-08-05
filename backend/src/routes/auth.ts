/**
 * Rutas de autenticación para clientes por NIT/RFC y administradores
 * Integra Control Tower MVP
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { 
  findOperationsByNit, 
  generateClientToken, 
  validateNitFormat,
  ClientLoginResult 
} from '../utils/nitUtils';
import { CSVRowData } from '../utils/csvMappers';

const router = express.Router();

// Ruta del archivo CSV
const CSV_FILE_PATH = path.join(__dirname, '../data/integra_updated_v4.csv');

// =============================================
// SISTEMA DE ADMINISTRADOR
// =============================================

// Credenciales hardcodeadas de administrador para MVP
const ADMIN_CREDENTIALS = {
  email: 'admin@integra.com',
  password: 'IntegraMVP2025!'
};

// Interfaces para autenticación de administrador
interface AdminLoginRequest {
  email: string;
  password: string;
}

interface AdminLoginResult {
  success: boolean;
  token?: string;
  admin?: {
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

// Función para generar token JWT de administrador
function generateAdminToken(email: string): string {
  const payload = {
    type: 'admin',
    role: 'administrator',
    email: email,
    name: 'Administrador Integra',
    permissions: ['view_all_operations', 'upload_csv', 'manage_data', 'admin_dashboard'],
    loginTime: Date.now()
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// =============================================
// ENDPOINTS DE AUTENTICACIÓN
// =============================================

/**
 * POST /api/auth/admin-login
 * Autenticación de administrador con credenciales hardcodeadas
 */
router.post('/admin-login', (req: Request, res: Response) => {
  try {
    const { email, password }: AdminLoginRequest = req.body;

    console.log(`🔐 Intento de login admin para email: "${email}"`);

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      } as AdminLoginResult);
    }

    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido'
      } as AdminLoginResult);
    }

    // Validar credenciales
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      console.log(`❌ Credenciales inválidas para: "${email}"`);
      return res.status(401).json({
        success: false,
        error: 'Credenciales de administrador inválidas'
      } as AdminLoginResult);
    }

    // Generar token de administrador
    const token = generateAdminToken(email);

    // Respuesta exitosa
    const response: AdminLoginResult = {
      success: true,
      token,
      admin: {
        email: email,
        name: 'Administrador Integra',
        role: 'administrator'
      }
    };

    console.log(`✅ Login admin exitoso: ${email}`);

    res.json(response);
    return;

  } catch (error) {
    console.error('❌ Error en admin-login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    } as AdminLoginResult);
    return;
  }
});

/**
 * POST /api/auth/client-login
 * Autenticación de cliente por NIT/RFC
 */
router.post('/client-login', (req: Request, res: Response) => {
  try {
    const { nit } = req.body;

    console.log(`🔐 Intento de login para NIT: "${nit}"`);

    // Validar entrada
    if (!nit || typeof nit !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'NIT/RFC es requerido'
      } as ClientLoginResult);
    }

    // Validar formato
    const formatValidation = validateNitFormat(nit);
    if (!formatValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: formatValidation.message
      } as ClientLoginResult);
    }

    // Verificar que existe el archivo CSV
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error('❌ Archivo CSV no encontrado:', CSV_FILE_PATH);
      return res.status(500).json({
        success: false,
        error: 'Datos no disponibles temporalmente'
      } as ClientLoginResult);
    }

    // Leer y parsear CSV
    console.log('📂 Leyendo archivo CSV:', CSV_FILE_PATH);
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    
    const csvData: CSVRowData[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // Manejar BOM si existe
    });

    console.log(`📊 CSV cargado: ${csvData.length} filas`);

    // Buscar operaciones por NIT
    const { operations, clientInfo } = findOperationsByNit(csvData, nit);

    // Verificar si encontramos operaciones
    if (!clientInfo || operations.length === 0) {
      console.log(`❌ No se encontraron operaciones para NIT: "${nit}"`);
      return res.status(404).json({
        success: false,
        error: 'No se encontraron operaciones para este NIT/RFC'
      } as ClientLoginResult);
    }

    // Generar token
    const token = generateClientToken(clientInfo);

    // Respuesta exitosa
    const response: ClientLoginResult = {
      success: true,
      token,
      client: clientInfo,
      operations
    };

    console.log(`✅ Login exitoso: ${clientInfo.name} - ${clientInfo.operationsCount} operaciones`);

    res.json(response);
    return;

  } catch (error) {
    console.error('❌ Error en client-login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    } as ClientLoginResult);
    return;
  }
});

/**
 * POST /api/auth/validate-token
 * Validar token de cliente (opcional para demo)
 */
router.post('/validate-token', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }

    // Decodificar token simple (en producción usar JWT real)
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Validar estructura básica
      if (!payload.nit || !payload.name || !payload.type || payload.type !== 'client') {
        throw new Error('Token inválido');
      }

      // Verificar que no sea muy antiguo (24 horas)
      const tokenAge = Date.now() - payload.loginTime;
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas en ms
      
      if (tokenAge > maxAge) {
        return res.status(401).json({
          success: false,
          error: 'Token expirado'
        });
      }

      res.json({
        success: true,
        client: {
          nit: payload.nit,
          name: payload.name,
          operationsCount: payload.operationsCount
        }
      });
      return;

    } catch (decodeError) {
      res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
      return;
    }

  } catch (error) {
    console.error('❌ Error en validate-token:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
    return;
  }
});

/**
 * GET /api/auth/test-login/:nit
 * Endpoint GET temporal para probar login desde navegador (solo para desarrollo)
 */
router.get('/test-login/:nit', (req: Request, res: Response) => {
  try {
    const { nit } = req.params;

    console.log(`🔐 Test login GET para NIT: "${nit}"`);

    // Validar entrada
    if (!nit || typeof nit !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'NIT/RFC es requerido en la URL'
      } as ClientLoginResult);
    }

    // Validar formato
    const formatValidation = validateNitFormat(nit);
    if (!formatValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: formatValidation.message
      } as ClientLoginResult);
    }

    // Verificar que existe el archivo CSV
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error('❌ Archivo CSV no encontrado:', CSV_FILE_PATH);
      return res.status(500).json({
        success: false,
        error: 'Datos no disponibles temporalmente'
      } as ClientLoginResult);
    }

    // Leer y parsear CSV
    console.log('📂 Leyendo archivo CSV:', CSV_FILE_PATH);
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    
    const csvData: CSVRowData[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // Manejar BOM si existe
    });

    console.log(`📊 CSV cargado: ${csvData.length} filas`);

    // Buscar operaciones por NIT
    const { operations, clientInfo } = findOperationsByNit(csvData, nit);

    // Verificar si encontramos operaciones
    if (!clientInfo || operations.length === 0) {
      console.log(`❌ No se encontraron operaciones para NIT: "${nit}"`);
      return res.status(404).json({
        success: false,
        error: 'No se encontraron operaciones para este NIT/RFC',
        suggestion: 'Prueba con: OOPA028673PUQ, UPIN924835AHU, BVAU461954EUD'
      } as ClientLoginResult);
    }

    // Generar token
    const token = generateClientToken(clientInfo);

    // Respuesta exitosa
    const response: ClientLoginResult = {
      success: true,
      token,
      client: clientInfo,
      operations
    };

    console.log(`✅ Test login exitoso: ${clientInfo.name} - ${clientInfo.operationsCount} operaciones`);

    res.json(response);
    return;

  } catch (error) {
    console.error('❌ Error en test-login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    } as ClientLoginResult);
    return;
  }
});

/**
 * GET /api/auth/test-admin
 * Endpoint GET temporal para probar login admin desde navegador (solo para desarrollo)
 */
router.get('/test-admin', (req: Request, res: Response) => {
  try {
    console.log('🔐 Test admin login GET');

    // Usar credenciales hardcodeadas para el test
    const email = ADMIN_CREDENTIALS.email;
    const password = ADMIN_CREDENTIALS.password;

    // Generar token de administrador
    const token = generateAdminToken(email);

    // Respuesta exitosa con información de prueba
    const response: AdminLoginResult = {
      success: true,
      token,
      admin: {
        email: email,
        name: 'Administrador Integra',
        role: 'administrator'
      }
    };

    console.log(`✅ Test admin login exitoso`);

    res.json({
      ...response,
      credentials_for_testing: {
        email: ADMIN_CREDENTIALS.email,
        password: 'IntegraMVP2025!'
      },
      instructions: 'Usa estas credenciales para hacer POST a /api/auth/admin-login'
    });
    return;

  } catch (error) {
    console.error('❌ Error en test-admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    } as AdminLoginResult);
    return;
  }
});

/**
 * GET /api/auth/test-nits
 * Endpoint de prueba para ver NITs disponibles en CSV (solo para desarrollo)
 */
router.get('/test-nits', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      return res.status(404).json({ error: 'CSV no encontrado' });
    }

    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const csvData: CSVRowData[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true
    });

    // Extraer muestra de NITs para testing
    const nitSamples = csvData.slice(0, 10).map((row, index) => {
      const docuCliente = row['1. Docu. Cliente'] || '';
      const infoGeneral = row['5. Info Gnal + Info Compra Int'] || '';
      
      // Extraer cliente
      const clientMatch = infoGeneral.match(/CLIENTE:\s*(.+?)(?=\n|PAÍS|$)/i);
      const clientName = clientMatch?.[1]?.trim() || 'Cliente no identificado';
      
      return {
        index: index + 1,
        clientName,
        docuCliente: docuCliente.substring(0, 100) + '...',
        // Intentar extraer NIT simple
        possibleNIT: docuCliente.match(/([0-9]{8,12})/)?.[1] || 'No encontrado'
      };
    });

    res.json({
      totalRows: csvData.length,
      samples: nitSamples,
      instructions: 'Usa el campo "possibleNIT" para probar el login'
    });
    return;

  } catch (error) {
    console.error('❌ Error en test-nits:', error);
    res.status(500).json({ error: 'Error procesando CSV' });
    return;
  }
});

export default router;