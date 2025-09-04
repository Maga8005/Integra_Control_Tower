# Sistema NPS para Integra Control Tower - Documento de Requerimientos

## Información General

**Proyecto:** Sistema de Net Promoter Score (NPS) contextual para operaciones de importación  
**Producto:** Integra Control Tower  
**Fecha:** Septiembre 2025  
**Versión:** 1.0  

## Resumen Ejecutivo

El objetivo es implementar un sistema de NPS inteligente que mida automáticamente la satisfacción del cliente en momentos clave durante el proceso de operaciones de importación financiadas por Integra. El sistema debe evaluar tanto la experiencia financiera como la gestión con proveedores internacionales, proporcionando insights actionables para mejorar el servicio.

## Análisis del Problema

### Contexto del Negocio
- **Problema Principal:** Falta de medición sistemática de satisfacción del cliente durante el proceso de importación
- **Oportunidad:** Capturar feedback contextual en momentos críticos del journey del cliente
- **Value Proposition:** Mejorar la experiencia del cliente y optimizar la gestión con proveedores internacionales

### Usuarios Objetivo
1. **Clientes importadores:** Reciben y responden encuestas NPS
2. **Equipo comercial:** Usa insights para mejorar gestión de cuentas
3. **Administradores:** Analizan métricas y tendencias generales
4. **Management:** Toma decisiones estratégicas basadas en datos de satisfacción

---

## REQUERIMIENTOS FUNCIONALES

### RF001 - Sistema de Triggers Automáticos
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe disparar automáticamente encuestas NPS en tres momentos específicos del timeline de operación:
- Al alcanzar 16.67% de progreso (Aprobación de Cotización)
- Al alcanzar 50% de progreso (Primer Giro a Proveedor)  
- Al alcanzar 100% de progreso (Liberación de Mercancía)
**Fuente:** Integración con sistema existente de progreso de operaciones  
**Criterio de Aceptación:** Las encuestas se disparan automáticamente sin intervención manual cuando se actualiza el progreso

### RF002 - Encuesta NPS Básica
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe presentar la pregunta estándar de NPS: "Del 0 al 10, ¿qué tan probable es que recomiendes Integra?" con contexto específico según la fase de la operación
**Fuente:** Estándar de metodología NPS  
**Criterio de Aceptación:** Escala visual de 0-10, con etiquetas "Nada probable" y "Muy probable"

### RF003 - Evaluación de Gestión de Proveedores
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** Para la encuesta de mediados (50%), el sistema debe incluir evaluaciones específicas sobre:
- Gestión del financiamiento (escala 1-5 estrellas)
- Coordinación con proveedores (escala 1-5 estrellas)
- Calidad de comunicación (escala 1-5 estrellas)
- Puntualidad en pagos a proveedores (opciones múltiples)
- Efectividad del apoyo en negociación (opciones múltiples)
**Fuente:** Necesidad de evaluar componente diferenciador del servicio (gestión de proveedores)  
**Criterio de Aceptación:** Preguntas adicionales aparecen solo para NPS < 8 en fase de mediados

### RF004 - Recolección de Feedback Cualitativo
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe solicitar comentarios abiertos a usuarios detractores (NPS ≤ 6) con preguntas específicas sobre áreas de mejora
**Fuente:** Necesidad de entender causas de insatisfacción  
**Criterio de Aceptación:** Campo de texto libre aparece para detractores con prompts contextuales

### RF005 - Prevención de Spam
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe garantizar que cada cliente reciba máximo una encuesta NPS por hito por operación
**Fuente:** Evitar fatiga de encuestas  
**Criterio de Aceptación:** Registro de encuestas enviadas previene duplicados

### RF006 - Dashboard de Analytics
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe proporcionar un dashboard para administradores que muestre:
- NPS general y por fase
- Métricas de gestión de proveedores
- Distribución de respuestas (promotores/pasivos/detractores)
- Tendencias temporales
- Alertas automáticas para scores bajos
**Fuente:** Necesidad de insights actionables para management  
**Criterio de Aceptación:** Dashboard actualizado en tiempo real con filtros por país, valor de operación, y período

### RF007 - Sistema de Alertas
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe generar alertas automáticas cuando:
- Un cliente proporciona NPS ≤ 6
- Se detectan patrones negativos con proveedores específicos
- El NPS promedio cae por debajo de umbrales definidos
**Fuente:** Necesidad de intervención proactiva  
**Criterio de Aceptación:** Notificaciones enviadas al equipo comercial dentro de 1 hora

### RF008 - Segmentación por País
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe adaptar encuestas y análisis según el país de operación (Colombia vs México), considerando diferencias culturales en la formulación de preguntas
**Fuente:** Operaciones multi-país con contextos culturales diferentes  
**Criterio de Aceptación:** Preguntas localizadas y métricas segmentadas por país

