import { createContext } from "react";
import { User } from "../types/auth";

export interface AuthContextType {
  onLogin: (email: string, password: string) => Promise<any>;
  onLogout: () => Promise<any>;
  authenticated: boolean;
  getUser?: () => User | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
