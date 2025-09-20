# Sistema INTEGRA CO - Documentación Completa del Proceso

## Resumen Ejecutivo

Este documento describe el proceso completo del producto **INTEGRA CO** de Finkargo, una solución integral para la gestión de operaciones de comercio internacional que combina financiamiento logístico con coordinación operativa. El sistema gestiona desde la negociación inicial con el cliente hasta la entrega final de mercancía en zona aduanera o depósito fiscal.

**Propósito del documento**: Proveer especificaciones detalladas para el desarrollo de una aplicación web que digitalice y centralice los procesos que actualmente se gestionan a través de Slack y otros medios dispersos.

**Alcance tecnológico inicial**: Aplicación web básica que replique la funcionalidad actual y mejore la trazabilidad y coordinación entre equipos.

## 1. ARQUITECTURA DEL SISTEMA INTEGRA CO

### 1.1 Objetivo General del Sistema

INTEGRA CO es un sistema integral de manejo del proceso logístico de una operación así como el financiamiento de logística que gestiona desde la negociación internacional con el proveedor hasta el depósito de la mercancía importada en Zona aduanera o Depósito fiscal ya sea en Colombia o México. El sistema coordina múltiples procesos interdependientes entre los equipos de operaciones (gestión logística), procurement (pricing y negocios internacionales), equipo legal (jurídico), facturación, estrategia (cálculo de intereses de financiamiento) y tesorería (gestiona los pagos) para asegurar operaciones de importación exitosas y bien financiadas.

### 1.2 Secuencia de Procesos del Sistema

- **STEP 1**: Proceso de negociación con el cliente que se va a financiar - Se cobra cuota operacional (pago por manejo de operación a nivel logístico) y 10% de adelanto del costo total de la operación
- **STEP 2**: Negociación interna hacia los proveedores internacionales
- **STEP 3**: Aprobación interna de la negociación por Comité de Giro
- **STEP 5**: Proceso de financiamiento de la operación (80% hacia el cliente)
- **STEP 6**: GIRO 1 a Proveedor Internacional - Primer pago a proveedor de mercancía según negociación (Finkargo Abroad hacia Proveedor)
- **STEP 7**: Valor de Segundo Anticipo Operación - Cobro de segundo anticipo al cliente (10% adicional de la operación)
- **STEP 8**: Segundo Giro a Proveedor Internacional (proceso recursivo según estructura de pagos)
- **STEP 9**: Solicitud de Factura Final
- **STEP 11**: Liberación de Mercancía y Cobranza
- **STEP 12**: Gestión de Extracostos
- **STEP 15**: Reembolso por Disminución en Valor
- **STEP 16**: Pagos Proveedores Logísticos (propuesto)

### 1.3 Equipos y Actores Involucrados

#### Equipos Internos
- **Operaciones (@operaciones-integra-co / @operaciones-integra-mx)**: Gestión logística integral, coordinación con proveedores y clientes, gestión de operaciones de importación, coordinación de pagos a clientes y proveedores, supervisión del flujo logístico completo
- **Procurement (@procurement-integra)**: Pricing y negocios internacionales, gestión de negociaciones con proveedores internacionales, coordinación de términos comerciales y condiciones de compra, recopilación y validación de documentación de proveedores
- **Equipo Legal (@legal-integra)**: Aspectos jurídicos, generación de documentos legales por componente
- **Facturación (@facturacion-integra)**: Equipo encargado de la emisión de facturas y proformas
- **Estrategia (@estrategia-integra)**: Cálculo de intereses de financiamiento, análisis de valores de operaciones
- **Tesorería (@tesoreria-integra)**: Gestiona los pagos, confirmación de pagos entrantes y salientes
- **Equipo Colombia (Agregación)**: Responsable de iniciar flujos y agregar miembros al canal
- **KAM (Key Account Manager)**: Responsable de la operación y gestión del cliente
- **Equipo Comercial (@comercial-co-integra)**: Maneja la relación comercial, dependiente del país
- **Comité de Giro (@comite-de-giro-integra)**: Comité evaluador responsable de la aprobación de operaciones
- **Mesa de Control (@mesa-control-mx)**: Equipo encargado de validación y control de giros a proveedores internacionales

#### Actores Internos (Estructura Finkargo)
- **Finkargo Abroad**: Comercializadora encargada de negociación y pagos con actores externos (proveedores y aliados logísticos)
- **Finkargo Colombia/México**: Encargados de financiar al cliente en sus respectivos mercados

#### Actores Externos
- **Cliente**: Receptor final de la documentación, responsable del pago inicial (cuota operacional + 10% adelanto), beneficiario del financiamiento (80%)
- **Proveedores Internacionales**: Entidades externas que suministran productos, requieren certificación bancaria, certificado de existencia y datos bancarios completos
- **Aliados Logísticos**: Red de servicios especializados que incluye agentes de carga internacionales, empresas de transporte marítimo y aéreo, verificadores de fábrica y de mercancía, compañías de seguros internacionales, bodegas y almacenes especializados, y otros servicios logísticos complementarios

## 2. PROCESO STEP 1: NEGOCIACIÓN CON CLIENTE Y GESTIÓN FINANCIERA INICIAL

