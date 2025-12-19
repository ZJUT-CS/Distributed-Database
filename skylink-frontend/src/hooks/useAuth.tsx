import React, { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        if (!parsed.createdAt) {
          const next = { ...parsed, createdAt: new Date().toISOString() };
          localStorage.setItem('user', JSON.stringify(next));
          setUser(next);
        } else {
          setUser(parsed);
        }
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
  }, []);

  const login = (userData: User) => {
    const next = { ...userData, createdAt: userData.createdAt || new Date().toISOString() };
    setUser(next);
    localStorage.setItem('user', JSON.stringify(next));
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

