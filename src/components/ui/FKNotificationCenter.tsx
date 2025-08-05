import { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

// Notification type configuration
const NOTIFICATION_CONFIG = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    borderColor: 'border-success-200',
    iconColor: 'text-success-600',
    titleColor: 'text-success-800',
    messageColor: 'text-success-700',
    progressColor: 'bg-success-500'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-error-50',
    borderColor: 'border-error-200',
    iconColor: 'text-error-600',
    titleColor: 'text-error-800',
    messageColor: 'text-error-700',
    progressColor: 'bg-error-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    messageColor: 'text-yellow-700',
    progressColor: 'bg-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200',
    iconColor: 'text-primary-600',
    titleColor: 'text-primary-800',
    messageColor: 'text-primary-700',
    progressColor: 'bg-primary-500'
  }
} as const;

// Main notification center component
export default function FKNotificationCenter() {
  const { notifications } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

// Individual notification toast component
interface NotificationToastProps {
  notification: Notification;
}

function NotificationToast({ notification }: NotificationToastProps) {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [progress, setProgress] = useState(100);

  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Progress bar animation for auto-dismiss notifications
  useEffect(() => {
    if (!notification.duration || notification.duration === 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const decrement = 100 / (notification.duration! / 100);
        const newProgress = prev - decrement;
        
        if (newProgress <= 0) {
          clearInterval(interval);
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [notification.duration]);

  // Handle manual dismiss
  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // Match transition duration
  };

  // Handle action click
  const handleActionClick = () => {
    notification.action?.onClick();
    handleDismiss();
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform",
        config.bgColor,
        config.borderColor,
        isVisible && !isRemoving 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95",
        "max-w-sm w-full"
      )}
    >
      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div 
            className={cn("h-full transition-all duration-100 ease-linear", config.progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Toast content */}
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>

          {/* Content */}
          <div className="ml-3 flex-1 min-w-0">
            <h4 className={cn("text-sm font-semibold", config.titleColor)}>
              {notification.title}
            </h4>
            <p className={cn("text-sm mt-1", config.messageColor)}>
              {notification.message}
            </p>

            {/* Action button */}
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={handleActionClick}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium hover:underline transition-colors",
                    config.iconColor
                  )}
                >
                  {notification.action.label}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {notification.timestamp.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Close button */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className={cn(
                "rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
                "focus:ring-gray-400"
              )}
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification bell component for header
interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
  badgeCount?: number;
  onClick?: () => void;
}

export function NotificationBell({ 
  className, 
  showBadge = true, 
  badgeCount, 
  onClick 
}: NotificationBellProps) {
  const { notifications } = useNotifications();
  const unreadCount = badgeCount ?? notifications.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors",
        className
      )}
      aria-label="Ver notificaciones"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      
      {/* Notification badge */}
      {showBadge && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-coral-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// Notification panel component for dropdown/sidebar
interface NotificationPanelProps {
  className?: string;
  maxNotifications?: number;
}

export function NotificationPanel({ 
  className, 
  maxNotifications = 10 
}: NotificationPanelProps) {
  const { notifications, clearAllNotifications } = useNotifications();
  const displayNotifications = notifications.slice(0, maxNotifications);

  if (notifications.length === 0) {
    return (
      <div className={cn("p-6 text-center", className)}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Info className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          No hay notificaciones
        </h3>
        <p className="text-sm text-gray-500">
          Todas las notificaciones aparecerán aquí
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-lg border border-gray-200", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Notificaciones
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {displayNotifications.map((notification, index) => (
          <NotificationListItem
            key={notification.id}
            notification={notification}
            isLast={index === displayNotifications.length - 1}
          />
        ))}
      </div>

      {/* Footer */}
      {notifications.length > maxNotifications && (
        <div className="p-3 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Y {notifications.length - maxNotifications} notificación{notifications.length - maxNotifications !== 1 ? 'es' : ''} más...
          </p>
        </div>
      )}
    </div>
  );
}

// Notification list item for panel
interface NotificationListItemProps {
  notification: Notification;
  isLast?: boolean;
}

function NotificationListItem({ notification, isLast }: NotificationListItemProps) {
  const { removeNotification } = useNotifications();
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  const handleDismiss = () => {
    removeNotification(notification.id);
  };

  const handleActionClick = () => {
    notification.action?.onClick();
    handleDismiss();
  };

  return (
    <div className={cn(
      "p-4 hover:bg-gray-50 transition-colors",
      !isLast && "border-b border-gray-100"
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>

        <div className="ml-3 flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {notification.timestamp.toLocaleString('es-ES', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {notification.action && (
              <button
                onClick={handleActionClick}
                className={cn(
                  "text-xs font-medium hover:underline transition-colors",
                  config.iconColor
                )}
              >
                {notification.action.label}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}