### 2.1 Objetivo del Proceso
Gestionar la negociación con el cliente que será financiado, estableciendo las condiciones comerciales iniciales y asegurando el pago de la cuota operacional y adelanto. Este proceso incluye:
- Solicitud de firma de cotización a Finkargo Colombia/México
- Emisión de factura de Cuota Operacional (pago por manejo de operación a nivel logístico)
- Solicitud y confirmación del 10% de adelanto del costo total de la operación
- Creación de documentos legales para la operación logística
- Confirmación de pagos para dar inicio a la operación de financiamiento

### 2.2 Descripción Detallada del Proceso

#### Fase 1: Preparación e Inicio de Operación
1. **Agregación del equipo**: Se añaden los miembros necesarios al canal utilizando el flujo "Agregar equipo Colombia"
2. **Creación de CARD de operación**: Se establece el registro de la operación indicando el KAM responsable
3. **Adjunto de cotización**: Se requiere el PDF de la cotización firmada por el cliente y Finkargo Colombia/México

#### Fase 2: Gestión de Documentación
4. **Subida de cotización del cliente**: Se registra la información básica incluyendo:
   - Nombre de la operación
   - Identificación del KAM responsable y equipo comercial por país
   - PDF de cotización del cliente
   - Estado de firma de cotización
   - Item ID correspondiente

#### Fase 3: Solicitud de Firma y Procesamiento
5. **Solicitud a Finkargo Colombia/México**: Se solicita la firma de cotización especificando KAM y equipo comercial
6. **Confirmación de firma**: @comercial-co-integra confirma que se realizó la solicitud de firma
7. **Adjuntar cotización firmada**: Una vez firmada, se adjunta la cotización con firma de Finkargo Colombia/México

#### Fase 4: Emisión de Factura de Cuota Operacional
8. **Actualización de cotización**: Se actualiza el estado de la cotización firmada
9. **Solicitud de facturación**: Se solicita a @facturacion-integra la emisión de factura de Cuota Operacional desde Finkargo Colombia/México y/o Finkargo Abroad (actuando como comercializadora)
10. **Procesamiento de factura**: El equipo de facturación procesa la solicitud y adjunta la factura de Cuota Operacional, coordinando con Finkargo Abroad para la comercialización del proceso

#### Fase 5: Documentos Legales y Gestión del 10% de Adelanto
11. **Creación de documentos legales**: Se inicia el proceso para generar documentación legal de la operación logística a través del enlace "INTEGRA - Documentos Legales"
12. **Recopilación de información de pago**: Se completa un formulario con:
    - Valor de Cuota Operacional
    - Valor de anticipo (10% del costo total de la operación)
    - Valor total de pago a confirmar
    - Moneda de pago
13. **Solicitud de soporte de pago**: Se solicita adjuntar el soporte de pago con 10% de anticipo del costo total

#### Fase 6: Confirmación de Pagos y Activación de Operación
14. **Cambio de estado a LISTO**: @tesoreria-integra cambia el estado de pago de la Cuota Operacional a "LISTO" una vez confirmado el reflejo del pago
15. **Información detallada del pago**: Se proporciona información específica sobre:
    - Cuota Operacional con respuestas del valor
    - Moneda de pago confirmada
    - 10% de anticipo con valor confirmado
    - Valor total del pago por confirmar
16. **Confirmación final y preparación para negociación con proveedores**: @operaciones-integra-co confirma que el pago de la Cuota Operacional y el 10% de adelanto han ingresado correctamente, habilitando el inicio de la negociación interna con proveedores

## 3. PROCESO STEP 2: NEGOCIACIÓN INTERNA CON PROVEEDORES INTERNACIONALES

### 3.1 Objetivo del Proceso
Gestionar la negociación interna con proveedores internacionales para asegurar las mejores condiciones comerciales que permitan el financiamiento de la operación. Este proceso incluye:
- Inicio de contacto y negociación directa con proveedores de mercancía internacional
- Recopilación de documentación del proveedor (proformas, certificaciones, datos bancarios)
- Coordinación de términos de pago, incoterms y condiciones comerciales favorables
- Gestión de información operacional y comercial internacional detallada
- Preparación de documentación para aprobación interna por comité

### 3.2 Descripción Detallada del Proceso

#### Fase 1: Preparación e Inicio de Negociación con Proveedores
1. **Identificación de la operación**: Se selecciona el elemento específico de la lista que corresponde a la operación de compra internacional que se va a gestionar
2. **Actualización de estado inicial**: Se modifica el elemento de lista para reflejar que ha iniciado el proceso de compra internacional
3. **Iniciación de contacto**: @procurement-integra recibe la instrucción de iniciar contacto con el proveedor de mercancía previamente identificado

#### Fase 2: Solicitud y Gestión de Documentación del Proveedor
4. **Comunicación inicial con proveedor**: @procurement-integra envía mensaje solicitando al proveedor que proporcione la documentación requerida para continuar con la negociación
5. **Especificación de documentos obligatorios**: Se solicita específicamente:
   - **Proforma comercial**: Debe estar a nombre de Finkargo Colombia/México y/o Finkargo Abroad, incluyendo términos de pago detallados, incoterm aplicable, días de producción estimados, y demás condiciones comerciales
   - **Certificación bancaria**: Documento oficial que valide la capacidad financiera y solvencia del proveedor, o documento equivalente aceptado internacionalmente
   - **Certificado de existencia**: Documentación legal que confirme la constitución y operación legal del proveedor, o su equivalente según la jurisdicción del proveedor
