import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, User, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import FKOperationDetail from '../components/ui/FKOperationDetail';
import { NotificationBell } from '../components/ui/FKNotificationCenter';

export default function OperationDetail() {
  const navigate = useNavigate();
  const { operationId } = useParams<{ operationId: string }>();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { showError } = useNotifications();

  // Debug logging for operation ID
  console.log('🔍 [OPERATION DETAIL PAGE] Component loaded:', {
    operationId,
    pathname: window.location.pathname,
    searchParams: window.location.search
  });

  // Redirect if not authenticated  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Validate operation ID
  useEffect(() => {
    if (!operationId) {
      showError('Error', 'ID de operación no válido');
      navigate('/dashboard', { replace: true });
    }
  }, [operationId, navigate, showError]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleRoleSwitch = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading || !user || !operationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de operación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volver al panel"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-primary-700">
                Integra Control Tower
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Panel de Control
              </button>
              <a 
                href="#" 
                className="text-primary-600 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-primary-600"
              >
                Operación Detallada
              </a>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell 
                onClick={() => navigate('/notifications')}
              />

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'client_with_operations' ? 'Cliente con Operaciones' : 
                     user.role === 'client_without_operations' ? 'Cliente Nuevo' : 
                     user.role}
                  </p>
                </div>
                
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-600" />
                  </div>
                )}

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button 
                    onClick={handleRoleSwitch}
                    className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Cambiar de rol"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <FKOperationDetail 
          operationId={operationId}
          onBack={handleBackToDashboard}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © 2024 Integra Trade Finance. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-primary-600 transition-colors">
                Política de Privacidad
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors">
                Términos de Servicio
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors">
                Soporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}