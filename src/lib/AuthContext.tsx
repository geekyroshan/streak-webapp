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

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for token from both sources - Github OAuth or regular token
        const token = localStorage.getItem('token') || localStorage.getItem('github_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        // If GitHub token exists, move it to our app's expected token name
        if (localStorage.getItem('github_token') && !localStorage.getItem('token')) {
          localStorage.setItem('token', localStorage.getItem('github_token') || '');
        }
        
        // Fetch user data with token
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('github_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect to dashboard if authenticated and on landing page
  useEffect(() => {
    // This section handles automatic redirect after authentication
    const redirectIfAuthenticated = () => {
      const path = window.location.pathname;
      const justAuthenticated = sessionStorage.getItem('just_authenticated') === 'true';
      
      // If we're authenticated and on the homepage, redirect to dashboard
      if (!isLoading && !!user && (path === '/' || path === '')) {
        window.location.href = '/dashboard';
      }
      
      // If just authenticated via GitHub, clear flag and redirect
      if (justAuthenticated && !isLoading) {
        sessionStorage.removeItem('just_authenticated');
        window.location.href = '/dashboard';
      }
    };
    
    redirectIfAuthenticated();
  }, [isLoading, user]);

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
      localStorage.removeItem('github_token');
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