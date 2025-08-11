/**
 * Configuración de entorno para la aplicación
 * Integra Control Tower MVP
 */

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  useMockBackend: boolean;
}

// Detectar el entorno basado en la URL y hostname
const currentUrl = window.location.href;
const hostname = window.location.hostname;
const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
const isProduction = !isDevelopment;

// Para mayor seguridad, también verificar si estamos en Netlify
const isNetlify = hostname.includes('netlify.app') || hostname.includes('netlify.com');

// URLs de Supabase Edge Functions
const SUPABASE_FUNCTIONS_URL = 'https://gfdaygaujovmyuqtehrv.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZGF5Z2F1am92bXl1cXRlaHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzg1NjIsImV4cCI6MjA3MDUxNDU2Mn0.YYDQebWyZdLedP9MNrQ-63BFclO21yrrQv4P7Qujc90';

// Configuración del entorno
export const environment: EnvironmentConfig = {
  apiBaseUrl: SUPABASE_FUNCTIONS_URL, // Siempre usar Supabase
  isDevelopment,
  isProduction: isProduction || isNetlify,
  useMockBackend: false, // Siempre usar Supabase
};

// Headers para Supabase
export const supabaseHeaders = {
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'apikey': SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
};

console.log('🌍 Configuración de entorno:', {
  currentUrl,
  hostname,
  isDevelopment: environment.isDevelopment,
  isProduction: environment.isProduction,
  isNetlify,
  useMockBackend: environment.useMockBackend,
  apiBaseUrl: environment.apiBaseUrl
});

// Log adicional para debugging
if (environment.useMockBackend) {
  console.log('📦 USANDO MOCK BACKEND - No se conectará a localhost:3001');
} else {
  console.log('🔗 USANDO BACKEND REAL - Conectará a:', environment.apiBaseUrl);
}