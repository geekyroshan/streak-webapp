import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { contributionService } from '@/lib/api';
import { Loader2, ChevronLeft, ChevronRight, LayoutGrid, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';

export const ActivityPatterns = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayOfWeekData, setDayOfWeekData] = useState<any[]>([]);
  const [timeOfDayData, setTimeOfDayData] = useState<any[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'all'>('all');
  const [hasContributions, setHasContributions] = useState(true);

  const goToPreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1));
    if (viewMode !== 'week') setViewMode('week');
    setLoading(true); // Set loading state when changing weeks
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(selectedWeek, 1);
    if (nextWeek <= new Date()) {
      setSelectedWeek(nextWeek);
      if (viewMode !== 'week') setViewMode('week');
      setLoading(true); // Set loading state when changing weeks
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => {
      const newMode = prev === 'all' ? 'week' : 'all';
      setLoading(true); // Set loading state when changing view mode
      return newMode;
    });
  };

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        setHasContributions(true); // Reset this flag when fetching new data
        
        let activityData;
        
        if (viewMode === 'week') {
          // Get data for the selected week
          const weekStart = format(startOfWeek(selectedWeek, { weekStartsOn: 0 }), 'yyyy-MM-dd');
          const weekEnd = format(endOfWeek(selectedWeek, { weekStartsOn: 0 }), 'yyyy-MM-dd');
          console.log(`Fetching activity data for week: ${weekStart} to ${weekEnd}`);
          activityData = await contributionService.getActivityPatterns(weekStart, weekEnd);
        } else {
          // Get all-time data
          console.log('Fetching all-time activity data');
          activityData = await contributionService.getActivityPatterns();
        }
        
        console.log('Activity data received:', activityData);
        
        if (activityData && activityData.dayOfWeekActivity) {
          // Process day of week data
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayData = daysOfWeek.map((day, index) => ({
            name: day.substring(0, 3), // Use short day names (Sun, Mon, etc.)
            value: activityData.dayOfWeekActivity[index] || 0
          }));
          
          console.log('Processed day of week data:', dayData);
          setDayOfWeekData(dayData);
          
          // Set time of day data from the API response
          setTimeOfDayData(activityData.timeOfDayActivity || []);
          console.log('Time of day data:', activityData.timeOfDayActivity);
          
          // Check if there are any contributions in this period
          const totalDayContributions = dayData.reduce((sum, item) => sum + item.value, 0);
          const totalTimeContributions = activityData.timeOfDayActivity?.reduce((sum: number, item: any) => sum + item.value, 0) || 0;
          
          const hasAnyContributions = totalDayContributions > 0 || totalTimeContributions > 0;
          console.log(`Total day contributions: ${totalDayContributions}, Total time contributions: ${totalTimeContributions}`);
          console.log(`Has contributions: ${hasAnyContributions}`);
          
          setHasContributions(hasAnyContributions);
        } else {
          console.error('Invalid activity data structure received:', activityData);
          setError('Failed to load activity data');
          setHasContributions(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch activity patterns:', error);
        setError('Failed to load activity data');
        setHasContributions(false);
        setLoading(false);
      }
    };
    
    fetchActivityData();
  }, [selectedWeek, viewMode]);
  
  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm p-3 border border-border rounded shadow-md text-xs">
          <p className="font-semibold text-sm mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: payload[0].color }} 
            />
            <p className="text-foreground">
              {`Contributions: ${payload[0].value}`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // New color palette - blues to purples
  const getBarColor = (value: number) => {
    if (value > 20) return '#845EF7'; // High activity - bright purple
    if (value > 10) return '#5E5FEE'; // Medium activity - blue-purple
    if (value > 5) return '#3B7FEB';  // Low activity - blue
    return '#364FC7';                 // Very low activity - deep blue
  };

  // Find max value for day of week data to set a consistent y-axis
  const dayOfWeekMax = Math.max(...dayOfWeekData.map(d => d.value), 10);
  const timeOfDayMax = Math.max(...timeOfDayData.map(d => d.value), 10);

  // Empty state component
  const EmptyState = () => (
    <div className="h-[170px] flex flex-col items-center justify-center text-muted-foreground">
      <AlertCircle className="h-6 w-6 mb-2 opacity-50" />
      <p className="text-sm">No contributions found for this period</p>
    </div>
  );

  return (
    <Card className="bg-card/80 backdrop-blur-md border-border/50">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Activity Patterns</CardTitle>
            <CardDescription>Analysis of your contribution habits</CardDescription>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleViewMode}
            className="h-8 gap-1 text-xs"
            disabled={loading}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {viewMode === 'all' ? 'View Weekly' : 'View All Time'}
          </Button>
        </div>
      </CardHeader>
      
      {viewMode === 'week' && (
        <div className="flex items-center justify-between px-4 -mt-1 mb-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousWeek}
            className="h-8 w-8 p-0 hover:bg-primary/10"
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium px-3 py-1 bg-primary/10 rounded-full">
            {format(startOfWeek(selectedWeek, { weekStartsOn: 0 }), 'MMM d')} - {format(endOfWeek(selectedWeek, { weekStartsOn: 0 }), 'MMM d, yyyy')}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextWeek}
            disabled={addWeeks(selectedWeek, 1) > new Date() || loading}
            className="h-8 w-8 p-0 hover:bg-primary/10 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading activity data...</span>
          </div>
        ) : error ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Failed to load activity data. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-border/30 rounded-md p-3 bg-card/50">
              <h3 className="text-sm font-medium mb-2">Contribution by Day of Week</h3>
              {!hasContributions ? <EmptyState /> : (
                <>
                  <div className="h-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.15} />
                        <XAxis 
                          dataKey="name" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          dy={5}
                        />
                        <YAxis 
                          hide={true} 
                          domain={[0, dayOfWeekMax + Math.ceil(dayOfWeekMax * 0.2)]} // Add 20% space on top
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          radius={[4, 4, 0, 0]} 
                          minPointSize={3}
                          barSize={26}
                        >
                          {dayOfWeekData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getBarColor(entry.value)} 
                              cursor="pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-1">
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      {['Low', 'Medium', 'High'].map((level, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-2 h-2 rounded-full mr-1" 
                            style={{ 
                              backgroundColor: index === 0 ? '#3B7FEB' : 
                                               index === 1 ? '#5E5FEE' : '#845EF7' 
                            }} 
                          />
                          <span>{level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="border border-border/30 rounded-md p-3 bg-card/50">
              <h3 className="text-sm font-medium mb-2">Contribution by Time of Day</h3>
              {!hasContributions ? <EmptyState /> : (
                <>
                  <div className="h-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.15} />
                        <XAxis 
                          dataKey="name" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                          dy={5}
                          tickFormatter={(value) => `${value}h`}
                        />
                        <YAxis 
                          hide={true} 
                          domain={[0, timeOfDayMax + Math.ceil(timeOfDayMax * 0.2)]} // Add 20% space on top
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          radius={[4, 4, 0, 0]}
                          minPointSize={3}
                          barSize={26}
                        >
                          {timeOfDayData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={getBarColor(entry.value)} 
                              cursor="pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-1">
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span>Time in 24-hour format (UTC)</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityPatterns; 