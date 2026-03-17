import React, { createContext, useContext, useEffect, useState } from "react";
import { login as loginRequest } from "@/lib/backend-api";
import type { AuthUser } from "@/lib/app-types";

interface RoleContextType {
  currentStaff: AuthUser | null;
  authToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "repair-hub-session";

const RoleContext = createContext<RoleContextType>({
  currentStaff: null,
  authToken: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawSession = window.localStorage.getItem(STORAGE_KEY);
    if (!rawSession) {
      return;
    }

    try {
      const session = JSON.parse(rawSession) as { token: string; user: AuthUser };
      setAuthToken(session.token);
      setCurrentStaff(session.user);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const result = await loginRequest(username, password);
    setAuthToken(result.token);
    setCurrentStaff(result.user);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentStaff(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <RoleContext.Provider
      value={{
        currentStaff,
        authToken,
        isAuthenticated: Boolean(currentStaff && authToken),
        login,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};
