import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from './api';
import { User } from '@/types/user';
import { useNavigate, useLocation } from 'react-router-dom';

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: () => {},
  logout: async () => {}
});

// Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for token in URL and store it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      // Clean up URL
      const cleanUrl = window.location.pathname;
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Fetch user data with token
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        // If we're on the home page and authenticated, redirect to dashboard
        if (window.location.pathname === '/') {
          window.location.href = '/dashboard';
        }
      } catch (err) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = () => {
    authService.login();
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (err) {
      setError('Logout failed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 