
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MissedDayProps {
  date: string;
  dayName: string;
  pattern?: string;
  priority: 'high' | 'medium' | 'low';
}

const MissedDay = ({ date, dayName, pattern, priority }: MissedDayProps) => {
  const priorityColor = {
    high: 'bg-red-500/10 border-red-500/20 text-red-500',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    low: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  };
  
  return (
    <div className={`p-3 rounded-md border mb-2 ${priorityColor[priority]}`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-sm font-medium">{date}</div>
          <div className="text-xs opacity-80">{dayName}</div>
        </div>
        
        <Button size="sm" variant="outline" className={priorityColor[priority]}>
          <Zap className="h-3.5 w-3.5 mr-1" />
          Fix
        </Button>
      </div>
      
      {pattern && (
        <div className="text-xs mt-1 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {pattern}
        </div>
      )}
    </div>
  );
};

export const GapAnalysis = () => {
  // Sample missed days data for demonstration
  const missedDays = [
    {
      date: 'April 6, 2025',
      dayName: 'Sunday',
      pattern: 'Weekend pattern detected',
      priority: 'medium' as const
    },
    {
      date: 'March 30, 2025',
      dayName: 'Sunday',
      pattern: 'Weekend pattern detected',
      priority: 'low' as const
    },
    {
      date: 'March 25, 2025',
      dayName: 'Tuesday',
      priority: 'high' as const
    },
    {
      date: 'March 15, 2025',
      dayName: 'Saturday',
      pattern: 'Weekend pattern detected',
      priority: 'low' as const
    },
    {
      date: 'March 5, 2025',
      dayName: 'Wednesday',
      priority: 'medium' as const
    }
  ];

  return (
    <Card className="h-[450px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Missed Days</CardTitle>
            <CardDescription>Gaps in your contribution timeline</CardDescription>
          </div>
          
          <Button size="sm" variant="outline" className="gap-1">
            <Calendar className="h-4 w-4" />
            Calendar View
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-[320px] pr-4">
          {missedDays.map((day, index) => (
            <MissedDay key={index} {...day} />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
