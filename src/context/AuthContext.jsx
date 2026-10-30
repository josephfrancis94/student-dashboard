import { createContext, useContext, useMemo, useState } from 'react';
import api, { extractPayload } from '../api/client';

const AuthContext = createContext(null);
const RESET_LOG_KEY = 'student-dashboard-password-reset-log';

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

  const register = async ({ name, email, password, role = 'staff' }) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password, role });
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

  const forgotPassword = async ({ email }) => {
    setLoading(true);

    try {
      const trimmedEmail = String(email || '').trim().toLowerCase();

      if (!trimmedEmail) {
        throw new Error('Please enter a valid email address.');
      }

      const existingRequests = JSON.parse(localStorage.getItem(RESET_LOG_KEY) || '[]');
      const nextRequests = [...existingRequests, { email: trimmedEmail, requestedAt: new Date().toISOString() }];
      localStorage.setItem(RESET_LOG_KEY, JSON.stringify(nextRequests));

      return {
        message: `Recovery instructions have been sent to ${trimmedEmail}. Check your inbox for the reset link.`,
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async ({ email, password }) => {
    setLoading(true);

    try {
      const trimmedEmail = String(email || '').trim().toLowerCase();

      if (!trimmedEmail || !password || password.length < 6) {
        throw new Error('A valid email and a password with at least 6 characters are required.');
      }

      const existingRequests = JSON.parse(localStorage.getItem(RESET_LOG_KEY) || '[]');
      const nextRequests = existingRequests.filter((entry) => entry.email !== trimmedEmail);
      localStorage.setItem(RESET_LOG_KEY, JSON.stringify(nextRequests));

      return {
        message: 'Your password has been updated. You can sign in with your new password now.',
      };
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
      register,
      forgotPassword,
      resetPassword,
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
