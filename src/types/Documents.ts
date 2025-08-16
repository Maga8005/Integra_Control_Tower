/**
 * Types for Client Documents Checklist
 * Integra Control Tower MVP
 */

// Base document item interface
export interface DocumentItem {
  id: string;
  name: string;
  description?: string;
  type: 'file' | 'text' | 'date' | 'checkbox' | 'select';
  required: boolean;
  category: string;
  options?: string[]; // For select type
  placeholder?: string; // For text type
  fileTypes?: string[]; // Accepted file types for file inputs
}

// Document completion status
export interface DocumentStatus {
  documentId: string;
  completed: boolean;
  value?: string | boolean | File | null;
  fileName?: string; // For file uploads
  uploadedAt?: string;
  notes?: string;
}

// Complete document checklist for an operation
export interface DocumentChecklist {
  operationId: string;
  country: 'MX' | 'CO';
  documents: DocumentItem[];
  statuses: DocumentStatus[];
  lastUpdated: string;
  completionPercentage: number;
}

// Country-specific document configurations
export const MEXICO_DOCUMENTS: DocumentItem[] = [
  // Documentación Fiscal - Updated according to new instructions
  {
    id: 'mx_padron_importadores',
    name: '1. Padrón de importadores con status ACTIVO',
    description: 'Documento que acredite el padrón de importadores activo',
    type: 'file',
    required: true,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'mx_verificacion_domicilio',
    name: '2. Verificación de domicilio en estado "LOCALIZADO"',
    description: 'Documento de verificación domiciliaria con estado localizado',
    type: 'file',
    required: true,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'mx_opinion_cumplimiento',
    name: '3. Opinión de cumplimiento en estado "POSITIVO"',
    description: 'Opinión de cumplimiento fiscal con estado positivo',
    type: 'file',
    required: true,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf']
  },
  {
    id: 'mx_contrato_prestacion',
    name: '4. Contrato de prestación de servicios con almacenadora fiscal',
    description: 'Contrato vigente con almacenadora fiscal',
    type: 'file',
    required: true,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf']
  },
  {
    id: 'mx_requiere_rrna',
    name: '5. ¿La mercancía a financiar requiere RRNA?',
    description: 'Seleccione Sí o No para confirmar si la mercancía requiere RRNA',
    type: 'select',
    required: true,
    category: 'Documentación Fiscal',
    options: [
      'Sí',
      'No'
    ]
  },
  {
    id: 'mx_normatividad_rrna',
    name: 'Normatividad / permisos / certificados (RRNA)',
    description: 'Adjuntar solo si la mercancía requiere RRNA',
    type: 'file',
    required: false,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf']
  },
  {
    id: 'mx_requiere_inscripcion_sectorial',
    name: '6. ¿La mercancía requiere inscripción a algún padrón sectorial?',
    description: 'Seleccione Sí o No para confirmar si requiere inscripción sectorial',
    type: 'select',
    required: true,
    category: 'Documentación Fiscal',
    options: [
      'Sí',
      'No'
    ]
  },
  {
    id: 'mx_tipo_padron_sectorial',
    name: 'Tipo de padrón sectorial',
    description: 'Seleccione el tipo de padrón sectorial correspondiente',
    type: 'select',
    required: false,
    category: 'Documentación Fiscal',
    options: [
      'Productos Químicos y Precursores Químicos',
      'Siderúrgico',
      'Textil y Confección',
      'Calzado',
      'Cigarros y Tabacos',
      'Automotriz',
      'Otro (especificar)'
    ]
  },
  {
    id: 'mx_inscripcion_sectorial_doc',
    name: 'Inscripción al padrón sectorial',
    description: 'Documento de inscripción al padrón sectorial seleccionado',
    type: 'file',
    required: false,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf']
  },
  {
    id: 'mx_despacho_aduanal',
    name: '7. ¿Por cuenta de quién se realiza el despacho aduanal?',
    description: 'Seleccione quién será responsable del despacho aduanal',
    type: 'select',
    required: true,
    category: 'Documentación Fiscal',
    options: [
      'Importador/Cliente',
      'Finkargo'
    ]
  },
  {
    id: 'mx_acuse_encargo_cliente',
    name: 'Acuse de encargo (si va por cuenta del cliente)',
    description: 'Adjuntar solo si el despacho va por cuenta del importador/cliente',
    type: 'file',
    required: false,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf']
  },
  {
    id: 'mx_pedimentos_finkargo',
    name: 'Pedimentos (si va por cuenta de Finkargo)',
    description: 'Adjuntar pedimentos solo si el despacho va por cuenta de Finkargo',
    type: 'file',
    required: false,
    category: 'Documentación Fiscal',
    fileTypes: ['pdf']
  }
];

