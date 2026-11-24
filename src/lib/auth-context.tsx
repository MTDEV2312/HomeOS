"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AppUser {
  id: string;
  email: string;
  emailVerified: boolean;
  providers: string[];
  createdAt: string;
  updatedAt: string;
  profile: {
    name?: string;
    avatar_url?: string;
    avatar_key?: string | null;
    [key: string]: unknown;
  };
  metadata: Record<string, unknown>;
}

function mapSupabaseUser(sbUser: SupabaseUser | null): AppUser | null {
  if (!sbUser) return null;
  const userMeta = (sbUser.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (sbUser.app_metadata || {}) as Record<string, unknown>;
  const providers = Array.isArray(appMeta.providers)
    ? (appMeta.providers as string[])
    : typeof appMeta.provider === 'string'
      ? [appMeta.provider]
      : ['email'];

  return {
    id: sbUser.id,
    email: sbUser.email || '',
    emailVerified: Boolean(sbUser.email_confirmed_at),
    providers,
    createdAt: sbUser.created_at,
    updatedAt: sbUser.updated_at || sbUser.created_at,
    profile: {
      ...userMeta,
    },
    metadata: appMeta,
  };
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; requireEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Record<string, unknown>) => Promise<{ error: Error | null }>;
  sendResetPasswordEmail: (email: string) => Promise<{ error: Error | null; success?: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setUser(null);
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setUser(null);
      } else {
        setUser(mapSupabaseUser(data.user));
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(mapSupabaseUser(data.session?.user ?? null));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(mapSupabaseUser(session?.user ?? null));
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error as Error };
    }
    if (data.user) {
      setUser(mapSupabaseUser(data.user));
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?verified=true` : undefined,
      },
    });
    if (error) {
      return { error: error as Error, requireEmailVerification: false };
    }
    if (data.session?.user) {
      setUser(mapSupabaseUser(data.session.user));
    }
    return {
      error: null,
      requireEmailVerification: !data.session,
    };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?verified=true` : undefined,
      },
    });
    if (error) {
      return { error: error as Error };
    }
    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors during logout
    }
    setUser(null);
  };

  const updateProfile = async (profile: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        ...(user?.profile || {}),
        ...profile,
      },
    });
    if (error) {
      return { error: error as Error };
    }
    if (data.user) {
      setUser(mapSupabaseUser(data.user));
    }
    return { error: null };
  };

  const sendResetPasswordEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) {
      return { error: error as Error, success: false };
    }
    return { error: null, success: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) {
      return { error: new Error('No hay sesión activa.') };
    }
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyErr) {
      return { error: new Error('La contraseña actual es incorrecta.') };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { error: error as Error };
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resendVerificationEmail,
        refreshUser,
        updateProfile,
        sendResetPasswordEmail,
        changePassword,
      }}
    >
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
