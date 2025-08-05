import { useState, useCallback } from 'react';
import { 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Users,
  CreditCard,
  Truck,
  AlertTriangle,
  Info,
  Download,
  Upload,
  CheckSquare,
  Square,
  Star,
  TrendingUp,
  Zap,
  Shield,
  Timer,
  Target
} from 'lucide-react';
import { OnboardingFormData } from '../../types';
import { cn } from '../../utils/cn';

interface FKOnboardingFlowProps {
  onComplete: (data: OnboardingFormData) => void;
  onSkip?: () => void;
  className?: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  checked: boolean;
  description?: string;
}

const INITIAL_STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Bienvenido',
    description: 'Conoce Integra Control Tower',
    icon: Users,
    completed: false
  },
  {
    id: 'comparison',
    title: 'Comparación',
    description: 'Integra vs Paga',
    icon: TrendingUp,
    completed: false
  },
  {
    id: 'timeline',
    title: 'Cronograma',
    description: 'Proceso y tiempos',
    icon: Clock,
    completed: false
  },
  {
    id: 'documents',
    title: 'Documentos',
    description: 'Lista de verificación',
    icon: FileText,
    completed: false
  },
  {
    id: 'setup',
    title: 'Configuración',
    description: 'Datos de la empresa',
    icon: CreditCard,
    completed: false
  }
];

const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: 'rut',
    text: 'RUT de la empresa',
    required: true,
    checked: false,
    description: 'Documento oficial de identificación tributaria'
  },
  {
    id: 'constitución',
    text: 'Escritura de constitución',
    required: true,
    checked: false,
    description: 'Documento legal de creación de la empresa'
  },
  {
    id: 'balances',
    text: 'Estados financieros últimos 2 años',
    required: true,
    checked: false,
    description: 'Balance general y estado de resultados auditados'
  },
  {
    id: 'comercio',
    text: 'Registro de comercio exterior',
    required: true,
    checked: false,
    description: 'Autorización para operaciones de importación'
  },
  {
    id: 'bancarios',
    text: 'Certificados bancarios',
    required: true,
    checked: false,
    description: 'Referencias comerciales y financieras'
  },
  {
    id: 'seguros',
    text: 'Pólizas de seguro',
    required: false,
    checked: false,
    description: 'Seguros de carga y responsabilidad civil'
  },
  {
    id: 'experiencia',
    text: 'Historial de importaciones',
    required: false,
    checked: false,
    description: 'Registro de operaciones anteriores'
  }
];

