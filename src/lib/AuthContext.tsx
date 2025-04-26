import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL for token parameter
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      // Store token and update state
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      setIsAuthenticated(true);
      
      // Clean up URL
      const cleanUrl = location.pathname;
      navigate(cleanUrl, { replace: true });
    }
  }, [location, navigate]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 