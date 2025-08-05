import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import FKCSVDataViewer from '../components/ui/FKCSVDataViewer';

export default function CSVDataViewer() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Visor de Datos CSV - Integra Control Tower';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/integra-logo.png" 
                alt="Integra" 
                className="h-8 w-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="hidden sm:block w-px h-6 bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                Control Tower MVP
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.name}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{user?.role?.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </a>
                <div className="w-px h-4 bg-gray-300" />
                <span className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg">
                  Datos CSV
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <FKCSVDataViewer />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-600">
              © 2025 Integra Control Tower MVP. Datos en tiempo real desde CSV.
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <span className="text-xs text-gray-500">
                Visor de datos para desarrollo y testing
              </span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Backend conectado</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}