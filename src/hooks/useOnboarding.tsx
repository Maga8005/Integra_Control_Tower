import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_STORAGE_KEY = 'integra_onboarding_completed';
const ONBOARDING_VERSION = '1.0'; // Version to track onboarding changes

interface OnboardingState {
  completed: boolean;
  version: string;
  completedAt?: string;
  userId?: string;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        const storedData = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        
        if (storedData) {
          const onboardingState: OnboardingState = JSON.parse(storedData);
          
          // Check if onboarding is for current user and version
          const isValidForCurrentUser = !user || onboardingState.userId === user.id;
          const isCurrentVersion = onboardingState.version === ONBOARDING_VERSION;
          const isCompleted = onboardingState.completed;
          
          setHasSeenOnboarding(isValidForCurrentUser && isCurrentVersion && isCompleted);
        } else {
          setHasSeenOnboarding(false);
        }
      } catch (error) {
        console.error('Error reading onboarding state:', error);
        setHasSeenOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  // Mark onboarding as completed
  const markOnboardingCompleted = () => {
    try {
      const onboardingState: OnboardingState = {
        completed: true,
        version: ONBOARDING_VERSION,
        completedAt: new Date().toISOString(),
        userId: user?.id
      };
      
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(onboardingState));
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  };

  // Reset onboarding (for testing or new versions)
  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setHasSeenOnboarding(false);
    } catch (error) {
      console.error('Error resetting onboarding state:', error);
    }
  };

  // Skip onboarding (mark as seen but not necessarily completed)
  const skipOnboarding = () => {
    try {
      const onboardingState: OnboardingState = {
        completed: true, // Mark as completed when skipped
        version: ONBOARDING_VERSION,
        completedAt: new Date().toISOString(),
        userId: user?.id
      };
      
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(onboardingState));
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  // Check if onboarding should be triggered for new operation
  const shouldTriggerOnboarding = () => {
    return !isLoading && !hasSeenOnboarding;
  };

  return {
    hasSeenOnboarding,
    isLoading,
    shouldTriggerOnboarding,
    markOnboardingCompleted,
    resetOnboarding,
    skipOnboarding
  };
}