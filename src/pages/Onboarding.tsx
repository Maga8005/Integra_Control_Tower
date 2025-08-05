import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import FKOnboardingFlow from '../components/ui/FKOnboardingFlow';
import { OnboardingFormData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addNotification } = useNotifications();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleComplete = async (data: OnboardingFormData) => {
    setIsCompleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user data with onboarding information
      if (user) {
        updateUser({
          ...user,
          company: data.companyName,
          // Store additional onboarding data in user context or separate store
        });
      }
      
      setShowSuccess(true);
      
      addNotification({
        type: 'success',
        title: '¡Configuración Completada!',
        message: 'Tu perfil ha sido configurado exitosamente. Ya puedes comenzar a usar Integra Control Tower.',
        duration: 5000
      });
      
      // Redirect to dashboard after success message (or back to where they came from)
      setTimeout(() => {
        const from = new URLSearchParams(window.location.search).get('from');
        navigate(from || '/dashboard');
      }, 3000);
      
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error en la Configuración',
        message: 'Hubo un problema al completar la configuración. Por favor, intenta nuevamente.',
        duration: 5000
      });
      setIsCompleting(false);
    }
  };

  const handleSkip = () => {
    addNotification({
      type: 'info',
      title: 'Configuración Omitida',
      message: 'Puedes completar la configuración más tarde desde tu perfil.',
      duration: 4000
    });
    const from = new URLSearchParams(window.location.search).get('from');
    navigate(from || '/dashboard');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Configuración Completada!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Tu perfil ha sido configurado exitosamente. 
              Serás redirigido al panel de control en unos segundos.
            </p>
            
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-sm text-gray-500">Redirigiendo...</span>
            </div>
            
            <button
              onClick={() => {
                const from = new URLSearchParams(window.location.search).get('from');
                navigate(from || '/dashboard');
              }}
              className="mt-6 text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-6"></div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configurando tu Perfil
            </h2>
            
            <p className="text-gray-600 mb-4">
              Estamos procesando tu información y configurando tu cuenta...
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-success-600 rounded-full"></div>
                <span>Validando información</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                <span>Configurando perfil de riesgo</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span>Preparando panel de control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Integra Control Tower
                  </h1>
                  <p className="text-xs text-gray-500">Configuración Inicial</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-gray-600">
                  Bienvenido, <span className="font-medium">{user.name}</span>
                </div>
              )}
              
              <button
                onClick={handleSkip}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Omitir configuración
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <FKOnboardingFlow 
          onComplete={handleComplete}
          onSkip={handleSkip}
          className="max-w-6xl mx-auto"
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>
                ¿Necesitas ayuda? Contáctanos en{' '}
                <a 
                  href="mailto:soporte@integra.com" 
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  soporte@integra.com
                </a>
                {' '}o al{' '}
                <a 
                  href="tel:+56123456789" 
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  +56 1 2345 6789
                </a>
              </p>
            </div>
            
            <div className="text-xs text-gray-500">
              © 2024 Integra Control Tower. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}