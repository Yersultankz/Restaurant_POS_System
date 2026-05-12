import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export type UserRole = 'waiter' | 'cashier' | 'chef' | 'boss' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  emoji: string;
}

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  users: User[];
  login: (user: User, token: string) => void;
  logout: () => void;
  registerUser: (user: Omit<User, 'id'> & { pin: string }) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function isJwtExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (isJwtExpired(localStorage.getItem('pos_token'))) {
      localStorage.removeItem('pos_user');
      localStorage.removeItem('pos_token');
      return null;
    }

    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('pos_token');
    return isJwtExpired(savedToken) ? null : savedToken;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('pos_users_list');
    return saved ? JSON.parse(saved) : [];
  });

  // Initialize api service with stored token
  useEffect(() => {
    const savedToken = localStorage.getItem('pos_token');
    if (savedToken && !isJwtExpired(savedToken)) {
      api.setToken(savedToken);
    }
  }, []);

  // Load public user list for login screen
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get<User[]>('/users');
        if (response.data) {
          setUsers(response.data);
          localStorage.setItem('pos_users_list', JSON.stringify(response.data));
        }
      } catch {
        // Fallback to cache
      }
    };
    loadUsers();
  }, []);

  const login = useCallback((user: User, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    api.setToken(authToken);
    localStorage.setItem('pos_user', JSON.stringify(user));
    localStorage.setItem('pos_token', authToken);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    api.setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
  }, []);

  const registerUser = async (userData: Omit<User, 'id'> & { pin: string }) => {
    try {
      const response = await api.post<User>('/users', userData);
      if (response.error || !response.data) {
        throw new Error(response.error?.message || 'Failed to register user');
      }
      const newUser = response.data;
      if (newUser) {
        setUsers(prev => [...prev, newUser]);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      api.setToken(token);
      const response = await api.post<{ valid?: boolean; success?: boolean }>('/users/verify-pin', { pin });
      return Boolean(response.data?.valid ?? response.data?.success);
    } catch {
      return false;
    }
  };

  const getToken = useCallback(() => token, [token]);

  return (
    <AuthContext.Provider value={{ currentUser, token, users, login, logout, registerUser, verifyPin, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Permissions map
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin:   ['tables', 'menu', 'analytics', 'menu_admin', 'billing', 'kitchen', 'settings'],
  waiter:  ['tables', 'menu'],
  cashier: ['tables', 'menu', 'billing'],
  chef:    ['kitchen'],
  boss:    ['tables', 'menu', 'analytics', 'menu_admin', 'settings'],
};
