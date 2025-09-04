import { useState, useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Truck,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  Building2
} from 'lucide-react';
import { 
  FinancialTimelineEvent, 
  ResumenFinanciero, 
  EstadoProceso,
  Currency,
  CostosLogisticos,
  ExtracostosOperacion,
  ReembolsoOperacion
} from '../../types/Operation';
import { cn } from '../../utils/cn';

// Configuración de iconos y colores por tipo de evento financiero
const FINANCIAL_EVENT_CONFIG = {
  cuota_operacional: {
    label: 'Cuota Operacional (10%)',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    milestone: 'Solicitud Enviada'
  },
  primer_anticipo: {
    label: 'Primer Anticipo',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600',
    milestone: 'Solicitud Enviada'
  },
  pago_proveedor: {
    label: 'Pago a Proveedor',
    icon: Building2,
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-600',
    milestone: 'Procesamiento de Pago'
  },
  segundo_anticipo: {
    label: 'Segundo Anticipo',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700 border-green-200',
    iconColor: 'text-green-600',
    milestone: 'Procesamiento de Pago'
  },
  avance_segundo: {
    label: 'Segundo Avance',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-700 border-green-200',
    iconColor: 'text-green-600',
    milestone: 'Post Primer Pago Proveedor'
  },
  pago_logistico: {
    label: 'Pagos Logísticos',
    icon: Truck,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600',
    milestone: 'Post Embarque'
  },
  liberacion: {
    label: 'Liberación de Fondos',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600',
    milestone: 'Entrega al Cliente'
  },
  extracosto: {
    label: 'Costo Adicional',
    icon: FileText,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    iconColor: 'text-orange-600',
    milestone: 'Variable'
  },
  reembolso: {
    label: 'Reembolso Fideicomiso',
    icon: DollarSign,
    color: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-600',
    milestone: 'Administrativo'
  }
} as const;

// Configuración de estados - soporta tanto enum como strings
const STATUS_CONFIG = {
  // Enum values
  [EstadoProceso.PENDIENTE]: {
    label: 'Pendiente',
    color: 'bg-gray-100 text-gray-600',
    icon: Clock
  },
  [EstadoProceso.EN_PROCESO]: {
    label: 'En Proceso',
    color: 'bg-yellow-100 text-yellow-700',
    icon: AlertCircle
  },
  [EstadoProceso.COMPLETADO]: {
    label: 'Completado',
    color: 'bg-success-100 text-success-700',
    icon: CheckCircle
  },
  [EstadoProceso.RECHAZADO]: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-700',
    icon: AlertCircle
  },
  // String values (from Supabase)
  'pendiente': {
    label: 'Pendiente',
    color: 'bg-gray-100 text-gray-600',
    icon: Clock
  },
  'en_proceso': {
    label: 'En Proceso',
    color: 'bg-yellow-100 text-yellow-700',
    icon: AlertCircle
  },
  'completado': {
    label: 'Completado',
    color: 'bg-success-100 text-success-700',
    icon: CheckCircle
  },
  'rechazado': {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-700',
    icon: AlertCircle
  }
} as const;

interface FKFinancialTimelineProps {
  operationId: string;
  resumenFinanciero: ResumenFinanciero;
  costosLogisticos?: Array<{
    id: string;
    operacion_id: string;
    tipo_costo: string;
    descripcion: string;
    monto: number;
  }>;
  extracostosOperacion?: ExtracostosOperacion[];
  reembolsosOperacion?: ReembolsoOperacion[];
  pagosClientes?: Array<{
    id: string;
    tipo_pago: string;
    monto: number;
    moneda: string;
    estado: string;
    fecha_pago?: string;
  }>;
  pagosProveedores?: Array<{
    id?: string;
    numeroGiro?: string;
    numero_pago?: string;
    valorSolicitado?: number;
    valor_pagado?: number;
    porcentajeGiro?: string;
    porcentaje_pago?: string;
    estado: string;
    fechaPago?: string;
    fecha_pago_realizado?: string;
  }>;
  giros?: Array<{
    numeroGiro: string;
    valorSolicitado: number;
    porcentajeGiro: string;
    estado: string;
    fechaPago?: string;
  }>;
  liberaciones?: Array<{
    numero: number;
    capital: number;
    fecha: string;
    estado: string;
    fechaVencimiento?: string;
  }>;
  timeline?: Array<{
    id: string;
    fase: string;
    descripcion: string;
    estado: string;
    progreso: number;
    responsable: string;
    fecha: string;
    notas: string;
  }>;
  isAdmin?: boolean;
  className?: string;
}

