import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

// Admin form validation schema
const adminAuthSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor ingresa una dirección de correo válida'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(50, 'La contraseña no puede tener más de 50 caracteres'),
});

type AdminAuthFormData = z.infer<typeof adminAuthSchema>;

interface FKAdminAuthFormProps {
  onSuccess?: () => void;
  onBackToClient?: () => void;
  className?: string;
}

export default function FKAdminAuthForm({ onSuccess, onBackToClient, className }: FKAdminAuthFormProps) {
  const { loginWithAdmin, isLoading } = useAuth();
  const { notifyLoginSuccess, notifyLoginError } = useAuthNotifications();
  const [authError, setAuthError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminAuthFormData>({
    resolver: zodResolver(adminAuthSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: AdminAuthFormData) => {
    setAuthError('');
    
    try {
      console.log('🔐 Iniciando login de administrador:', { email: data.email });
      
      // Authenticate with admin credentials
      const result = await loginWithAdmin(data.email, data.password);
      
      if (result.success) {
        notifyLoginSuccess(`Administrador: ${data.email}`);
        onSuccess?.();
      } else {
        const errorMessage = result.error || 'Error de inicio de sesión de administrador.';
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
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600 text-base">
            Acceso exclusivo para administradores del sistema
          </p>
        </div>

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">
            Email de Administrador
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              id="admin-email" 
              disabled={isFormLoading}
              className={cn(
                "w-full h-12 pl-12 pr-4 border rounded-lg text-base",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "disabled:bg-gray-50 disabled:text-gray-500",
                errors.email 
                  ? "border-error-500 focus:ring-error-500 focus:border-error-500" 
                  : "border-gray-300"
              )}
              placeholder="admin@integra.com"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-error-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password')}
              type="password"
              id="admin-password" 
              disabled={isFormLoading}
              className={cn(
                "w-full h-12 pl-12 pr-4 border rounded-lg text-base",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "disabled:bg-gray-50 disabled:text-gray-500",
                errors.password 
                  ? "border-error-500 focus:ring-error-500 focus:border-error-500" 
                  : "border-gray-300"
              )}
              placeholder="Ingresa tu contraseña"
            />
          </div>
          {errors.password && (
            <p className="text-sm text-error-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.password.message}
            </p>
          )}
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
              Verificando credenciales...
            </>
          ) : (
            <>
              Acceder al Panel Admin
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Back to Client Login */}
        {onBackToClient && (
          <button
            type="button"
            onClick={onBackToClient}
            disabled={isFormLoading}
            className="w-full text-sm text-gray-600 hover:text-primary-600 transition-colors disabled:opacity-50"
          >
            ← Volver al login de clientes
          </button>
        )}

        {/* Demo Information for MVP */}
        <div className="mt-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <h4 className="text-sm font-medium text-orange-700 mb-2">
            🔧 Credenciales de Administrador (MVP)
          </h4>
          <div className="text-xs text-orange-600 space-y-1">
            <p><strong>Email:</strong> <code className="bg-orange-100 px-1 rounded">admin@integra.com</code></p>
            <p><strong>Password:</strong> <code className="bg-orange-100 px-1 rounded">IntegraMVP2025!</code></p>
            <p className="text-orange-500 mt-2">⚠️ Solo para desarrollo - no usar en producción</p>
          </div>
        </div>
      </form>
    </div>
  );
}