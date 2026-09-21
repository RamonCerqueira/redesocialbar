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
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('tonopiramba_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return null;
  });
  const [activeCheckIn, setActiveCheckIn] = useState<CheckIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('tonopiramba_token');
    const cachedUser = localStorage.getItem('tonopiramba_user');

    if (!token) {
      setUser(null);
      setActiveCheckIn(null);
      setIsLoading(false);
      return;
    }

    if (cachedUser && !user) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {}
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

      if (data && data.id) {
        const validatedUser: User = {
          id: data.id,
          email: data.email,
          role: data.role,
          status: data.status,
          profile: data.profile,
        };
        setUser(validatedUser);
        localStorage.setItem('tonopiramba_user', JSON.stringify(validatedUser));
        setActiveCheckIn(data.activeCheckIn);
      }
    } catch (err: any) {
      // Apenas desloga se o servidor responder explicitamente com 401 ou 403 (token inválido/expirado)
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem('tonopiramba_token');
        localStorage.removeItem('tonopiramba_user');
        setUser(null);
        setActiveCheckIn(null);
      } else {
        // Se a API estiver offline ou em erro 500, mantém a sessão do usuário intacta
        console.warn('[Auth] Falha temporária na verificação de sessão, mantendo usuário logado.');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {}
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tonopiramba_token', token);
      localStorage.setItem('tonopiramba_user', JSON.stringify(userData));
    }
    setUser(userData);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tonopiramba_token');
      localStorage.removeItem('tonopiramba_user');
    }
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
