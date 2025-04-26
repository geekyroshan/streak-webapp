import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize token state from localStorage
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('Found token in localStorage:', storedToken);
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      console.log('URL Token found:', urlToken);
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      setIsAuthenticated(true);
      
      // Clean up URL
      const cleanUrl = location.pathname || '/dashboard';
      navigate(cleanUrl, { replace: true });
    }
  }, [location.search, navigate]);

  const login = useCallback((newToken: string) => {
    console.log('Login called with token:', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    console.log('Logout called');
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    navigate('/', { replace: true });
  }, [navigate]);

  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    token,
    login,
    logout
  }), [isAuthenticated, token, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 