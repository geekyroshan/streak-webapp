import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: () => void;
  logout: () => void;
  loginWithToken: (token: string) => void;
  redirectPath: string | null;
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
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  const login = () => {
    // Redirect to GitHub auth endpoint
    window.location.href = '/api/auth/github';
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setRedirectPath('/');
  };

  // Override login with token when we have one from URL
  const loginWithToken = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
    setRedirectPath('/dashboard');
  };

  // Check for token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      loginWithToken(urlToken);
    }
  }, []);

  const value = {
    isAuthenticated,
    token,
    login,
    logout,
    loginWithToken,
    redirectPath
  };

  return (
    <AuthContext.Provider value={value}>
      {redirectPath ? <Navigate to={redirectPath} replace /> : children}
    </AuthContext.Provider>
  );
}; 