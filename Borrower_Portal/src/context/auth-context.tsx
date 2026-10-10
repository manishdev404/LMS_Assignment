'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest } from '@/lib/api';
import { navigateWithNewSession } from '@/lib/navigation';
import type { User } from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ user: User }>('/auth/borrower/me')
      .then(({ user: current }) => {
        if (cancelled) return;
        setUser(current);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ user: User }>('/auth/borrower/login', {
      method: 'POST',
      body: { email, password },
    });
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await apiRequest<{ user: User }>('/auth/borrower/register', {
      method: 'POST',
      body: payload,
    });
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest<void>('/auth/borrower/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setStatus('anonymous');
    navigateWithNewSession('/login');
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
