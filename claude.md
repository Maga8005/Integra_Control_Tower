# Project: Integra Control Tower MVP

**Extends**: Enterprise Base Template (claude-base.md)

## MVP CONTEXT
Build a web application foundation for testing user experience with import financing operations. Priority: Fast user validation while maintaining enterprise standards for future scalability.

## Project Objectives
- **Primary**: Validate user experience in import financing workflows
- **Secondary**: Establish foundation for enterprise-grade scaling
- **Timeline**: Rapid deployment for user testing
- **Focus**: Clean UX over complex backend initially

## Domain-Specific Architecture

### Business Domain
- **Industry**: Import financing and trade operations
- **Users**: Financial analysts, import managers, compliance officers
- **Core Process**: End-to-end import financing workflow management

### MVP Modules (Phase 1)
```
src/
├── components/forms/
│   ├── FKAuthForm.tsx           # Enterprise login/registration
│   ├── FKFinancingApplication.tsx # Core financing request form
│   └── FKDocumentUpload.tsx     # Document submission component
├── components/ui/
│   ├── FKDashboard.tsx          # Operations overview dashboard
│   ├── FKTimeline.tsx           # Process tracking component
│   ├── FKNotificationCenter.tsx # Alert and notification system
│   └── FKOnboardingFlow.tsx     # User guided tour
├── hooks/
│   ├── useFinancingData.tsx     # Core business logic hook
│   ├── useDocumentTracking.tsx  # Document status management
│   └── useNotifications.tsx     # Notification state management
└── pages/
    ├── Dashboard.tsx            # Main operations view
    ├── ApplicationFlow.tsx      # Financing application process
    ├── DocumentCenter.tsx       # Document management
    └── Timeline.tsx             # Process tracking view
```

## Data Models (Import Financing Domain)

### Core Entities
```typescript
interface FinancingApplication {
  id: string;
  applicantId: string;
  importDetails: ImportDetails;
  financingAmount: number;
  currency: Currency;
  status: ApplicationStatus;
  documents: Document[];
  timeline: TimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

interface ImportDetails {
  supplier: Supplier;
  buyer: Buyer;
  goods: GoodsDescription;
  shipmentDetails: ShipmentInfo;
  paymentTerms: PaymentTerms;
  estimatedArrival: Date;
}

interface TimelineEvent {
  id: string;
  stage: ProcessStage;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  description: string;
  timestamp: Date;
  responsibleParty: string;
}

type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'funded' 
  | 'completed';

type ProcessStage = 
  | 'application' 
  | 'documentation' 
  | 'review' 
  | 'approval' 
  | 'funding' 
  | 'monitoring' 
  | 'completion';
```

## MVP-Specific Implementation Strategy

### Phase 1: Core MVP (Weeks 1-2)
- **Auth**: JWT-based authentication with role simulation
- **Dashboard**: Real-time status overview with mock data
- **Application Flow**: Step-by-step financing request process
- **Basic Timeline**: Visual progress tracking

### Phase 2: Enhanced UX (Weeks 3-4)
- **Document Management**: Upload and tracking system
- **Notifications**: Real-time alerts and updates
- **Advanced Dashboard**: Analytics and reporting views
- **Onboarding**: Guided user experience flow

### Phase 3: Enterprise Integration (Weeks 5-8)
- **Real Backend Integration**: Connect to enterprise APIs
- **Advanced Security**: Full compliance and audit trails
- **Performance Optimization**: Handle production load
- **Advanced Features**: AI insights, automated processes

## Business Rules & Validation

### Financing Application Rules
- Minimum financing amount: $10,000 USD
- Maximum financing percentage: 90% of invoice value
- Required documents: Invoice, Bill of Lading, Insurance Certificate
- Application expiry: 30 days from submission
- Currency support: USD, EUR, GBP initially

### User Permissions
- **Applicant**: Create/edit applications, upload documents, view status
- **Analyst**: Review applications, request additional documents, approve/reject
- **Manager**: Override decisions, view analytics, manage user access

## API Specifications

### Core Endpoints
```typescript
// Applications
POST /api/applications                    # Create new financing application
GET /api/applications/:id                 # Get application details
PUT /api/applications/:id                 # Update application
GET /api/applications/user/:userId        # Get user's applications

// Documents
POST /api/applications/:id/documents      # Upload document
GET /api/applications/:id/documents       # List documents
DELETE /api/documents/:documentId         # Remove document

// Timeline
GET /api/applications/:id/timeline        # Get process timeline
POST /api/applications/:id/timeline       # Add timeline event
```

## Testing Strategy
- **User Testing**: Weekly feedback sessions with real import managers
- **A/B Testing**: Different workflow approaches
- **Performance**: Load testing with realistic data volumes
- **Security**: Penetration testing for financial data protection

## Deployment & Monitoring
- **Environment**: Development → Staging → Production pipeline
- **Monitoring**: Application performance and user behavior tracking
- **Feedback**: Integrated user feedback collection system
- **Analytics**: User journey and conversion funnel analysis

## Success Metrics
- **User Engagement**: Time spent in application, completion rates
- **Process Efficiency**: Average time from application to approval
- **User Satisfaction**: NPS scores and feedback ratings
- **Technical Performance**: Page load times, error rates, uptime

## UI DESIGN SYSTEM

### Colors
- Primary: #050A53, #0C147B, #3C47D3, #77A1E2 
- Coral/CTA: #EB8774, #F19F90
- Success: #E0F7E6/#2CA14D, Error: #FFE4E4/#CC071E

### Components  
- Buttons: 52px(L)/44px(M)/36px(S), 8px radius
- Cards: 8px radius, 24px padding
- Inputs: 48px height, 8px radius

### Typography
- Font: Epilogue (400, 500, 600, 700)
- Scale: 36px→16px→14px→12px

### Layout
- Spacing: 4px multiples
- Breakpoints: 720px/1024px/1280px

## LANGUAGE
- All UI text, comments, and documentation in Spanish
- Variable names and functions in English (best practice)
- Error messages and user-facing content in Spanish