6. **Instrucciones de continuidad**: Se indica al proveedor que debe hacer clic en "Continuar" una vez que la negociación con el proveedor haya culminado y se reciba la documentación completa solicitada

#### Fase 3: Recopilación Integral de Información Comercial y Operacional
7. **Activación de formulario detallado**: Se procede a completar un formulario exhaustivo que captura toda la información necesaria para la operación de importación, organizado en las siguientes secciones:

**Sección A: Información General del Cliente y Operación**
- **Identificación del cliente**: Nombre completo del cliente que realizará la importación
- **Geografía comercial**:
  - País desde donde se realizará la importación (país exportador)
  - País destino de la mercancía (país importador)
- **Valoración comercial**:
  - Valor TOTAL de la compra en la moneda original
  - Moneda de pago principal solicitada por el cliente
  - Información sobre disponibilidad de otras monedas alternativas

**Sección B: Términos y Condiciones Comerciales**
- **Condiciones de pago con el cliente final**:
  - Estructura detallada de pagos (ejemplo: 30% como anticipo, saldo 70% contra entrega de Bill of Lading)
  - Definición clara de hitos de pago y documentos requeridos para cada desembolso
- **INCOTERM de compra**: Términos internacionales de comercio aplicables a la compra desde el proveedor
- **Ubicación específica de origen**: Sitio acordado para la operación de compra (ejemplo: Shanghai - Puerto de Shanghai, China)
- **INCOTERM de venta**: Términos aplicables a la venta hacia el cliente final
- **Ubicación específica de destino**: Sitio acordado para la entrega final (ejemplo: Zona Franca específica, Bodega determinada con dirección completa)

**Sección C: Información Completa del Proveedor/Beneficiario**
- **Datos de identificación**:
  - Nombre legal completo del beneficiario/proveedor de mercancía
  - Dirección comercial completa del proveedor
  - Código postal del proveedor
  - Provincia o estado donde opera el proveedor
- **Información bancaria primaria**:
  - Nombre oficial del banco donde mantiene cuenta el proveedor
  - Número de cuenta bancaria completo
  - Código SWIFT del banco principal
- **Información bancaria secundaria (para transferencias internacionales)**:
  - Nombre del banco intermediario (si aplica)
  - Código SWIFT del banco intermediario

**Sección D: Gestión Documental**
- **Carga de documentos del proveedor**: Subida de todos los documentos proporcionados por el proveedor de mercancía (certificaciones, registros, etc.)
- **Ingreso de proforma de Finkargo**: Subida de la proforma oficial generada por Finkargo Colombia/México para la operación
- **Observaciones adicionales**: Campo libre para incluir cualquier información relevante adicional sobre la operación, condiciones especiales, o consideraciones particulares

#### Fase 4: Validación y Preparación para Aprobación Interna
8. **Actualización de elemento de lista**: Se modifica el estado del elemento correspondiente para reflejar que toda la información ha sido recopilada
9. **Notificación a procurement**: Se envía comunicación a @procurement-integra informando que se ha subido la información general de la operación y está disponible para revisión
10. **Validación de proforma base**: Se confirma que la proforma del proveedor "pineada" (marcada como referencia) es efectivamente la que corresponde al inicio de la negociación y servirá como documento base
11. **Instrucciones para finalización**: Se proporciona orientación para diligenciar el formulario final de acuerdo con los términos definitivos acordados en la negociación
12. **Solicitud de aprobación al comité**: Se activa el enlace "INTEGRA - Solicitud a Comité de Giro" para proceder con el proceso de evaluación y aprobación interna

## 4. PROCESO STEP 3: APROBACIÓN INTERNA DE LA NEGOCIACIÓN

### 4.1 Objetivo del Proceso
Gestionar la aprobación interna de la negociación realizada con proveedores mediante evaluación del Comité de Giro, que analiza la viabilidad y riesgos de la operación antes de autorizar el financiamiento. Este proceso incluye:
- Evaluación de criterios de riesgo y elegibilidad del cliente y proveedor por parte del comité interno
- Análisis detallado de condiciones comerciales y términos de pago negociados
- Verificación de licencias, registros y condiciones especiales regulatorias
- Aprobación, rechazo o condicionamiento basado en criterios establecidos de riesgo
- Autorización para proceder con el financiamiento de la operación una vez aprobado

### 4.2 Descripción Detallada del Proceso

#### Fase 1: Iniciación y Preparación del Proceso de Evaluación
1. **Activación desde interfaz de Slack**: El proceso se inicia mediante un enlace específico disponible en Slack que dirige automáticamente al flujo de trabajo del Comité de Giro
2. **Acceso al formulario de evaluación**: Se presenta el formulario "Comité de Giro" que contiene todos los criterios de evaluación necesarios para la toma de decisiones

#### Fase 2: Evaluación Sistemática de Criterios de Elegibilidad y Riesgo
3. **Cuestionario estructurado de evaluación**: El Comité de Giro debe completar una evaluación exhaustiva basada en los siguientes criterios críticos organizados por categorías:

**Categoría A: Análisis del Historial y Experiencia del Cliente**
- **Criterio de experiencia temporal**: "¿El cliente ha importado por más de 2 años?"
  - Evalúa la estabilidad y experiencia del cliente en operaciones de comercio internacional
  - Busca determinar si el cliente tiene suficiente conocimiento del proceso de importación