### RF009 - Integración con Timeline Existente
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe integrarse con la funcionalidad existente de `calculateProgressFromProceso()` para detectar automáticamente cambios en el progreso de operaciones
**Fuente:** Aprovechar infraestructura existente  
**Criterio de Aceptación:** No requiere cambios manuales en el flujo de actualización de progreso

### RF010 - Persistencia de Datos
**Tipo:** Requirement  
**Categoría:** Funcional  
**Descripción:** El sistema debe almacenar todas las respuestas NPS en Supabase con relación a la operación específica, incluyendo timestamp, respuestas cuantitativas y cualitativas
**Fuente:** Necesidad de análisis histórico  
**Criterio de Aceptación:** Datos persistidos inmediatamente después del envío

---

## REQUERIMIENTOS NO FUNCIONALES

### Requerimientos de Producto

### RNF001 - Tiempo de Respuesta
**Tipo:** Requirement  
**Categoría:** No Funcional (Producto)  
**Descripción:** Los modales de NPS deben cargar en menos de 2 segundos después del trigger
**Fuente:** Experiencia de usuario fluida  
**Criterio de Aceptación:** Tiempo de carga medido < 2 segundos en 95% de los casos

### RNF002 - Disponibilidad
**Tipo:** Requirement  
**Categoría:** No Funcional (Producto)  
**Descripción:** El sistema de NPS debe mantener 99.5% de uptime durante horas de operación (8AM - 8PM COT/CST)
**Fuente:** Criticidad de capturar feedback en momentos específicos  
**Criterio de Aceptación:** Monitoring muestra < 0.5% downtime mensual

### RNF003 - Usabilidad Mobile
**Tipo:** Requirement  
**Categoría:** No Funcional (Producto)  
**Descripción:** Las encuestas NPS deben ser completamente funcionales y intuitivas en dispositivos móviles
**Fuente:** Clientes acceden desde diferentes dispositivos  
**Criterio de Aceptación:** Testing exitoso en iOS Safari y Android Chrome

### RNF004 - Tasa de Respuesta Objetivo
**Tipo:** Requirement  
**Categoría:** No Funcional (Producto)  
**Descripción:** El sistema debe lograr una tasa de respuesta mínima del 70% en encuestas enviadas
**Fuente:** Necesidad de datos representativos  
**Criterio de Aceptación:** Métricas mensuales muestran > 70% response rate

### Requerimientos Organizacionales

### RNF005 - Integración con Flujo Actual
**Tipo:** Requirement  
**Categoría:** No Funcional (Organizacional)  
**Descripción:** La implementación no debe interrumpir o modificar el flujo operacional actual de gestión de operaciones
**Fuente:** Continuidad del negocio  
**Criterio de Aceptación:** Despliegue sin downtime de funcionalidades existentes

### RNF006 - Capacitación Mínima
**Tipo:** Requirement  
**Categoría:** No Funcional (Organizacional)  
**Descripción:** El sistema debe ser intuitivo para usuarios existentes sin requerir capacitación adicional
**Fuente:** Eficiencia organizacional  
**Criterio de Aceptación:** Usuarios pueden completar encuestas sin documentación

### RNF007 - Escalabilidad
**Tipo:** Requirement  
**Categoría:** No Funcional (Organizacional)  
**Descripción:** El sistema debe soportar hasta 1000 operaciones simultáneas sin degradación de performance
**Fuente:** Crecimiento proyectado del negocio  
**Criterio de Aceptación:** Load testing exitoso con 1000+ operaciones concurrentes

### Requerimientos Externos

### RNF008 - Privacidad de Datos
**Tipo:** Requirement  
**Categoría:** No Funcional (External)  
**Descripción:** El sistema debe cumplir con regulaciones de protección de datos de Colombia y México (Habeas Data y LFPDPPP)
**Fuente:** Regulaciones legales de ambos países  
**Criterio de Aceptación:** Auditoría legal confirma cumplimiento normativo

### RNF009 - Retención de Datos
**Tipo:** Requirement  
**Categoría:** No Funcional (External)  
**Descripción:** Los datos de NPS deben conservarse por mínimo 5 años para análisis histórico y auditorías
**Fuente:** Requerimientos de auditoría financiera  
**Criterio de Aceptación:** Políticas de backup garantizan retención por 5+ años

---

## ESPECIFICACIONES TÉCNICAS

### SPEC001 - Base de Datos
**Tipo:** Specification  
**Categoría:** Funcional  
**Descripción:** Implementar tabla `nps_responses` en Supabase con los siguientes campos mínimos:
```sql
CREATE TABLE nps_responses (
  id UUID PRIMARY KEY,
  operation_id VARCHAR(255) REFERENCES operations(id),
  stage VARCHAR(20) CHECK (stage IN ('inicio', 'mediados', 'final')),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  financing_rating INTEGER CHECK (financing_rating >= 1 AND financing_rating <= 5),
  supplier_rating INTEGER CHECK (supplier_rating >= 1 AND supplier_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  payment_timing VARCHAR(50),
  negotiation_support VARCHAR(100),
  qualitative_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  country VARCHAR(3)
);
```
**Fuente:** Necesidades de almacenamiento estructurado  

