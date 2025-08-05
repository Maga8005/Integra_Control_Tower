import { useState } from 'react';
import {
  Building,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Truck,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Currency } from '../../types';

interface FinancingApplicationData {
  // Company Information
  clientName: string;
  clientCountry: string;
  clientContact: string;
  clientEmail: string;
  clientPhone: string;
  
  // Supplier Information
  supplierName: string;
  supplierCountry: string;
  supplierContact: string;
  supplierEmail: string;
  
  // Operation Details
  goodsDescription: string;
  amount: number;
  currency: Currency;
  paymentTerms: string;
  estimatedShipping: string;
  
  // Financing Details
  financingPercentage: number;
  requestedAmount: number;
  paymentDueDate: string;
  
  // Additional Information
  additionalNotes: string;
}

interface FKFinancingApplicationProps {
  onSubmit: (data: FinancingApplicationData) => void;
  onSaveDraft?: (data: Partial<FinancingApplicationData>) => void;
  onCancel?: () => void;
  initialData?: Partial<FinancingApplicationData>;
  className?: string;
}

const INITIAL_DATA: FinancingApplicationData = {
  clientName: '',
  clientCountry: 'Chile',
  clientContact: '',
  clientEmail: '',
  clientPhone: '',
  supplierName: '',
  supplierCountry: '',
  supplierContact: '',
  supplierEmail: '',
  goodsDescription: '',
  amount: 0,
  currency: 'USD',
  paymentTerms: '',
  estimatedShipping: '',
  financingPercentage: 80,
  requestedAmount: 0,
  paymentDueDate: '',
  additionalNotes: ''
};

