# INTEGRA CO Expansion - Project Context for Claude Code

## Project Overview

**Project Name**: Integra Control Tower - INTEGRA CO Module Expansion  
**Current Status**: Expanding existing webapp from MVP to full INTEGRA CO process management  
**Development Stage**: Architecture & Foundation Phase  
**Target Timeline**: Q2 2025  

## Current State Analysis

### What We Have (Integra Control Tower Light v6)
- **Functional webapp at 95% completion** with authentication, dashboards, CSV processing
- **Tech Stack**: React 18 + TypeScript, Supabase (PostgreSQL), Edge Functions
- **Key Features**: 
  - Dual authentication (NIT/RFC for Colombia/Mexico)
  - Advanced CSV parser with regex extraction
  - Financial timeline with real dates
  - Multi-currency support (USD, EUR, MXN, COP)
  - NPS system with contextual feedback
  - Client & Admin dashboards

### What We Need to Add (INTEGRA CO Process)
- **16-step workflow** for international trade financing operations
- **Multi-provider management** (1 operation → N providers, each with independent terms)
- **Complex approval workflows** (Committee evaluations with risk criteria)
- **Parallel process orchestration** (multiple teams working simultaneously)
- **Legal document generation** per component
- **Advanced cost management** (extras, refunds, logistic provider payments)

## Architecture Extension Strategy

### Code Organization Philosophy
Following the **extend existing project** approach:
- **Encapsulate business logic** in services/classes 
- **Isolate new functionality** in dedicated modules
- **Maintain backward compatibility** with current features
- **Use feature flags** for progressive deployment

### Proposed Structure
```
src/
├── core/                      # Existing core (keep)
├── integra-co/               # NEW: INTEGRA CO specific module
│   ├── workflows/            # 16 process steps
│   ├── orchestration/        # Multi-process coordination
│   ├── providers/           # Multi-provider management
│   ├── approvals/           # Committee & validation flows
│   ├── documents/           # Legal document generation
│   └── costs/               # Advanced cost management
```

## Database Architecture Requirements

### New Tables Needed
```sql
-- Multi-provider support
proveedores_operacion (
  id, operacion_id, proveedor_nombre, 
  estructura_pagos, estado_individual, terminos_comerciales
)

-- Workflow orchestration  
workflow_steps (
  id, operacion_id, step_number, step_name,
  estado, responsable_equipo, fecha_inicio, fecha_completado
)

-- Committee approvals
comite_evaluaciones (
  id, operacion_id, criterios_evaluacion, 
  decision, condiciones, evaluador, fecha_aprobacion
)

-- Complex payment structures (per provider)
giros_proveedor (
  id, proveedor_operacion_id, numero_giro, 
  valor_giro, moneda, porcentaje, estado_pago
)

-- Legal documents per component
documentos_legales (
  id, operacion_id, componente, tipo_documento,
  estado_generacion, archivo_url, fecha_creacion
)

-- Advanced cost tracking
costos_adicionales (
  id, operacion_id, tipo_costo, concepto,
  monto, moneda, requiere_financiamiento, estado
)
```

### Relationship Complexity
- **1 Operation** → **N Providers** → **M Payment Installments each**
- **1 Operation** → **16 Workflow Steps** → **Multiple Teams in Parallel**
- **1 Operation** → **Multiple Legal Components** → **Dynamic Document Generation**

## Technical Implementation Priorities

### Phase 1: Foundation (Weeks 1-3)
1. **Database Schema Extension**
   - Add new tables with proper relationships
   - Migrate existing data if needed
   - Create indexes for performance

2. **Service Layer Refactoring**
   - Extract business logic from components
   - Create provider management services
   - Implement workflow orchestration engine

3. **API Extensions**
   - New Edge Functions for INTEGRA CO processes
   - Multi-provider CRUD operations
   - Workflow state management endpoints

### Phase 2: Core Workflows (Weeks 4-8)
1. **Steps 1-3: Negotiation & Approval**
   - Client negotiation with operational fee collection
   - Provider negotiation with documentation requirements
   - Committee evaluation with risk criteria

2. **Steps 5-8: Financing & Payments**
   - 80% financing to client
   - Multi-provider payment orchestration (parallel processing)
   - Recursive payment structure support

