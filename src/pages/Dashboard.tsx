import React, { useEffect, useState } from 'react';
import { StreakStats } from '@/components/StreakStats';
import { ContributionCalendar } from '@/components/ContributionCalendar';
import { RepositoryBrowser } from '@/components/RepositoryBrowser';
import { GapAnalysis } from '@/components/GapAnalysis';
import { WelcomeModal } from '@/components/WelcomeModal';
import { BackdatingCard } from '@/components/BackdatingCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { contributionService } from '@/lib/api';

const Dashboard = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for token in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Clean up the URL by removing the token parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      // Reload the page to apply the token
      window.location.reload();
    }
  }, [location]);

  // Fetch current streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getStreakStats();
        setCurrentStreak(data.currentStreak);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch streak data:', error);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchStreakData();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'Developer'}!
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Current streak</p>
            {loading ? (
              <div className="h-8 w-24 bg-muted/30 animate-pulse rounded"></div>
            ) : (
              <p className="text-2xl font-bold">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            {loading ? (
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-lg font-bold text-primary-foreground">
                {currentStreak}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Prominent backdating card */}
      <BackdatingCard />
      
      <StreakStats />
      
      <ContributionCalendar />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RepositoryBrowser />
        <GapAnalysis />
      </div>
      
      <div className="flex justify-center mt-6">
        <Link to="/streak">
          <Button size="lg" className="px-8 gap-2">
            Manage Your Streak <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      
      <WelcomeModal />
    </div>
  );
};

export default Dashboard;