export default function FKFinancingApplication({
  onSubmit,
  onSaveDraft,
  onCancel,
  initialData = {},
  className
}: FKFinancingApplicationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FinancingApplicationData>({
    ...INITIAL_DATA,
    ...initialData
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    {
      id: 'client',
      title: 'Información del Cliente',
      description: 'Datos de tu empresa',
      icon: Building
    },
    {
      id: 'supplier',
      title: 'Información del Proveedor',
      description: 'Datos del proveedor',
      icon: MapPin
    },
    {
      id: 'operation',
      title: 'Detalles de la Operación',
      description: 'Mercancías y términos',
      icon: FileText
    },
    {
      id: 'financing',
      title: 'Financiamiento',
      description: 'Monto y condiciones',
      icon: DollarSign
    },
    {
      id: 'review',
      title: 'Revisión',
      description: 'Confirmar información',
      icon: CheckCircle
    }
  ];

  // Auto-calculate requested amount based on percentage
  const handleAmountChange = (amount: number) => {
    setFormData(prev => ({
      ...prev,
      amount,
      requestedAmount: Math.round((amount * prev.financingPercentage) / 100)
    }));
  };

  const handleFinancingPercentageChange = (percentage: number) => {
    setFormData(prev => ({
      ...prev,
      financingPercentage: percentage,
      requestedAmount: Math.round((prev.amount * percentage) / 100)
    }));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    const step = steps[currentStep];

    switch (step.id) {
      case 'client':
        if (!formData.clientName.trim()) newErrors.clientName = 'Nombre de la empresa es requerido';
        if (!formData.clientContact.trim()) newErrors.clientContact = 'Persona de contacto es requerida';
        if (!formData.clientEmail.trim()) newErrors.clientEmail = 'Email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
          newErrors.clientEmail = 'Formato de email inválido';
        }
        if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Teléfono es requerido';
        break;

      case 'supplier':
        if (!formData.supplierName.trim()) newErrors.supplierName = 'Nombre del proveedor es requerido';
        if (!formData.supplierCountry.trim()) newErrors.supplierCountry = 'País del proveedor es requerido';
        if (!formData.supplierContact.trim()) newErrors.supplierContact = 'Contacto del proveedor es requerido';
        break;

      case 'operation':
        if (!formData.goodsDescription.trim()) newErrors.goodsDescription = 'Descripción de mercancías es requerida';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Monto debe ser mayor a 0';
        if (!formData.paymentTerms.trim()) newErrors.paymentTerms = 'Términos de pago son requeridos';
        if (!formData.estimatedShipping) newErrors.estimatedShipping = 'Fecha estimada de envío es requerida';
        break;

      case 'financing':
        if (!formData.paymentDueDate) newErrors.paymentDueDate = 'Fecha de vencimiento es requerida';
        if (formData.financingPercentage < 10 || formData.financingPercentage > 90) {
          newErrors.financingPercentage = 'Porcentaje debe estar entre 10% y 90%';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'client':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.clientName ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Ej: Importadora ABC S.A."
                />
                {errors.clientName && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País *
                </label>
                <select
                  value={formData.clientCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientCountry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Chile">Chile</option>
                  <option value="Perú">Perú</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Bolivia">Bolivia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de Contacto *
                </label>
                <input
                  type="text"
                  value={formData.clientContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientContact: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.clientContact ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Nombre del responsable"
                />
                {errors.clientContact && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientContact}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Corporativo *
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.clientEmail ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="contacto@empresa.com"
                />
                {errors.clientEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.clientPhone ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="+56 9 1234 5678"
                />
                {errors.clientPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'supplier':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.supplierName ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Nombre de la empresa proveedora"
                />
                {errors.supplierName && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País del Proveedor *
                </label>
                <input
                  type="text"
                  value={formData.supplierCountry}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierCountry: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.supplierCountry ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Ej: China, Estados Unidos, Alemania"
                />
                {errors.supplierCountry && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierCountry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto del Proveedor *
                </label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.supplierContact ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Nombre del contacto"
                />
                {errors.supplierContact && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplierContact}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Proveedor
                </label>
                <input
                  type="email"
                  value={formData.supplierEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="contacto@proveedor.com"
                />
              </div>
            </div>
          </div>
        );

      case 'operation':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de las Mercancías *
              </label>
              <textarea
                value={formData.goodsDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, goodsDescription: e.target.value }))}
                rows={4}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  errors.goodsDescription ? "border-red-300" : "border-gray-300"
                )}
                placeholder="Describe detalladamente las mercancías a importar..."
              />
              {errors.goodsDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.goodsDescription}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total *
                </label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.amount ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="0"
                  min="0"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Estimada de Envío *
                </label>
                <input
                  type="date"
                  value={formData.estimatedShipping}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedShipping: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.estimatedShipping ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.estimatedShipping && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimatedShipping}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Términos de Pago *
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  errors.paymentTerms ? "border-red-300" : "border-gray-300"
                )}
              >
                <option value="">Selecciona términos de pago</option>
                <option value="FOB">FOB - Free On Board</option>
                <option value="CIF">CIF - Cost, Insurance & Freight</option>
                <option value="EXW">EXW - Ex Works</option>
                <option value="DDP">DDP - Delivered Duty Paid</option>
                <option value="FCA">FCA - Free Carrier</option>
              </select>
              {errors.paymentTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentTerms}</p>
              )}
            </div>
          </div>
        );

      case 'financing':
        return (
          <div className="space-y-6">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-primary-900 mb-2">Información de Financiamiento</h4>
                  <p className="text-sm text-primary-800">
                    Podemos financiar entre el 10% y 90% del valor total de tu operación. 
                    El monto solicitado se calculará automáticamente según el porcentaje seleccionado.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje a Financiar *
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={formData.financingPercentage}
                    onChange={(e) => handleFinancingPercentageChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>10%</span>
                    <span className="font-semibold text-primary-600">
                      {formData.financingPercentage}%
                    </span>
                    <span>90%</span>
                  </div>
                </div>
                {errors.financingPercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.financingPercentage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Solicitado
                </label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.requestedAmount.toLocaleString()}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-700"
                  />
                  <span className="text-sm text-gray-500">{formData.currency}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.financingPercentage}% de {formData.currency} ${formData.amount.toLocaleString()}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento del Pago *
                </label>
                <input
                  type="date"
                  value={formData.paymentDueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    errors.paymentDueDate ? "border-red-300" : "border-gray-300"
                  )}
                />
                {errors.paymentDueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentDueDate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Información adicional sobre la operación..."
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-success-50 border border-success-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-success-900 mb-2">Información Completa</h4>
                  <p className="text-sm text-success-800">
                    Revisa todos los datos antes de enviar tu solicitud de financiamiento.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Información del Cliente
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Empresa:</strong> {formData.clientName}</div>
                  <div><strong>País:</strong> {formData.clientCountry}</div>
                  <div><strong>Contacto:</strong> {formData.clientContact}</div>
                  <div><strong>Email:</strong> {formData.clientEmail}</div>
                  <div><strong>Teléfono:</strong> {formData.clientPhone}</div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Información del Proveedor
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Proveedor:</strong> {formData.supplierName}</div>
                  <div><strong>País:</strong> {formData.supplierCountry}</div>
                  <div><strong>Contacto:</strong> {formData.supplierContact}</div>
                  {formData.supplierEmail && (
                    <div><strong>Email:</strong> {formData.supplierEmail}</div>
                  )}
                </div>
              </div>

              {/* Operation Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalles de la Operación
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Mercancías:</strong> {formData.goodsDescription}</div>
                  <div><strong>Monto:</strong> {formData.currency} ${formData.amount.toLocaleString()}</div>
                  <div><strong>Términos:</strong> {formData.paymentTerms}</div>
                  <div><strong>Envío Estimado:</strong> {new Date(formData.estimatedShipping).toLocaleDateString('es-ES')}</div>
                </div>
              </div>

              {/* Financing Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Detalles del Financiamiento
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div><strong>Porcentaje:</strong> {formData.financingPercentage}%</div>
                  <div><strong>Monto Solicitado:</strong> {formData.currency} ${formData.requestedAmount.toLocaleString()}</div>
                  <div><strong>Vencimiento:</strong> {new Date(formData.paymentDueDate).toLocaleDateString('es-ES')}</div>
                  {formData.additionalNotes && (
                    <div><strong>Notas:</strong> {formData.additionalNotes}</div>
                  )}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Solicitud de Financiamiento
        </h1>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progreso</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% completado</span>
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
            const isCompleted = index < currentStep;
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
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
        
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
            <ArrowLeft className="h-5 w-5" />
            Anterior
          </button>

          {onSaveDraft && (
            <button
              onClick={handleSaveDraft}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar Borrador
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          
          <span className="text-sm text-gray-600">
            {currentStep + 1} de {steps.length}
          </span>
          
          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Solicitud
                  <CheckCircle className="h-5 w-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              Siguiente
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}