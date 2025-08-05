import { Operation, TimelineEvent, OperationStatus } from '../types';

// Helper function to generate timeline events based on operation status
const generateTimeline = (status: OperationStatus): TimelineEvent[] => {
  const baseTimeline: TimelineEvent[] = [
    {
      id: '1',
      title: 'Solicitud Enviada',
      status: 'completed',
      date: '2024-01-15',
      description: 'Aceptación de cotización',
      responsibleParty: 'Cliente'
    },
    {
      id: '2',
      title: 'Documentos de Operación y Pago Cuota Operacional',
      status: status === 'onboarding' ? 'current' : 'completed',
      date: '2024-01-16',
      description: 'Documentación legal y pago de cuota operacional',
      responsibleParty: 'Coordinador'
    },
    {
      id: '3',
      title: 'Procesamiento de Pago',
      status: status === 'documents' ? 'current' : status === 'onboarding' ? 'pending' : 'completed',
      date: '2024-01-18',
      description: 'Asegurar términos de financiamiento y Procesamiento de pago al proveedor',
      responsibleParty: 'Especialista en Compras'
    },
    {
      id: '4',
      title: 'Envío y Logística',
      status: status === 'payment' ? 'current' : ['onboarding', 'documents'].includes(status) ? 'pending' : 'completed',
      date: '2024-01-22',
      description: 'Coordinación de envío y seguimiento de mercancías en tránsito',
      responsibleParty: 'Coordinador'
    },
    {
      id: '5',
      title: 'Operación Completada',
      status: status === 'completed' ? 'completed' : 'pending',
      date: '2024-02-05',
      description: 'Mercancías entregadas y operación de financiamiento completada exitosamente',
      responsibleParty: 'Cliente'
    }
  ];

  return baseTimeline;
};

// Helper function to calculate progress percentage
const getProgressByStatus = (status: OperationStatus): number => {
  const progressMap: Record<OperationStatus, number> = {
    onboarding: 20,
    documents: 40,
    payment: 60,
    shipping: 80,
    completed: 100
  };
  return progressMap[status];
};

