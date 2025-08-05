import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BackendStatusProps {
  className?: string;
  showDetails?: boolean;
}

interface HealthStatus {
  status: 'connected' | 'disconnected' | 'checking';
  message: string;
  details?: {
    database: boolean;
    csvData: boolean;
    lastCheck: string;
  };
}

export default function FKBackendStatus({ className, showDetails = false }: BackendStatusProps) {
  const [status, setStatus] = useState<HealthStatus>({
    status: 'checking',
    message: 'Verificando conexión...'
  });

  const checkBackendHealth = async () => {
    setStatus(prev => ({ ...prev, status: 'checking' }));
    
    try {
      // Check main health endpoint
      const healthResponse = await fetch('http://localhost:3001/health');
      const healthData = await healthResponse.json();

      if (healthResponse.ok && healthData.success) {
        // Check CSV data availability
        let csvDataAvailable = false;
        try {
          const csvResponse = await fetch('http://localhost:3001/api/admin/csv-fields', {
            headers: { 'x-admin-key': 'admin-dev-key' }
          });
          csvDataAvailable = csvResponse.ok;
        } catch {
          csvDataAvailable = false;
        }

        setStatus({
          status: 'connected',
          message: 'Backend conectado',
          details: {
            database: healthData.data?.database || false,
            csvData: csvDataAvailable,
            lastCheck: new Date().toLocaleTimeString('es-ES')
          }
        });
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      setStatus({
        status: 'disconnected',
        message: 'Backend desconectado',
        details: {
          database: false,
          csvData: false,
          lastCheck: new Date().toLocaleTimeString('es-ES')
        }
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'checking':
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!showDetails) {
    // Compact version for header/navbar
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {getStatusIcon()}
        <span className="text-sm text-gray-600">{status.message}</span>
        <button
          onClick={checkBackendHealth}
          className="text-xs text-gray-500 hover:text-primary-600 transition-colors"
          title="Verificar conexión"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Detailed version for dashboard/debug
  return (
    <div className={cn("bg-white rounded-lg border shadow-sm", className)}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {status.status === 'connected' ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Estado del Backend
          </h3>
          <button
            onClick={checkBackendHealth}
            disabled={status.status === 'checking'}
            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-primary-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", status.status === 'checking' && "animate-spin")} />
            Verificar
          </button>
        </div>

        {/* Status Badge */}
        <div className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium mb-4", getStatusColor())}>
          {getStatusIcon()}
          {status.message}
        </div>

        {/* Details */}
        {status.details && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de datos:</span>
                <div className="flex items-center gap-1">
                  {status.details.database ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium">
                    {status.details.database ? 'Conectada' : 'Opcional'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Datos CSV:</span>
                <div className="flex items-center gap-1">
                  {status.details.csvData ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {status.details.csvData ? 'Disponibles' : 'No disponibles'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Última verificación:</span>
                <span>{status.details.lastCheck}</span>
              </div>
            </div>

            {/* Connection Help */}
            {status.status === 'disconnected' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Solución de problemas:
                </h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Verifica que el backend esté corriendo en puerto 3001</li>
                  <li>• Ejecuta: <code className="bg-yellow-100 px-1 rounded">cd backend && npm run dev</code></li>
                  <li>• Verifica que el archivo CSV esté en: <code className="bg-yellow-100 px-1 rounded">backend/src/data/integra_updated_v4.csv</code></li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}