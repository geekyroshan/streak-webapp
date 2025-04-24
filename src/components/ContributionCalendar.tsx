import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GlassCard, GlassCardHeader, GlassCardContent } from '@/components/ui/glass-card';
import { Sparkle } from '@/components/ui/sparkle';
import { contributionService } from '@/lib/api';
import { format, parseISO, subYears, getYear, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define CSS variables for contribution colors
const contributionStyles = document.createElement('style');
contributionStyles.innerHTML = `
  .contribution-level-0 {
    background-color: #161b22 !important;
  }
  .contribution-level-1 {
    background-color: #0e4429 !important;
  }
  .contribution-level-2 {
    background-color: #006d32 !important;
  }
  .contribution-level-3 {
    background-color: #26a641 !important;
  }
  .contribution-level-4 {
    background-color: #39d353 !important;
  }
`;
document.head.appendChild(contributionStyles);

interface ContributionDayProps {
  level: 0 | 1 | 2 | 3 | 4;
  date: string;
  count: number;
  isMissed?: boolean;
  isFuture?: boolean;
}

const ContributionDay = ({ level, date, count, isMissed, isFuture }: ContributionDayProps) => {
  // Inline styles as a fallback in case CSS classes don't work
  const bgColors = {
    0: '#161b22',
    1: '#0e4429',
    2: '#006d32',
    3: '#26a641',
    4: '#39d353'
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "w-3 h-3 md:w-4 md:h-4 rounded-sm transition-colors",
              level === 4 ? "animate-pulse-subtle" : "",
              isFuture ? "opacity-40" : "",
              `contribution-level-${level}`
            )}
            style={{ 
              backgroundColor: bgColors[level],
              border: isFuture ? '1px dashed rgba(255,255,255,0.1)' : 'none',
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          {isFuture ? (
            <p className="font-medium">Future date</p>
          ) : (
            <p className="font-medium">{count} contributions</p>
          )}
          <p className="text-xs text-muted-foreground">{date}</p>
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
    isFuture?: boolean;
  }>;
}

const ContributionWeek = ({ days }: ContributionWeekProps) => {
  return (
    <div className="flex flex-col items-center gap-1 h-full">
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
      isFuture?: boolean;
    }>;
  }>;
}

