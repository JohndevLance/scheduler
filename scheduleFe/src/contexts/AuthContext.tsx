import { createContext, useContext, type ReactNode } from 'react';
import type { User } from '@/shared/types/auth';
import { useAuthStore } from '@/store/authStore';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  // Zustand persist with localStorage hydrates synchronously during store
  // creation. By the time any component renders, the persisted values are
  // already available — no async loading step needed.
  // Expired/revoked tokens are caught by the 401 interceptor in axiosInstance,
  // which calls clearAuth() and redirects to /login automatically.
  const isLoading = false;

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
};
