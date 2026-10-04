'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, clearSession } from './authDatabase';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  guardianName: string | null;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  guardianName: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [guardianName, setGuardianName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session && session.expiresAt > Date.now()) {
          setIsAuthenticated(true);
          setGuardianName(session.guardianName);
        } else {
          setIsAuthenticated(false);
          setGuardianName(null);
        }
      } catch (err) {
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

  const login = (name: string) => {
    setIsAuthenticated(true);
    setGuardianName(name);
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
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, guardianName, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
