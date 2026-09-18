'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from './api';
import { User, CheckIn } from './types';

interface AuthContextType {
  user: User | null;
  activeCheckIn: CheckIn | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setActiveCheckIn: (checkIn: CheckIn | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('tonopiramba_token');
    if (!token) {
      setUser(null);
      setActiveCheckIn(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{
        id: string;
        email: string;
        role: any;
        status: any;
        profile: any;
        activeCheckIn: CheckIn | null;
      }>('/auth/me');

      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        profile: data.profile,
      });
      setActiveCheckIn(data.activeCheckIn);
    } catch {
      localStorage.removeItem('tonopiramba_token');
      setUser(null);
      setActiveCheckIn(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('tonopiramba_token', token);
    setUser(userData);
    refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('tonopiramba_token');
    setUser(null);
    setActiveCheckIn(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeCheckIn,
        isLoading,
        login,
        logout,
        refreshUser,
        setActiveCheckIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
