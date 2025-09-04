/**
 * Modal NPS contextual para Integra Control Tower
 * Se dispara automáticamente en 3 momentos del timeline: 16.67%, 50%, 100%
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Star, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

// Tipos para las respuestas NPS
interface NPSFormData {
  nps_score: number;
  financing_rating?: number;
  supplier_rating?: number;
  communication_rating?: number;
  payment_timing?: string;
  negotiation_support?: string;
  qualitative_feedback?: string;
  improvement_suggestions?: string;
}

interface NPSModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: string;
  clientId: string;
  stage: 'inicio' | 'mediados' | 'final';
  progressPercentage: number;
  country: 'COL' | 'MEX';
  onSubmit: (data: NPSFormData) => Promise<void>;
}

// Configuración de contextos por etapa
const STAGE_CONFIG = {
  inicio: {
    title: 'Cuéntanos tu experiencia inicial',
    subtitle: 'Tu operación ha sido aprobada y estamos iniciando el proceso',
    context: 'aprobación de cotización',
    color: 'blue'
  },
  mediados: {
    title: 'Evaluemos el proceso hasta ahora',
    subtitle: 'Ya realizamos el primer pago a tu proveedor',
    context: 'gestión de pagos a proveedores',
    color: 'indigo'
  },
  final: {
    title: '¡Felicitaciones! Proceso completado',
    subtitle: 'Tu mercancía ha sido liberada exitosamente',
    context: 'finalización de la operación',
    color: 'green'
  }
};

// Opciones para las evaluaciones específicas
const TIMING_OPTIONS = [
  { value: 'muy_puntual', label: 'Muy puntual' },
  { value: 'puntual', label: 'Puntual' },
  { value: 'regular', label: 'Regular' },
  { value: 'impuntual', label: 'Impuntual' },
  { value: 'muy_impuntual', label: 'Muy impuntual' }
];

const SUPPORT_OPTIONS = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'deficiente', label: 'Deficiente' },
  { value: 'no_aplica', label: 'No aplica' }
];

const FKNPSModal: React.FC<NPSModalProps> = ({
  isOpen,
  onClose,
  operationId,
  clientId,
  stage,
  progressPercentage,
  country,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState<'nps' | 'detailed' | 'feedback' | 'success'>('nps');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  
  const { register, handleSubmit, watch, setValue, reset } = useForm<NPSFormData>();
  const watchedScore = watch('nps_score');

  const config = STAGE_CONFIG[stage];

  // Reset cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      reset();
      setCurrentStep('nps');
      setNpsScore(null);
      setIsSubmitting(false);
    }
  }, [isOpen, reset]);

  // Determinar clasificación NPS
  const getNPSClassification = (score: number): 'promoter' | 'passive' | 'detractor' => {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  };

  // Manejar selección de score NPS
  const handleNPSSelect = (score: number) => {
    console.log(`📊 [NPS MODAL] Score seleccionado: ${score}, Etapa: ${stage}`);
    setNpsScore(score);
    setValue('nps_score', score);
    
    // Lógica de flujo según score y etapa
    setTimeout(() => {
      if (stage === 'mediados' && score < 8) {
        console.log(`📊 [NPS MODAL] Yendo a evaluación detallada`);
        setCurrentStep('detailed');
      } else if (score <= 6) {
        console.log(`📊 [NPS MODAL] Yendo a feedback (detractor)`);
        setCurrentStep('feedback');
      } else {
        // Para promotores y pasivos, enviar directamente
        console.log(`📊 [NPS MODAL] Enviando directamente (promotor/pasivo)`);
        // Usar el score directamente en lugar de depender del estado npsScore
        handleFinalSubmitWithScore(score);
      }
    }, 500);
  };

  // Continuar a feedback desde evaluación detallada
  const handleDetailedNext = (data: Partial<NPSFormData>) => {
    Object.keys(data).forEach(key => {
      setValue(key as keyof NPSFormData, data[key as keyof NPSFormData]);
    });
    
    if (npsScore && npsScore <= 6) {
      setCurrentStep('feedback');
    } else {
      handleFinalSubmit({ ...data, nps_score: npsScore! });
    }
  };

  // Enviar respuesta final con score directo (para promotores/pasivos)
  const handleFinalSubmitWithScore = async (score: number) => {
    console.log(`📊 [NPS MODAL] Enviando con score directo: ${score}`);
    
    setIsSubmitting(true);
    try {
      const finalData = {
        nps_score: score
      };
      console.log(`📊 [NPS MODAL] Datos finales a enviar:`, finalData);
      
      await onSubmit(finalData);
      console.log(`✅ [NPS MODAL] Respuesta enviada exitosamente`);
      setCurrentStep('success');
      setTimeout(() => {
        console.log(`✅ [NPS MODAL] Auto-cerrando modal`);
        onClose();
      }, 3000);
    } catch (error) {
      console.error('❌ [NPS MODAL] Error enviando NPS:', error);
      alert('Error enviando la respuesta. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar respuesta final
  const handleFinalSubmit = async (data: NPSFormData) => {
    console.log(`📊 [NPS MODAL] Enviando respuesta final:`, data);
    console.log(`📊 [NPS MODAL] npsScore actual:`, npsScore);
    
    if (npsScore === null || npsScore === undefined) {
      console.error('❌ [NPS MODAL] npsScore es null/undefined');
      alert('Error: No se ha seleccionado un score NPS válido');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const finalData = {
        ...data,
        nps_score: npsScore
      };
      console.log(`📊 [NPS MODAL] Datos finales a enviar:`, finalData);
      
      await onSubmit(finalData);
      console.log(`✅ [NPS MODAL] Respuesta enviada exitosamente`);
      setCurrentStep('success');
      setTimeout(() => {
        console.log(`✅ [NPS MODAL] Auto-cerrando modal`);
        onClose();
      }, 3000); // Aumenté a 3 segundos para que se vea la pantalla de éxito
    } catch (error) {
      console.error('❌ [NPS MODAL] Error enviando NPS:', error);
      alert('Error enviando la respuesta. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={cn(
          "p-6 border-b",
          config.color === 'blue' && "bg-blue-50 border-blue-200",
          config.color === 'indigo' && "bg-indigo-50 border-indigo-200", 
          config.color === 'green' && "bg-green-50 border-green-200"
        )}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={cn(
                "text-lg font-semibold mb-1",
                config.color === 'blue' && "text-blue-900",
                config.color === 'indigo' && "text-indigo-900",
                config.color === 'green' && "text-green-900"
              )}>
                {config.title}
              </h3>
              <p className={cn(
                "text-sm",
                config.color === 'blue' && "text-blue-700",
                config.color === 'indigo' && "text-indigo-700",
                config.color === 'green' && "text-green-700"
              )}>
                {config.subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'nps' && (
            <NPSScoreStep
              onSelect={handleNPSSelect}
              selectedScore={npsScore}
              config={config}
            />
          )}

          {currentStep === 'detailed' && (
            <DetailedEvaluationStep
              onNext={handleDetailedNext}
              register={register}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {currentStep === 'feedback' && (
            <FeedbackStep
              onSubmit={handleFinalSubmit}
              register={register}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              npsScore={npsScore!}
            />
          )}

          {currentStep === 'success' && (
            <SuccessStep onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

// Componente para selección de score NPS
const NPSScoreStep: React.FC<{
  onSelect: (score: number) => void;
  selectedScore: number | null;
  config: any;
}> = ({ onSelect, selectedScore, config }) => (
  <div className="text-center">
    <div className="mb-6">
      <h4 className="text-lg font-medium mb-2">
        Del 0 al 10, ¿qué tan probable es que recomiendes Integra?
      </h4>
      <p className="text-sm text-gray-600">
        Considerando tu experiencia con {config.context}
      </p>
    </div>

    {/* Escala 0-10 */}
    <div className="flex justify-center space-x-1 mb-4">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            "w-10 h-10 rounded-lg border-2 font-medium transition-all duration-200",
            selectedScore === i
              ? "bg-primary-600 text-white border-primary-600 scale-110"
              : "bg-white text-gray-700 border-gray-300 hover:border-primary-300 hover:bg-primary-50"
          )}
        >
          {i}
        </button>
      ))}
    </div>

    {/* Labels */}
    <div className="flex justify-between text-xs text-gray-500">
      <span>Nada probable</span>
      <span>Muy probable</span>
    </div>
  </div>
);

