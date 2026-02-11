import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_STORAGE_KEY = 'settings.hapticsEnabled';

type HapticsContextValue = {
  hapticsEnabled: boolean;
  setHapticsEnabled: (enabled: boolean) => void;
  isLoaded: boolean;
};

const HapticsContext = createContext<HapticsContextValue | undefined>(
  undefined
);

export function HapticsProvider({ children }: { children: React.ReactNode }) {
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(HAPTICS_STORAGE_KEY);
        if (storedValue !== null) {
          setHapticsEnabledState(storedValue === 'true');
        }
      } catch (err) {
        console.warn('Failed to load haptics preference', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPreference();
  }, []);

  const setHapticsEnabled = (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    AsyncStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled)).catch(err => {
      console.warn('Failed to save haptics preference', err);
    });
  };

  return (
    <HapticsContext.Provider
      value={{ hapticsEnabled, setHapticsEnabled, isLoaded }}
    >
      {children}
    </HapticsContext.Provider>
  );
}

export function useHapticsPreference() {
  const context = useContext(HapticsContext);
  if (context === undefined) {
    throw new Error(
      'useHapticsPreference must be used within a HapticsProvider'
    );
  }
  return context;
}

export { HAPTICS_STORAGE_KEY };
