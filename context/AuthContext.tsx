import { createContext } from "react";
import { User } from "../types/auth";

export interface AuthContextType {
  onLogin: (email: string, password: string) => Promise<any>;
  onLogout: () => Promise<any>;
  googleLogin: (token: string) => Promise<any>;
  refreshToken: () => Promise<boolean>;
  authenticated: boolean;
  getUser?: () => User | null;
  organization?: any | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