export const mockOperations: Operation[] = [
  {
    id: 'OP-2024-001',
    clientName: 'TechCorp International',
    supplierName: 'Shanghai Electronics Co.',
    amount: 250000,
    currency: 'USD',
    status: 'shipping',
    progress: getProgressByStatus('shipping'),
    timeline: generateTimeline('shipping'),
    importDetails: {
      supplierName: 'Shanghai Electronics Co.',
      supplierCountry: 'China',
      goodsDescription: 'Componentes electrónicos de consumo y semiconductores',
      estimatedShipping: '2024-02-01',
      paymentTerms: '30 días neto, LC a la vista'
    },
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-22T14:30:00Z'
  },
  {
    id: 'OP-2024-007',
    clientName: 'TechCorp International',
    supplierName: 'Korean Tech Components',
    amount: 180000,
    currency: 'USD',
    status: 'documents',
    progress: getProgressByStatus('documents'),
    timeline: generateTimeline('documents'),
    importDetails: {
      supplierName: 'Korean Tech Components',
      supplierCountry: 'South Korea',
      goodsDescription: 'Pantallas LCD y componentes de memoria avanzados',
      estimatedShipping: '2024-02-15',
      paymentTerms: '45 días neto, transferencia bancaria'
    },
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-01-26T16:20:00Z'
  },
  {
    id: 'OP-2024-008',
    clientName: 'TechCorp International',
    supplierName: 'Taiwan Semiconductor Ltd.',
    amount: 320000,
    currency: 'USD',
    status: 'completed',
    progress: getProgressByStatus('completed'),
    timeline: generateTimeline('completed'),
    importDetails: {
      supplierName: 'Taiwan Semiconductor Ltd.',
      supplierCountry: 'Taiwan',
      goodsDescription: 'Procesadores ARM y chips especializados para IoT',
      estimatedShipping: '2024-01-10',
      paymentTerms: '60 días neto, LC confirmada'
    },
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-28T10:15:00Z'
  },
  {
    id: 'OP-2024-002',
    clientName: 'Global Manufacturing Ltd.',
    supplierName: 'Mumbai Textiles Pvt.',
    amount: 180000,
    currency: 'USD',
    status: 'documents',
    progress: getProgressByStatus('documents'),
    timeline: generateTimeline('documents'),
    importDetails: {
      supplierName: 'Mumbai Textiles Pvt.',
      supplierCountry: 'India',
      goodsDescription: 'Telas de algodón de alta calidad y materiales textiles',
      estimatedShipping: '2024-02-10',
      paymentTerms: '45 días neto, Cobranza documentaria'
    },
    createdAt: '2024-01-18T11:15:00Z',
    updatedAt: '2024-01-20T16:45:00Z'
  },
  {
    id: 'OP-2024-003',
    clientName: 'European Auto Parts',
    supplierName: 'Osaka Precision Industries',
    amount: 420000,
    currency: 'EUR',
    status: 'completed',
    progress: getProgressByStatus('completed'),
    timeline: generateTimeline('completed'),
    importDetails: {
      supplierName: 'Osaka Precision Industries',
      supplierCountry: 'Japan',
      goodsDescription: 'Componentes automotrices de precisión y partes de motor',
      estimatedShipping: '2024-01-25',
      paymentTerms: '60 días neto, LC confirmada'
    },
    createdAt: '2024-01-10T08:30:00Z',
    updatedAt: '2024-02-05T12:00:00Z'
  },
  {
    id: 'OP-2024-004',
    clientName: 'MedSupply Chain Inc.',
    supplierName: 'Berlin Pharma Solutions',
    amount: 95000,
    currency: 'EUR',
    status: 'payment',
    progress: getProgressByStatus('payment'),
    timeline: generateTimeline('payment'),
    importDetails: {
      supplierName: 'Berlin Pharma Solutions',
      supplierCountry: 'Germany',
      goodsDescription: 'Dispositivos médicos y equipos farmacéuticos',
      estimatedShipping: '2024-02-15',
      paymentTerms: '21 días neto, Garantía bancaria'
    },
    createdAt: '2024-01-20T13:45:00Z',
    updatedAt: '2024-01-23T10:20:00Z'
  },
  {
    id: 'OP-2024-005',
    clientName: 'FoodTech Solutions',
    supplierName: 'Brazilian Coffee Exports',
    amount: 75000,
    currency: 'USD',
    status: 'onboarding',
    progress: getProgressByStatus('onboarding'),
    timeline: generateTimeline('onboarding'),
    importDetails: {
      supplierName: 'Brazilian Coffee Exports',
      supplierCountry: 'Brazil',
      goodsDescription: 'Granos de café premium y equipos de procesamiento de alimentos',
      estimatedShipping: '2024-02-20',
      paymentTerms: '30 días neto, Cuenta abierta'
    },
    createdAt: '2024-01-22T15:00:00Z',
    updatedAt: '2024-01-22T15:00:00Z'
  },
  {
    id: 'OP-2024-006',
    clientName: 'Renewable Energy Corp',
    supplierName: 'Nordic Wind Technologies',
    amount: 680000,
    currency: 'EUR',
    status: 'documents',
    progress: getProgressByStatus('documents'),
    timeline: generateTimeline('documents'),
    importDetails: {
      supplierName: 'Nordic Wind Technologies',
      supplierCountry: 'Denmark',
      goodsDescription: 'Componentes de turbinas eólicas y sistemas de energía renovable',
      estimatedShipping: '2024-03-01',
      paymentTerms: '90 días neto, LC standby'
    },
    createdAt: '2024-01-19T10:30:00Z',
    updatedAt: '2024-01-21T14:15:00Z'
  }
];

// Helper functions for data manipulation
export const getOperationsByStatus = (status: OperationStatus): Operation[] => {
  return mockOperations.filter(op => op.status === status);
};

export const getOperationsByClient = (clientName: string): Operation[] => {
  return mockOperations.filter(op => 
    op.clientName.toLowerCase().includes(clientName.toLowerCase())
  );
};

export const getTotalValueByStatus = (status: OperationStatus): { usd: number; eur: number } => {
  const filtered = getOperationsByStatus(status);
  return filtered.reduce(
    (acc, op) => {
      if (op.currency === 'USD') {
        acc.usd += op.amount;
      } else if (op.currency === 'EUR') {
        acc.eur += op.amount;
      }
      return acc;
    },
    { usd: 0, eur: 0 }
  );
};

export const getOperationById = (id: string): Operation | undefined => {
  return mockOperations.find(op => op.id === id);
};