import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotifications';
import FKNotificationCenter from './components/ui/FKNotificationCenter';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Timeline from './pages/Timeline';
import OperationDetail from './pages/OperationDetail';
import Onboarding from './pages/Onboarding';
import CSVDataViewer from './pages/CSVDataViewer';

// App content that uses auth context
function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando Integra Control Tower...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? 
            (user?.role === 'administrator' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) 
            : <Login />} 
        />
        <Route 
          path="/admin/login" 
          element={isAuthenticated ? 
            (user?.role === 'administrator' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />) 
            : <AdminLogin />} 
        />
        
        {/* Protected routes */}
        {isAuthenticated ? (
          <>
            {/* Admin routes */}
            {user?.role === 'administrator' ? (
              <>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/timeline" element={<Timeline />} />
                <Route path="/admin/operation/:operationId" element={<OperationDetail />} />
                <Route path="/admin/csv-data" element={<CSVDataViewer />} />
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            ) : (
              /* Client routes */
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/operation/:operationId" element={<OperationDetail />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/csv-data" element={<CSVDataViewer />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
      
      {/* Global Notification Center */}
      <FKNotificationCenter />
    </div>
  );
}

// Main App component with AuthProvider and NotificationProvider wrapper
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router future={{ v7_startTransition: true }}>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;