3. **Step 11: Merchandise Liberation**
   - Hybrid process management (system + email coordination)
   - Collection management integration

### Phase 3: Advanced Features (Weeks 9-12)
1. **Complex Cost Management**
   - Extra costs with financing evaluation
   - Refunds for value differences
   - Logistic provider payments

2. **Document Generation**
   - Legal documents per component
   - Integration with external document services
   - Version control and approval workflows

3. **Team Coordination Simulation**
   - Slack-like notification system
   - Role-based task assignment
   - Escalation workflows

## Key Technical Challenges

### Challenge 1: Multi-Provider Orchestration
**Problem**: One operation can have 3+ providers, each with different payment schedules
**Solution**: State machine per provider + orchestration layer to coordinate

### Challenge 2: Parallel Team Coordination
**Problem**: Multiple teams (procurement, legal, treasury) work simultaneously
**Solution**: Event-driven architecture with team-specific queues

### Challenge 3: Complex State Management
**Problem**: 16 steps with conditional branches and parallel execution
**Solution**: Workflow engine with state persistence and recovery

### Challenge 4: Recursive Payment Structures
**Problem**: Provider A needs 3 payments, Provider B needs 2, Provider C needs 1
**Solution**: Dynamic payment scheduling with provider-specific calendars

## Integration Points

### Current System Integration
- **Leverage existing**: Authentication, CSV processing, timeline generation
- **Extend**: Dashboard to show INTEGRA CO workflows
- **Enhance**: NPS system for step-specific feedback

### External System Simulation
- **Slack Integration**: Webhook simulation for team notifications
- **Banking APIs**: Mock interfaces for payment confirmations
- **Document Services**: Template generation and legal document creation

## Development Approach

### Incremental Development
1. **Start with Step 1** as complete proof-of-concept
2. **Build workflow engine** to support step orchestration
3. **Add provider management** for multi-provider scenarios
4. **Implement committee approval** flow
5. **Scale to remaining steps** using established patterns

### Quality Assurance
- **Unit tests** for business logic services
- **Integration tests** for workflow orchestration
- **End-to-end tests** for complete operation lifecycle
- **Load testing** for multi-provider scenarios

## Success Metrics

### Functional Metrics
- **Complete operation lifecycle**: From client negotiation to merchandise delivery
- **Multi-provider support**: Handle 3+ providers per operation simultaneously
- **Approval accuracy**: Committee evaluations with proper risk assessment
- **Process efficiency**: Reduce manual coordination by 80%

### Technical Metrics
- **Performance**: Handle 100+ concurrent operations
- **Reliability**: 99.9% uptime for critical workflows
- **Maintainability**: Modular architecture with clear separation of concerns
- **Scalability**: Easy addition of new process steps or provider types

## Risk Mitigation

### Technical Risks
- **Complexity Overload**: Use feature flags and progressive rollout
- **Data Migration**: Extensive backup and rollback procedures
- **Performance Degradation**: Database optimization and caching strategies

### Business Risks
- **User Adoption**: Maintain familiar UI patterns while adding new features
- **Process Disruption**: Parallel development with current system
- **Training Requirements**: Comprehensive documentation and user guides

## Development Environment Setup

### Required Tools
- **Node.js 18+** for backend development
- **React 18** with TypeScript for frontend
- **Supabase CLI** for database management
- **Git** with feature branch workflow
- **VS Code** with recommended extensions

### Database Access
```bash
# Supabase connection
SUPABASE_URL=https://gfdaygaujovmyuqtehrv.supabase.co
SUPABASE_ANON_KEY=[provided separately]
SUPABASE_SERVICE_ROLE_KEY=[provided separately]
```

### Local Development
```bash
# Start development server
npm run dev

# Run database migrations
supabase db push

# Deploy edge functions
supabase functions deploy [function-name]
```

## Next Immediate Actions

1. **Review and validate** this architecture approach
2. **Create detailed database schema** for new tables
3. **Implement first workflow step** (Step 1: Client Negotiation)
4. **Refactor existing services** for modularity
5. **Set up development environment** for new module structure

---

**Note**: This expansion builds upon existing Integra Control Tower Light v6 architecture. All new development should maintain backward compatibility and leverage existing authentication, dashboard, and CSV processing infrastructure.