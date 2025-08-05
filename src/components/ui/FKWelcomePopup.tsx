import { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface FKWelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  userName?: string;
  className?: string;
}

export default function FKWelcomePopup({ 
  isOpen, 
  onClose, 
  onProceed, 
  userName = "Usuario",
  className 
}: FKWelcomePopupProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleProceed = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onProceed();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-200",
        isAnimating ? "opacity-100" : "opacity-0",
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className={cn(
          "relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all duration-200 max-h-[90vh] overflow-y-auto",
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary-100" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">¡Bienvenido a Integra!</h1>
              <p className="text-primary-100 text-sm">Hola {userName}, comenzemos tu primera operación</p>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-primary-50 text-sm leading-relaxed">
              Estás a punto de crear tu primera solicitud de financiamiento. Te guiaremos paso a paso 
              para que tengas la mejor experiencia posible.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What is Nueva Operación */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-coral-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">¿Qué es "Nueva Operación"?</h2>
            </div>
            
            <p className="text-gray-600 leading-relaxed">
              El botón <strong>"Nueva Operación"</strong> te permite solicitar financiamiento para tus importaciones. 
              Através de un formulario simple, podrás detallar tu operación y recibir una evaluación 
              preliminar de tu solicitud.
            </p>
          </div>

          {/* Process Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Proceso de Aprobación
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-primary-600">1</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Solicitud</h4>
                <p className="text-xs text-gray-600 mt-1">Completas el formulario con los detalles</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-coral-600">2</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Estudio Preliminar</h4>
                <p className="text-xs text-gray-600 mt-1">Evaluamos tu solicitud en 48-72 horas</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-success-600">3</span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm">Respuesta</h4>
                <p className="text-xs text-gray-600 mt-1">Te contactamos con el resultado</p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Información Importante
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-orange-900 text-sm">Estudio Preliminar</h4>
                  <p className="text-sm text-orange-800 mt-1">
                    La aprobación inicial depende de un estudio preliminar de tu perfil crediticio y 
                    la viabilidad de la operación. No todas las solicitudes son aprobadas automáticamente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <FileText className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-primary-900 text-sm">Documentación Completa</h4>
                  <p className="text-sm text-primary-800 mt-1">
                    Es fundamental que proporciones información completa y documentación actualizada. 
                    Esto acelera significativamente el proceso de evaluación.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Reminder */}
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-success-900 text-sm mb-2">¿Por qué elegir Integra?</h4>
                <ul className="text-sm text-success-800 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success-600" />
                    Financiamiento hasta 100% del valor
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success-600" />
                    Logística puerta a puerta incluida
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success-600" />
                    Un solo interlocutor para todo el proceso
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            <p>¿Tienes dudas? Contáctanos en <strong>soporte@integra.com</strong></p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleProceed}
              className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              Entendido, Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}