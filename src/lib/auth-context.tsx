"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { insforge } from '@/lib/insforge';

// InsForge user type based on SDK docs
interface InsForgeUser {
  id: string;
  email: string;
  emailVerified: boolean;
  providers: string[];
  createdAt: string;
  updatedAt: string;
  profile: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
}

interface AuthContextType {
  user: InsForgeUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; requireEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Record<string, unknown>) => Promise<{ error: Error | null }>;
  sendResetPasswordEmail: (email: string) => Promise<{ error: Error | null; success?: boolean }>;
  exchangeResetPasswordToken: (email: string, code: string) => Promise<{ error: Error | null; token?: string }>;
  resetPassword: (newPassword: string, otp: string) => Promise<{ error: Error | null }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<InsForgeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error || !data?.user) {
        setUser(null);
      } else {
        setUser(data.user as InsForgeUser);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Get initial session on mount
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error as Error };
    }
    if (data?.user) {
      setUser(data.user as InsForgeUser);
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: name || email.split('@')[0],
    });
    if (error) {
      return { error: error as Error, requireEmailVerification: false };
    }
    return {
      error: null,
      requireEmailVerification: data?.requireEmailVerification ?? false,
    };
  };

  const verifyEmail = async (email: string, otp: string) => {
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) {
      return { error: error as Error };
    }
    if (data?.user) {
      setUser(data.user as InsForgeUser);
    }
    return { error: null };
  };

  const signOut = async () => {
    await insforge.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (profile: Record<string, unknown>) => {
    const { error } = await insforge.auth.setProfile(profile);
    if (error) {
      return { error: error as Error };
    }
    // Refresh user to get updated profile
    await refreshUser();
    return { error: null };
  };

  const sendResetPasswordEmail = async (email: string) => {
    const { data, error } = await insforge.auth.sendResetPasswordEmail({
      email,
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
    });
    if (error) {
      return { error: error as Error, success: false };
    }
    return { error: null, success: data?.success ?? false };
  };

  const exchangeResetPasswordToken = async (email: string, code: string) => {
    const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code });
    if (error) {
      return { error: error as Error, token: undefined };
    }
    return { error: null, token: data?.token };
  };

  const resetPassword = async (newPassword: string, otp: string) => {
    const { error } = await insforge.auth.resetPassword({ newPassword, otp });
    if (error) {
      return { error: error as Error };
    }
    return { error: null };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const { error } = await insforge.auth.resetPassword({
      newPassword,
      otp: currentPassword,
    });
    if (error) {
      return { error: error as Error };
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, verifyEmail, refreshUser, updateProfile, sendResetPasswordEmail, exchangeResetPasswordToken, resetPassword, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}