### SPEC002 - API Endpoints
**Tipo:** Specification  
**Categoría:** Funcional  
**Descripción:** Implementar los siguientes endpoints REST:
- `POST /api/nps/submit` - Enviar respuesta NPS
- `GET /api/nps/analytics/{country}` - Obtener métricas por país
- `GET /api/nps/operation/{id}` - Obtener NPS de operación específica
- `POST /api/nps/trigger` - Trigger manual para testing
**Fuente:** Integración frontend-backend  

### SPEC003 - Encriptación
**Tipo:** Specification  
**Categoría:** No Funcional (External)  
**Descripción:** Implementar encriptación AES-256 para comentarios cualitativos almacenados en base de datos
**Fuente:** Protección de datos sensibles  

### SPEC004 - Rate Limiting
**Tipo:** Specification  
**Categoría:** No Funcional (Producto)  
**Descripción:** Implementar rate limiting de 10 requests por minuto por cliente para endpoints de NPS
**Fuente:** Prevención de abuso del sistema  

### SPEC005 - Framework de UI
**Tipo:** Specification  
**Categoría:** No Funcional (Organizacional)  
**Descripción:** Utilizar React Hook Form para manejo de formularios NPS y Tailwind CSS para estilos consistentes con la aplicación existente
**Fuente:** Consistencia con stack tecnológico actual  

---

## CRITERIOS DE ACEPTACIÓN GENERALES

### Funcionalidad Core
- [ ] NPS se dispara automáticamente en los 3 hitos definidos
- [ ] Encuestas se adaptan según la fase (inicio/mediados/final)
- [ ] Respuestas se almacenan correctamente en Supabase
- [ ] Dashboard muestra métricas en tiempo real
- [ ] Alertas se envían para scores bajos

### Experiencia de Usuario
- [ ] Modal de NPS no es intrusivo y se puede cerrar
- [ ] Funciona correctamente en mobile y desktop
- [ ] Tiempo de carga < 2 segundos
- [ ] UI consistente con diseño actual de Integra

### Integración
- [ ] No interrumpe funcionalidades existentes
- [ ] Se integra con sistema de progreso actual
- [ ] Datos se sincronizan correctamente con Supabase

### Analytics y Reportes
- [ ] Dashboard muestra métricas segmentadas por fase y país
- [ ] Detecta y alerta sobre problemas con proveedores específicos
- [ ] Exportación de datos para análisis adicional

---

## PLAN DE IMPLEMENTACIÓN

### Fase 1: Core NPS System (2-3 semanas)
- Implementación de triggers automáticos
- Creación de modales básicos de NPS
- Integración con base de datos
- Testing básico

### Fase 2: Enhanced Analytics (1-2 semanas)
- Dashboard de métricas
- Sistema de alertas
- Segmentación por país
- Optimizaciones de performance

### Fase 3: Advanced Features (1 semana)
- Feedback cualitativo avanzado
- Exportación de reportes
- Configuración de umbrales personalizables
- Testing de carga

---

## RIESGOS Y MITIGACIONES

### Riesgo: Baja Tasa de Respuesta
**Mitigación:** Diseño no-intrusivo, timing inteligente, incentivos opcionales

### Riesgo: Impacto en Performance
**Mitigación:** Triggers asíncronos, caching de datos, optimización de queries

### Riesgo: Datos Inconsistentes
**Mitigación:** Validación estricta, testing exhaustivo, rollback automático

---

## MÉTRICAS DE ÉXITO

### KPIs Primarios
- **Tasa de respuesta NPS:** > 70%
- **NPS promedio general:** Baseline + mejora mensual
- **Tiempo de resolución de detractores:** < 24 horas

### KPIs Secundarios
- **Adoption rate:** > 95% de operaciones con NPS enviado
- **Sistema uptime:** > 99.5%
- **User satisfaction con el sistema:** > 8/10

---

## CONSIDERACIONES FUTURAS

### Posibles Expansiones
- Integración con sistemas de CRM externos
- Análisis predictivo de satisfacción
- Automatización de seguimiento a detractores
- Integración con WhatsApp/SMS para encuestas

### Optimizaciones
- Machine learning para timing óptimo de encuestas
- Personalización de preguntas por tipo de cliente
- Benchmarking automático contra industria

---

*Documento generado siguiendo metodología WRSPM y estándares de ingeniería de requerimientos*  
*Todos los requerimientos son testeable, medibles y trazables al problema original*