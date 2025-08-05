import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FKAdminAuthForm from '../components/forms/FKAdminAuthForm';

// Admin login component separate from client login
export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Redirect based on user role
      if (user?.role === 'administrator') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleLoginSuccess = () => {
    navigate('/admin/dashboard', { replace: true });
  };

  const handleBackToClient = () => {
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50">
      {/* Background Pattern - More admin-like */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-50 rounded-full opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <FKAdminAuthForm 
              onSuccess={handleLoginSuccess}
              onBackToClient={handleBackToClient}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 Integra Trade Finance - Panel de Administración
            </p>
            <div className="mt-2 flex items-center justify-center gap-6 text-xs text-gray-400">
              <a href="#" className="hover:text-primary-600 transition-colors">
                Soporte Técnico
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors">
                Documentación
              </a>
              <a href="#" className="hover:text-primary-600 transition-colors">
                Seguridad
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </div>
  );
}