export default function FKOnboardingFlow({ onComplete, onSkip, className }: FKOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [formData, setFormData] = useState<OnboardingFormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: '',
    expectedVolume: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateStepCompletion = useCallback((stepIndex: number, completed: boolean) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed } : step
    ));
  }, []);

  const validateCurrentStep = (): boolean => {
    const currentStepId = steps[currentStep].id;
    const newErrors: Record<string, string> = {};

    if (currentStepId === 'setup') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'El nombre de la empresa es requerido';
      }
      if (!formData.contactPerson.trim()) {
        newErrors.contactPerson = 'El nombre del contacto es requerido';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Formato de email inválido';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'El teléfono es requerido';
      }
      if (!formData.businessType) {
        newErrors.businessType = 'Selecciona el tipo de negocio';
      }
      if (!formData.expectedVolume) {
        newErrors.expectedVolume = 'Selecciona el volumen esperado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    updateStepCompletion(currentStep, true);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  };

  const getCompletionPercentage = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-10 w-10 text-primary-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ¡Bienvenido a Integra Control Tower!
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                La plataforma inteligente para el financiamiento de tus importaciones
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-coral-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Proceso Rápido</h3>
                <p className="text-sm text-gray-600">
                  Aprobación en 48-72 horas vs 2-3 semanas tradicional
                </p>
              </div>
              
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-success-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">100% Digital</h3>
                <p className="text-sm text-gray-600">
                  Sin papeleo físico, todo gestionado desde la plataforma
                </p>
              </div>
              
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Transparencia</h3>
                <p className="text-sm text-gray-600">
                  Seguimiento en tiempo real de todo el proceso
                </p>
              </div>
            </div>
          </div>
        );

      case 'comparison':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Integra vs Paga: Comparación
              </h2>
              <p className="text-lg text-gray-600">
                Dos enfoques diferentes para el financiamiento de importaciones
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Integra Column */}
              <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary-900">Integra Control Tower</h3>
                  <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full">Solución Integral</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Financiamiento hasta 100%</p>
                      <p className="text-sm text-gray-600">Cubrimos el valor total de la importación</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Compra directa al proveedor</p>
                      <p className="text-sm text-gray-600">Nosotros compramos, tú recibes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Logística puerta a puerta</p>
                      <p className="text-sm text-gray-600">Gestionamos todo el proceso de importación</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Un solo interlocutor</p>
                      <p className="text-sm text-gray-600">Simplificamos toda la cadena</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Liberación parcial disponible</p>
                      <p className="text-sm text-gray-600">Flexibilidad en el cobro</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paga Column */}
              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Timer className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-900">Paga</h3>
                  <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">Solo Financiamiento</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Cupo rotativo hasta USD $2.7M</p>
                      <p className="text-sm text-gray-600">Financiamiento hasta 70% de facturas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Plazos hasta 150 días</p>
                      <p className="text-sm text-gray-600">Respuesta en menos de 48h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Cliente maneja logística</p>
                      <p className="text-sm text-gray-600">Solo proporcionan el financiamiento</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Múltiples intermediarios</p>
                      <p className="text-sm text-gray-600">Debes coordinar con varios proveedores</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Sin afectar endeudamiento bancario</p>
                      <p className="text-sm text-gray-600">Ventaja: mantiene líneas de crédito</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mt-8">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-primary-900 mb-2">La Diferencia Clave</h4>
                  <p className="text-sm text-primary-800 mb-3">
                    <strong>Paga</strong> ofrece financiamiento rápido pero tú sigues manejando toda la operación: 
                    proveedores, logística, documentación, seguimiento.
                  </p>
                  <p className="text-sm text-primary-800">
                    <strong>Integra</strong> es tu socio integral: financiamos, compramos, importamos y entregamos. 
                    Tú te enfocas en vender, nosotros en todo lo demás.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Cronograma del Proceso
              </h2>
              <p className="text-lg text-gray-600">
                Conoce cada etapa y los tiempos esperados
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  phase: 'Fase 1',
                  title: 'Onboarding y Evaluación',
                  duration: '1-2 días',
                  color: 'coral',
                  icon: Users,
                  tasks: [
                    'Registro en la plataforma',
                    'Carga de documentación inicial',
                    'Evaluación automática de perfil de riesgo',
                    'Pre-aprobación o solicitud de información adicional'
                  ]
                },
                {
                  phase: 'Fase 2',
                  title: 'Documentación y Verificación',
                  duration: '1-2 días',
                  color: 'primary',
                  icon: FileText,
                  tasks: [
                    'Revisión de documentos por especialistas',
                    'Verificación de referencias comerciales',
                    'Validación de información financiera',
                    'Aprobación final del comité de crédito'
                  ]
                },
                {
                  phase: 'Fase 3',
                  title: 'Estructuración y Pago',
                  duration: '1 día',
                  color: 'success',
                  icon: CreditCard,
                  tasks: [
                    'Definición de términos y condiciones',
                    'Firma de contratos digitales',
                    'Desembolso del financiamiento',
                    'Configuración de seguimiento automático'
                  ]
                },
                {
                  phase: 'Fase 4',
                  title: 'Seguimiento y Entrega',
                  duration: '15-45 días',
                  color: 'blue',
                  icon: Truck,
                  tasks: [
                    'Monitoreo automático del envío',
                    'Alertas de eventos importantes',
                    'Gestión de documentos de importación',
                    'Liquidación final al recibir mercancía'
                  ]
                }
              ].map((phase, index) => (
                <div key={index} className="relative">
                  {index < 3 && (
                    <div className="absolute left-6 top-16 w-0.5 h-12 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      phase.color === 'coral' && "bg-coral-100",
                      phase.color === 'primary' && "bg-primary-100",
                      phase.color === 'success' && "bg-success-100",
                      phase.color === 'blue' && "bg-blue-100"
                    )}>
                      <phase.icon className={cn(
                        "h-6 w-6",
                        phase.color === 'coral' && "text-coral-600",
                        phase.color === 'primary' && "text-primary-600",
                        phase.color === 'success' && "text-success-600",
                        phase.color === 'blue' && "text-blue-600"
                      )} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">{phase.phase}</span>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          phase.color === 'coral' && "bg-coral-100 text-coral-600",
                          phase.color === 'primary' && "bg-primary-100 text-primary-600",
                          phase.color === 'success' && "bg-success-100 text-success-600",
                          phase.color === 'blue' && "bg-blue-100 text-blue-600"
                        )}>
                          {phase.duration}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {phase.title}
                      </h3>
                      
                      <ul className="space-y-2">
                        {phase.tasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mt-8">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-primary-900 mb-2">Tiempo Total Estimado</h4>
                  <p className="text-sm text-primary-800 mb-3">
                    <strong>3-5 días hábiles</strong> desde la aplicación hasta el desembolso, 
                    comparado con 15-21 días de métodos tradicionales.
                  </p>
                  <p className="text-sm text-primary-800">
                    <strong>Nota:</strong> Los tiempos pueden variar según la complejidad de la operación 
                    y la completitud de la documentación inicial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Lista de Verificación de Documentos
              </h2>
              <p className="text-lg text-gray-600">
                Prepara tu documentación para acelerar el proceso
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Descarga la Lista Completa</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Obtén una guía detallada con todos los requisitos y formatos aceptados.
                  </p>
                  <button className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Guía PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentos Requeridos</h3>
              
              {checklist.map((item) => (
                <div 
                  key={item.id}
                  className={cn(
                    "p-4 border rounded-lg transition-colors cursor-pointer",
                    item.checked 
                      ? "bg-success-50 border-success-200" 
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  )}
                  onClick={() => handleChecklistToggle(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <button 
                      className="mt-0.5 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChecklistToggle(item.id);
                      }}
                    >
                      {item.checked ? (
                        <CheckSquare className="h-5 w-5 text-success-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          "font-medium",
                          item.checked ? "text-success-900" : "text-gray-900"
                        )}>
                          {item.text}
                        </h4>
                        {item.required && (
                          <span className="px-2 py-0.5 bg-coral-100 text-coral-600 text-xs font-medium rounded-full">
                            Requerido
                          </span>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className={cn(
                          "text-sm",
                          item.checked ? "text-success-700" : "text-gray-600"
                        )}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Formatos Aceptados</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Acepta archivos en PDF, JPG, PNG con tamaño máximo de 10MB por documento.
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Escanea en alta resolución para evitar rechazos por calidad.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Documentos completados: {' '}
                <span className="font-semibold text-primary-600">
                  {checklist.filter(item => item.checked).length} de {checklist.length}
                </span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(checklist.filter(item => item.checked).length / checklist.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Configuración de la Empresa
              </h2>
              <p className="text-lg text-gray-600">
                Completa la información básica para personalizar tu experiencia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.companyName ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Ej: Importadora XYZ S.A."
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de Contacto *
                </label>
                <input
                  type="text"
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.contactPerson ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Ej: Juan Pérez"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Corporativo *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.email ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Ej: contacto@empresa.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.phone ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Ej: +56 9 1234 5678"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio *
                </label>
                <select
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.businessType ? "border-red-300" : "border-gray-300"
                  )}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="retail">Retail / Comercio</option>
                  <option value="manufacturing">Manufactura</option>
                  <option value="technology">Tecnología</option>
                  <option value="automotive">Automotriz</option>
                  <option value="textiles">Textiles</option>
                  <option value="food">Alimentos</option>
                  <option value="other">Otro</option>
                </select>
                {errors.businessType && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>
                )}
              </div>

              <div>
                <label htmlFor="expectedVolume" className="block text-sm font-medium text-gray-700 mb-2">
                  Volumen Esperado Anual *
                </label>
                <select
                  id="expectedVolume"
                  value={formData.expectedVolume}
                  onChange={(e) => setFormData({...formData, expectedVolume: e.target.value})}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.expectedVolume ? "border-red-300" : "border-gray-300"
                  )}
                >
                  <option value="">Selecciona un rango</option>
                  <option value="under_100k">Menos de $100K USD</option>
                  <option value="100k_500k">$100K - $500K USD</option>
                  <option value="500k_1m">$500K - $1M USD</option>
                  <option value="1m_5m">$1M - $5M USD</option>
                  <option value="over_5m">Más de $5M USD</option>
                </select>
                {errors.expectedVolume && (
                  <p className="mt-1 text-sm text-red-600">{errors.expectedVolume}</p>
                )}
              </div>
            </div>

            <div className="bg-success-50 border border-success-200 rounded-lg p-6 mt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-success-900 mb-2">Privacidad y Seguridad</h4>
                  <p className="text-sm text-success-800">
                    Toda tu información está protegida con encriptación de nivel bancario. 
                    Solo la utilizamos para evaluar tu perfil crediticio y personalizar tu experiencia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Configuración Inicial</h1>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Omitir configuración
            </button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progreso</span>
            <span>{getCompletionPercentage()}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-center space-x-8 overflow-x-auto pb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = step.completed;
            const isPast = index < currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center min-w-0 flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors mb-2",
                    isCompleted 
                      ? "bg-success-600 text-white" 
                      : isActive 
                        ? "bg-primary-600 text-white" 
                        : isPast
                          ? "bg-primary-100 text-primary-600 hover:bg-primary-200"
                          : "bg-gray-200 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <StepIcon className="h-6 w-6" />
                  )}
                </button>
                <div className="text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    isActive ? "text-primary-600" : isCompleted ? "text-success-600" : "text-gray-500"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={cn(
            "px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2",
            currentStep === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
        >
          <ChevronLeft className="h-5 w-5" />
          Anterior
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {currentStep + 1} de {steps.length}
          </span>
          
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Completar' : 'Siguiente'}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}