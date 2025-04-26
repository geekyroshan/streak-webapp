import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Separate hook for managing auth state
const useAuthState = () => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  const setAuth = useCallback((newToken: string | null) => {
    try {
      if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error managing auth state:', error);
    }
  }, []);

  return {
    token,
    isAuthenticated,
    setAuth
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated, setAuth } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle token from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const urlToken = params.get('token');

      if (urlToken) {
        console.log('URL Token found:', urlToken);
        setAuth(urlToken);
        
        // Clean up URL
        const cleanUrl = location.pathname || '/dashboard';
        navigate(cleanUrl, { replace: true });
      }
    } catch (error) {
      console.error('Error handling URL token:', error);
    }
  }, [location.search, navigate, setAuth]);

  const login = useCallback((newToken: string) => {
    console.log('Login called with token:', newToken);
    setAuth(newToken);
  }, [setAuth]);

  const logout = useCallback(() => {
    console.log('Logout called');
    setAuth(null);
    navigate('/', { replace: true });
  }, [navigate, setAuth]);

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