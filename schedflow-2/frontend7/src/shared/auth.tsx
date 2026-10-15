import React, { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: string;
  department_id?: string | number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
}

const TOKEN_KEY = 'schedflow_token';
const USER_KEY = 'schedflow_user';
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(() => {
    return !!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
  });

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        setToken(savedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const access_token = res.data.access_token;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    setUser(res.data.user);
    setToken(access_token);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
