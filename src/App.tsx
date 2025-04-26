import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import StreakPage from "./pages/StreakPage";
import RepositoriesPage from "./pages/RepositoriesPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import LogoutPage from "./pages/LogoutPage";

const queryClient = new QueryClient();

// Wrap protected content with Layout
const ProtectedContent = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const App: React.FC = () => {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<LogoutPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedContent><Dashboard /></ProtectedContent>} />
            <Route path="/calendar" element={<ProtectedContent><CalendarPage /></ProtectedContent>} />
            <Route path="/streak" element={<ProtectedContent><StreakPage /></ProtectedContent>} />
            <Route path="/repositories" element={<ProtectedContent><RepositoriesPage /></ProtectedContent>} />
            <Route path="/activity" element={<ProtectedContent><ActivityPage /></ProtectedContent>} />
            <Route path="/settings" element={<ProtectedContent><SettingsPage /></ProtectedContent>} />

            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </QueryClientProvider>
    </Router>
  );
};

export default App;
