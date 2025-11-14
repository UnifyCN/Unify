import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserInfo } from '@/hooks/users/useUserInfo';

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  profilePictureUrl?: string;
}

interface UserContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { data: userInfo, isLoading } = useUserInfo(userId || undefined);

  // Get user ID and email from auth
  useEffect(() => {
    const getAuthUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email || null);
      } else {
        setUserId(null);
        setUserEmail(null);
      }
    };

    getAuthUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      } else {
        setUserId(null);
        setUserEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUser = () => {
    // This will trigger a refetch via React Query invalidation
    // The context will automatically update when userInfo changes
  };

  const currentUser: CurrentUser | null =
    userId && userEmail && userInfo
      ? {
          id: userId,
          email: userEmail,
          username: userInfo.username,
          profilePictureUrl: userInfo.profilePictureUrl,
        }
      : null;

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading: isLoading || !userId,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
}
