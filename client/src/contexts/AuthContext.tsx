import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/catalog.service';
import type { Admin } from '../types';

interface AuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<Admin>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setAdmin: (admin: Admin | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const current = await authService.me();
      setAdmin(current);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleUnauthorized = () => setAdmin(null);
    window.addEventListener('f2w:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('f2w:unauthorized', handleUnauthorized);
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const current = await authService.login(username, password);
    setAdmin(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
    }
  }, []);

  const value = useMemo(
    () => ({ admin, loading, login, logout, refresh, setAdmin }),
    [admin, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
