import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StoreSettings } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isDarkMode: boolean;
  settings: StoreSettings | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, confirmPassword?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  toggleTheme: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('azryl_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('azryl_theme') === 'dark');
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Theme Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme', 'bg-[#faf6fe]', 'text-purple-950');
      document.body.classList.add('dark-theme', 'bg-[#0b0514]', 'text-slate-100');
      localStorage.setItem('azryl_theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme', 'bg-[#faf6fe]', 'text-purple-950');
      document.body.classList.remove('dark-theme', 'bg-[#0b0514]', 'text-slate-100');
      localStorage.setItem('azryl_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('azryl_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('azryl_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    fetchSettings();
  }, [refreshUser, fetchSettings]);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login gagal' };
      }
      localStorage.setItem('azryl_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi jaringan bermasalah' };
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Pendaftaran gagal' };
      }
      localStorage.setItem('azryl_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Koneksi jaringan bermasalah' };
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('azryl_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem('azryl_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDarkMode,
        settings,
        login,
        register,
        logout,
        refreshUser,
        refreshSettings: fetchSettings,
        toggleTheme,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
