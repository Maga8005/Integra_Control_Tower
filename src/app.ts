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
const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
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
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
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

// Rutas de salud del sistema
app.get('/health', async (req: Request, res: Response) => {
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
app.get('/api', (req: Request, res: Response) => {
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
        'POST /api/auth/login - Autenticación de usuarios',
        'GET /api/operations - Listado de operaciones',
        'POST /api/operations - Crear nueva operación',
        'GET /api/operations/:id - Detalle de operación',
        'PUT /api/operations/:id - Actualizar operación'
      ]
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(apiInfo);
});

// Rutas principales (placeholder para desarrollo)
app.use('/api/auth', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Endpoints de autenticación en desarrollo',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/operations', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Endpoints de operaciones en desarrollo',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/documents', (req: Request, res: Response) => {
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
    // Inicializar base de datos
    await initializeDatabase();
    
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
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
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