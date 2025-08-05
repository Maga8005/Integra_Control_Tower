/**
 * Configuración de base de datos para Integra Control Tower
 * TypeORM + PostgreSQL setup para MVP
 */
import { DataSource } from 'typeorm';
export declare const databaseConfig: {
    type: "postgres";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    synchronize: boolean;
    logging: boolean;
    entities: string[];
    migrations: string[];
    subscribers: string[];
    extra: {
        connectionLimit: number;
        acquireTimeout: number;
        timeout: number;
    };
};
export declare const AppDataSource: DataSource;
export declare const initializeDatabase: () => Promise<void>;
export declare const closeDatabase: () => Promise<void>;
export declare const checkDatabaseHealth: () => Promise<boolean>;
export declare const testDatabaseConfig: {
    database: string;
    synchronize: boolean;
    logging: boolean;
    dropSchema: boolean;
    type: "postgres";
    host: string;
    port: number;
    username: string;
    password: string;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    entities: string[];
    migrations: string[];
    subscribers: string[];
    extra: {
        connectionLimit: number;
        acquireTimeout: number;
        timeout: number;
    };
};
export declare const TestDataSource: DataSource;
export declare const initializeTestDatabase: () => Promise<void>;
export declare const cleanupTestDatabase: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map