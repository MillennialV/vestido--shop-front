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
    const checkSession = async (retry = true) => {
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
        } else if (res.status === 401 && retry) {
          // Si falla con 401, intentamos refrescar el token automáticamente una vez
          console.log('🔄 [AuthProvider] Sesión expirada, intentando refrescar...');
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setAuthenticated(true);
            setUser(refreshData.user || null);
            setOrganization(refreshData.organization || null);
            if (refreshData.token) {
              localStorage.setItem('authToken', refreshData.token);
            }
            console.log('✅ [AuthProvider] Token refrescado automáticamente');
          } else {
            setAuthenticated(false);
            setUser(null);
            setOrganization(null);
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

      let targetUrl = '/panel';
      if (isLocalhost) {
        // En local, si tiene dominio vamos a la raíz, si no al panel
        targetUrl = targetDomain ? '/' : '/panel';
      } else if (targetDomain) {
        // Redirigir al dominio propio de la organización en producción
        targetUrl = `https://${targetDomain}`;
      } else if (slug) {
        // Si no hay dominio, redirigir a la ruta por slug o panel
        targetUrl = `/${slug}`;
      }

      window.location.href = targetUrl;
    }
  };

  const googleLogin = async (token: string) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error en validación de Google');
    }

    const data = await res.json();
    setAuthenticated(true);
    setUser(data.user || null);
    setOrganization(data.organization || null);
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    // Redirección después de login exitoso
    if (!data.organization) {
      window.location.href = '/panel';
    } else {
      const org = data.organization;
      const targetDomain = org.domain;
      const slug = org.organization_name;

      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      let targetUrl = '/panel';
      if (isLocalhost) {
        targetUrl = targetDomain ? '/' : '/panel';
      } else if (targetDomain) {
        targetUrl = `https://${targetDomain}`;
      } else if (slug) {
        targetUrl = `/${slug}`;
      }

      window.location.href = targetUrl;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('🔄 [AuthProvider] Solicitando refresco de token...');
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAuthenticated(true);
        setUser(data.user || null);
        setOrganization(data.organization || null);
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        console.log('✅ [AuthProvider] Token refrescado con éxito');
        return true;
      }
    } catch (err) {
      console.error('❌ [AuthProvider] Error al refrescar token:', err);
    }
    return false;
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

  const value: AuthContextType = { onLogin, onLogout, googleLogin, refreshToken, authenticated, getUser, organization };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-900 dark:border-white"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
