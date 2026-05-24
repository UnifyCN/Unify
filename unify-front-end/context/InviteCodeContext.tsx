import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type InviteCodeSource = 'clipboard' | 'manual' | null;

export interface InviteCodeState {
  code: string | null;
  source: InviteCodeSource;
}

interface InviteCodeContextValue extends InviteCodeState {
  setCode: (code: string, source: Exclude<InviteCodeSource, null>) => void;
  clear: () => void;
}

const InviteCodeContext = createContext<InviteCodeContextValue | null>(null);

export const InviteCodeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<InviteCodeState>({ code: null, source: null });

  const setCode = useCallback<InviteCodeContextValue['setCode']>((code, source) => {
    setState({ code, source });
  }, []);

  const clear = useCallback(() => {
    setState({ code: null, source: null });
  }, []);

  const value = useMemo<InviteCodeContextValue>(
    () => ({ ...state, setCode, clear }),
    [state, setCode, clear]
  );

  return (
    <InviteCodeContext.Provider value={value}>
      {children}
    </InviteCodeContext.Provider>
  );
};

export function useInviteCode(): InviteCodeContextValue {
  const ctx = useContext(InviteCodeContext);
  if (!ctx) {
    throw new Error('useInviteCode must be used inside <InviteCodeProvider>');
  }
  return ctx;
}
