/**
 * Aplicación principal Express para Integra Control Tower Backend
 * MVP de sistema de financiamiento de importaciones
 */

import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Importar configuración de base de datos
import { initializeDatabase, closeDatabase, checkDatabaseHealth } from './config/database';

// Importar tipos
import { ApiResponse } from './types/Operation';

// Importar parser para endpoint de testing
import { parseOperationInfo } from './services/OperationInfoParser';

// Importar controllers
import { OperationController } from './controllers/OperationController';
import { AdminController } from './controllers/AdminController';

// Importar rutas
import authRoutes from './routes/auth';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Express
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware de logging personalizado
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  
  console.log(`🔵 [${new Date().toISOString()}] ${req.method} ${req.path} - Request ID: ${requestId}`);
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`🟢 [${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - Request ID: ${requestId}`);
  });
  
  next();
};

// Middleware de manejo de errores
const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`❌ [${new Date().toISOString()}] Error:`, {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    requestId: req.headers['x-request-id'],
    path: req.path,
    method: req.method
  });

  const response: ApiResponse<null> = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    errors: process.env.NODE_ENV === 'development' 
      ? [error.message] 
      : ['Error interno del servidor'],
    timestamp: new Date().toISOString()
  };

  res.status(500).json(response);
};

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Configuración CORS
const corsOptions = {
  origin: "*",  // Permitir cualquier origen para testing
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-admin-key']
};

app.use(cors(corsOptions));

// Middleware de compresión
app.use(compression());

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Ruta raíz
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Integra Control Tower Backend API v1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api_info: '/api',
      admin_csv_data: '/api/admin/csv-data',
      admin_csv_fields: '/api/admin/csv-fields',
      admin_upload_csv: '/api/admin/upload-csv',
      admin_process_mexico: '/api/admin/process-mexico-csv',
      admin_country_comparison: '/api/admin/country-comparison',
      admin_upload_country: '/api/admin/upload-country-csv/:country', // NUEVO UNIFICADO
      admin_country_data: '/api/admin/country-data/:country', // NUEVO UNIFICADO
      admin_countries: '/api/admin/countries', // NUEVO UNIFICADO
      operations: '/api/operations',
      dashboard: '/api/operations/dashboard'
    },
    documentation: 'Ver ADMIN_ENDPOINTS.md para más información'
  } as ApiResponse<any>);
});

