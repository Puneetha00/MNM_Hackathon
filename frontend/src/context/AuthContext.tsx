import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  demoLogin: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPreferences: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    removeAuthToken();
    setCurrentUser(null);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (token: string, user: User) => {
    setAuthToken(token);
    setCurrentUser(user);
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(role);
      setAuthToken(res.access_token);
      setCurrentUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPreferences = async (data: Partial<User>) => {
    await api.updateMe(data);
    await refreshUser();
  };

  // Inactivity auto-logout listener (#10 Security Requirement)
  useEffect(() => {
    if (!currentUser) return;

    const timeoutMinutes = currentUser.inactivity_timeout_minutes || 15;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        alert("Session expired due to inactivity for security. Please log in again.");
        logout();
      }, timeoutMs);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [currentUser, logout]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        demoLogin,
        refreshUser,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
