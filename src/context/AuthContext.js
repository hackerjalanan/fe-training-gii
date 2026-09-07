import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../service/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const currentUser = await AuthService.getUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        // console.error("Error initializing auth:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password, captchaToken) => {
    setLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(username, password, captchaToken);
      // response sudah response.data dari axios,
      // jadi langsung akses response.staff
      setUser(response.response.staff);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.metaData?.message || 'Login gagal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
