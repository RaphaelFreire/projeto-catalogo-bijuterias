'use client';

import Cookies from 'js-cookie';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { decodeJwtPayload } from '../util/jwt.util';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  login: (token: string) => void;
  logout: () => void;
}

const COOKIE_NAME = 'auth_token';
const COOKIE_EXPIRES_DAYS = 7;

const AuthContext = createContext<AuthContextValue | null>(null);

function tokenToUser(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return { id: payload.sub, name: payload.name, email: payload.email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const stored = Cookies.get(COOKIE_NAME);
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }
    const hydratedUser = tokenToUser(stored);
    if (!hydratedUser) {
      Cookies.remove(COOKIE_NAME);
      setStatus('unauthenticated');
      return;
    }
    setToken(stored);
    setUser(hydratedUser);
    setStatus('authenticated');
  }, []);

  const login = useCallback((nextToken: string) => {
    const hydratedUser = tokenToUser(nextToken);
    if (!hydratedUser) {
      Cookies.remove(COOKIE_NAME);
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
      return;
    }
    Cookies.set(COOKIE_NAME, nextToken, {
      expires: COOKIE_EXPIRES_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    setToken(nextToken);
    setUser(hydratedUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(COOKIE_NAME);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, login, logout }),
    [user, token, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}
