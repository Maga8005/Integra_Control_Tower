import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FKAuthForm from '../components/forms/FKAuthForm';
import { Shield } from 'lucide-react';

// Login component that uses the auth context (AuthProvider is now in App.tsx)
export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLoginSuccess = () => {
    navigate('/dashboard', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-coral-100 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-50 rounded-full opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <FKAuthForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Admin Access Link */}
          <div className="mt-6 text-center">
            <Link 
              to="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50"
            >
              <Shield className="h-4 w-4" />
              Acceso de Administrador
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 Integra Trade Finance. Todos los derechos reservados.
            </p>
            <div className="mt-2 flex items-center justify-center gap-6 text-xs text-gray-400">
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
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
    </div>
  );
}