export default function FKFinancialTimeline({
  operationId,
  resumenFinanciero,
  costosLogisticos,
  extracostosOperacion = [],
  reembolsosOperacion = [],
  pagosClientes = [],
  pagosProveedores = [],
  giros = [],
  liberaciones = [],
  timeline = [],
  isAdmin = false,
  className
}: FKFinancialTimelineProps) {
  const [showReimbursements, setShowReimbursements] = useState(false);

  // Debug: log de datos recibidos
  console.log('🔍 FKFinancialTimeline - Datos recibidos:', {
    operationId,
    resumenFinanciero,
    costosLogisticos: costosLogisticos?.length,
    extracostosOperacion: extracostosOperacion?.length,
    reembolsosOperacion: reembolsosOperacion?.length,
    pagosClientes: pagosClientes?.length,
    pagosProveedores: pagosProveedores?.length,
    giros: giros?.length,
    liberaciones: liberaciones?.length,
    timeline: timeline?.length,
    isAdmin
  });

  // 🔍 DEBUG ESPECÍFICO PARA PAGOS
  console.log('🔍 [DEBUG PAGOS] Detalles específicos:', {
    pagosProveedoresRaw: pagosProveedores,
    pagosClientesRaw: pagosClientes,
    girosRaw: giros
  });


  // Función helper para filtrar extracostos válidos (con concepto) - FUERA del useMemo
  const extracostosValidos = extracostosOperacion?.filter(e => {
    // Debug cada extracosto
    console.log(`🔍 Evaluando extracosto:`, {
      id: e.id,
      concepto: e.concepto,
      conceptoType: typeof e.concepto,
      conceptoValue: JSON.stringify(e.concepto),
      monto: e.monto,
      montoType: typeof e.monto
    });
    
    // REGLA ESTRICTA: Solo incluir si tiene concepto válido Y no null Y no undefined
    const tieneConceptoValido = e.concepto !== null && 
                               e.concepto !== undefined && 
                               typeof e.concepto === 'string' && 
                               e.concepto.trim().length > 0 &&
                               e.concepto.toLowerCase() !== 'null' &&
                               e.concepto.toLowerCase() !== 'undefined';
    
    // REGLA ESTRICTA: Solo incluir si tiene monto válido (número positivo real)
    const tieneMontoValido = e.monto !== null && 
                            e.monto !== undefined && 
                            typeof e.monto === 'number' && 
                            e.monto > 0 && 
                            e.monto < 9999999; // Excluir fechas como 20250902
    
    const esValido = tieneConceptoValido && tieneMontoValido;
    console.log(`🎯 Extracosto ${e.id}: ${esValido ? '✅ INCLUIDO' : '❌ EXCLUIDO'} | Concepto: ${tieneConceptoValido ? '✓' : '✗'} | Monto: ${tieneMontoValido ? '✓' : '✗'}`);
    
    return esValido;
  }) || [];

  // Identificar extracostos excluidos para debug (usar la misma lógica estricta)
  const extracostosExcluidos = extracostosOperacion?.filter(e => {
    const tieneConceptoValido = e.concepto !== null && 
                               e.concepto !== undefined && 
                               typeof e.concepto === 'string' && 
                               e.concepto.trim().length > 0 &&
                               e.concepto.toLowerCase() !== 'null' &&
                               e.concepto.toLowerCase() !== 'undefined';
    
    const tieneMontoValido = e.monto !== null && 
                            e.monto !== undefined && 
                            typeof e.monto === 'number' && 
                            e.monto > 0 && 
                            e.monto < 9999999;
    
    // Devolver true para los que NO cumplen con los criterios (excluidos)
    return !(tieneConceptoValido && tieneMontoValido);
  }) || [];

  console.log('🔍 [EXTRACOSTOS FILTRADOS] Resultados:', {
    totalOriginal: extracostosOperacion?.length || 0,
    extracostosValidos: extracostosValidos.length,
    extracostosExcluidosCount: extracostosExcluidos.length,
    totalFiltrado: extracostosValidos.reduce((sum, e) => sum + (e.monto || 0), 0),
    totalExcluido: extracostosExcluidos.reduce((sum, e) => sum + (e.monto || 0), 0),
    extracostosVálidos: extracostosValidos.map(e => ({
      concepto: e.concepto,
      monto: e.monto
    })),
    extracostosExcluidosDetalle: extracostosExcluidos.map(e => ({
      id: e.id,
      concepto: e.concepto || '(sin concepto)',
      monto: e.monto,
      razonExclusion: !e.concepto || e.concepto.trim() === '' || 
                     e.concepto.toLowerCase() === 'null' || 
                     e.concepto.toLowerCase() === 'undefined' ? 
                     'sin concepto válido' : 
                     e.monto >= 999999999 ? 'monto parece fecha' : 'monto inválido'
    }))
  });

  // Eventos del timeline financiero
  const timelineEvents = useMemo(() => {
    const events: FinancialTimelineEvent[] = [];

    // 🔍 DEBUG: Verificar estado de factura cuota operacional
    const solicitudEnviadaPhase = timeline.find(phase => 
      phase.fase?.toLowerCase().includes('solicitud') && 
      (phase.estado === 'completado' || phase.descripcion?.toLowerCase().includes('listo'))
    );
    
    const esCuotaOperacionalLista = !!solicitudEnviadaPhase;
    
    console.log('📋 [CUOTA OPERACIONAL] Estado de factura:', {
      solicitudEnviadaPhase: !!solicitudEnviadaPhase,
      esCuotaOperacionalLista,
      timelineCompleto: timeline
    });

    // Usar estado y fecha reales de la BD - NO crear datos mock
    const cuotaOperacional = pagosClientes?.find(pago => pago.tipo_pago === 'cuota_operacional');
    if (cuotaOperacional) {
      // Combinar lógica de negocio (factura lista) con lógica de fechas
      let estadoCuotaFinal: EstadoProceso;
      if (esCuotaOperacionalLista) {
        estadoCuotaFinal = EstadoProceso.COMPLETADO; // Regla de negocio prioritaria
      } else {
        // Si factura no está lista, usar lógica de fechas
        estadoCuotaFinal = determinarEstadoPorFecha(
          undefined, // Los pagos de clientes no tienen fecha_solicitud separada
          cuotaOperacional.fecha_pago,
          cuotaOperacional.estado
        );
      }
      
      events.push({
        id: `cuota-${cuotaOperacional.id}`,
        tipo: 'cuota_operacional',
        descripcion: 'Cuota Operacional (10% del valor total)',
        monto: cuotaOperacional.monto,
        moneda: cuotaOperacional.moneda || Currency.USD,
        fecha_real: cuotaOperacional.fecha_pago || undefined,
        estado: estadoCuotaFinal, // 🆕 Combinado: regla de negocio + fechas
        milestone_operacional: 'Solicitud Enviada'
      });
    }

    const primerAnticipo = pagosClientes?.find(pago => pago.tipo_pago === 'primer_anticipo');
    if (primerAnticipo) {
      // Combinar lógica de negocio (factura lista) con lógica de fechas
      let estadoPrimerAnticipoFinal: EstadoProceso;
      if (esCuotaOperacionalLista) {
        estadoPrimerAnticipoFinal = EstadoProceso.COMPLETADO; // Regla de negocio prioritaria
      } else {
        // Si factura no está lista, usar lógica de fechas
        estadoPrimerAnticipoFinal = determinarEstadoPorFecha(
          undefined, // Los pagos de clientes no tienen fecha_solicitud separada
          primerAnticipo.fecha_pago,
          primerAnticipo.estado
        );
      }
      
      events.push({
        id: `primer-anticipo-${primerAnticipo.id}`,
        tipo: 'primer_anticipo',
        descripcion: 'Primer Anticipo del Cliente',
        monto: primerAnticipo.monto,
        moneda: primerAnticipo.moneda || Currency.USD,
        fecha_real: primerAnticipo.fecha_pago || undefined,
        estado: estadoPrimerAnticipoFinal, // 🆕 Combinado: regla de negocio + fechas
        milestone_operacional: 'Solicitud Enviada'
      });
    }

    // ✅ 2. SEGUNDA FASE: Pagos a Proveedores de Mercancía y Segundo Anticipo
    const segundoAnticipo = pagosClientes?.find(pago => pago.tipo_pago === 'segundo_anticipo');
    
    // Usar pagosProveedores (datos reales de tabla pagos_proveedores) en lugar de giros
    const pagosProveedoresReales = pagosProveedores || [];
    
    console.log('💰 [PAGOS PROVEEDORES] Datos disponibles:', {
      pagosProveedoresCount: pagosProveedoresReales.length,
      pagos: pagosProveedoresReales.map(p => ({
        numero_pago: p.numero_pago || p.numeroGiro,
        valor_pagado: p.valor_pagado || p.valorSolicitado,
        estado: p.estado,
        fecha_solicitud: p.fecha_solicitud,
        fecha_pago_realizado: p.fecha_pago_realizado
      }))
    });

    console.log('🚛 [COSTOS LOGÍSTICOS] Datos disponibles:', {
      costosLogisticosCount: costosLogisticos?.length || 0,
      costos: costosLogisticos?.map(c => ({
        tipo_costo: c.tipo_costo,
        descripcion: c.descripcion,
        monto: c.monto,
        estado: c.estado,
        fecha_pago: c.fecha_pago
      })) || []
    });

    console.log('💰 [LIBERACIONES] Datos disponibles:', {
      liberacionesCount: liberaciones?.length || 0,
      liberaciones: liberaciones?.map(l => ({
        numero: l.numero,
        capital: l.capital,
        fecha: l.fecha,
        estado: l.estado
      })) || []
    });

    console.log('💸 [EXTRACOSTOS] Datos disponibles:', {
      extracostosCount: extracostosOperacion?.length || 0,
      extracostos: extracostosOperacion?.map(e => ({
        concepto: e.concepto,
        monto: e.monto,
        estado: e.estado,
        fecha_pago: e.fecha_pago,
        conceptoVacio: !e.concepto || e.concepto.trim() === ''
      })) || [],
      totalSinFiltrar: extracostosOperacion?.reduce((sum, e) => sum + (e.monto || 0), 0) || 0
    });
    
    // Función helper para determinar estado basado en fechas
    const determinarEstadoPorFecha = (fechaSolicitud?: string, fechaPagoRealizado?: string, estadoOriginal?: string): EstadoProceso => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Si tiene fecha de pago realizado
      if (fechaPagoRealizado) {
        const fechaPago = new Date(fechaPagoRealizado);
        fechaPago.setHours(0, 0, 0, 0);
        
        console.log(`📅 [ESTADO AUTO] Evaluando pago - Fecha pago: ${fechaPagoRealizado}, Hoy: ${hoy.toISOString().split('T')[0]}`);
        
        if (fechaPago <= hoy) {
          console.log(`✅ [ESTADO AUTO] Pago completado (fecha pasada)`);
          return EstadoProceso.COMPLETADO; // Ya se pagó
        } else {
          console.log(`⏳ [ESTADO AUTO] Pago en proceso (fecha futura)`);
          return EstadoProceso.EN_PROCESO; // Pago programado para el futuro
        }
      }
      
      // Si tiene fecha de solicitud pero no de pago
      if (fechaSolicitud) {
        console.log(`📋 [ESTADO AUTO] Tiene solicitud sin pago - EN_PROCESO`);
        return EstadoProceso.EN_PROCESO; // Solicitado pero no pagado
      }
      
      // Si no tiene fechas, usar estado original o pendiente
      if (estadoOriginal === 'completado') return EstadoProceso.COMPLETADO;
      if (estadoOriginal === 'en_proceso') return EstadoProceso.EN_PROCESO;
      
      console.log(`⚪ [ESTADO AUTO] Sin fechas disponibles - PENDIENTE`);
      return EstadoProceso.PENDIENTE;
    };

    // 💰 INTERCALAR PAGOS: Primer Pago → Segundo Anticipo → Resto de Pagos
    pagosProveedoresReales.forEach((pago, index) => {
      const numeroPago = pago.numero_pago || pago.numeroGiro || (index + 1);
      const valorPago = pago.valor_pagado || pago.valorSolicitado || 0;
      const porcentajePago = pago.porcentaje_pago || pago.porcentajeGiro || '';
      
      // 🆕 Determinar estado basado en fechas
      const estadoFinal = determinarEstadoPorFecha(
        pago.fecha_solicitud, 
        pago.fecha_pago_realizado, 
        pago.estado
      );
      
      // Agregar cada pago a proveedor
      events.push({
        id: `pago-proveedor-${pago.id || numeroPago}`,
        tipo: 'pago_proveedor',
        descripcion: `Pago a Proveedor #${numeroPago}${porcentajePago ? ` (${porcentajePago})` : ''} - Mercancía`,
        monto: valorPago,
        moneda: Currency.USD,
        fecha_real: pago.fecha_pago_realizado || pago.fechaPago || undefined,
        fecha_solicitud: pago.fecha_solicitud || undefined,
        estado: estadoFinal, // 🆕 Estado determinado por fechas
        milestone_operacional: 'Procesamiento de Pago a Proveedor'
      });
      
      // ✅ DESPUÉS DEL PRIMER PAGO A PROVEEDOR → Agregar segundo anticipo
      if (index === 0 && segundoAnticipo) {
        // 🆕 Determinar estado del segundo anticipo basado en fecha
        const estadoSegundoAnticipo = determinarEstadoPorFecha(
          undefined, // Los pagos de clientes no tienen fecha_solicitud separada
          segundoAnticipo.fecha_pago,
          segundoAnticipo.estado
        );
        
        events.push({
          id: `segundo-anticipo-${segundoAnticipo.id}`,
          tipo: 'segundo_anticipo',
          descripcion: 'Segundo Anticipo del Cliente',
          monto: segundoAnticipo.monto,
          moneda: segundoAnticipo.moneda || Currency.USD,
          fecha_real: segundoAnticipo.fecha_pago || undefined,
          estado: estadoSegundoAnticipo, // 🆕 Estado determinado por fechas
          milestone_operacional: 'Procesamiento de Pago a Proveedor'
        });
      }
    });

    // ✅ Los pagos a proveedores ya se procesaron arriba en el forEach

    // ✅ 3. TERCERA FASE: Pagos a Proveedores Logísticos (después de pagos internacionales)
    if (costosLogisticos && costosLogisticos.length > 0) {
      costosLogisticos.forEach((costo, index) => {
        // 🆕 Determinar estado basado en fechas
        const estadoCostoLogistico = determinarEstadoPorFecha(
          undefined, // Los costos logísticos no tienen fecha_solicitud separada
          costo.fecha_pago,
          costo.estado
        );

        events.push({
          id: `logistico-${costo.id || `${operationId}-${index}`}`,
          tipo: 'pago_logistico',
          descripcion: `${costo.tipo_costo}: ${costo.descripcion || 'Pago Logístico'}`,
          monto: costo.monto,
          moneda: (costo.moneda as Currency) || Currency.USD,
          fecha_real: costo.fecha_pago,
          estado: estadoCostoLogistico, // 🆕 Estado determinado por fechas
          milestone_operacional: 'Post Embarque'
        });
      });
    }

    // ✅ 4. CUARTA FASE: Liberaciones de Fondos (después de pagos logísticos)
    if (liberaciones && liberaciones.length > 0) {
      liberaciones.forEach((liberacion, index) => {
        // 🆕 Determinar estado basado en fechas
        const estadoLiberacion = determinarEstadoPorFecha(
          undefined, // Las liberaciones no tienen fecha_solicitud separada
          liberacion.fecha,
          liberacion.estado
        );

        events.push({
          id: `liberacion-${index + 1}`,
          tipo: 'liberacion',
          descripcion: `Liberación #${liberacion.numero} - Entrega de Fondos al Cliente`,
          monto: liberacion.capital,
          moneda: Currency.USD,
          fecha_real: liberacion.fecha,
          estado: estadoLiberacion, // 🆕 Estado determinado por fechas
          milestone_operacional: 'Entrega al Cliente'
        });
      });
    }

    // ✅ EXTRACOSTOS REMOVIDOS - Ya no se muestran en el timeline financiero

    // 5. Reembolsos (solo para admin)
    if (isAdmin && reembolsosOperacion.length > 0) {
      reembolsosOperacion.forEach((reembolso) => {
        events.push({
          id: `reembolso-${reembolso.id}`,
          tipo: 'reembolso',
          descripcion: reembolso.concepto,
          monto: reembolso.monto_reembolso,
          moneda: reembolso.moneda,
          fecha_real: reembolso.fecha_reembolso,
          estado: reembolso.estado_reembolso,
          milestone_operacional: 'Administrativo'
        });
      });
    }

    // ✅ NO REORDENAR - Los eventos ya fueron agregados en el orden correcto
    // Los eventos ya están intercalados correctamente:
    // 1. Cuota Operacional, 2. Primer Anticipo, 3. Primer Pago Proveedor, 4. Segundo Anticipo, 5. Resto Pagos...
    
    console.log('💰 Timeline eventos en orden de inserción:', events.map((e, idx) => ({
      orden: idx + 1,
      tipo: e.tipo,
      descripcion: e.descripcion,
      monto: e.monto
    })));
    
    // Usar el orden de inserción (ya está correcto)
    const sortedEvents = events;

    console.log('💰 FKFinancialTimeline - Eventos generados:', sortedEvents.map(e => ({
      id: e.id,
      tipo: e.tipo,
      estado: e.estado,
      monto: e.monto
    })));

    return sortedEvents;
  }, [resumenFinanciero, costosLogisticos, extracostosOperacion, reembolsosOperacion, pagosClientes, pagosProveedores, giros, liberaciones, timeline, isAdmin, operationId]);

  // Filtrar reembolsos si están ocultos
  const visibleEvents = useMemo(() => {
    if (!isAdmin || showReimbursements) {
      return timelineEvents;
    }
    return timelineEvents.filter(event => event.tipo !== 'reembolso');
  }, [timelineEvents, isAdmin, showReimbursements]);

  const totalReembolsos = reembolsosOperacion.reduce((sum, r) => sum + r.monto_reembolso, 0);

  // 🆕 CALCULAR TOTALES REALES BASADOS EN DATOS DE BD
  const totalPagadoReal = useMemo(() => {
    const totalPagosClientes = pagosClientes?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0;
    const totalGirosProveedor = pagosProveedores?.reduce((sum, p) => sum + (p.valor_pagado || p.valorSolicitado || 0), 0) || 0;
    const totalCostosLogisticos = costosLogisticos?.reduce((sum, c) => sum + (c.monto || 0), 0) || 0;
    const totalExtracostosValidos = extracostosValidos.reduce((sum, e) => sum + (e.monto || 0), 0);
    const totalLiberaciones = liberaciones?.reduce((sum, l) => sum + (l.capital || 0), 0) || 0;
    
    return totalPagosClientes + totalGirosProveedor + totalCostosLogisticos + totalExtracostosValidos + totalLiberaciones;
  }, [pagosClientes, pagosProveedores, costosLogisticos, extracostosValidos, liberaciones]);

  const totalPendienteReal = useMemo(() => {
    const valorTotalOperacion = resumenFinanciero.valorOperacion || 0;
    return Math.max(0, valorTotalOperacion - totalPagadoReal);
  }, [resumenFinanciero.valorOperacion, totalPagadoReal]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header con resumen financiero */}
      <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900">
            Timeline Financiero
          </h3>
          <div className="text-right">
            <p className="text-sm text-primary-700">Valor Total Operación</p>
            <p className="text-xl font-bold text-primary-900">
              ${(resumenFinanciero.valorOperacion || 0).toLocaleString()} USD
            </p>
          </div>
        </div>

        {/* Resumen de estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <span className="text-sm font-medium text-gray-700">Total Pagado</span>
            </div>
            <p className="text-lg font-bold text-success-600">
              ${totalPagadoReal.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Total por Financiar</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">
              ${totalPendienteReal.toLocaleString()}
            </p>
          </div>

          {isAdmin && totalReembolsos > 0 && (
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Reembolsos</span>
              </div>
              <p className="text-lg font-bold text-red-600">
                ${(totalReembolsos || 0).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Toggle para reembolsos (solo admin) */}
        {isAdmin && reembolsosOperacion.length > 0 && (
          <div className="mt-4 pt-4 border-t border-primary-200">
            <button
              onClick={() => setShowReimbursements(!showReimbursements)}
              className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-900 transition-colors"
            >
              {showReimbursements ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showReimbursements ? 'Ocultar' : 'Mostrar'} Reembolsos Fideicomiso ({reembolsosOperacion.length})
            </button>
          </div>
        )}
      </div>

      {/* Información Financiera Detallada - MOVIDA DESDE OVERVIEW */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success-600" />
            Información Financiera Completa
          </h4>
          
          {/* Executive Summary - Movido desde Overview */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
            <h6 className="font-semibold text-primary-800 mb-4 text-base">📈 RESUMEN EJECUTIVO</h6>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-center">
              {/* Card 1: Total Operación */}
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-primary-700 mb-1 break-words">
                  ${resumenFinanciero.valorOperacion?.toLocaleString() || '0'}
                </p>
                <p className="text-xs md:text-sm text-primary-600 font-medium leading-tight">Total Operación</p>
              </div>
              
              {/* Card 2: Giros a Proveedor */}
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-indigo-600 mb-1 break-words">
                  ${(pagosProveedores?.reduce((sum, p) => sum + (p.valor_pagado || p.valorSolicitado || 0), 0) || 0).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-indigo-600 font-medium leading-tight">Giros a Proveedor</p>
              </div>
              
              {/* Card 3: Costos Logísticos */}
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-purple-600 mb-1 break-words">
                  ${(costosLogisticos?.reduce((sum, c) => sum + (c.monto || 0), 0) || 0).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-purple-600 font-medium leading-tight">Costos Logísticos</p>
              </div>
              
              {/* Card 4: Liberaciones */}
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-emerald-600 mb-1 break-words">
                  ${(liberaciones?.reduce((sum, l) => sum + (l.capital || 0), 0) || 0).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-emerald-600 font-medium leading-tight">Liberaciones</p>
              </div>
              
              {/* Card 5: Total Extracostos */}
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-orange-600 mb-1 break-words">
                  ${(extracostosValidos.reduce((sum, e) => sum + (e.monto || 0), 0)).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-orange-600 font-medium leading-tight">Total Extracostos</p>
              </div>
              
              {/* Card 6: Reembolsos */}
              <div className="bg-white/80 rounded-lg p-4 shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-red-600 mb-1 break-words">
                  ${(reembolsosOperacion?.reduce((sum, r) => sum + (r.monto_reembolso || 0), 0) || 0).toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-red-600 font-medium leading-tight">Reembolsos</p>
              </div>
            </div>
            
            {/* Resumen Adicional con Contadores */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/60 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Giros Procesados:</span>
                  <span className="font-semibold text-indigo-700">{pagosProveedores?.length || 0} giros</span>
                </div>
              </div>
              <div className="bg-white/60 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Costos Logísticos:</span>
                  <span className="font-semibold text-purple-700">{costosLogisticos?.length || 0} conceptos</span>
                </div>
              </div>
              <div className="bg-white/60 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Liberaciones:</span>
                  <span className="font-semibold text-emerald-700">{liberaciones?.length || 0} entregas</span>
                </div>
              </div>
              <div className="bg-white/60 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Extracostos:</span>
                  <span className="font-semibold text-orange-700">{extracostosValidos.length} conceptos</span>
                </div>
              </div>
              <div className="bg-white/60 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Reembolsos:</span>
                  <span className="font-semibold text-red-700">{reembolsosOperacion?.length || 0} conceptos</span>
                </div>
              </div>
              <div className="bg-white/60 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Eventos:</span>
                  <span className="font-semibold text-gray-700">{timelineEvents.length} eventos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Cuota Operacional y Avances */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h6 className="font-semibold text-blue-800 mb-4 text-base flex items-center gap-2">
                💳 CUOTAS Y AVANCES
              </h6>
              
              <div className="space-y-3">
                {pagosClientes && pagosClientes.length > 0 ? (
                  <>
                    {pagosClientes
                      .sort((a, b) => (a.orden || 0) - (b.orden || 0)) // Ordenar por el campo orden
                      .map((pago, index) => {
                        // Mapear nombres más legibles
                        const getNombrePago = (tipoPago: string, descripcion?: string) => {
                          if (descripcion) return descripcion;
                          switch (tipoPago.toLowerCase()) {
                            case 'cuota_operacional': return 'Cuota Operacional (10%)';
                            case 'primer_anticipo': return 'Primer Anticipo';
                            case 'segundo_anticipo': return 'Segundo Anticipo';
                            default: return tipoPago.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          }
                        };

                        return (
                          <div key={index} className="bg-white/80 rounded p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-blue-700 font-medium">
                                {getNombrePago(pago.tipo_pago, pago.descripcion)}
                              </span>
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                (pago.estado === 'pagado' || pago.estado === 'completado' || pago.fecha_pago) ? 
                                  'bg-success-100 text-success-700' : 
                                  'bg-gray-100 text-gray-600'
                              )}>
                                {(pago.estado === 'pagado' || pago.estado === 'completado' || pago.fecha_pago) ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-blue-600">
                                {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-ES') : ''}
                              </span>
                              <span className="font-medium text-blue-800 text-xs">
                                ${(pago.monto || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    
                    <div className="border-t border-blue-200 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-blue-700">Total Cuotas y Avances:</span>
                        <span className="font-bold text-blue-800">
                          ${(pagosClientes.reduce((sum, p) => sum + (p.monto || 0), 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-blue-600 text-sm">No hay cuotas o avances registrados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Giros a Proveedor Detallados */}
            <div className="bg-indigo-50 rounded-lg p-6">
              <h6 className="font-semibold text-indigo-800 mb-4 text-base flex items-center gap-2">
                🏭 GIROS A PROVEEDOR
              </h6>
              
              <div className="space-y-2">
                {pagosProveedores && pagosProveedores.length > 0 ? (
                  <>
                    {pagosProveedores.map((giro, index) => (
                      <div key={index} className="bg-white/80 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-indigo-700 font-medium">
                            {giro.numero_pago || giro.numeroGiro || `Giro #${index + 1}`}
                          </span>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            (giro.estado === 'completado' || giro.fecha_pago_realizado) ? 'bg-success-100 text-success-700' : 
                            giro.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {(giro.estado === 'completado' || giro.fecha_pago_realizado) ? 'Pagado' : 
                             giro.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-indigo-600">
                            {giro.porcentaje_pago || giro.porcentajeGiro || 'N/A'}
                          </span>
                          <span className="font-medium text-indigo-800 text-xs">
                            ${(giro.valor_pagado || giro.valorSolicitado || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-indigo-200 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-indigo-700">Total Giros:</span>
                        <span className="font-bold text-indigo-800">
                          ${(pagosProveedores?.reduce((sum, p) => sum + (p.valor_pagado || p.valorSolicitado || 0), 0) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-indigo-600 text-sm">
                    No hay giros registrados
                  </div>
                )}
              </div>
            </div>

            {/* Costos Logísticos Detallados */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h6 className="font-semibold text-purple-800 mb-4 text-base flex items-center gap-2">
                🚛 COSTOS LOGÍSTICOS
              </h6>
              
              <div className="space-y-2">
                {costosLogisticos && costosLogisticos.length > 0 ? (
                  <>
                    {costosLogisticos.map((costo, index) => (
                      <div key={index} className="bg-white/80 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-purple-700 font-medium truncate">
                            {costo.descripcion || costo.tipo_costo}
                          </span>
                          <span className="font-bold text-purple-800 text-xs">
                            ${(costo.monto || 0).toLocaleString()}
                          </span>
                        </div>
                        {costo.descripcion && costo.tipo_costo && (
                          <div className="text-xs text-purple-500">
                            {costo.tipo_costo}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="border-t border-purple-200 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-purple-700">Total Logísticos:</span>
                        <span className="font-bold text-purple-800">
                          ${(costosLogisticos.reduce((sum, c) => sum + (c.monto || 0), 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-purple-600 text-sm">No hay costos logísticos registrados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Liberaciones Detalladas */}
            <div className="bg-emerald-50 rounded-lg p-6">
              <h6 className="font-semibold text-emerald-800 mb-4 text-base flex items-center gap-2">
                💰 LIBERACIONES
              </h6>
              
              <div className="space-y-2">
                {liberaciones && liberaciones.length > 0 ? (
                  <>
                    {liberaciones.map((liberacion, index) => (
                      <div key={index} className="bg-white/80 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-emerald-700 font-medium">
                            Liberación #{liberacion.numero}
                          </span>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            (liberacion.estado === 'completado' || liberacion.fecha) ? 'bg-success-100 text-success-700' : 
                            liberacion.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {(liberacion.estado === 'completado' || liberacion.fecha) ? 'Entregado' : 
                             liberacion.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-600">
                            {liberacion.fecha ? new Date(liberacion.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </span>
                          <span className="font-medium text-emerald-800 text-xs">
                            ${(liberacion.capital || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-emerald-200 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-emerald-700">Total Liberado:</span>
                        <span className="font-bold text-emerald-800">
                          ${(liberaciones?.reduce((sum, l) => sum + (l.capital || 0), 0) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-emerald-600 text-sm">
                    No hay liberaciones registradas
                  </div>
                )}
              </div>
            </div>

            {/* Extracostos Adicionales */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h6 className="font-semibold text-orange-800 mb-4 text-base flex items-center gap-2">
                💸 EXTRACOSTOS ADICIONALES
              </h6>
              
              <div className="space-y-2">
                {extracostosValidos.length > 0 ? (
                  <>
                    {extracostosValidos.map((extracosto, index) => (
                      <div key={index} className="bg-white/80 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-orange-700 font-medium truncate">{extracosto.concepto}</span>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            (extracosto.estado === 'completado' || extracosto.estado === 'pagado') ? 'bg-success-100 text-success-700' : 
                            extracosto.estado === 'en_proceso' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {(extracosto.estado === 'completado' || extracosto.estado === 'pagado') ? 'Pagado' : 
                             extracosto.estado === 'en_proceso' ? 'En Proceso' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-orange-600">
                            {extracosto.fecha_pago ? new Date(extracosto.fecha_pago).toLocaleDateString('es-ES') : 'Sin fecha'}
                          </span>
                          <span className="font-medium text-orange-800 text-xs">
                            ${(extracosto.monto || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t border-orange-200 pt-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-orange-700">
                          Total Extracostos:
                        </span>
                        <span className="font-bold text-orange-800">
                          ${(extracostosValidos.reduce((sum, e) => sum + (e.monto || 0), 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-orange-600 italic text-center py-4">No hay extracostos válidos registrados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline de eventos financieros */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Cronograma de Pagos
          </h4>
          
          {visibleEvents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay eventos financieros registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleEvents.map((event, index) => {
                const config = FINANCIAL_EVENT_CONFIG[event.tipo];
                let statusConfig = STATUS_CONFIG[event.estado as keyof typeof STATUS_CONFIG];
                
                // Validación de configuraciones para evitar errores
                if (!config) {
                  console.error(`⚠️ Configuración no encontrada para tipo de evento: ${event.tipo}`);
                  return null;
                }
                
                // Si no encuentra el estado, usar pendiente como fallback
                if (!statusConfig) {
                  console.warn(`⚠️ Estado no reconocido: ${event.estado}, usando fallback 'pendiente'`);
                  statusConfig = STATUS_CONFIG['pendiente'];
                }
                
                const EventIcon = config.icon;
                const StatusIcon = statusConfig.icon;

                return (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border"
                  >
                    {/* Icono del tipo de evento */}
                    <div className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2",
                      config.color
                    )}>
                      <EventIcon className={cn("h-6 w-6", config.iconColor)} />
                    </div>

                    {/* Contenido del evento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">
                            {config.label}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.descripcion}
                          </p>
                          {event.milestone_operacional && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 Milestone: {event.milestone_operacional}
                            </p>
                          )}
                        </div>
                        
                        {/* Monto y fecha */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900">
                            ${(event.monto || 0).toLocaleString()} {event.moneda}
                          </p>
                          {(event.fecha_real || event.fecha_solicitud) && (
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              {event.fecha_solicitud && (
                                <p className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Solicitud: {new Date(event.fecha_solicitud).toLocaleDateString('es-ES')}
                                </p>
                              )}
                              {event.fecha_real && (
                                <p className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {event.fecha_solicitud ? 'Pago: ' : ''}{new Date(event.fecha_real).toLocaleDateString('es-ES')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estado del pago */}
                      <div className="flex items-center justify-between">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
                          statusConfig.color
                        )}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.label}
                        </div>

                        {!event.fecha_real && event.estado === EstadoProceso.PENDIENTE && (
                          <span className="text-xs text-gray-500">
                            Fecha por confirmar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}