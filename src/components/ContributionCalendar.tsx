import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GlassCard, GlassCardHeader, GlassCardContent } from '@/components/ui/glass-card';
import { Sparkle } from '@/components/ui/sparkle';
import { contributionService } from '@/lib/api';

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
              level === 4 ? "animate-pulse-subtle" : "",
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
  const [loading, setLoading] = useState(true);
  const [contributionData, setContributionData] = useState<any>(null);
  const [processedCalendarData, setProcessedCalendarData] = useState<any[]>([]);
  
  // Fetch contribution data from API
  useEffect(() => {
    const fetchContributionData = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getUserContributions();
        setContributionData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch contribution data:', error);
        setLoading(false);
      }
    };
    
    fetchContributionData();
  }, []);
  
  // Process contribution data into calendar format
  useEffect(() => {
    if (!contributionData) return;
    
    try {
      const { events, analysis } = contributionData;
      
      // Create a map of date to contribution count
      const contributionsByDate: Record<string, number> = {};
      
      // Process events data
      events.forEach((event: any) => {
        const date = event.created_at.split('T')[0];
        contributionsByDate[date] = (contributionsByDate[date] || 0) + 1;
      });
      
      // Build the calendar grid (52 weeks)
      const calendarData = [];
      const today = new Date();
      const yearAgo = new Date();
      yearAgo.setDate(today.getDate() - 364); // 52 weeks plus the current day
      
      // Create weeks
      for (let week = 0; week < 52; week++) {
        const weekData = { days: [] as any[] };
        
        // Create days in the week
        for (let day = 0; day < 7; day++) {
          const date = new Date(yearAgo);
          date.setDate(yearAgo.getDate() + (week * 7) + day);
          
          const dateString = date.toISOString().split('T')[0];
          const count = contributionsByDate[dateString] || 0;
          
          // Determine contribution level based on count
          let level: 0 | 1 | 2 | 3 | 4 = 0;
          if (count > 0) {
            if (count <= 2) level = 1;
            else if (count <= 5) level = 2;
            else if (count <= 10) level = 3;
            else level = 4;
          }
          
          // Check if this is a gap in the recent streak
          const isMissed = analysis.gaps.includes(dateString);
          
          weekData.days.push({
            level,
            date: date.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            }),
            count,
            isMissed
          });
        }
        
        calendarData.push(weekData);
      }
      
      setProcessedCalendarData(calendarData);
    } catch (error) {
      console.error('Error processing contribution data:', error);
    }
  }, [contributionData]);
  
  // Use provided calendarData or the processed data from API
  const data = calendarData || processedCalendarData;
  
  // Days of the week labels
  const daysOfWeek = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  
  // Find the highest contribution day and its index
  let highestCount = 0;
  let highestWeekIndex = 0;
  let highestDayIndex = 0;
  
  data.forEach((week, weekIndex) => {
    week.days.forEach((day, dayIndex) => {
      if (day.count > highestCount) {
        highestCount = day.count;
        highestWeekIndex = weekIndex;
        highestDayIndex = dayIndex;
      }
    });
  });
  
  return (
    <GlassCard className="w-full glass-calendar relative">
      <GlassCardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-xl font-semibold tracking-tight">Contribution Activity</h3>
          {highestCount > 10 && (
            <div className="relative ml-2">
              <Sparkle color="bg-primary" size="sm" className="animate-sparkle" />
            </div>
          )}
        </div>
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
      </GlassCardHeader>
      <GlassCardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-[3px] mt-6">
              {daysOfWeek.map((day, index) => (
                <div key={index} className="h-3 text-xs text-muted-foreground">{day}</div>
              ))}
            </div>
            
            <div className="flex gap-[3px] overflow-x-auto pb-2 relative">
              {data.map((week, weekIndex) => (
                <ContributionWeek key={weekIndex} days={week.days} />
              ))}
              
              {/* Add sparkle to highlight the highest contribution day */}
              {highestCount > 0 && (
                <div 
                  className="absolute"
                  style={{
                    left: `${highestWeekIndex * 4 + 1}px`,
                    top: `${highestDayIndex * 4 - 4}px`,
                  }}
                >
                  <Sparkle 
                    color="bg-primary" 
                    size="sm"
                    className="animate-sparkle opacity-70"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};
