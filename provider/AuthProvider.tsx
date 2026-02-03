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
    try {
      const result = await authService.login(email, password);

      if (result.token && result.user) {
        setAuthenticated(true);
      } else {
        throw new Error("No se recibió token o usuario");
      }
    } catch (err) {
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
