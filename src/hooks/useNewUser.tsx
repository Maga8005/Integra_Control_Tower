import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { mockOperations } from '../data/mockOperations';

const NEW_USER_WELCOME_KEY = 'integra_new_user_welcome_shown';
const WELCOME_VERSION = '1.0'; // Version to track welcome changes

interface NewUserWelcomeState {
  shown: boolean;
  version: string;
  shownAt?: string;
  userId?: string;
}

export function useNewUser() {
  const { user } = useAuth();
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [shouldShowWelcome, setShouldShowWelcome] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has seen the welcome popup and has existing operations
  useEffect(() => {
    const checkNewUserStatus = () => {
      try {
        // First, check if user has existing operations
        const hasExistingOperations = checkUserHasOperations();
        
        if (hasExistingOperations) {
          // User has operations, definitely not new
          setIsNewUser(false);
          setShouldShowWelcome(false);
        } else {
          // User has no operations, check localStorage for welcome state
          const storedData = localStorage.getItem(NEW_USER_WELCOME_KEY);
          
          if (storedData) {
            const welcomeState: NewUserWelcomeState = JSON.parse(storedData);
            
            // Check if welcome is for current user and version
            const isValidForCurrentUser = !user || welcomeState.userId === user.id;
            const isCurrentVersion = welcomeState.version === WELCOME_VERSION;
            const hasBeenShown = welcomeState.shown;
            
            const userHasSeenWelcome = isValidForCurrentUser && isCurrentVersion && hasBeenShown;
            
            setIsNewUser(!userHasSeenWelcome);
            setShouldShowWelcome(!userHasSeenWelcome);
          } else {
            // No welcome state stored and no operations = new user
            setIsNewUser(true);
            setShouldShowWelcome(true);
          }
        }
      } catch (error) {
        console.error('Error reading new user welcome state:', error);
        // On error, check operations fallback
        const hasExistingOperations = checkUserHasOperations();
        setIsNewUser(!hasExistingOperations);
        setShouldShowWelcome(!hasExistingOperations);
      } finally {
        setIsLoading(false);
      }
    };

    checkNewUserStatus();
  }, [user]);

  // Helper function to check if user has existing operations
  const checkUserHasOperations = (): boolean => {
    if (!user) return false;
    
    if (user.role === 'client') {
      // For clients, check if they have operations matching their company
      const userOperations = mockOperations.filter(op => 
        op.clientName.toLowerCase().includes(user.company?.toLowerCase() || '') ||
        op.clientName.toLowerCase() === user.company?.toLowerCase()
      );
      return userOperations.length > 0;
    } else {
      // For coordinators and procurement, they can see all operations
      // so they're never "new" in terms of having operations
      return mockOperations.length > 0;
    }
  };

  // Mark welcome as shown
  const markWelcomeAsShown = () => {
    try {
      const welcomeState: NewUserWelcomeState = {
        shown: true,
        version: WELCOME_VERSION,
        shownAt: new Date().toISOString(),
        userId: user?.id
      };
      
      localStorage.setItem(NEW_USER_WELCOME_KEY, JSON.stringify(welcomeState));
      setIsNewUser(false);
      setShouldShowWelcome(false);
    } catch (error) {
      console.error('Error saving new user welcome state:', error);
    }
  };

  // Reset welcome state (for testing or new versions)
  const resetWelcomeState = () => {
    try {
      localStorage.removeItem(NEW_USER_WELCOME_KEY);
      setIsNewUser(true);
      setShouldShowWelcome(true);
    } catch (error) {
      console.error('Error resetting new user welcome state:', error);
    }
  };

  // Skip welcome without marking as shown (different from dismiss)
  const skipWelcome = () => {
    setShouldShowWelcome(false);
    // Note: We don't mark as shown, so it might appear again
  };

  // Check if welcome should be triggered for specific actions
  const shouldTriggerWelcomeFor = (action: 'new-operation' | 'first-login'): boolean => {
    if (isLoading) return false;
    
    switch (action) {
      case 'new-operation':
        return shouldShowWelcome && isNewUser;
      case 'first-login':
        return shouldShowWelcome && isNewUser;
      default:
        return false;
    }
  };

  return {
    isNewUser,
    shouldShowWelcome,
    isLoading,
    shouldTriggerWelcomeFor,
    markWelcomeAsShown,
    resetWelcomeState,
    skipWelcome,
    hasExistingOperations: checkUserHasOperations // Expose for debugging
  };
}