import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'expo-router';

// Define which routes should hide the header
const HIDE_HEADER_ROUTES = [
  '/(tabs)/Gather/GroupDetailScreen',
  '/(tabs)/Gather/PostDetails', 
  '/(tabs)/Gather/EventDetailScreen',
  '/(tabs)/Gather/EventsScreen',
  // Add more routes that need hidden headers
];

type HeaderContextValue = {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  forceVisible: () => void;
  forceHidden: () => void;
};

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

export const HeaderManager = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(true);
  const [forceState, setForceState] = useState<'visible' | 'hidden' | null>(null);
  const pathname = usePathname();

  // Auto-hide header based on route
  useEffect(() => {
    if (forceState) return; // Don't auto-manage if manually forced

    const shouldHide = HIDE_HEADER_ROUTES.some(route => 
      pathname.includes(route.replace('/(tabs)/Gather/', ''))
    );
    
    setVisible(!shouldHide);
  }, [pathname, forceState]);

  const forceVisible = () => {
    setForceState('visible');
    setVisible(true);
  };

  const forceHidden = () => {
    setForceState('hidden');
    setVisible(false);
  };

  const handleSetVisible = (newVisible: boolean) => {
    setForceState(null); // Clear force state when manually setting
    setVisible(newVisible);
  };

  return (
    <HeaderContext.Provider 
      value={{ 
        visible, 
        setVisible: handleSetVisible,
        forceVisible,
        forceHidden 
      }}
    >
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within HeaderManager');
  }
  return context;
};
