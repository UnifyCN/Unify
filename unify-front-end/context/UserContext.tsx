import React, { createContext, use, useEffect, useState } from 'react';
import { isAuthApiError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useUserInfo } from '@/hooks/users/useUserInfo';
import { useQueryClient } from '@tanstack/react-query';
import { StageNumber } from '@/types/checklist';
import { Persona } from '@/types/onboardingProfile';

interface CurrentUser {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  permissions: string;
  profilePictureUrl?: string;
  isPremium: boolean;
  arrivalDate: string | null;
  city: string | null;
  province: string | null;
  stage: StageNumber;
  persona: Persona | null;
  personaOther: string | null;
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
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUserId(data.user.id);
          setUserEmail(data.user.email || null);
        } else {
          setUserId(null);
          setUserEmail(null);
        }
      } catch (err) {
        // Stale session in SecureStore (e.g. refresh token rotated, expired,
        // or invalidated server-side). Clear it locally so subsequent calls
        // return a clean null user and stop throwing on every app launch.
        if (isAuthApiError(err) && err.code === 'refresh_token_not_found') {
          await supabase.auth.signOut({ scope: 'local' });
          setUserId(null);
          setUserEmail(null);
          return;
        }
        throw err;
      }
    };

    getAuthUser().catch(err => {
      console.error('[UserContext] Failed to load auth user:', err);
    });

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
          firstName: effectiveUserInfo.firstName ?? null,
          permissions: effectiveUserInfo.permissions,
          profilePictureUrl: effectiveUserInfo.profilePictureUrl,
          isPremium: effectiveUserInfo.isPremium,
          arrivalDate: effectiveUserInfo.arrivalDate,
          city: effectiveUserInfo.city,
          province: effectiveUserInfo.province,
          stage: effectiveUserInfo.stage,
          persona: effectiveUserInfo.persona,
          personaOther: effectiveUserInfo.personaOther,
        }
      : null;

  return (
    <UserContext
      value={{
        currentUser,
        isLoading: isLoading || !userId,
        refreshUser,
      }}
    >
      {children}
    </UserContext>
  );
}

export function useCurrentUser() {
  const context = use(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
}
