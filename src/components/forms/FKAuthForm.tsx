import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, User, ArrowRight, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useAuthNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

// Form validation schema
const clientAuthSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor ingresa una dirección de correo válida'),
  nit: z
    .string()
    .min(6, 'El NIT/RFC debe tener al menos 6 caracteres')
    .max(15, 'El NIT/RFC no puede tener más de 15 caracteres')
    .regex(/^[A-Z0-9\-\.]+$/i, 'El NIT/RFC solo puede contener letras, números, guiones y puntos'),
});

type ClientAuthFormData = z.infer<typeof clientAuthSchema>;

// No need for role configuration anymore - roles determined automatically

interface FKAuthFormProps {
  onSuccess?: () => void;
  className?: string;
}

export default function FKAuthForm({ onSuccess, className }: FKAuthFormProps) {
  const { loginWithNit, isLoading } = useAuth();
  const { notifyLoginSuccess, notifyLoginError } = useAuthNotifications();
  const [authError, setAuthError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientAuthFormData>({
    resolver: zodResolver(clientAuthSchema),
    defaultValues: {
      email: '',
      nit: ''
    }
  });

  const onSubmit = async (data: ClientAuthFormData) => {
    setAuthError('');
    
    try {
      console.log('🔐 Iniciando login con datos:', { email: data.email, nit: data.nit });
      
      // Store email in localStorage for future reference
      localStorage.setItem('integra-client-email', data.email);
      
      // Authenticate with NIT
      const result = await loginWithNit(data.nit);
      
      if (result.success) {
        notifyLoginSuccess(`${data.email} (NIT: ${data.nit})`);
        onSuccess?.();
      } else {
        const errorMessage = result.error || 'Error de inicio de sesión. Verifica tu NIT/RFC.';
        setAuthError(errorMessage);
        notifyLoginError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
      setAuthError(errorMessage);
      notifyLoginError(errorMessage);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            Integra Control Tower
          </h1>
          <p className="text-gray-600 text-base">
            Accede a tus operaciones de financiamiento de importación
          </p>
        </div>


        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="email" 
              disabled={isFormLoading}
              className={cn(
                "w-full h-12 pl-12 pr-4 border rounded-lg text-base",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "disabled:bg-gray-50 disabled:text-gray-500",
                errors.email 
                  ? "border-error-500 focus:ring-error-500 focus:border-error-500" 
                  : "border-gray-300"
              )}
              placeholder="Ingresa tu dirección de correo electrónico"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-error-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* NIT/RFC Input */}
        <div className="space-y-2">
          <label htmlFor="nit" className="block text-sm font-medium text-gray-700">
            NIT/RFC
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('nit')}
              type="text"
              id="nit" 
              disabled={isFormLoading}
              className={cn(
                "w-full h-12 pl-12 pr-4 border rounded-lg text-base",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "disabled:bg-gray-50 disabled:text-gray-500",
                errors.nit 
                  ? "border-error-500 focus:ring-error-500 focus:border-error-500" 
                  : "border-gray-300"
              )}
              placeholder="Ingresa tu NIT/RFC (ej: OOPA028673PUQ)"
            />
          </div>
          {errors.nit && (
            <p className="text-sm text-error-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.nit.message}
            </p>
          )}
          {/* NIT Helper Text */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-700 mb-1">💡 NITs de prueba disponibles:</p>
            <p>• <code className="bg-blue-100 px-1 rounded">OOPA028673PUQ</code> - Industrial Ltd</p>
            <p>• <code className="bg-blue-100 px-1 rounded">UPIN924835AHU</code> - Asia Exports</p>
            <p>• <code className="bg-blue-100 px-1 rounded">BVAU461954EUD</code> - Tech Solutions</p>
          </div>
        </div>


        {/* Error Message */}
        {authError && (
          <div className="p-4 rounded-lg bg-error-50 border border-error-200">
            <p className="text-sm text-error-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {authError}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isFormLoading}
          className={cn(
            "w-full h-12 px-6 rounded-lg font-medium text-base",
            "transition-all duration-200 flex items-center justify-center gap-2",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isFormLoading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700 text-white hover:shadow-md"
          )}
        >
          {isFormLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Verificando datos...
            </>
          ) : (
            <>
              Acceder al Panel
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Demo Information */}
        <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Acceso al Sistema
          </h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p>Proporciona tu correo electrónico y NIT/RFC para acceder a tus operaciones de financiamiento.</p>
            <div className="bg-white p-2 rounded border">
              <p className="font-medium text-gray-700 mb-1">NITs de prueba disponibles:</p>
              <p>• <code className="bg-gray-100 px-1 rounded">OOPA028673PUQ</code> - Industrial Ltd</p>
              <p>• <code className="bg-gray-100 px-1 rounded">UPIN924835AHU</code> - Asia Exports</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}