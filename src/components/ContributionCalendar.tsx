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
}

const ContributionDay = ({ level, date, count, isMissed }: ContributionDayProps) => {
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
              `contribution-level-${level}`
            )}
            style={{ backgroundColor: bgColors[level] }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{count} contributions</p>
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
        
        // By default, fetch data for the last year
        let data;
        if (selectedYear === new Date().getFullYear()) {
          // For current year, fetch last 12 months (default behavior)
          data = await contributionService.getUserContributions();
        } else {
          // For previous years, specify the year range
          const startDate = `${selectedYear}-01-01`;
          const endDate = `${selectedYear}-12-31`;
          data = await contributionService.getUserContributions(startDate);
        }
        
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
        
        // Filter contributions based on selected year
        const filteredContributions = contributions.filter((day: any) => {
          if (!day.date) return false;
          
          const contribDate = new Date(day.date);
          // For current year, include last 12 months
          if (selectedYear === new Date().getFullYear()) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            return contribDate >= oneYearAgo;
          } 
          // For other years, include only that year
          else {
            return contribDate.getFullYear() === selectedYear;
          }
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
      let startDate, endDate;
      
      if (selectedYear === new Date().getFullYear()) {
        // If current year, show the last 12 months
        endDate = new Date(); // Today
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1); // One year ago
      } else {
        // For past years, show that specific year
        startDate = new Date(selectedYear, 0, 1); // January 1st of selected year
        endDate = new Date(selectedYear, 11, 31); // December 31st of selected year
      }
      
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
      
      // Create weeks
      for (let week = 0; week < numberOfWeeks; week++) {
        const weekData = { days: [] as any[] };
        
        // Create days in the week
        for (let day = 0; day < 7; day++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + (week * 7) + day);
          
          const dateString = date.toISOString().split('T')[0];
          const contribution = contributionsByDate[dateString] || { count: 0 };
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
            fullDate: date
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
    
    // Track the months we've seen
    const seenMonths = new Map<number, boolean>();
    
    // Get earliest and latest dates in the dataset
    let earliestDate = new Date();
    let latestDate = new Date(0);
    
    data.forEach(week => {
      if (!week.days || week.days.length === 0) return;
      
      week.days.forEach(day => {
        if (day.fullDate) {
          const date = new Date(day.fullDate);
          if (date < earliestDate) earliestDate = date;
          if (date > latestDate) latestDate = date;
        }
      });
    });
    
    // Scan through the weeks to find the first occurrence of each month
    data.forEach((week, weekIndex) => {
      if (!week.days || week.days.length === 0) return;
      
      const firstDay = week.days[0];
      if (!firstDay.fullDate) return;
      
      const date = new Date(firstDay.fullDate);
      const month = date.getMonth();
      
      // If we haven't seen this month yet, add it to our labels
      if (!seenMonths.has(month)) {
        monthPositions.push({
          month: months[month],
          offset: weekIndex
        });
        seenMonths.set(month, true);
      }
    });
    
    // For current year, ensure April is displayed as the last month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (selectedYear === currentYear && currentMonth === 3) { // April is month 3 (0-indexed)
      if (!seenMonths.has(currentMonth)) {
        // Add April at the end
        monthPositions.push({
          month: 'Apr',
          offset: data.length - 1
        });
      } else {
        // Make sure April is the last visible month label
        const aprilIndex = monthPositions.findIndex(m => m.month === 'Apr');
        if (aprilIndex >= 0) {
          const april = monthPositions[aprilIndex];
          // Move April to the end if it's not already the last month
          if (aprilIndex < monthPositions.length - 1) {
            monthPositions.splice(aprilIndex, 1);
            monthPositions.push({
              month: 'Apr',
              offset: data.length - 1
            });
          }
        }
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
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <div className="flex w-full">
                <div className="w-[30px]"></div> {/* Space for day labels */}
                <div className="flex-1 grid grid-flow-col auto-cols-fr">
                  {monthLabels.map((label, i) => (
                    <div 
                      key={i} 
                      className="text-xs text-muted-foreground font-normal"
                      style={{ 
                        gridColumnStart: label.offset + 1,
                        gridColumnEnd: "span 1" 
                      }}
                    >
                      {label.month}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main calendar */}
              <div className="flex w-full mt-1">
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
