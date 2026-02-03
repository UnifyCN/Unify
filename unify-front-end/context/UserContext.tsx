import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserInfo } from '@/hooks/users/useUserInfo';
import { useQueryClient } from '@tanstack/react-query';
import { StageNumber } from '@/types/checklist';

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  permissions: string;
  profilePictureUrl?: string;
  isPremium: boolean;
  arrivalDate: string | null;
  stage: StageNumber;
}

interface UserContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { data: userInfo, isLoading } = useUserInfo(userId || undefined);

  // Try to get cached userInfo immediately when userId changes
  const cachedUserInfo = userId
    ? queryClient.getQueryData(['userInfo', userId])
    : null;

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

  // Use cached data if available, otherwise use fetched data
  const effectiveUserInfo = (cachedUserInfo || userInfo) as typeof userInfo;

  const currentUser: CurrentUser | null =
    userId && userEmail && effectiveUserInfo
      ? {
          id: userId,
          email: userEmail,
          username: effectiveUserInfo.username,
          permissions: effectiveUserInfo.permissions,
          profilePictureUrl: effectiveUserInfo.profilePictureUrl,
          isPremium: effectiveUserInfo.isPremium,
          arrivalDate: effectiveUserInfo.arrivalDate,
          stage: effectiveUserInfo.stage,
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
