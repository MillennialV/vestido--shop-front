"use client";

import { AuthContext } from "../context/AuthContext";
import authService from "../services/authService";
import { ReactNode, useEffect, useState } from "react";
import { AuthContextType } from "../context/AuthContext";
import { User } from "../types/auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthenticated(true);
    }
  }, []);

  const onLogin = async (email: string, password: string) => {
    console.log("[AuthProvider] onLogin iniciado para:", email);
    try {
      console.log("[AuthProvider] Llamando a authService.login...");
      const result = await authService.login(email, password);
      console.log("[AuthProvider] Resultado de login:", {
        hasToken: !!result.token,
        hasUser: !!result.user,
        email: result.user?.email,
      });

      if (result.token && result.user) {
        console.log(
          "[AuthProvider] Login exitoso para usuario:",
          result.user.email,
        );
        setAuthenticated(true);
        console.log("[AuthProvider] Estado actualizado, authenticated = true");
      } else {
        console.error("[AuthProvider] Resultado sin token o user");
        throw new Error("No se recibió token o usuario");
      }
    } catch (err) {
      console.error("[AuthProvider] Error en onLogin:", err);
      throw err;
    }
  };

  const onLogout = async () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setAuthenticated(false);
  };

  const getUser = (): User | null => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  const value: AuthContextType = { onLogin, onLogout, authenticated, getUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
