import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import type { User } from '../types';

const TOKEN_KEY = 'skylink_token';
const USER_KEY = 'skylink_user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUserRole = (role: unknown): 'user' | 'admin' => {
  if (role === 2 || role === '2') return 'admin';
  const r = String(role ?? '').trim().toLowerCase();
  return r.includes('admin') ? 'admin' : 'user';
};

const parseStoredUser = (): { user: User | null; token: string | null } => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);

    if (!token || !userRaw) {
      return { user: null, token: null };
    }

    const parsed = JSON.parse(userRaw) as any;
    if (!parsed || typeof parsed !== 'object') {
      return { user: null, token: null };
    }

    const user: User = {
      id: parsed.id ?? parsed.userId,
      username: parsed.username,
      email: parsed.email,
      phoneNumber: parsed.phoneNumber,
      role: normalizeUserRole(parsed.role),
      adminRole: parsed.adminRole ?? parsed.admin_role ?? parsed.roleId ?? parsed.role_id,
      createdAt: parsed.createdAt,
    };

    return { user, token };
  } catch (e) {
    console.error('Failed to parse user from local storage', e);
    return { user: null, token: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { user: storedUser, token: storedToken } = parseStoredUser();
    setUser(storedUser);
    setToken(storedToken);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        const { user: storedUser, token: storedToken } = parseStoredUser();
        setUser(storedUser);
        setToken(storedToken);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isInitialized]);

  const login = useCallback((userData: User, authToken: string) => {
    const nextUser = { ...userData, createdAt: userData.createdAt || new Date().toISOString() };
    setUser(nextUser);
    setToken(authToken);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // 从服务端获取最新用户信息，而非仅读取 localStorage
      const { getMyProfile } = await import('../api/auth');
      const profile = await getMyProfile();

      if (profile) {
        const updatedUser: User = {
          id: profile.userId,
          username: user?.username || '',  // 保留原值或使用空字符串
          email: profile.email ?? undefined,
          phoneNumber: profile.phoneNumber ?? undefined,
          role: user?.role || 'user',  // 保留原值或默认 user
          adminRole: user?.adminRole,
          createdAt: profile.createTime ?? user?.createdAt,
          // 实名认证关键字段
          realName: profile.realName ?? undefined,
          idCard: profile.idCard ?? undefined,
          gender: profile.gender as 0 | 1 | 2 | undefined,
        };

        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh user from server, falling back to localStorage', error);
      // 降级：从 localStorage 读取
      const { user: storedUser, token: storedToken } = parseStoredUser();
      setUser(storedUser);
      setToken(storedToken);
    }
  }, [user?.username, user?.role, user?.adminRole, user?.createdAt]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    updateUser,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