- **Criterio de frecuencia específica**: "¿El cliente ha importado la misma mercancía 3 o más veces en los últimos 2 años?"
  - Analiza la recurrencia y especialización del cliente en el tipo específico de mercancía
  - Permite evaluar el riesgo asociado con la familiaridad del producto

**Categoría B: Evaluación de Capacidad Regulatoria y Legal**
- **Criterio de compliance regulatorio**: "¿El cliente tiene las licencias o registros para nacionalizar?"
  - Verifica que el cliente cumpla con todos los requisitos legales para la importación
  - Asegura que no habrá problemas regulatorios durante el proceso de nacionalización
- **Criterio de condiciones especiales**: "¿La subpartida arancelaria tiene condiciones especiales para nacionalizarse?"
  - Evalúa complejidades adicionales según la clasificación arancelaria específica
  - Identifica requisitos especiales que puedan impactar el proceso o costos

**Categoría C: Análisis del Proveedor y Relaciones Comerciales**
- **Criterio de alcance comercial del proveedor**: "¿Proveedor vende a más de un importador en Colombia?"
  - Evalúa la diversificación y estabilidad comercial del proveedor en el mercado colombiano
  - Determina si el proveedor tiene experiencia múltiple en el mercado local
- **Criterio de independencia comercial**: "¿El cliente tiene participación accionaria con el proveedor o viceversa?"
  - Identifica posibles conflictos de interés o relaciones que puedan afectar la transparencia de la operación
  - Evalúa riesgos asociados con operaciones entre partes relacionadas

**Categoría D: Clasificación y Manejo de Mercancías**
- **Criterio de clasificación de riesgo de mercancía**: "¿La mercancía es peligrosa, refrigerada, perecedera, madera o cerámica?"
  - Categoriza la mercancía según su nivel de complejidad logística y regulatoria
  - Identifica requisitos especiales de manejo, almacenamiento o transporte
  - Evalúa riesgos asociados con tipos específicos de productos

**Categoría E: Evaluación de Términos Comerciales y Financieros**
- **Criterio de estructura de pagos**: "Los términos de pago incluyen más del 30% antes de recibir B/L (Negociación final)"
  - Analiza la estructura de pagos acordada y su impacto en el riesgo financiero
  - Evalúa la exposición financiera basada en los términos de pago negociados
- **Criterio de verificaciones adicionales**: "¿Aplica Verifica de Fábrica o Previo? ¿o ambos? O Ninguno"
  - Determina qué nivel de verificación se requiere para la operación
  - Establece controles adicionales de calidad o compliance según sea necesario

#### Fase 3: Procesamiento y Documentación de la Evaluación
4. **Selección del elemento específico**: Se identifica y selecciona el elemento particular de la lista que corresponde a la operación bajo evaluación
5. **Transmisión de información al comité**: @comite-de-giro-integra recibe formalmente la información compilada para proceder con la aprobación en Comité de Giro
6. **Estructuración de información para revisión**: Se presenta un mensaje detallado que incluye:
   - **Información general de operación "en chincheta"**: Datos clave de la operación siempre visibles como referencia
   - **Información detallada del importador**: Datos específicos del cliente incluidos en el cuerpo del mensaje
   - **Instrucciones claras de acción**: Orientación para dar clic en "Aprobar" para completar el formulario y aprobar los giros bajo las condiciones establecidas

#### Fase 4: Presentación Estructurada de Información para Toma de Decisiones
7. **Compilación y presentación de respuestas**: Se genera un resumen estructurado que incluye cada criterio evaluado con:
   - **Pregunta original formulada**
   - **Respuesta proporcionada con enlaces de verificación**
   - **Contexto adicional cuando sea relevante**

#### Fase 5: Proceso de Decisión y Formalización
8. **Activación del proceso de aprobación**: Se utiliza el botón "Aprobar" para acceder al formulario final de decisión
9. **Formulario de resultados de evaluación**: Se completa un formulario específico que captura:
   - **Estado de aprobación de giros**: "¿Giros aprobados?" (Sí/No)
   - **Condicionamiento de la aprobación**: "¿Están condicionados los giros?" con especificación de condiciones si aplica
10. **Actualización formal del estado**: Se modifica el elemento de lista correspondiente para reflejar el resultado de la evaluación

#### Fase 6: Comunicación de Decisión y Autorización para Financiamiento
11. **Comunicación oficial de la decisión**: @comite-de-giro-integra emite comunicación formal indicando que el Comité de aprobación de giros ha evaluado la operación y comunica:
    - **Resultado específico**: Giros aprobados, aprobados con condiciones, o rechazados
    - **Condiciones aplicables**: Detalle de cualquier condición específica que se deba cumplir
    - **Identificación del responsable**: Persona específica que aprobó la operación
    - **Persona que completó el formulario**: Identificación del evaluador responsable
12. **Autorización para financiamiento**: Se notifica a @operaciones-integra-co para iniciar el proceso de financiamiento mediante el enlace "INTEGRA - Componente de Financiamiento Giro 1"
    - Esta activación autoriza el inicio formal del proceso de financiamiento (80% hacia el cliente)
    - Se establece la autorización directa entre la aprobación del comité y la ejecución del financiamiento

## 5. PROCESO STEP 5: FINANCIAMIENTO DE LA OPERACIÓN (80% HACIA EL CLIENTE)

