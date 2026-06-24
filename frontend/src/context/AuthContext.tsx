import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User, rememberMe: boolean) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('sd_digitals_crm_token') || sessionStorage.getItem('sd_digitals_crm_token');
      const storedUser = localStorage.getItem('sd_digitals_crm_user') || sessionStorage.getItem('sd_digitals_crm_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify session integrity with server
          const res = await api.get('/auth/me');
          setUser(res.data);
          
          // Save updated data
          if (localStorage.getItem('sd_digitals_crm_token')) {
            localStorage.setItem('sd_digitals_crm_user', JSON.stringify(res.data));
          } else {
            sessionStorage.setItem('sd_digitals_crm_user', JSON.stringify(res.data));
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, userData: User, rememberMe: boolean) => {
    setToken(newToken);
    setUser(userData);
    
    if (rememberMe) {
      localStorage.setItem('sd_digitals_crm_token', newToken);
      localStorage.setItem('sd_digitals_crm_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('sd_digitals_crm_token', newToken);
      sessionStorage.setItem('sd_digitals_crm_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sd_digitals_crm_token');
    localStorage.removeItem('sd_digitals_crm_user');
    sessionStorage.removeItem('sd_digitals_crm_token');
    sessionStorage.removeItem('sd_digitals_crm_user');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    if (localStorage.getItem('sd_digitals_crm_token')) {
      localStorage.setItem('sd_digitals_crm_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('sd_digitals_crm_user', JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
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
