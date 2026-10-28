import { createContext, useContext, useMemo, useState } from 'react';
import api, { extractPayload } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('student-dashboard-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password }) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = extractPayload(response);

      const sessionUser = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      };

      localStorage.setItem('student-dashboard-token', payload.token);
      localStorage.setItem('student-dashboard-user', JSON.stringify(sessionUser));
      setUser(sessionUser);

      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('student-dashboard-token');
    localStorage.removeItem('student-dashboard-user');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