export const COLOMBIA_DOCUMENTS: DocumentItem[] = [
  // Documentación Colombia
  {
    id: 'co_rut',
    name: 'RUT (Registro Único Tributario)',
    description: 'Documento vigente expedido por la DIAN',
    type: 'file',
    required: true,
    category: 'Documentación Legal',
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'co_rut_numero',
    name: 'Número de RUT',
    type: 'text',
    required: true,
    category: 'Documentación Legal',
    placeholder: 'Ej: 900123456-1'
  },
  {
    id: 'co_cedula',
    name: 'Cédula de Ciudadanía del Representante Legal',
    description: 'Documento de identidad vigente',
    type: 'file',
    required: true,
    category: 'Documentación Legal',
    fileTypes: ['pdf', 'jpg', 'png']
  },
  {
    id: 'co_cedula_numero',
    name: 'Número de Cédula',
    type: 'text',
    required: true,
    category: 'Documentación Legal',
    placeholder: 'Ej: 12345678'
  },
  {
    id: 'co_certificado_bancario',
    name: 'Certificado Bancario',
    description: 'Certificación bancaria con antigüedad no mayor a 30 días',
    type: 'file',
    required: true,
    category: 'Documentación Financiera',
    fileTypes: ['pdf']
  },
  {
    id: 'co_fecha_expedicion_certificado',
    name: 'Fecha de expedición del certificado bancario',
    type: 'date',
    required: true,
    category: 'Documentación Financiera'
  },
  {
    id: 'co_estados_financieros',
    name: 'Estados Financieros',
    description: 'Estados financieros del último período',
    type: 'file',
    required: false,
    category: 'Documentación Financiera',
    fileTypes: ['pdf', 'xlsx']
  }
];

// Helper function to get documents by country
export function getDocumentsByCountry(country: string): DocumentItem[] {
  const countryCode = country.toUpperCase();
  
  if (countryCode === 'MEXICO' || countryCode === 'MX' || countryCode === 'MEX') {
    return MEXICO_DOCUMENTS;
  } else if (countryCode === 'COLOMBIA' || countryCode === 'CO' || countryCode === 'COL') {
    return COLOMBIA_DOCUMENTS;
  }
  
  // Default to Mexico if country not recognized
  return MEXICO_DOCUMENTS;
}

// Document groups for proper progress calculation
const DOCUMENT_GROUPS = {
  // Independent documents (each counts as 1 group)
  independent: [
    'mx_padron_importadores',
    'mx_verificacion_domicilio', 
    'mx_opinion_cumplimiento',
    'mx_contrato_prestacion'
  ],
  
  // Conditional groups (each group counts as 1, regardless of sub-documents)
  conditional: [
    {
      name: 'rrna_group',
      main: 'mx_requiere_rrna',
      conditionals: ['mx_normatividad_rrna']
    },
    {
      name: 'sectorial_group', 
      main: 'mx_requiere_inscripcion_sectorial',
      conditionals: ['mx_tipo_padron_sectorial', 'mx_inscripcion_sectorial_doc']
    },
    {
      name: 'despacho_group',
      main: 'mx_despacho_aduanal', 
      conditionals: ['mx_acuse_encargo_cliente', 'mx_pedimentos_finkargo']
    }
  ]
};

