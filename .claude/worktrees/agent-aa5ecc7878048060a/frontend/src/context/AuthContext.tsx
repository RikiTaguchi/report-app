"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, authApi } from "@/lib/api";
import type { CurrentUser, LoginRequest, Role } from "@/lib/types";

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (role: Role, req: LoginRequest) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfileImageUrl: (profileImageUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (role: Role, req: LoginRequest) => {
    const me = await authApi.login(role, req);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
    }
    setUser(null);
  }, []);

  const updateProfileImageUrl = useCallback((profileImageUrl: string | null) => {
    setUser((prev) => (prev ? { ...prev, profileImageUrl } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, updateProfileImageUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
