"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface UserProfile {
  id: number;
  email: string | null;
  nickname: string | null;
  provider: string | null;
  createdAt: string;
  lastActiveAt: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
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
    const accessToken = getStoredToken("accessToken");
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        // Token expired or invalid
        removeStoredToken("accessToken");
        removeStoredToken("refreshToken");
        setUser(null);
        return;
      }

      const data: unknown = await res.json();
      setUser(data as UserProfile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
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
