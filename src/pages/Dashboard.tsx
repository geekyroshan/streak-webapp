
import React from 'react';
import { StreakStats } from '@/components/StreakStats';
import { ContributionCalendar } from '@/components/ContributionCalendar';
import { RepositoryBrowser } from '@/components/RepositoryBrowser';
import { GapAnalysis } from '@/components/GapAnalysis';
import { WelcomeModal } from '@/components/WelcomeModal';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor and maintain your GitHub contribution streaks.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Current streak</p>
            <p className="text-2xl font-bold">12 days</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-lg font-bold text-primary-foreground">
              12
            </div>
          </div>
        </div>
      </div>
      
      <StreakStats />
      
      <ContributionCalendar />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RepositoryBrowser />
        <GapAnalysis />
      </div>
      
      <WelcomeModal />
    </div>
  );
};

export default Dashboard;
