'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api, getMe, logout as apiLogout } from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await getMe();
        setUser(data.user);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Send OTP to phone
  const sendOtp = async (phone) => {
    try {
      setError(null);
      const data = await api.sendOtp(phone);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Verify OTP and login
  const verifyOtp = async (phone, otp) => {
    try {
      setError(null);
      const data = await api.verifyOtp(phone, otp);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Register new user (after OTP verification)
  const register = async (userData) => {
    try {
      setError(null);
      const data = await api.register(userData);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        sendOtp,
        verifyOtp,
        register,
        logout,
        updateUser,
        checkAuth,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
