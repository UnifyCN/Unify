import React, { createContext, useContext, useState } from 'react';

interface CompanionContextType {
  lastConversationId: string | null;
  lastAccessedAt: number | null;
  setLastConversation: (conversationId: string | null) => void;
  clearLastConversation: () => void;
}

const CompanionContext = createContext<CompanionContextType | undefined>(
  undefined
);

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [lastConversationId, setLastConversationId] = useState<string | null>(
    null
  );
  const [lastAccessedAt, setLastAccessedAt] = useState<number | null>(null);

  const setLastConversation = (conversationId: string | null) => {
    setLastConversationId(conversationId);
    setLastAccessedAt(conversationId ? Date.now() : null);
  };

  const clearLastConversation = () => {
    setLastConversationId(null);
    setLastAccessedAt(null);
  };

  return (
    <CompanionContext.Provider
      value={{
        lastConversationId,
        lastAccessedAt,
        setLastConversation,
        clearLastConversation,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const context = useContext(CompanionContext);
  if (context === undefined) {
    throw new Error('useCompanion must be used within a CompanionProvider');
  }
  return context;
}