### 5.1 Objetivo del Proceso
Gestionar el proceso de financiamiento de la operación, proporcionando al cliente el 80% del valor de la operación una vez confirmados todos los aspectos legales y documentales. Este proceso incluye:
- Validación de cambios en negociación y actualización de proformas del proveedor
- Cálculo de intereses de financiamiento y valores totales de la operación
- Generación de documentos legales específicos del componente de financiamiento
- Integración de todos los costos (flete internacional, seguro, gastos en destino)
- Creación de factura/proforma por el valor total y activación del primer giro al proveedor internacional
- Gestión del primer componente de financiamiento hacia el cliente

### 5.2 Formularios y Datos Requeridos

#### Formulario de Costos Detallado
- **ID Integra**: Identificador único de la operación en el sistema
- **ID Paga**: Identificador de pagos asociado
- **País Exportador**: País de origen de la mercancía
- **INCOTERM de Negociación**: Términos comerciales acordados
- **Flete Internacional**: Valor del transporte marítimo/aéreo con aliados logísticos
- **Seguro**: Valor de la póliza de seguro de la mercancía
- **Gastos en Destino**: Costos de nacionalización, impuestos, tasas portuarias, servicios de bodegas y agentes
- **Moneda de pago**: Divisa en la que se realizarán los pagos
- **Nota**: Campo para observaciones adicionales

## 6. PROCESO STEP 6: PRIMER GIRO A PROVEEDOR INTERNACIONAL

### 6.1 Objetivo del Proceso
Gestionar el primer pago a proveedor(es) de mercancía internacional según la negociación establecida, ejecutado por Finkargo Abroad hacia el/los proveedor(es). 

**IMPORTANTE: Relación Operación-Proveedores**
- **Una operación puede incluir múltiples proveedores de mercancía**
- **Cada proveedor mantiene términos de negociación independientes**
- **Cada proveedor requiere datos bancarios y documentación específica**
- **Los giros se procesan individualmente por proveedor**
- **Los términos de pago pueden diferir significativamente entre proveedores**

### 6.2 Estructura de Datos: Operación → Múltiples Proveedores

**Modelo de relación:**
```
OPERACIÓN (1) ←→ (N) PROVEEDORES DE MERCANCÍA
```

**Cada proveedor mantiene:**
- Negociación comercial independiente (precios, términos, incoterms)
- Estructura de pagos específica (porcentajes, fechas, condiciones)
- Datos bancarios propios (banco, cuenta, SWIFT, intermediarios)
- Documentación legal individual (certificaciones, registros)
- Calendario de pagos diferenciado
- Moneda de pago específica

