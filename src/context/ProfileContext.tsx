"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateCoinsLocal: (delta: number) => void;
  updateCommissionCoinsLocal: (delta: number) => void;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  updateCoinsLocal: () => {},
  updateCommissionCoinsLocal: () => {},
});

export function ProfileProvider({
  children,
  initialProfile,
}: {
  children: React.ReactNode;
  initialProfile: Profile | null;
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState<boolean>(!initialProfile);

  const refreshProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCoinsLocal = useCallback((delta: number) => {
    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        coins: Math.max(0, prev.coins + delta),
      };
    });
  }, []);

  const updateCommissionCoinsLocal = useCallback((delta: number) => {
    setProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        commission_coins: Math.max(0, (prev.commission_coins || 0) + delta),
      };
    });
  }, []);

  useEffect(() => {
    if (!initialProfile) {
      refreshProfile();
    }
  }, [initialProfile, refreshProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile,
        updateCoinsLocal,
        updateCommissionCoinsLocal,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
