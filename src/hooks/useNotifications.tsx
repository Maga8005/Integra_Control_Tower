import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss time in milliseconds, 0 for manual dismiss only
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Notification context type
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (title: string, message: string, duration?: number) => string;
  showError: (title: string, message: string, duration?: number) => string;
  showWarning: (title: string, message: string, duration?: number) => string;
  showInfo: (title: string, message: string, duration?: number) => string;
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Default durations for different notification types
const DEFAULT_DURATIONS = {
  success: 4000,   // 4 seconds
  error: 0,        // Manual dismiss only
  warning: 6000,   // 6 seconds  
  info: 5000       // 5 seconds
} as const;

// Notification provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate unique ID for notifications
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback((
    notificationData: Omit<Notification, 'id' | 'timestamp'>
  ): string => {
    const id = generateId();
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: new Date(),
      duration: notificationData.duration ?? DEFAULT_DURATIONS[notificationData.type]
    };

    setNotifications(prev => [notification, ...prev]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }

    return id;
  }, [generateId]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different notification types
  const showSuccess = useCallback((
    title: string, 
    message: string, 
    duration?: number
  ): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }, [addNotification]);

  const showError = useCallback((
    title: string, 
    message: string, 
    duration?: number
  ): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration
    });
  }, [addNotification]);

  const showWarning = useCallback((
    title: string, 
    message: string, 
    duration?: number
  ): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration
    });
  }, [addNotification]);

  const showInfo = useCallback((
    title: string, 
    message: string, 
    duration?: number
  ): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }, [addNotification]);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notifications
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper hooks for specific notification types
export function useSuccessNotification() {
  const { showSuccess } = useNotifications();
  return showSuccess;
}

export function useErrorNotification() {
  const { showError } = useNotifications();
  return showError;
}

export function useWarningNotification() {
  const { showWarning } = useNotifications();
  return showWarning;
}

export function useInfoNotification() {
  const { showInfo } = useNotifications();
  return showInfo;
}

// Hook for common operation notifications
export function useOperationNotifications() {
  const notifications = useNotifications();

  const notifyOperationSuccess = useCallback((operationId: string, action: string) => {
    notifications.showSuccess(
      'Operación Exitosa',
      `${action} completado para la operación ${operationId}`,
      4000
    );
  }, [notifications]);

  const notifyOperationError = useCallback((operationId: string, action: string, error?: string) => {
    notifications.showError(
      'Error en Operación',
      `Error al ${action.toLowerCase()} la operación ${operationId}${error ? `: ${error}` : ''}`,
      0 // Manual dismiss for errors
    );
  }, [notifications]);

  const notifyOperationWarning = useCallback((operationId: string, message: string) => {
    notifications.showWarning(
      'Atención Requerida',
      `Operación ${operationId}: ${message}`,
      6000
    );
  }, [notifications]);

  const notifyOperationInfo = useCallback((operationId: string, message: string) => {
    notifications.showInfo(
      'Información de Operación',
      `Operación ${operationId}: ${message}`,
      5000
    );
  }, [notifications]);

  return {
    notifyOperationSuccess,
    notifyOperationError,
    notifyOperationWarning, 
    notifyOperationInfo
  };
}

// Hook for authentication notifications
export function useAuthNotifications() {
  const notifications = useNotifications();

  const notifyLoginSuccess = useCallback((userName: string) => {
    notifications.showSuccess(
      'Bienvenido',
      `Sesión iniciada exitosamente. ¡Hola, ${userName}!`,
      3000
    );
  }, [notifications]);

  const notifyLoginError = useCallback((error?: string) => {
    notifications.showError(
      'Error de Inicio de Sesión',
      error || 'No se pudo iniciar sesión. Por favor verifica tus credenciales.',
      0
    );
  }, [notifications]);

  const notifyLogoutSuccess = useCallback(() => {
    notifications.showInfo(
      'Sesión Cerrada',
      'Has cerrado sesión exitosamente.',
      3000
    );
  }, [notifications]);

  const notifySessionExpired = useCallback(() => {
    notifications.showWarning(
      'Sesión Expirada',
      'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      0
    );
  }, [notifications]);

  return {
    notifyLoginSuccess,
    notifyLoginError,
    notifyLogoutSuccess,
    notifySessionExpired
  };
}