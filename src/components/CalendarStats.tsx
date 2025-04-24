import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

interface CalendarStatsProps {
  totalContributions: number;
  dailyAverage: number;
}

export function CalendarStats({ totalContributions, dailyAverage }: CalendarStatsProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-1">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>Total: {totalContributions} contributions</span>
      </Badge>
      
      <Badge variant="outline" className="flex items-center gap-1">
        <span>Daily Average: {dailyAverage.toFixed(1)}</span>
      </Badge>
    </div>
  );
}

export default CalendarStats; 