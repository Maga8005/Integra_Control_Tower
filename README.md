# Integra Control Tower MVP

A web application foundation for testing user experience with import financing operations. Built with React 18, TypeScript, and Vite following Clean Architecture principles.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
src/
├── components/forms/         # FK-prefixed form components
│   ├── FKAuthForm.tsx       # Enterprise login with role switching
│   └── FKOnboardingForm.tsx # Step-by-step setup wizard
├── components/ui/           # FK-prefixed reusable components
│   ├── FKDashboard.tsx      # Operations overview dashboard
│   ├── FKTimeline.tsx       # Process tracking visual
│   └── FKNotificationToast.tsx # Simple alerts
├── hooks/                   # Custom hooks
│   ├── useAuth.tsx          # Authentication state
│   ├── useOperations.tsx    # Operations data management
│   └── useLocalStorage.tsx  # Data persistence
├── data/                    # Mock data
│   ├── mockOperations.ts    # Import financing mock data
│   └── users.ts             # Sample users (Client, Coordinator, Procurement)
├── pages/                   # Application routes
│   ├── Login.tsx            # Authentication entry
│   ├── Dashboard.tsx        # Main operations view
│   ├── Timeline.tsx         # Process tracking
│   └── Onboarding.tsx       # User setup flow
├── types/                   # TypeScript interfaces
│   └── index.ts             # Domain models and types
└── utils/                   # Utility functions
    └── cn.ts                # Class name utility
```

## 🛠 Technology Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Forms**: react-hook-form + zod validation
- **Routing**: React Router DOM
- **State Management**: useState + localStorage (MVP)
- **Icons**: Lucide React
- **Build Tool**: Vite with HMR

## 🎯 MVP Features

### Phase 1 (Current)
- ✅ **Project Foundation**: Complete folder structure and configuration
- ✅ **Type System**: Import financing domain models
- ✅ **Basic Routing**: Authentication and protected routes
- 🔄 **Role-based Authentication**: Client, Coordinator, Procurement roles
- 🔄 **Operations Dashboard**: Status cards and overview
- 🔄 **Visual Timeline**: Progress tracking with status indicators
- 🔄 **Onboarding Flow**: Step-by-step user setup

### Phase 2 (Next)
- 📋 **Document Management**: Upload and tracking system
- 📋 **Real-time Notifications**: Alerts and updates
- 📋 **Enhanced Dashboard**: Analytics and reporting
- 📋 **Mobile Responsive**: Touch-optimized interface

## 💾 Data Models

### Core Operation Type
```typescript
interface Operation {
  id: string;
  clientName: string;
  supplierName: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  status: 'onboarding' | 'documents' | 'payment' | 'shipping' | 'completed';
  progress: number; // 0-100%
  timeline: TimelineEvent[];
  importDetails: ImportDetails;
  createdAt: string;
  updatedAt: string;
}
```

### User Roles
- **Client**: Create operations, upload documents, track progress
- **Coordinator**: Review applications, manage workflow
- **Procurement**: Handle supplier relationships, documentation

## 🎨 Design System

### Colors
- **Primary**: Blue tones for action items and navigation
- **Secondary**: Gray tones for secondary content
- **Success**: Green for completed states
- **Warning**: Orange for attention items
- **Error**: Red for error states

### Component Naming
All business components use the **FK prefix** following enterprise standards:
- `FKDashboard`, `FKTimeline`, `FKAuthForm`, etc.

## 🔧 Development Guidelines

### Code Standards
- **TypeScript**: 100% coverage, no `any` types
- **Components**: Functional components with hooks
- **Forms**: react-hook-form with zod validation
- **Styling**: Tailwind classes with cn() utility
- **State**: Local state with localStorage persistence

### Enterprise Principles
- **Clean Architecture**: Clear separation of concerns
- **SOLID Design**: Maintainable and scalable code
- **Type Safety**: Comprehensive TypeScript coverage
- **Performance**: Optimized rendering and bundle size

## 📱 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature-description`
2. Make changes following code standards
3. Run tests and build: `npm run build`
4. Commit with detailed message
5. Submit for review

## 📄 License

Enterprise MVP - Internal Use Only