import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Award, Calendar, BarChart } from 'lucide-react';
import { contributionService } from '@/lib/api';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  isLoading?: boolean;
}

const StatCard = ({ title, value, description, icon, trend, isLoading }: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="p-2 bg-primary/10 rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-6 w-20 bg-muted/30 animate-pulse rounded"></div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <p className={`text-xs ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center mt-1`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const StreakStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalContributions: 0,
    weeklyAverage: 0
  });

  useEffect(() => {
    const fetchStreakStats = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getStreakStats();
        
        // Calculate weekly average
        const weeklyAverage = data.totalContributions > 0 
          ? (data.totalContributions / 52).toFixed(1) 
          : 0;
        
        setStats({
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          totalContributions: data.totalContributions,
          weeklyAverage
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch streak stats:', error);
        setLoading(false);
      }
    };
    
    fetchStreakStats();
  }, []);

  const statCards = [
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}`,
      description: 'Consecutive contribution days',
      icon: <Flame className="h-4 w-4 text-primary" />,
      trend: {
        value: 15, // This could be calculated based on historical data
        label: 'vs. last month'
      }
    },
    {
      title: 'Longest Streak',
      value: `${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`,
      description: 'Your record streak',
      icon: <Award className="h-4 w-4 text-primary" />,
    },
    {
      title: 'This Year',
      value: stats.totalContributions,
      description: 'Total contributions',
      icon: <Calendar className="h-4 w-4 text-primary" />,
      trend: {
        value: 23, // This could be calculated based on historical data
        label: 'vs. last year'
      }
    },
    {
      title: 'Weekly Average',
      value: stats.weeklyAverage,
      description: 'Contributions per week',
      icon: <BarChart className="h-4 w-4 text-primary" />,
      trend: {
        value: -5, // This could be calculated based on historical data
        label: 'vs. last month'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} isLoading={loading} />
      ))}
    </div>
  );
};