export const ContributionCalendar = ({ calendarData }: ContributionCalendarProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionData, setContributionData] = useState<any>(null);
  const [processedCalendarData, setProcessedCalendarData] = useState<any[]>([]);
  const [totalContributions, setTotalContributions] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  
  // Years for filtering (current year and 4 previous years)
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Fetch contribution data from API
  useEffect(() => {
    const fetchContributionData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching contribution data...');
        
        // Always fetch data for the entire calendar year
        let data;
        const startDate = `${selectedYear}-01-01`;
        const endDate = selectedYear === new Date().getFullYear() 
          ? format(new Date(), 'yyyy-MM-dd') // Today for current year
          : `${selectedYear}-12-31`;         // Dec 31 for past years
        
        console.log(`Fetching contributions for date range: ${startDate} to ${endDate}`);
        data = await contributionService.getUserContributions(startDate);
        
        console.log('Contribution data received:', data);
        setContributionData(data);
        setLoading(false);
      } catch (error: any) {
        console.error('Failed to fetch contribution data:', error);
        setError(error?.message || 'Failed to load contribution data');
        setLoading(false);
        
        // If API fails, create dummy data for testing
        if (process.env.NODE_ENV === 'development') {
          createDummyData();
        }
      }
    };
    
    fetchContributionData();
  }, [selectedYear]); // Add selectedYear as dependency
  
  // Create dummy data for testing purposes in development
  const createDummyData = () => {
    console.log('Creating dummy data for testing...');
    const dummyData = {
      contributions: [],
      analysis: { gaps: [] }
    };
    
    // Create some dummy contributions
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Random contribution count (more recent dates have higher probability of contributions)
      const randomFactor = Math.random() * (i < 30 ? 3 : 1);
      const count = Math.floor(randomFactor * (Math.random() * 15));
      
      dummyData.contributions.push({
        date: dateString,
        count: count,
        color: '#39d353'
      });
      
      // Add some random gaps
      if (i > 10 && i < 60 && Math.random() > 0.9) {
        dummyData.analysis.gaps.push(dateString);
      }
    }
    
    setContributionData(dummyData);
  };
  
  // Process contribution data into calendar format
  useEffect(() => {
    if (!contributionData) return;
    
    try {
      console.log('Processing contribution data for year:', selectedYear);
      const { contributions, analysis } = contributionData;
      
      // Log the original contributions count
      console.log(`Total contributions before filtering: ${contributions?.length || 0}`);
      
      // Create a map of date to contribution count
      const contributionsByDate: Record<string, {count: number, color?: string}> = {};
      
      // Process GraphQL contribution data first (more accurate and complete)
      if (contributions && contributions.length > 0) {
        let totalCount = 0;
        
        // Filter contributions based on selected year and remove any scheduled commits
        const filteredContributions = contributions.filter((day: any) => {
          if (!day.date) return false;
          
          // Skip scheduled contributions
          if (day.isScheduled) {
            console.log(`Skipping scheduled contribution on ${day.date}`);
            return false;
          }
          
          const contribDate = new Date(day.date);
          
          // Always filter by calendar year regardless of current year
          return contribDate.getFullYear() === selectedYear;
        });
        
        // Log filtered contributions
        console.log(`Filtered contributions for year ${selectedYear}: ${filteredContributions.length}`);
        
        if (filteredContributions.length === 0) {
          console.warn(`No contributions found for year ${selectedYear}`);
        }
        
        // Add filtered contributions to the map
        filteredContributions.forEach((day: any) => {
          contributionsByDate[day.date] = {
            count: day.count,
            color: day.color
          };
          totalCount += day.count;
        });
        
        setTotalContributions(totalCount);
      } else {
        console.warn('No contribution data available, generating sample data');
        // Generate some sample data if no contributions are found
        createDummyData();
        return;
      }
      
      // Build calendar grid based on selected year
      const calendarData = [];
      
      // Always use Jan 1 to Dec 31 of the selected year
      const startDate = new Date(selectedYear, 0, 1); // January 1st of selected year
      
      // For the selected year, always show the full year (Jan-Dec)
      const endDate = new Date(selectedYear, 11, 31); // December 31st of selected year
      
      // Adjust to include full weeks
      const startOfWeek = new Date(startDate);
      startOfWeek.setDate(startDate.getDate() - startDate.getDay()); // Move to previous Sunday
      
      const endOfWeek = new Date(endDate);
      const endDay = endDate.getDay();
      endOfWeek.setDate(endDate.getDate() + (6 - endDay)); // Move to next Saturday
      
      console.log('Building calendar grid from', startOfWeek.toISOString(), 'to', endOfWeek.toISOString());
      
      // Calculate number of weeks to display
      const totalDays = Math.round((endOfWeek.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const numberOfWeeks = Math.ceil(totalDays / 7);
      
      // Get today's date to identify future dates
      const today = new Date();
      
      // Create weeks
      for (let week = 0; week < numberOfWeeks; week++) {
        const weekData = { days: [] as any[] };
        
        // Create days in the week
        for (let day = 0; day < 7; day++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + (week * 7) + day);
          
          const dateString = date.toISOString().split('T')[0];
          const isFutureDate = date > today;
          
          // For future dates in current year, show empty squares
          // For past dates, show actual contribution data
          const contribution = isFutureDate ? { count: 0 } : (contributionsByDate[dateString] || { count: 0 });
          const count = contribution.count || 0;
          
          // Determine contribution level based on count
          let level: 0 | 1 | 2 | 3 | 4 = 0;
          if (count > 0) {
            if (count <= 2) level = 1;
            else if (count <= 5) level = 2;
            else if (count <= 10) level = 3;
            else level = 4;
          }
          
          // Check if this is a gap in the recent streak
          const isMissed = analysis?.gaps?.includes(dateString);
          
          // Format date for display
          const formattedDate = format(date, 'MMM d, yyyy');
          
          weekData.days.push({
            level,
            date: formattedDate,
            count,
            isMissed,
            month: date.getMonth(),
            fullDate: date,
            isFuture: isFutureDate
          });
        }
        
        calendarData.push(weekData);
      }
      
      console.log('Calendar data processed. Weeks:', calendarData.length);
      setProcessedCalendarData(calendarData);
    } catch (error: any) {
      console.error('Error processing contribution data:', error);
      setError('Error processing contribution data');
    }
  }, [contributionData, selectedYear]);
  
  // Use provided calendarData or the processed data from API
  const data = calendarData || processedCalendarData;
  
  // Days of the week labels - using the GitHub convention
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
  
  // Get month labels for the calendar
  const getMonthLabels = () => {
    if (!data || data.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPositions: { month: string, offset: number }[] = [];
    
    // For the current year, always show all months regardless of data availability
    if (selectedYear === new Date().getFullYear()) {
      // Find the first week index containing data for the current year
      let firstWeekOfYear = 0;
      let lastWeekOfYear = data.length - 1;
      
      // Find first week containing January
      for (let i = 0; i < data.length; i++) {
        if (!data[i].days || data[i].days.length === 0) continue;
        
        for (const day of data[i].days) {
          if (!day.fullDate) continue;
          
          const date = new Date(day.fullDate);
          if (date.getFullYear() === selectedYear && date.getMonth() === 0) {
            firstWeekOfYear = i;
            break;
          }
        }
        
        if (firstWeekOfYear > 0) break;
      }
      
      // For current year, always display all 12 months regardless of current month
      // Calculate available width from first week to last week
      const availableWidth = lastWeekOfYear - firstWeekOfYear;
      
      // Distribute all 12 months evenly across the available width
      for (let i = 0; i < 12; i++) {
        // Calculate position based on the fraction of the year
        const position = firstWeekOfYear + Math.floor((i / 11) * availableWidth);
        
        // Ensure position is within bounds
        const finalPosition = Math.max(firstWeekOfYear, Math.min(position, data.length - 1));
        
        monthPositions.push({
          month: months[i],
          offset: finalPosition
        });
      }
      
      return monthPositions;
    }
    
    // For past years, use the existing algorithm
    // Create a map of month to first week containing that month
    const monthWeeks = new Map<number, number>();
    
    // Scan all weeks to find the first occurrence of each month in the selected year
    data.forEach((week, weekIndex) => {
      if (!week.days || week.days.length === 0) return;
      
      for (const day of week.days) {
        if (!day.fullDate) continue;
        
        const date = new Date(day.fullDate);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          
          // If we haven't recorded this month yet, store its week index
          if (!monthWeeks.has(month)) {
            monthWeeks.set(month, weekIndex);
          }
        }
      }
    });
    
    // If we found any months, create the month labels
    if (monthWeeks.size > 0) {
      // For each month from January to December
      for (let i = 0; i < 12; i++) {
        // If we found this month in the data, use its actual position
        if (monthWeeks.has(i)) {
          monthPositions.push({
            month: months[i],
            offset: monthWeeks.get(i)!
          });
        } else {
          // Month not found in data - estimate its position
          
          // Try to find the previous and next available months
          let prevMonth = i - 1;
          let nextMonth = i + 1;
          let prevWeek = -1;
          let nextWeek = -1;
          
          // Find nearest previous month with data
          while (prevMonth >= 0 && !monthWeeks.has(prevMonth)) {
            prevMonth--;
          }
          if (prevMonth >= 0) {
            prevWeek = monthWeeks.get(prevMonth)!;
          }
          
          // Find nearest next month with data
          while (nextMonth < 12 && !monthWeeks.has(nextMonth)) {
            nextMonth++;
          }
          if (nextMonth < 12) {
            nextWeek = monthWeeks.get(nextMonth)!;
          }
          
          // Calculate estimated week position
          let estimatedWeek;
          if (prevWeek >= 0 && nextWeek >= 0) {
            // Interpolate between previous and next month
            const prevMonths = i - prevMonth;
            const totalMonths = nextMonth - prevMonth;
            const totalWeeks = nextWeek - prevWeek;
            estimatedWeek = prevWeek + Math.round((prevMonths / totalMonths) * totalWeeks);
          } else if (prevWeek >= 0) {
            // Estimate based on previous month (add ~4 weeks per month)
            estimatedWeek = prevWeek + ((i - prevMonth) * 4);
          } else if (nextWeek >= 0) {
            // Estimate based on next month (subtract ~4 weeks per month)
            estimatedWeek = nextWeek - ((nextMonth - i) * 4);
          } else {
            // We couldn't find any months with data (unlikely to happen)
            estimatedWeek = Math.floor(data.length / 12) * i;
          }
          
          // Ensure the estimated week is within bounds
          estimatedWeek = Math.max(0, Math.min(estimatedWeek, data.length - 1));
          
          monthPositions.push({
            month: months[i],
            offset: estimatedWeek
          });
        }
      }
    } else {
      // No months found for this year - create evenly distributed month labels
      const weeksPerMonth = data.length / 12;
      for (let i = 0; i < 12; i++) {
        const offset = Math.min(Math.floor(i * weeksPerMonth), data.length - 1);
        monthPositions.push({
          month: months[i],
          offset: offset
        });
      }
    }
    
    return monthPositions;
  };
  
  const monthLabels = getMonthLabels();
  
  // Calculate cell size and spacing based on container width
  const cellSize = 11; // GitHub's size
  const cellGap = 2; // Gap between cells
  const weekWidth = cellSize + cellGap;
  
  // Update the year selection handler to handle errors better
  const handleYearChange = (year: number) => {
    if (year === selectedYear) return;
    
    console.log(`Changing year from ${selectedYear} to ${year}`);
    setLoading(true);
    setSelectedYear(year);
    
    // Reset any previous errors
    setError(null);
  };
  
  return (
    <GlassCard className="w-full glass-calendar relative rounded-lg overflow-hidden">
      <GlassCardContent className="py-5 px-5">
        {loading ? (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm font-medium">Loading contribution data...</p>
          </div>
        ) : null}
        
        {error ? (
          <div className="h-[220px] flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-destructive text-center">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1.5 bg-primary/20 text-primary text-xs rounded-md hover:bg-primary/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {/* Year buttons and legend */}
            <div className="flex items-center justify-between mb-2">
              {/* Year filter */}
              <div className="flex items-start gap-1">
                {availableYears.map(year => (
                  <Button
                    key={year}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleYearChange(year)}
                    className={cn(
                      "min-w-10 h-7 px-2 rounded-md text-xs font-medium transition-colors",
                      selectedYear === year 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    {year}
                  </Button>
                ))}
              </div>
              
              {selectedYear !== new Date().getFullYear() && (
                <div className="text-xs font-medium text-muted-foreground">
                  Showing contributions for {selectedYear}
                </div>
              )}
              
              {/* Legend */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Less</span>
                {[0, 1, 2, 3, 4].map((level) => {
                  const bgColors = {
                    0: '#161b22',
                    1: '#0e4429',
                    2: '#006d32',
                    3: '#26a641',
                    4: '#39d353'
                  };
                  
                  return (
                    <div 
                      key={level} 
                      className={`w-3 h-3 rounded-sm contribution-level-${level}`}
                      style={{ backgroundColor: bgColors[level] }}
                    />
                  );
                })}
                <span className="text-xs text-muted-foreground">More</span>
              </div>
            </div>
            
            {/* Calendar component */}
            <div className="w-full">
              {/* Month labels */}
              <div className="flex w-full mb-2 pt-1">
                <div className="w-[30px]"></div> {/* Space for day labels */}
                <div className="flex-1 grid grid-flow-col auto-cols-fr">
                  {monthLabels.map((label, i) => {
                    // For current year, adjust visibility criteria to ensure more months are visible
                    const prevLabel = i > 0 ? monthLabels[i-1] : null;
                    const isCurrentYear = selectedYear === new Date().getFullYear();
                    
                    // Use a lower threshold for current year to show more months
                    const tooClose = prevLabel && (label.offset - prevLabel.offset) < (isCurrentYear ? 4 : 2);
                    
                    // Important months that should always be visible
                    const isImportantMonth = ['Jan', 'Apr', 'Jul', 'Oct'].includes(label.month);
                    const shouldDisplay = !tooClose || isImportantMonth;
                    
                    return (
                      <div 
                        key={i} 
                        className="text-xs font-medium relative"
                        style={{ 
                          gridColumnStart: label.offset + 1,
                          gridColumnEnd: "span 1"
                        }}
                      >
                        <span 
                          className={`absolute left-0 whitespace-nowrap ${shouldDisplay ? '' : 'opacity-0'}`}
                          style={{ 
                            color: (label.month === 'Jan' ? 'var(--primary)' : 
                                   isImportantMonth ? 'var(--foreground)' : 'var(--muted-foreground)'),
                            fontWeight: label.month === 'Jan' || isImportantMonth ? 'bold' : 'normal'
                          }}
                        >
                          {label.month}
                        </span>
                        <div 
                          className="h-0.5 bg-border/50 absolute left-0 bottom-0"
                          style={{ 
                            backgroundColor: label.month === 'Jan' ? 'var(--primary)' : '',
                            width: label.month === 'Jan' ? '4px' : isImportantMonth ? '3px' : '2px',
                            opacity: shouldDisplay ? 0.8 : 0.2
                          }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Main calendar */}
              <div className="flex w-full mt-2">
                {/* Day labels */}
                <div className="flex flex-col gap-1 pt-2 pr-2 w-[30px] flex-shrink-0">
                  {daysOfWeek.map((day, index) => (
                    <div key={index} className="h-3 md:h-4 text-xs text-muted-foreground flex items-center justify-end w-full font-normal">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Contribution grid - expand to fill available width */}
                <div className="flex-1 pt-2 pb-1 overflow-hidden">
                  <div className="grid grid-flow-col auto-cols-fr gap-1">
                    {data && data.length > 0 ? (
                      <>
                        {data.map((week, weekIndex) => (
                          <ContributionWeek key={weekIndex} days={week.days} />
                        ))}
                      </>
                    ) : (
                      <div className="w-full flex justify-center items-center py-12 col-span-full">
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">No contributions found for {selectedYear}</p>
                          <p className="text-xs text-muted-foreground">Try selecting a different year</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Learn more link */}
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
              <span className="cursor-pointer hover:text-foreground">Learn how we count contributions</span>
            </div>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};