// Rutas de salud del sistema
app.get('/health', async (_req: Request, res: Response) => {
  const healthCheck: ApiResponse<{
    status: string;
    timestamp: string;
    uptime: number;
    database: boolean;
    environment: string;
    version: string;
  }> = {
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await checkDatabaseHealth(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(healthCheck);
});

// Ruta de información de la API
app.get('/api', (_req: Request, res: Response) => {
  const apiInfo: ApiResponse<{
    name: string;
    version: string;
    description: string;
    endpoints: string[];
  }> = {
    success: true,
    data: {
      name: 'Integra Control Tower API',
      version: '1.0.0',
      description: 'API para sistema de financiamiento de importaciones',
      endpoints: [
        'GET /health - Health check del sistema',
        'GET /api - Información de la API',
        'POST /api/auth/client-login - Autenticación de clientes por NIT/RFC',
        'GET /api/auth/test-login/:nit - Test login desde navegador (desarrollo)',
        'POST /api/auth/validate-token - Validación de token de cliente',
        'GET /api/auth/test-nits - Ver NITs disponibles (desarrollo)',
        'GET /api/operations - Listado de operaciones',
        'GET /api/operations/dashboard - Datos optimizados para dashboard',
        'POST /api/operations - Crear nueva operación',
        'GET /api/operations/:id - Detalle de operación',
        'PUT /api/operations/:id - Actualizar operación',
        'GET /api/admin/csv-data - Datos raw del CSV (admin)',
        'GET /api/admin/csv-fields - Campos del CSV (admin)',
        'POST /api/admin/csv-refresh - Refrescar cache CSV (admin)',
        'POST /api/admin/upload-csv - Cargar nuevo archivo CSV (admin)',
        'POST /api/admin/process-mexico-csv - Procesar CSV específico de México (admin)',
        'GET /api/admin/country-comparison - Comparar estructuras CSV entre países (admin)',
        'POST /api/admin/upload-country-csv/:country - Upload CSV por país unificado (admin)',
        'GET /api/admin/country-data/:country - Obtener datos por país (admin)',
        'GET /api/admin/countries - Listar países disponibles (admin)'
      ]
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(apiInfo);
});

// Endpoint de testing para el parser
app.post('/api/test/parse', (req: Request, res: Response) => {
  try {
    console.log('🧪 Endpoint /api/test/parse llamado');
    
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El campo "text" es requerido y debe ser un string',
        timestamp: new Date().toISOString()
      });
    }

    console.log('📝 Texto recibido para parsing, longitud:', text.length);
    
    // Parsear usando la función principal
    const parsedInfo = parseOperationInfo(text);
    
    const response: ApiResponse<typeof parsedInfo> = {
      success: true,
      data: parsedInfo,
      message: 'Texto parseado exitosamente',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Parsing completado, enviando respuesta');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error en endpoint /api/test/parse:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      message: 'Error interno procesando el texto',
      errors: [error instanceof Error ? error.message : 'Error desconocido'],
      timestamp: new Date().toISOString()
    };

    res.status(500).json(response);
  }
});

// Rutas de operaciones CSV
app.get('/api/operations', OperationController.getAllOperations);
app.get('/api/operations/dashboard', OperationController.getDashboardOperations); // NUEVO ENDPOINT
app.get('/api/operations/stats', OperationController.getOperationStats);
app.get('/api/operations/csv/info', OperationController.getCSVInfo);
app.post('/api/operations/reload', OperationController.reloadOperations);
app.get('/api/operations/:id', OperationController.getOperationById);

// Rutas administrativas
app.get('/api/admin/csv-data', AdminController.getCSVData);
app.get('/api/admin/csv-fields', AdminController.getCSVFields);
app.post('/api/admin/csv-refresh', AdminController.refreshCSVCache);
app.post('/api/admin/upload-csv', AdminController.getUploadMiddleware(), AdminController.uploadCSV);
app.get('/api/admin/process-mexico-csv', AdminController.processMexicoCSV); // Cambiado a GET para testing
app.get('/api/admin/country-comparison', AdminController.compareCountryCSVs);
// NUEVOS ENDPOINTS UNIFICADOS
app.post('/api/admin/upload-country-csv/:country', AdminController.getUploadMiddleware(), AdminController.uploadCountryCSV);
app.get('/api/admin/country-data/:country', AdminController.getCountryData);
app.get('/api/admin/countries', AdminController.getAvailableCountries);

// Rutas de autenticación
app.use('/api/auth', authRoutes);

app.use('/api/documents', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Endpoints de documentos en desarrollo',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  const response: ApiResponse<null> = {
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    errors: ['Endpoint no existe'],
    timestamp: new Date().toISOString()
  };
  
  res.status(404).json(response);
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos (opcional en desarrollo)
    try {
      await initializeDatabase();
    } catch (dbError) {
      console.warn('⚠️  Base de datos no disponible, continuando sin DB para desarrollo');
    }
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor Integra Control Tower ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 API info: http://localhost:${PORT}/api`);
    });

    // Manejo graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔴 Servidor HTTP cerrado');
        
        try {
          await closeDatabase();
          console.log('💤 Aplicación cerrada correctamente');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error durante el cierre:', error);
          process.exit(1);
        }
      });
    };

    // Capturar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Capturar errores no manejados
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Iniciar la aplicación solo si no estamos en testing
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Exportar la app para testing
export default app;