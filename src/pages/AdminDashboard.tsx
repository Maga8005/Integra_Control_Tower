import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Users, Database, Settings, BarChart3, FileDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications, useAuthNotifications } from '../hooks/useNotifications';
import FKAdminDashboard from '../components/ui/FKAdminDashboard';
import { NotificationBell } from '../components/ui/FKNotificationCenter';
import { cn } from '../utils/cn';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { showInfo } = useNotifications();
  const { notifyLogoutSuccess } = useAuthNotifications();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'administrator')) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleLogout = () => {
    notifyLogoutSuccess();
    logout();
    navigate('/admin/login', { replace: true });
  };

  const handleDataManagement = () => {
    navigate('/admin/csv-data');
  };

  const handleViewTimeline = () => {
    navigate('/admin/timeline');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Panel de Administración
                </h1>
                <p className="text-sm text-slate-300">
                  Integra Control Tower
                </p>
              </div>
            </div>

            {/* Right side - Admin info and actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationBell />
              
              {/* Admin info */}
              <div className="flex items-center gap-3 text-white">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-slate-300">Administrador</p>
                </div>
              </div>

              {/* Admin actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDataManagement}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Gestión de Datos"
                >
                  <Database className="h-5 w-5" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Actions */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones de Administrador</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleDataManagement}
                className="flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
              >
                <Database className="h-6 w-6 text-primary-600" />
                <div className="text-left">
                  <p className="font-medium text-primary-700">Gestión de Datos</p>
                  <p className="text-sm text-primary-600">Ver y administrar CSV</p>
                </div>
              </button>

              <button
                onClick={handleViewTimeline}
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <BarChart3 className="h-6 w-6 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-green-700">Vista Timeline</p>
                  <p className="text-sm text-green-600">Análisis de procesos</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Component - Shows all operations for admin */}
        <FKAdminDashboard />
      </main>
    </div>
  );
}