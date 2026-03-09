import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchProfile,
  updateProfile as apiUpdateProfile,
  deleteAccount as apiDeleteAccount,
  loginWithGoogle,
  logoutApi,
  setTokens,
  clearTokens,
  getAccessToken,
  type UserProfile,
} from '../api';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  updateUser: (data: { name: string; picture?: string }) => Promise<void>;
  deleteUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await fetchProfile();
      setUser(profile);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    // Проверяем наличие токена и загружаем профиль
    if (getAccessToken()) {
      loadProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadProfile]);

  const login = () => {
    loginWithGoogle();
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearTokens();
    setUser(null);
  };

  const updateUser = async (data: { name: string; picture?: string }) => {
    await apiUpdateProfile(data);
    await loadProfile();
  };

  const deleteUser = async () => {
    await apiDeleteAccount();
    clearTokens();
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    if (getAccessToken()) {
      await loadProfile();
    }
  }, [loadProfile]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, deleteUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export type { UserProfile };
