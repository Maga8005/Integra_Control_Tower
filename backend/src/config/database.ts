/**
 * Configuración de base de datos para Integra Control Tower
 * TypeORM + PostgreSQL setup para MVP
 */

import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

// Configuración de la base de datos
export const databaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'integra_control_tower',
  
  // Configuración SSL para producción
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Configuraciones de desarrollo
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  
  // Entidades y migraciones
  entities: [
    path.join(__dirname, '/../entities/*.ts'),
    path.join(__dirname, '/../entities/*.js')
  ],
  migrations: [
    path.join(__dirname, '/../migrations/*.ts'),
    path.join(__dirname, '/../migrations/*.js')
  ],
  subscribers: [
    path.join(__dirname, '/../subscribers/*.ts'),
    path.join(__dirname, '/../subscribers/*.js')
  ],
  
  // Pool de conexiones
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
  }
};

// DataSource principal
export const AppDataSource = new DataSource(databaseConfig);

// Función para inicializar la conexión
export const initializeDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Conexión a la base de datos establecida');
      
      // Ejecutar migraciones pendientes en producción
      if (process.env.NODE_ENV === 'production') {
        await AppDataSource.runMigrations();
        console.log('✅ Migraciones ejecutadas');
      }
    }
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

// Función para cerrar la conexión
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Conexión a la base de datos cerrada');
    }
  } catch (error) {
    console.error('❌ Error cerrando la base de datos:', error);
    throw error;
  }
};

// Función de health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    if (!AppDataSource.isInitialized) {
      return false;
    }
    
    // Query simple para verificar conectividad
    await AppDataSource.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
};

// Configuración para testing
export const testDatabaseConfig = {
  ...databaseConfig,
  database: process.env.DB_TEST_NAME || 'integra_control_tower_test',
  synchronize: true,
  logging: false,
  dropSchema: true,
};

export const TestDataSource = new DataSource(testDatabaseConfig);

// Función para setup de testing
export const initializeTestDatabase = async (): Promise<void> => {
  try {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
      console.log('✅ Test database initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing test database:', error);
    throw error;
  }
};

// Función para cleanup de testing
export const cleanupTestDatabase = async (): Promise<void> => {
  try {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
      console.log('✅ Test database cleaned up');
    }
  } catch (error) {
    console.error('❌ Error cleaning up test database:', error);
    throw error;
  }
};