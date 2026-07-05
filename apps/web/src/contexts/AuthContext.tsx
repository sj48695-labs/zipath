"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { UserProfile } from "@zipath/types";
import { refreshAuthProfile } from "./authProfile";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateInterestRegions: (regions: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function setStoredToken(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function removeStoredToken(key: string): void {
  localStorage.removeItem(key);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    await refreshAuthProfile({
      getAccessToken: () => getStoredToken("accessToken"),
      clearTokens: () => {
        // 토큰이 만료되었거나 유효하지 않다.
        removeStoredToken("accessToken");
        removeStoredToken("refreshToken");
      },
      setUser,
      setIsLoading,
    });
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string) => {
      setStoredToken("accessToken", accessToken);
      setStoredToken("refreshToken", refreshToken);
      void fetchProfile();
    },
    [fetchProfile],
  );

  const logout = useCallback(() => {
    removeStoredToken("accessToken");
    removeStoredToken("refreshToken");
    setUser(null);
  }, []);

  const updateInterestRegions = useCallback(async (regions: string[]) => {
    const accessToken = getStoredToken("accessToken");
    if (!accessToken) {
      throw new Error("로그인이 필요합니다.");
    }

    const res = await fetch("/api/auth/profile/interest-regions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ interestRegions: regions }),
    });

    if (!res.ok) {
      const body: unknown = await res.json().catch(() => null);
      const message =
        (body as Record<string, string>)?.error ?? "관심 지역 저장에 실패했습니다.";
      throw new Error(message);
    }

    const data: unknown = await res.json();
    setUser(data as UserProfile);
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        fetchProfile,
        updateInterestRegions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
