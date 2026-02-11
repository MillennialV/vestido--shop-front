"use client";

import { AuthContext } from "../context/AuthContext";
import { ReactNode, useEffect, useState } from "react";
import { AuthContextType } from "../context/AuthContext";
import { User } from "../types/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verifica la sesión llamando a un endpoint protegido
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setAuthenticated(true);
          setUser(data.user || null);
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } catch {
        setAuthenticated(false);
        setUser(null);
      }
    };
    checkSession();
  }, []);

  const onLogin = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error en login');
    }
    const data = await res.json();
    setAuthenticated(true);
    setUser(data.user || null);
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
  };

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const getUser = (): User | null => {
    return user;
  };

  const value: AuthContextType = { onLogin, onLogout, authenticated, getUser };

  if (!mounted) {
    return <>{children}</>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
