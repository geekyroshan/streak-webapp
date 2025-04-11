
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Award, Calendar, BarChart } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard = ({ title, value, description, icon, trend }: StatCardProps) => {
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
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center mt-1`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const StreakStats = () => {
  const stats = [
    {
      title: 'Current Streak',
      value: '12 days',
      description: 'Consecutive contribution days',
      icon: <Flame className="h-4 w-4 text-primary" />,
      trend: {
        value: 15,
        label: 'vs. last month'
      }
    },
    {
      title: 'Longest Streak',
      value: '37 days',
      description: 'Your record streak',
      icon: <Award className="h-4 w-4 text-primary" />,
    },
    {
      title: 'This Year',
      value: '782',
      description: 'Total contributions',
      icon: <Calendar className="h-4 w-4 text-primary" />,
      trend: {
        value: 23,
        label: 'vs. last year'
      }
    },
    {
      title: 'Weekly Average',
      value: '15.3',
      description: 'Contributions per week',
      icon: <BarChart className="h-4 w-4 text-primary" />,
      trend: {
        value: -5,
        label: 'vs. last month'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