// Componente para evaluación detallada (solo en etapa 'mediados')
const DetailedEvaluationStep: React.FC<{
  onNext: (data: Partial<NPSFormData>) => void;
  register: any;
  handleSubmit: any;
  isSubmitting: boolean;
}> = ({ onNext, register, handleSubmit, isSubmitting }) => (
  <form onSubmit={handleSubmit(onNext)} className="space-y-6">
    <div className="text-center mb-6">
      <h4 className="text-lg font-medium mb-2">Ayúdanos a mejorar</h4>
      <p className="text-sm text-gray-600">Evalúa aspectos específicos de nuestro servicio</p>
    </div>

    {/* Rating de financiamiento */}
    <StarRating
      label="Gestión del financiamiento"
      name="financing_rating"
      register={register}
    />

    {/* Rating de coordinación con proveedores */}
    <StarRating
      label="Coordinación con proveedores"
      name="supplier_rating"
      register={register}
    />

    {/* Rating de comunicación */}
    <StarRating
      label="Calidad de comunicación"
      name="communication_rating"
      register={register}
    />

    {/* Puntualidad en pagos */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Puntualidad en pagos a proveedores
      </label>
      <select
        {...register('payment_timing')}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">Selecciona una opción</option>
        {TIMING_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>

    {/* Efectividad del apoyo */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Efectividad del apoyo en negociación
      </label>
      <select
        {...register('negotiation_support')}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">Selecciona una opción</option>
        {SUPPORT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>

    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isSubmitting ? 'Enviando...' : 'Continuar'}
    </button>
  </form>
);

// Componente para feedback cualitativo
const FeedbackStep: React.FC<{
  onSubmit: (data: NPSFormData) => void;
  register: any;
  handleSubmit: any;
  isSubmitting: boolean;
  npsScore: number;
}> = ({ onSubmit, register, handleSubmit, isSubmitting, npsScore }) => (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    <div className="text-center mb-6">
      <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-3" />
      <h4 className="text-lg font-medium mb-2">Ayúdanos a mejorar tu experiencia</h4>
      <p className="text-sm text-gray-600">
        Tus comentarios son muy valiosos para nosotros
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ¿Qué podríamos haber hecho mejor?
      </label>
      <textarea
        {...register('qualitative_feedback')}
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        placeholder="Comparte tu experiencia y sugerencias..."
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ¿Tienes alguna sugerencia específica?
      </label>
      <textarea
        {...register('improvement_suggestions')}
        rows={3}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        placeholder="Sugerencias para mejorar nuestro servicio..."
      />
    </div>

    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
    </button>
  </form>
);

// Componente para rating con estrellas
const StarRating: React.FC<{
  label: string;
  name: string;
  register: any;
}> = ({ label, name, register }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              setRating(star);
              // Actualizar react-hook-form
              register(name).onChange({ target: { value: star } });
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-colors"
          >
            <Star
              className={cn(
                "h-8 w-8",
                (hover || rating) >= star
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
      </div>
      <input
        {...register(name)}
        type="hidden"
        value={rating}
      />
    </div>
  );
};

// Componente de éxito
const SuccessStep: React.FC<{ onClose?: () => void }> = ({ onClose }) => (
  <div className="text-center py-8">
    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
    <h4 className="text-lg font-semibold text-green-900 mb-2">
      ¡Gracias por tu feedback!
    </h4>
    <p className="text-sm text-gray-600 mb-4">
      Tu opinión nos ayuda a mejorar continuamente nuestro servicio.
    </p>
    <p className="text-xs text-gray-500 mb-4">
      El modal se cerrará automáticamente en unos segundos...
    </p>
    {onClose && (
      <button
        onClick={onClose}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
      >
        Cerrar
      </button>
    )}
  </div>
);

export default FKNPSModal;