### 6.3 Formulario "Solicitar giro 1 Provee" (Por Proveedor Individual)
- **Nombre Proveedor de Mercancía (Compañía)**: Identificación específica y completa del proveedor beneficiario del giro actual
- **Valor del pago solicitado**: Monto exacto a transferir al proveedor específico (según su negociación individual)
- **Moneda de pago**: Divisa específica acordada con este proveedor (puede diferir entre proveedores)
- **Número de giro**: Identificador único del giro (formato sugerido: OPERACION-PROVEEDOR-GIRO#)
- **Porcentaje de Giro**: Porcentaje del valor total asignado específicamente a este proveedor (Ejemplo: 30% del valor del Proveedor X, 12.5% del valor del Proveedor Y)
- **Fecha de solicitud de Giro 1**: Fecha en que se solicita el primer giro a este proveedor específico
- **ID de PAGA**: Identificador del sistema de pagos asociado a este proveedor específico
- **Días de financiamiento - PAGA**: Plazo de financiamiento específico negociado con este proveedor
- **Documentación actualizada específica del proveedor**:
  - Adjunta Proforma Proveedor actualizada (específica de este proveedor si cambió su negociación)
  - Adjunta la cotización actualizada (si cambió la negociación general que afecta a este proveedor)
- **Observaciones por cambio negociación**: Campo para documentar modificaciones específicas con este proveedor individual

### 6.4 Gestión de Múltiples Proveedores en Paralelo

**Ejecución simultánea:**
- Giro 1 a Proveedor A (30% de su participación) → Proceso independiente
- Giro 1 a Proveedor B (25% de su participación) → Proceso paralelo
- Giro 1 a Proveedor C (40% de su participación) → Proceso simultáneo

**Validación individual por Mesa de Control:**
- Cada proveedor requiere validación específica de sus datos bancarios
- Verificación independiente de términos comerciales por proveedor
- Confirmación individual de documentación y certificaciones

### 6.5 Formulario "Confirma Pago Proveedor" (Individual por Proveedor)
- **Proveedor beneficiario**: Confirmación específica del proveedor que recibió el pago
- **Adjunta el soporte de pago a Proveedor**: Comprobante específico de la transferencia realizada a este proveedor individual
- **Fecha de pago al Proveedor**: Fecha efectiva en que se realizó el pago al proveedor específico

### 6.6 Consideraciones Técnicas para Múltiples Proveedores

**Base de datos relacional:**
```
TABLA: operaciones
- id_operacion (PK)
- nombre_operacion
- cliente
- estado_general

TABLA: proveedores_operacion
- id_proveedor_operacion (PK)
- id_operacion (FK)
- nombre_proveedor
- datos_bancarios
- terminos_negociacion
- estructura_pagos
- moneda_pago

TABLA: giros_proveedor
- id_giro (PK)
- id_proveedor_operacion (FK)
- numero_giro
- valor_giro
- fecha_solicitud
- estado_giro
```

**Estados independientes por proveedor:**
- Proveedor A: Giro 1 Completado → Esperando Giro 2
- Proveedor B: Giro 1 En Proceso → Mesa de Control
- Proveedor C: Giro 1 Pendiente → Documentación Faltante

**Interfaz sugerida:**
- Vista de operación con tabla de proveedores
- Detalle expandible por cada proveedor
- Estado visual independiente por proveedor
- Gestión de giros individual con histórico por proveedor

## 7. PROCESO STEP 7: SEGUNDO ANTICIPO OPERACIÓN

### 7.1 Formulario "2do Anticipo Operación"
- **Valor de Segundo Anticipo**: Monto exacto del 10% adicional de la operación
- **Moneda de pago**: Divisa en la que se debe realizar el pago
- **Fecha de pago**: Fecha límite o programada para el pago del segundo anticipo
- **Adjunta el soporte de pago**: Comprobante del pago realizado por el cliente

## 8. PROCESO STEP 8: SEGUNDO GIRO A PROVEEDOR INTERNACIONAL

### 8.1 Objetivo del Proceso
Gestionar el segundo giro (y posteriores según sea necesario) a proveedor(es) de mercancía internacional según los términos de negociación establecidos, ejecutado por Finkargo Abroad hacia el/los proveedor(es). Este proceso se activa dependiendo del número de giros que se requieran para cumplir con el pago total de la mercancía según los términos de negociación acordados individualmente con cada proveedor.

**IMPORTANTE: Gestión Individual por Proveedor**
- **Cada proveedor mantiene su propia estructura de pagos** (puede ser 2, 3, 4+ giros)
- **Los segundos giros son independientes entre proveedores**
- **Un proveedor puede estar en Giro 2 mientras otro está en Giro 1**
- **Las fechas y montos de segundos giros varían por proveedor**
- **Cada proveedor puede tener diferentes condiciones para giros posteriores**

### 8.2 Estructura de Pagos Diferenciada por Proveedor

**Ejemplo operativo:**
```
OPERACIÓN #123:
├── Proveedor A (40% del total)
│   ├── Giro 1: 30% (completado)
│   ├── Giro 2: 40% (en proceso)
│   └── Giro 3: 30% (pendiente)
├── Proveedor B (35% del total)
│   ├── Giro 1: 50% (completado)
│   └── Giro 2: 50% (pendiente)
└── Proveedor C (25% del total)
    └── Giro 1: 100% (completado)
```

### 8.3 Formulario "Solicitar giro 2 Provee" (Individual por Proveedor)
- **Nombre de Proveedor de Mercancía (Compañía)**: Identificación específica del proveedor beneficiario del segundo giro
- **Valor del pago solicitado**: Monto exacto del segundo giro al proveedor específico (según su estructura individual de pagos)
- **Moneda de pago**: Divisa específica de este proveedor (puede diferir entre proveedores)
- **Número de giro**: Identificador único del segundo giro (formato: OPERACION-PROVEEDOR-GIRO2)
- **Porcentaje de Giro**: Porcentaje del valor total de este proveedor correspondiente a este segundo giro
- **Fecha de solicitud de Giro 2**: Fecha específica según calendario acordado con este proveedor
- **ID de PAGA**: Identificador del sistema de pagos específico para este proveedor
- **Días de financiamiento - PAGA**: Plazo de financiamiento específico para este segundo giro del proveedor
- **Documentación actualizada del proveedor específico**:
  - Adjunta Proforma Proveedor actualizada (si cambió la negociación con este proveedor)
  - Adjunta la cotización actualizada (si cambió la negociación general)
- **Observaciones por cambio negociación**: Modificaciones específicas con este proveedor individual

### 8.4 Activación de Procesos Posteriores Diferenciados (Por Proveedor)

**El sistema evalúa individualmente cada proveedor:**

#### Opción A: Finalización de Negociación con Proveedor Específico
- **Condición**: Si finalizó la negociación con **un proveedor específico** (completó todos sus giros)
- **Evaluación**: Se verifica si **todos los proveedores** de la operación han completado sus pagos
- **Si todos terminaron**: Activar "INTEGRA - FACTURA FINAL (COFACE - Integra 2.0)"
- **Si otros proveedores continúan**: Mantener operación activa, solo cerrar el proveedor individual

#### Opción B: Continuación de Pagos al Mismo Proveedor
- **Condición**: Si existe otro pago pendiente para **este proveedor específico** (tercer giro, cuarto giro, etc.)
- **Activación**: "INTEGRA - SEGUNDO GIRO A PROVEEDOR INTERNACIONAL" (proceso recursivo para el mismo proveedor)
- **Propósito**: Continuar con la estructura de pagos acordada con este proveedor hasta completar el 100% de su participación

#### Opción C: Segundo Componente de Financiamiento
- **Condición**: Si existe otro Componente de Financiamiento a nivel de operación
- **Activación**: "INTEGRA - SEGUNDO Componente de Financiamiento Plataforma"
- **Propósito**: Gestionar componentes adicionales de financiamiento según la estructura general de la operación

### 8.5 Gestión de Estados Paralelos por Proveedor

**Panel de control sugerido:**
```
OPERACIÓN #123 - Estado General: EN PROCESO

Proveedor A (Textiles Corp):
├── Giro 1: ✅ Completado (15-Mar)
├── Giro 2: 🔄 En Mesa de Control
└── Giro 3: ⏳ Pendiente

Proveedor B (Electronics Ltd):
├── Giro 1: ✅ Completado (18-Mar)
└── Giro 2: 🔄 Ejecutando Pago

Proveedor C (Materials SA):
└── Giro 1: ✅ Completado (20-Mar) - PROVEEDOR FINALIZADO
```

### 8.6 Consideraciones Técnicas para Múltiples Proveedores

**Lógica de finalización de operación:**
```sql
-- Verificar si operación puede finalizar
SELECT COUNT(*) FROM proveedores_operacion 
WHERE id_operacion = X 
AND estado_proveedor != 'COMPLETADO'

-- Si resultado = 0, todos los proveedores terminaron
-- Activar FACTURA FINAL
```

**Estados por proveedor:**
- ACTIVO: Proveedor con giros pendientes
- EN_PROCESO: Proveedor con giro en trámite
- COMPLETADO: Proveedor que finalizó todos sus giros
- SUSPENDIDO: Proveedor con incidencias

**Notificaciones diferenciadas:**
- Notificar solo a equipos relevantes para cada proveedor específico
- Escalamientos independientes por proveedor (24hrs por cada uno)
- Confirmaciones individuales sin impactar otros proveedores

### 8.7 Flexibilidad Temporal y Operativa

**Calendarios independientes:**
- Proveedor A: Giros mensuales (30-60-90 días)
- Proveedor B: Giros contra hitos (Pre-embarque, Embarque)
- Proveedor C: Pago único (100% al zarpe)

**Monedas diferenciadas:**
- Proveedor A: USD
- Proveedor B: EUR  
- Proveedor C: CNY

**Validaciones específicas:**
- Mesa de Control valida cada proveedor según sus propios términos
- Documentación bancaria individual por proveedor
- Confirmaciones de pago independientes

## 9. PROCESO STEP 9: SOLICITUD DE FACTURA FINAL

### 9.1 Formulario "Costos Logísticos extras"
- **País Exportador**: País de origen de la mercancía
- **INCOTERM de Negociación**: Términos comerciales internacionales aplicables
- **Flete Internacional**: Valor del transporte marítimo/aéreo
- **Seguro**: Valor de la póliza de seguro de la mercancía
- **Gastos en Destino**: Costos de nacionalización, impuestos, tasas portuarias
- **Moneda de pago**: Divisa en la que se realizarán los pagos
- **Nota**: Campo para observaciones adicionales relevantes

### 9.2 Rutas de Activación Según Tipo de Operación
- **Ruta A**: Integra COFACE e Integra 2.0 (1 componente) → "INTEGRA - LIBERACIÓN DE MERCANCÍA (Coface - Integra 2.0)"
- **Ruta B**: Integra con varios componentes → "INTEGRA - COMPONENTE DE FINANCIAMIENTO LOGÍSTICO"
- **Ruta C**: Si existe extracosto → "INTEGRA CO STEP 12 - EXTRACOSTO (CO)"
- **Ruta D**: Si existe reembolso → "INTEGRA CO STEP 15 - REEMBOLSO (CO)"

## 10. PROCESO STEP 11: LIBERACIÓN DE MERCANCÍA Y COBRANZA

### 10.1 Formulario "Liberación de mercancía"
- **Número de Liberación**: Identificador único y secuencial de la liberación
- **Monto de Liberación de Mercancía**: Valor específico del capital liberado
- **Moneda de pago**: Divisa en la que se registra la liberación
- **Fecha de Liberación**: Fecha efectiva de la liberación de mercancía

### 10.2 Gestión Híbrida de Procesos
- **Sistema de flujos**: Registro y control de montos de liberación
- **Gestión por correo**: Coordinación logística detallada con aliados y gestión de cobranza
- **Coordinación integrada**: Combinación efectiva de sistemas formales e informales

## 11. PROCESO STEP 12: GESTIÓN DE EXTRACOSTOS

### 11.1 Formulario "Extracostos" (Inicial)
- **Concepto Extracosto**: Descripción específica del tipo de extracosto generado
- **Monto del Extracosto**: Valor exacto del costo adicional no previsto
- **Moneda de pago**: Divisa en la que se debe pagar el extracosto
- **Fecha de solicitud**: Fecha en que se identifica y solicita el manejo del extracosto
- **Justificación**: Explicación detallada de las causas que generaron el extracosto
- **Link de la cotización actualizado**: Enlace a la cotización modificada que incluye el extracosto

### 11.2 Formulario "Extracostos" (Financiamiento)
- **¿Requiere de financiamiento?**: Determinación si el extracosto será financiado por Finkargo o pagado directamente por el cliente
- **¿Cuántos días de financiamiento?**: Si requiere financiamiento, especificación del plazo

### 11.3 Formulario "Pago Extracosto Log"
- **Adjunta swift de pago**: Comprobante de la transferencia o pago realizado
- **Fecha de pago**: Fecha efectiva en que se realizó el pago del extracosto

### 11.4 Causas Principales de Extracostos
- **Demoras en Puerto**: Demurrage, detention, storage
- **Problemas Documentales**: Inexactitud en declaraciones, documentos faltantes
- **Inspecciones Inesperadas**: Gubernamentales, cuarentenas
- **Logística Interna**: Fallas de coordinación, transportes no previstos

## 12. PROCESO STEP 15: REEMBOLSO POR DISMINUCIÓN EN VALOR

### 12.1 Formulario "Información reembolso"
- **¿Cuál es el valor inicial de la mercancía?**: Monto originalmente estimado y facturado al cliente
- **¿Cuál es el valor final de la mercancía?**: Monto real final según factura del proveedor internacional
- **¿Cuánto varió la operación?**: Cálculo de la diferencia entre valor inicial y final
- **Moneda de pago**: Divisa en la que se manejó la operación
- **Por favor adjunta la factura con valor menor**: Subida de la factura final del proveedor con el valor reducido

### 12.2 Formulario "Giro Intercompañías"
- **Adjunta el soporte del giro**: Comprobante de la transferencia intercompañías realizada
- **Fecha de giro intercompañías**: Fecha efectiva en que se realizó la transferencia

### 12.3 Formulario "Giro a Fideicomiso"
- **Adjunta el soporte de pago**: Comprobante del reembolso realizado al fideicomiso del cliente
- **Fecha de giro Fideicomiso**: Fecha efectiva del reembolso

## 13. PROCESO STEP 16: PAGOS PROVEEDORES LOGÍSTICOS (PROPUESTO)

### 13.1 Formulario "Pago Proveedor Logístico"

**Datos de Identificación del Proveedor:**
- **Nombre de Agente Logístico**: Identificación completa del proveedor de servicios logísticos
- **NIT/RFC**: Número de identificación tributaria del proveedor
- **Número de factura**: Identificador de la factura emitida por el proveedor

**Desglose Detallado de Costos:**
- **Flete Internacional (Monto)**: Costo del transporte marítimo o aéreo internacional
- **Flete Nacional (Monto)**: Costo del transporte terrestre nacional o local
- **Gastos Portuarios / Destino (Monto)**: Costos asociados con operaciones portuarias y de destino
- **Otros pagos (Concepto)**: Descripción de servicios adicionales prestados
- **Otros pagos (Monto)**: Valor de servicios adicionales o extraordinarios

**Condiciones de Pago:**
- **Moneda de pago**: Divisa en la que se realizará el pago al proveedor
- **Plazo de pago**: Términos de pago acordados con el proveedor
- **Fecha de solicitud**: Fecha en que se solicita el procesamiento del pago
- **Fecha de vencimiento**: Fecha límite para realizar el pago
- **Tipo de prioridad**: Clasificación de urgencia del pago

**Documentación de Soporte:**
- **Adjunta el soporte para el pago (factura)**: Subida de la factura oficial del proveedor
- **Adjunta Documentos de Proveedor**: Documentación adicional del proveedor (certificaciones, contratos, etc.)

### 13.2 Tipos de Proveedores Logísticos Cubiertos
- **Agentes de Carga Internacionales**: Consolidación, coordinación de embarques, gestión documental
- **Empresas de Transporte**: Flete internacional, servicios naviera/aéreo
- **Verificadores**: Inspección pre-embarque, verificación de calidad, certificaciones
- **Compañías de Seguros**: Cobertura de carga, seguros de transporte, pólizas especializadas
- **Bodegas y Almacenes**: Almacenamiento temporal, manejo de mercancía, cross-docking
- **Servicios Complementarios**: Agentes aduanales, transporte terrestre, servicios de embalaje

## 14. CONSIDERACIONES TÉCNICAS PARA DESARROLLO

### 14.1 Estados y Transiciones del Sistema

**Estados principales por operación:**
```
Iniciada → Negociación Cliente → Negociación Proveedor → 
Evaluación Comité → Aprobada/Rechazada → Financiamiento → 
Giros Proveedor → Factura Final → Liberación → Cerrada
```

**Estados paralelos independientes:**
- Extracostos (pueden activarse en cualquier momento)
- Reembolsos (activados por diferencias de valor)
- Pagos proveedores logísticos (según necesidades operativas)

### 14.2 Referencias Cruzadas y Enlaces
- **"10. Info por GIRO Proveedor"**: Referencia principal para trazabilidad entre procesos
- **Enlaces de verificación**: "Respuesta a: [Campo específico]" para validación cruzada
- **Información "en chincheta"**: Datos clave siempre visibles en la operación

### 14.3 Integraciones Requeridas
- **Sistema de facturación**: Para generación automática de facturas y proformas
- **Módulo de tesorería**: Para confirmación de pagos y gestión de transferencias
- **Plataforma legal**: Para generación de documentos legales por componente
- **Sistema bancario**: Para validación de datos y confirmación de transferencias
- **Gestión documental**: Para almacenamiento y versionado de documentos

### 14.4 Notificaciones y Flujo de Trabajo
- **Notificaciones automáticas**: Entre equipos según avance de fases
- **Escalamientos**: Por timeouts definidos (ej: 24hrs para confirmación de pagos)
- **Validaciones**: Campos obligatorios y dependencias entre formularios
- **Aprobaciones**: Workflow de aprobación con múltiples niveles según monto y riesgo

### 14.5 Reportes y Analytics Necesarios
- **Operacionales**: Tiempo por step, cuellos de botella, eficiencia por equipo
- **Financieros**: Volumen de financiamiento, márgenes, extracostos, reembolsos
- **Comerciales**: Performance por KAM, proveedores más utilizados, rutas principales
- **Riesgos**: Análisis de criterios de aprobación, rechazos por categoría

Esta documentación detallada proporciona la base completa para el desarrollo de la aplicación web, manteniendo toda la riqueza operativa del proceso actual mientras estructura la información para facilitar su implementación tecnológica.