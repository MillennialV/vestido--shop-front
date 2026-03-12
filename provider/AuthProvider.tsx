"use client";

import { AuthContext } from "../context/AuthContext";
import { ReactNode, useEffect, useState } from "react";
import { AuthContextType } from "../context/AuthContext";
import { User } from "../types/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setOrganization(data.organization || null);
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
        } else {
          setAuthenticated(false);
          setUser(null);
          setOrganization(null);
        }
      } catch {
        setAuthenticated(false);
        setUser(null);
        setOrganization(null);
      } finally {
        setIsLoading(false);
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
    setOrganization(data.organization || null);
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    if (!data.organization) {
      window.location.href = '/panel';
    } else {
      const org = data.organization;
      const targetDomain = org.domain;
      const slug = org.organization_name;

      // Detectar si estamos en entorno local
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (isLocalhost) {
        // En local, si tiene dominio vamos a la raíz, si no al panel
        window.location.href = targetDomain ? '/' : '/panel';
      } else if (targetDomain) {
        // Redirigir al dominio propio de la organización en producción
        window.location.href = `https://${targetDomain}`;
      } else if (slug) {
        // Si no hay dominio, redirigir a la ruta por slug o panel
        window.location.href = `/${slug}`;
      } else {
        window.location.href = '/panel';
      }
    }
  };

  const onLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setUser(null);
    setOrganization(null);
    localStorage.removeItem('authToken');
  };

  const getUser = (): User | null => {
    return user;
  };

  const value: AuthContextType = { onLogin, onLogout, authenticated, getUser, organization };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
