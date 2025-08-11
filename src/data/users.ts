import { User, UserRole } from '../types';

export const mockUsers: User[] = [
  // Client Users with Operations
  {
    id: 'user-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@techcorp.com',
    role: 'client_with_operations',
    company: 'TechCorp International',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-002',  
    name: 'Michael Rodriguez',
    email: 'michael.r@globalmanuf.com',
    role: 'client_with_operations',
    company: 'Global Manufacturing Ltd.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-003',
    name: 'Emma Thompson',
    email: 'emma.thompson@euroauto.com',
    role: 'client_with_operations',
    company: 'European Auto Parts',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },

  // New Client Users without Operations
  {
    id: 'user-004',
    name: 'David Kim',
    email: 'david.kim@medsupply.com',
    role: 'client_without_operations',
    company: 'MedSupply Chain Inc.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-005',
    name: 'Maria Garcia',
    email: 'maria.garcia@foodtech.com',
    role: 'client_without_operations',
    company: 'FoodTech Solutions',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-006',
    name: 'James Wilson',
    email: 'james.wilson@renewablecorp.com',
    role: 'client_without_operations',
    company: 'Renewable Energy Corp',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  }
];

// Helper functions for user management
export const getUsersByRole = (role: UserRole): User[] => {
  return mockUsers.filter(user => user.role === role);
};

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
};

export const getClientUsers = (): User[] => {
  return mockUsers.filter(user => user.role.startsWith('client'));
};

export const getClientsWithOperations = (): User[] => {
  return getUsersByRole('client_with_operations');
};

export const getNewClients = (): User[] => {
  return getUsersByRole('client_without_operations');
};

// Demo users for quick login (matching role selection)
export const getDemoUser = (role: UserRole): User => {
  const demoUsers: Record<UserRole, User> = {
    client_with_operations: {
      id: 'demo-client-with-ops',
      name: 'Demo Cliente con Operaciones',
      email: 'demo@client-ops.com',
      role: 'client_with_operations',
      company: 'TechCorp International',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    client_without_operations: {
      id: 'demo-client-new',  
      name: 'Demo Cliente Nuevo',
      email: 'demo@client-new.com',
      role: 'client_without_operations',
      company: 'Nueva Empresa Demo',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
    },
    administrator: {
      id: 'admin-001',
      name: 'Administrator',
      email: 'admin@integra.com',
      role: 'administrator',
      company: 'Integra Control Tower',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  };
  
  return demoUsers[role];
};