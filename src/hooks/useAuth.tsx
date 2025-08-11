import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User, UserRole, AdminLoginResponse } from '../types';
import { getUserByEmail, getDemoUser } from '../data/users';
import { useLocalStorage, useRecentActivity } from './useLocalStorage';
import { environment } from '../config/environment';
import { mockAdminLogin } from '../services/mockAuthService';

// Interfaces para autenticación por NIT
interface ClientLoginResponse {
  success: boolean;
  token?: string;
  client?: {
    nit: string;
    name: string;
    operationsCount: number;
  };
  operations?: any[];
  error?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithNit: (nit: string) => Promise<{ success: boolean; error?: string }>;
  loginWithAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  canAccessOperation: (operationId: string) => boolean;
  clientOperations: any[] | null;
  authToken: string | null;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission mappings by role
const ROLE_PERMISSIONS = {
  client_with_operations: [
    'view_own_operations',
    'view_documents',
    'download_documents',
    'view_timeline',
    'edit_own_profile',
    'track_existing_operations'
  ],
  client_without_operations: [
    'create_operation',
    'start_onboarding',
    'view_demo_content',
    'edit_own_profile'
  ],
  administrator: [
    'view_all_operations',
    'upload_csv',
    'manage_data',
    'admin_dashboard',
    'manage_users',
    'view_analytics',
    'export_data',
    'system_settings'
  ]
} as const;

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser, removeUser] = useLocalStorage<User | null>('integra-user', null);
  const [authToken, setAuthToken, removeAuthToken] = useLocalStorage<string | null>('integra-token', null);
  const [clientOperations, setClientOperations, removeClientOperations] = useLocalStorage<any[] | null>('integra-client-operations', null);
  const [isLoading, setIsLoading] = useState(true);
  const { addActivity } = useRecentActivity();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      // Simulate session validation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get current user from localStorage directly to avoid dependency loop
      const savedUser = localStorage.getItem('integra-user');
      let currentUser = null;
      
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('integra-user');
        }
      }
      
      if (currentUser) {
        // Validate stored user data
        if (currentUser.id && currentUser.email && currentUser.role) {
          addActivity({
            id: `session-${Date.now()}`,
            type: 'auth',
            description: `Session restored for ${currentUser.name}`,
            timestamp: new Date().toISOString(),
            data: { role: currentUser.role }
          });
        } else {
          // Invalid session data, remove it
          localStorage.removeItem('integra-user');
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    checkSession();
  }, []); // Empty dependency array - only run once on mount

  // Login function
  const login = useCallback(async (email: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let userData: User;
      
      // For demo purposes, allow any email with role selection
      if (email.includes('demo') || email.includes('test')) {
        userData = getDemoUser(role);
        userData.email = email;
        userData.name = `${role.charAt(0).toUpperCase() + role.slice(1)} User`;
      } else {
        // Try to find user by email
        const foundUser = getUserByEmail(email);
        if (foundUser && foundUser.role === role) {
          userData = foundUser;
        } else {
          // Create demo user with provided email and role
          userData = {
            id: `user-${Date.now()}`,
            name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: email,
            role: role,
            company: role.startsWith('client') ? 'Demo Client Company' : 'Integra Trade Finance',
            avatar: getDemoUser(role).avatar
          };
        }
      }
      
      setUser(userData);
      
      addActivity({
        id: `login-${Date.now()}`,
        type: 'auth',
        description: `Successfully logged in as ${userData.name}`,
        timestamp: new Date().toISOString(),
        data: { role: userData.role, email: userData.email }
      });
      
      setIsLoading(false);
      return { success: true };
      
    } catch (error) {
      setIsLoading(false);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    }
  }, [setUser, addActivity]);

  // Login with NIT function
  const loginWithNit = useCallback(async (nit: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔐 Iniciando login con NIT:', nit);
      
      // Call backend auth endpoint
      const response = await fetch('http://localhost:3001/api/auth/client-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nit }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error en login con NIT:', errorData);
        setIsLoading(false);
        return { 
          success: false, 
          error: errorData.error || 'Error de conexión con el servidor' 
        };
      }
      
      const loginData: ClientLoginResponse = await response.json();
      console.log('✅ Respuesta de login:', loginData);
      
      if (!loginData.success || !loginData.client || !loginData.token) {
        setIsLoading(false);
        return { 
          success: false, 
          error: loginData.error || 'Error en la autenticación' 
        };
      }
      
      // Create user object from client data
      const userData: User = {
        id: `client-${loginData.client.nit}`,
        name: loginData.client.name.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim(),
        email: `${loginData.client.nit}@client.integra.com`,
        role: loginData.client.operationsCount > 0 ? 'client_with_operations' : 'client_without_operations',
        company: loginData.client.name.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim(),
        avatar: '/avatars/client-default.jpg',
        nit: loginData.client.nit
      };
      
      // Store user data, token and operations
      setUser(userData);
      setAuthToken(loginData.token);
      setClientOperations(loginData.operations || []);
      
      addActivity({
        id: `nit-login-${Date.now()}`,
        type: 'auth',
        description: `Login exitoso con NIT: ${loginData.client.nit} - ${loginData.client.operationsCount} operaciones`,
        timestamp: new Date().toISOString(),
        data: { 
          nit: loginData.client.nit,
          role: userData.role,
          operationsCount: loginData.client.operationsCount
        }
      });
      
      console.log('✅ Login con NIT exitoso:', userData);
      setIsLoading(false);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en loginWithNit:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: 'Error de conexión. Verifique que el servidor esté funcionando.' 
      };
    }
  }, [setUser, setAuthToken, setClientOperations, addActivity]);

  // Login with Admin function
  const loginWithAdmin = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔐 Iniciando login admin con email:', email);
      console.log('🌍 Environment config:', {
        useMockBackend: environment.useMockBackend,
        isDevelopment: environment.isDevelopment,
        isProduction: environment.isProduction,
        apiBaseUrl: environment.apiBaseUrl,
        hostname: window.location.hostname
      });
      
      let loginData: AdminLoginResponse;
      
      // Extra safety check - if we're not on localhost, force mock
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const shouldUseMock = environment.useMockBackend || !isLocalHost;
      
      console.log('🎯 Decision: shouldUseMock =', shouldUseMock, '(isLocalHost =', isLocalHost, ')');
      
      if (shouldUseMock) {
        // Usar servicio mock en producción
        console.log('📦 Usando mock auth service');
        loginData = await mockAdminLogin(email, password);
      } else {
        // Call backend admin auth endpoint en desarrollo
        console.log('🔗 Conectando a backend en desarrollo');
        const response = await fetch(`${environment.apiBaseUrl}/api/auth/admin-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Error en login admin:', errorData);
          setIsLoading(false);
          return { 
            success: false, 
            error: errorData.error || 'Error de conexión con el servidor' 
          };
        }
        
        loginData = await response.json();
      }
      
      console.log('✅ Respuesta de login admin:', loginData);
      
      if (!loginData.success || !loginData.admin || !loginData.token) {
        setIsLoading(false);
        return { 
          success: false, 
          error: loginData.error || 'Error en la autenticación de administrador' 
        };
      }
      
      // Create admin user object
      const userData: User = {
        id: `admin-${loginData.admin.email}`,
        name: loginData.admin.name,
        email: loginData.admin.email,
        role: 'administrator' as UserRole,
        company: 'Integra Trade Finance',
        avatar: '/avatars/admin-default.jpg'
      };
      
      // Store admin data and token
      setUser(userData);
      setAuthToken(loginData.token);
      
      // Clear client operations for admin login
      setClientOperations(null);
      
      addActivity({
        id: `admin-login-${Date.now()}`,
        type: 'auth',
        description: `Login admin exitoso: ${loginData.admin.email}`,
        timestamp: new Date().toISOString(),
        data: { 
          email: loginData.admin.email,
          role: userData.role,
          type: 'admin'
        }
      });
      
      console.log('✅ Login admin exitoso:', userData);
      setIsLoading(false);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en loginWithAdmin:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: 'Error de conexión. Verifique que el servidor esté funcionando.' 
      };
    }
  }, [setUser, setAuthToken, setClientOperations, addActivity]);

  // Logout function
  const logout = useCallback(() => {
    if (user) {
      addActivity({
        id: `logout-${Date.now()}`,
        type: 'auth',
        description: `${user.name} logged out`,
        timestamp: new Date().toISOString(),
        data: { role: user.role }
      });
    }
    
    // Clear all auth-related data
    removeUser();
    removeAuthToken();
    removeClientOperations();
  }, [user, removeUser, removeAuthToken, removeClientOperations, addActivity]);

  // Switch role function (for demo purposes)
  const switchRole = useCallback((newRole: UserRole) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        role: newRole,
        company: newRole.startsWith('client') ? user.company || 'Demo Client Company' : 'Integra Trade Finance'
      };
      
      setUser(updatedUser);
      
      addActivity({
        id: `role-switch-${Date.now()}`,
        type: 'auth',
        description: `Role switched to ${newRole}`,
        timestamp: new Date().toISOString(),
        data: { previousRole: user.role, newRole }
      });
    }
  }, [user, setUser, addActivity]);

  // Permission checking
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission as any);
  }, [user]);

  // Check if user can access specific operation
  const canAccessOperation = useCallback((operationId: string): boolean => {
    if (!user) return false;
    
    // All client types can access their own operations
    if (user.role.startsWith('client')) {
      // Clients with operations can view existing operations
      if (user.role === 'client_with_operations') {
        return hasPermission('view_own_operations');
      }
      // New clients don't have existing operations to view
      return false;
    }
    
    return false;
  }, [user, hasPermission]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithNit,
    loginWithAdmin,
    logout,
    switchRole,
    hasPermission,
    canAccessOperation,
    clientOperations,
    authToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hooks for specific use cases
export function useUserRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role || null;
}

export function usePermissions(): {
  hasPermission: (permission: string) => boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
} {
  const { hasPermission } = useAuth();
  
  return {
    hasPermission,
    canCreate: hasPermission('create_operation'),
    canEdit: hasPermission('update_operation_status'),
    canDelete: hasPermission('delete_operation'),
    canApprove: hasPermission('approve_operations')
  };
}

export function useAuthGuard(requiredPermission?: string) {
  const { isAuthenticated, hasPermission, isLoading } = useAuth();
  
  const canAccess = requiredPermission 
    ? isAuthenticated && hasPermission(requiredPermission)
    : isAuthenticated;
    
  return {
    canAccess,
    isLoading,
    isAuthenticated
  };
}