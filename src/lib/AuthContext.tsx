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
  const [token, setToken] = useState<string | null>(() => {
    // Try to get token from localStorage first
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('Found token in localStorage:', storedToken);
      return storedToken;
    }
    return null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL for token parameter
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');

    console.log('URL Token found:', urlToken);

    if (urlToken && (!token || urlToken !== token)) {
      console.log('Storing new token from URL');
      // Store token and update state
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      setIsAuthenticated(true);
      
      // Clean up URL and redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate, token]);

  // Effect to update isAuthenticated when token changes
  useEffect(() => {
    console.log('Token state changed:', token);
    setIsAuthenticated(!!token);
  }, [token]);

  const login = (newToken: string) => {
    console.log('Login called with token:', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('Logout called');
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