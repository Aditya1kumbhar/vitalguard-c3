'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, clearSession } from './authDatabase';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  guardianName: string | null;
  identifier: string | null;
  bandId: string | null;
  login: (name: string, identifier: string, bandId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  guardianName: null,
  identifier: null,
  bandId: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [guardianName, setGuardianName] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [bandId, setBandId] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        // PERMANENT SESSION: If a session exists with a valid identifier,
        // the user is authenticated FOREVER until they explicitly log out.
        // No expiry check — "once registered, always logged in".
        if (session && session.identifier) {
          setIsAuthenticated(true);
          setGuardianName(session.guardianName);
          setIdentifier(session.identifier);
          setBandId(session.bandId);
        } else {
          setIsAuthenticated(false);
          setGuardianName(null);
          setIdentifier(null);
          setBandId(null);
        }
      } catch (err) {
        console.warn("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const login = (name: string, ident: string, band: string) => {
    setIsAuthenticated(true);
    setGuardianName(name);
    setIdentifier(ident);
    setBandId(band);
    router.push('/');
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (err) {
      console.warn("Failed to clear session from DB:", err);
    }
    setIsAuthenticated(false);
    setGuardianName(null);
    setIdentifier(null);
    setBandId(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    } else {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, guardianName, identifier, bandId, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
