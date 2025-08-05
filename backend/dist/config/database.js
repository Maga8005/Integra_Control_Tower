"use strict";
/**
 * Configuración de base de datos para Integra Control Tower
 * TypeORM + PostgreSQL setup para MVP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestDatabase = exports.initializeTestDatabase = exports.TestDataSource = exports.testDatabaseConfig = exports.checkDatabaseHealth = exports.closeDatabase = exports.initializeDatabase = exports.AppDataSource = exports.databaseConfig = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const path_1 = tslib_1.__importDefault(require("path"));
// Cargar variables de entorno
dotenv_1.default.config();
// Configuración de la base de datos
exports.databaseConfig = {
    type: 'postgres',
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
        path_1.default.join(__dirname, '/../entities/*.ts'),
        path_1.default.join(__dirname, '/../entities/*.js')
    ],
    migrations: [
        path_1.default.join(__dirname, '/../migrations/*.ts'),
        path_1.default.join(__dirname, '/../migrations/*.js')
    ],
    subscribers: [
        path_1.default.join(__dirname, '/../subscribers/*.ts'),
        path_1.default.join(__dirname, '/../subscribers/*.js')
    ],
    // Pool de conexiones
    extra: {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
    }
};
// DataSource principal
exports.AppDataSource = new typeorm_1.DataSource(exports.databaseConfig);
// Función para inicializar la conexión
const initializeDatabase = async () => {
    try {
        if (!exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.initialize();
            console.log('✅ Conexión a la base de datos establecida');
            // Ejecutar migraciones pendientes en producción
            if (process.env.NODE_ENV === 'production') {
                await exports.AppDataSource.runMigrations();
                console.log('✅ Migraciones ejecutadas');
            }
        }
    }
    catch (error) {
        console.error('❌ Error conectando a la base de datos:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
// Función para cerrar la conexión
const closeDatabase = async () => {
    try {
        if (exports.AppDataSource.isInitialized) {
            await exports.AppDataSource.destroy();
            console.log('✅ Conexión a la base de datos cerrada');
        }
    }
    catch (error) {
        console.error('❌ Error cerrando la base de datos:', error);
        throw error;
    }
};
exports.closeDatabase = closeDatabase;
// Función de health check
const checkDatabaseHealth = async () => {
    try {
        if (!exports.AppDataSource.isInitialized) {
            return false;
        }
        // Query simple para verificar conectividad
        await exports.AppDataSource.query('SELECT 1');
        return true;
    }
    catch (error) {
        console.error('❌ Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
// Configuración para testing
exports.testDatabaseConfig = {
    ...exports.databaseConfig,
    database: process.env.DB_TEST_NAME || 'integra_control_tower_test',
    synchronize: true,
    logging: false,
    dropSchema: true,
};
exports.TestDataSource = new typeorm_1.DataSource(exports.testDatabaseConfig);
// Función para setup de testing
const initializeTestDatabase = async () => {
    try {
        if (!exports.TestDataSource.isInitialized) {
            await exports.TestDataSource.initialize();
            console.log('✅ Test database initialized');
        }
    }
    catch (error) {
        console.error('❌ Error initializing test database:', error);
        throw error;
    }
};
exports.initializeTestDatabase = initializeTestDatabase;
// Función para cleanup de testing
const cleanupTestDatabase = async () => {
    try {
        if (exports.TestDataSource.isInitialized) {
            await exports.TestDataSource.destroy();
            console.log('✅ Test database cleaned up');
        }
    }
    catch (error) {
        console.error('❌ Error cleaning up test database:', error);
        throw error;
    }
};
exports.cleanupTestDatabase = cleanupTestDatabase;
//# sourceMappingURL=database.js.map