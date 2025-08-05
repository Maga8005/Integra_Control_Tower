import { useState, useEffect, useCallback } from 'react';

// Generic localStorage hook with error handling and type safety
export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common use cases
export function usePersistedState<T>(key: string, initialValue: T) {
  return useLocalStorage(key, initialValue);
}

// Hook for managing user session
export function useUserSession() {
  const [user, setUser, removeUser] = useLocalStorage('integra-user', null);
  
  const login = useCallback((userData: any) => {
    setUser(userData);
  }, [setUser]);

  const logout = useCallback(() => {
    removeUser();
  }, [removeUser]);

  return { user, login, logout, isAuthenticated: !!user };
}

// Hook for managing application settings
export function useAppSettings() {
  const defaultSettings = {
    theme: 'light',
    language: 'en',
    notifications: true,
    autoSave: true,
    currency: 'USD'
  };

  const [settings, setSettings] = useLocalStorage('integra-settings', defaultSettings);

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings]);

  return { settings, updateSetting, resetSettings };
}

// Hook for managing operations cache
export function useOperationsCache() {
  const [operations, setOperations, clearOperations] = useLocalStorage('integra-operations-cache', []);
  
  const updateOperation = useCallback((operationId: string, updates: any) => {
    setOperations((prev: any[]) => 
      prev.map(op => op.id === operationId ? { ...op, ...updates } : op)
    );
  }, [setOperations]);

  const addOperation = useCallback((operation: any) => {
    setOperations((prev: any[]) => [...prev, operation]);
  }, [setOperations]);

  const removeOperation = useCallback((operationId: string) => {
    setOperations((prev: any[]) => prev.filter(op => op.id !== operationId));
  }, [setOperations]);

  return { 
    operations, 
    setOperations, 
    updateOperation, 
    addOperation, 
    removeOperation, 
    clearOperations 
  };
}

// Hook for managing form drafts
export function useFormDrafts(formId: string) {
  const [draft, setDraft, removeDraft] = useLocalStorage(`integra-draft-${formId}`, null);
  
  const saveDraft = useCallback((formData: any) => {
    setDraft({
      ...formData,
      savedAt: new Date().toISOString()
    });
  }, [setDraft]);

  const clearDraft = useCallback(() => {
    removeDraft();
  }, [removeDraft]);

  const hasDraft = draft && draft.savedAt;

  return { draft, saveDraft, clearDraft, hasDraft };
}

// Hook for managing recent activity
export function useRecentActivity() {
  const [activities, setActivities] = useLocalStorage('integra-recent-activity', []);

  const addActivity = useCallback((activity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    data?: any;
  }) => {
    setActivities((prev: any[]) => {
      const filtered = prev.filter(item => item.id !== activity.id);
      const updated = [activity, ...filtered].slice(0, 50); // Keep last 50 activities
      return updated;
    });
  }, [setActivities]);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, [setActivities]);

  return { activities, addActivity, clearActivities };
}