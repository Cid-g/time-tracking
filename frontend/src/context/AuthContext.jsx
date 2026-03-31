import { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, logoutApi, getMeApi, refreshTokenApi } from '../api/auth.api';
import { setAccessToken, clearAccessToken } from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount via refresh token cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await refreshTokenApi();
        setAccessToken(data.data.accessToken);
        const meResponse = await getMeApi();
        setUser(meResponse.data.data.user);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Listen for session expiry from axios interceptor
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      clearAccessToken();
    };
    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await loginApi(credentials);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await registerApi(formData);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