// Helper function to calculate completion percentage with grouped logic
export function calculateCompletionPercentage(
  documents: DocumentItem[],
  statuses: DocumentStatus[]
): number {
  const country = documents.length > 0 && documents[0].id.startsWith('mx_') ? 'MX' : 'CO';
  
  // For non-Mexico countries, use simple calculation
  if (country !== 'MX') {
    const requiredDocs = documents.filter(doc => doc.required);
    const completedRequired = requiredDocs.filter(doc => {
      const status = statuses.find(s => s.documentId === doc.id);
      return status?.completed === true;
    });
    
    if (requiredDocs.length === 0) return 100;
    return Math.round((completedRequired.length / requiredDocs.length) * 100);
  }

  // For Mexico, use grouped calculation
  let completedGroups = 0;
  const totalGroups = DOCUMENT_GROUPS.independent.length + DOCUMENT_GROUPS.conditional.length;

  // Check independent documents
  DOCUMENT_GROUPS.independent.forEach(docId => {
    const status = statuses.find(s => s.documentId === docId);
    if (status?.completed === true) {
      completedGroups++;
    }
  });

  // Check conditional groups
  DOCUMENT_GROUPS.conditional.forEach(group => {
    const mainStatus = statuses.find(s => s.documentId === group.main);
    
    if (mainStatus?.completed === true) {
      // Main question is answered
      if (group.name === 'rrna_group') {
        // RRNA group: if "Sí", need document; if "No", group is complete
        if (mainStatus.value === 'No') {
          completedGroups++; // "No" means group is complete
        } else if (mainStatus.value === 'Sí') {
          // Need to check if RRNA document is uploaded
          const rrnaDoc = statuses.find(s => s.documentId === 'mx_normatividad_rrna');
          if (rrnaDoc?.completed === true) {
            completedGroups++; // Both question and document completed
          }
        }
      } else if (group.name === 'sectorial_group') {
        // Sectorial group: if "Sí", need type and document; if "No", group is complete
        if (mainStatus.value === 'No') {
          completedGroups++;
        } else if (mainStatus.value === 'Sí') {
          const typeStatus = statuses.find(s => s.documentId === 'mx_tipo_padron_sectorial');
          const docStatus = statuses.find(s => s.documentId === 'mx_inscripcion_sectorial_doc');
          if (typeStatus?.completed === true && docStatus?.completed === true) {
            completedGroups++;
          }
        }
      } else if (group.name === 'despacho_group') {
        // Despacho group: need appropriate document based on selection
        if (mainStatus.value === 'Importador/Cliente') {
          const acuseDoc = statuses.find(s => s.documentId === 'mx_acuse_encargo_cliente');
          if (acuseDoc?.completed === true) {
            completedGroups++;
          }
        } else if (mainStatus.value === 'Finkargo') {
          const pedimentosDoc = statuses.find(s => s.documentId === 'mx_pedimentos_finkargo');
          if (pedimentosDoc?.completed === true) {
            completedGroups++;
          }
        }
      }
    }
  });

  if (totalGroups === 0) return 100;
  return Math.round((completedGroups / totalGroups) * 100);
}

// Helper function to get country code from operation
export function getCountryFromOperation(operation: any): 'MX' | 'CO' {
  console.log('🔍 [DOCUMENTS] Detectando país para operación:', {
    operationId: operation.id,
    paisImportador: operation.paisImportador,
    paisExportador: operation.paisExportador,
    paisProveedor: operation.paisProveedor,
    rutaComercial: operation.rutaComercial,
    clienteCompleto: operation.clienteCompleto,
    allFields: operation
  });
  
  const importerCountry = operation.paisImportador?.toLowerCase();
  
  // Check multiple possible fields for Mexico indicators
  const checkMexico = () => {
    const fields = [
      operation.paisImportador?.toLowerCase(),
      operation.paisExportador?.toLowerCase(), 
      operation.rutaComercial?.toLowerCase(),
      operation.route?.toLowerCase(),
      operation.clienteCompleto?.toLowerCase()
    ];
    
    return fields.some(field => 
      field?.includes('mexico') || 
      field?.includes('méxico') ||
      field?.includes('mx') ||
      field?.includes('mex')
    );
  };
  
  // Check multiple possible fields for Colombia indicators  
  const checkColombia = () => {
    const fields = [
      operation.paisImportador?.toLowerCase(),
      operation.paisExportador?.toLowerCase(),
      operation.rutaComercial?.toLowerCase(),
      operation.route?.toLowerCase(),
      operation.clienteCompleto?.toLowerCase()
    ];
    
    return fields.some(field =>
      field?.includes('colombia') ||
      field?.includes('co') ||
      field?.includes('col')
    );
  };
  
  let detectedCountry: 'MX' | 'CO';
  
  if (checkMexico()) {
    detectedCountry = 'MX';
  } else if (checkColombia()) {
    detectedCountry = 'CO';
  } else {
    // Default to Mexico
    detectedCountry = 'MX';
  }
  
  console.log('🎯 [DOCUMENTS] País detectado:', detectedCountry, 
    detectedCountry === 'MX' ? '(México)' : '(Colombia)');
  
  return detectedCountry;
}