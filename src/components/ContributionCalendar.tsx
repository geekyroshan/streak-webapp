
import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContributionDayProps {
  level: 0 | 1 | 2 | 3 | 4;
  date: string;
  count: number;
  isMissed?: boolean;
}

const ContributionDay = ({ level, date, count, isMissed }: ContributionDayProps) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "w-3 h-3 rounded-sm transition-all hover:scale-125",
              isMissed ? "ring-2 ring-destructive/60" : "",
              `contribution-level-${level}`
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{count} contributions</p>
          <p className="text-xs text-muted-foreground">{date}</p>
          {isMissed && <p className="text-xs text-destructive font-medium">Missed day</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ContributionWeekProps {
  days: Array<{
    level: 0 | 1 | 2 | 3 | 4;
    date: string;
    count: number;
    isMissed?: boolean;
  }>;
}

const ContributionWeek = ({ days }: ContributionWeekProps) => {
  return (
    <div className="flex flex-col gap-[3px]">
      {days.map((day, index) => (
        <ContributionDay key={index} {...day} />
      ))}
    </div>
  );
};

interface ContributionCalendarProps {
  calendarData?: Array<{
    days: Array<{
      level: 0 | 1 | 2 | 3 | 4;
      date: string;
      count: number;
      isMissed?: boolean;
    }>;
  }>;
}

export const ContributionCalendar = ({ calendarData }: ContributionCalendarProps) => {
  // Sample data for demonstration
  const sampleCalendarData = Array.from({ length: 52 }, (_, weekIndex) => ({
    days: Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date();
      date.setDate(date.getDate() - ((52 - weekIndex) * 7 + (6 - dayIndex)));
      
      // Randomize contribution levels
      const randomLevel = Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4;
      let count = 0;
      switch (randomLevel) {
        case 0: count = 0; break;
        case 1: count = Math.floor(Math.random() * 3) + 1; break;
        case 2: count = Math.floor(Math.random() * 5) + 3; break;
        case 3: count = Math.floor(Math.random() * 7) + 7; break;
        case 4: count = Math.floor(Math.random() * 10) + 15; break;
      }
      
      // Mark some days as missed for demonstration
      const isMissed = randomLevel === 0 && Math.random() > 0.7;
      
      return {
        level: randomLevel,
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        }),
        count,
        isMissed
      };
    })
  }));
  
  const data = calendarData || sampleCalendarData;
  
  // Days of the week labels
  const daysOfWeek = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contribution Activity</CardTitle>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div 
              key={level} 
              className={`w-3 h-3 rounded-sm contribution-level-${level}`} 
            />
          ))}
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-[3px] mt-6">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="h-3 text-xs text-muted-foreground">{day}</div>
            ))}
          </div>
          
          <div className="flex gap-[3px] overflow-x-auto pb-2">
            {data.map((week, index) => (
              <ContributionWeek key={index} days={week.days} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
