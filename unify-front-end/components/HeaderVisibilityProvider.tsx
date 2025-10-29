import React, { createContext, useContext, useState } from 'react';

type HeaderVisibilityContextValue = {
  visible: boolean;
  setVisible: (v: boolean) => void;
};

const HeaderVisibilityContext = createContext<
  HeaderVisibilityContextValue | undefined
>(undefined);

export const HeaderVisibilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [visible, setVisible] = useState(true);

  return (
    <HeaderVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </HeaderVisibilityContext.Provider>
  );
};

export const useHeaderVisibility = () => {
  const ctx = useContext(HeaderVisibilityContext);
  if (!ctx) {
    throw new Error(
      'useHeaderVisibility must be used within HeaderVisibilityProvider'
    );
  }
  return ctx;
};

export default HeaderVisibilityProvider;