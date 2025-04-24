import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, ListFilter, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { streakService, contributionService } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { GapCalendarView } from './GapCalendarView';
import { useGlobalMissedDays } from '@/lib/GlobalMissedDaysContext';

export const GapAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const { toast } = useToast();
  
  // Use the global missed days context
  const {
    missedDays,
    selectedRepo,
    isFixingAny,
    setIsFixingAny
  } = useGlobalMissedDays();
  
  // Function to fix a missed day
  const fixMissedDay = async (missedDay: any) => {
    if (!selectedRepo) {
      toast({
        variant: "destructive",
        title: "No repository selected",
        description: "Please select a repository for backdating"
      });
      return;
    }
    
    try {
      setIsFixingAny(true);
      
      // Create a commit for this missed day
      await streakService.createBackdatedCommit({
        repository: selectedRepo.name,
        repositoryUrl: selectedRepo.html_url,
        filePath: `streak-records/${missedDay.id}/README.md`,
        commitMessage: `Update streak record for ${missedDay.date}`,
        dateTime: missedDay.id + 'T12:00:00Z', // Set to noon on the missed day
        content: `# Streak Record\n\nDate: ${missedDay.date}\nDay: ${missedDay.dayOfWeek}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
      });
      
      toast({
        title: "Success!",
        description: `Fixed missed day for ${missedDay.date}`,
      });
      
      setIsFixingAny(false);
    } catch (error) {
      console.error('Failed to fix missed day:', error);
      
      // Extract more specific error message if available
      let errorMessage = 'Failed to create backdated commit. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = `Server error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        variant: "destructive",
        title: "Failed to fix missed day",
        description: errorMessage
      });
      
      setIsFixingAny(false);
    }
  };
  
  // Function to fix multiple missed days
  const fixMultipleMissedDays = async (selectedDates: string[]) => {
    if (!selectedRepo || selectedDates.length === 0) {
      toast({
        variant: "destructive",
        title: "No dates selected",
        description: "Please select at least one date to fix"
      });
      return;
    }
    
    setIsFixingAny(true);
    
    let successCount = 0;
    const failedDates: string[] = [];
    
    try {
      // Process each selected date
      for (const dateStr of selectedDates) {
        try {
          const date = parseISO(dateStr);
          const formattedDate = format(date, 'MMMM d, yyyy');
          const dayOfWeek = format(date, 'EEEE');
          
          await streakService.createBackdatedCommit({
            repository: selectedRepo.name,
            repositoryUrl: selectedRepo.html_url,
            filePath: `streak-records/${dateStr}/README.md`,
            commitMessage: `Update streak record for ${formattedDate}`,
            dateTime: dateStr + 'T12:00:00Z', // Set to noon on the selected day
            content: `# Streak Record\n\nDate: ${formattedDate}\nDay: ${dayOfWeek}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
          });
          
          successCount++;
          
          // Short delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (dayError) {
          console.error(`Failed to process day ${dateStr}:`, dayError);
          failedDates.push(dateStr);
        }
      }
      
      // Show success/error toast
      if (failedDates.length === 0) {
        toast({
          title: "Success!",
          description: `Fixed ${successCount} missed days`,
        });
      } else {
        toast({
          variant: "destructive",
          title: `Fixed ${successCount} days, but ${failedDates.length} failed`,
          description: "Some dates could not be processed. Try again later."
        });
      }
      
      setIsFixingAny(false);
    } catch (error) {
      console.error('Failed to fix multiple missed days:', error);
      
      toast({
        variant: "destructive",
        title: "Failed to fix missed days",
        description: "An error occurred while processing your request"
      });
      
      setIsFixingAny(false);
    }
  };
  
  // Handle date selection from calendar
  const handleDateSelect = async (dateStr: string) => {
    if (!selectedRepo) {
      toast({
        variant: "destructive",
        title: "No repository selected",
        description: "Please select a repository for backdating"
      });
      return;
    }
    
    const missedDay = missedDays.find(day => day.id === dateStr);
    
    if (missedDay) {
      await fixMissedDay(missedDay);
    } else {
      // Create a missed day object for this date
      const date = parseISO(dateStr);
      const formattedDate = format(date, 'MMMM d, yyyy');
      const dayOfWeek = format(date, 'EEEE');
      const daysAgo = Math.ceil(Math.abs(new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      await fixMissedDay({
        id: dateStr,
        date: formattedDate,
        dayOfWeek,
        daysAgo,
        priority: 'medium',
        isWeekend: [0, 6].includes(date.getDay())
      });
    }
  };
  
  // Toggle between calendar and list views
  const toggleView = () => {
    setShowCalendarView(!showCalendarView);
  };
  
  // Return component
  return (
    <Card className="shadow-lg bg-card/50 backdrop-blur-lg border-input/10">
      <CardHeader className="pb-2">
        <div>
          <CardTitle>Contribution Gaps</CardTitle>
          <CardDescription>Identify and fix gaps in your contribution streak</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : showCalendarView ? (
          // Show the calendar view
          <GapCalendarView 
            missedDays={missedDays} 
            onDateSelect={handleDateSelect}
            onBackClick={() => setShowCalendarView(false)}
            onFixDay={fixMissedDay}
            onFixAll={fixMultipleMissedDays}
            isFixing={isFixingAny}
          />
        ) : (
          // Show the list view
          <div className="space-y-3">
            {missedDays.length > 0 ? (
              <div>
                <div className="flex flex-col gap-2 mt-2">
                  {missedDays.slice(0, 10).map((day) => (
                    <div 
                      key={day.id} 
                      className="flex justify-between items-center p-2 rounded-md bg-card/30 hover:bg-card/50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.date}</span>
                          <Badge 
                            variant={
                              day.priority === 'high' ? 'destructive' : 
                              day.priority === 'medium' ? 'default' : 'outline'
                            }
                            className="text-xs h-5"
                          >
                            {day.daysAgo} {day.daysAgo === 1 ? 'day' : 'days'} ago
                          </Badge>
                          {day.isWeekend && (
                            <Badge variant="outline" className="text-xs h-5 border-yellow-600/30 text-yellow-500">
                              Weekend
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{day.dayOfWeek}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={isFixingAny}
                        onClick={() => fixMissedDay(day)}
                        className="h-8 text-xs bg-primary/10 hover:bg-primary/20"
                      >
                        {isFixingAny ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Fix'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                {missedDays.length > 10 && (
                  <div className="mt-3 text-center text-sm text-muted-foreground">
                    <span>+ {missedDays.length - 10} more gaps found. </span>
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-sm" 
                      onClick={toggleView}
                    >
                      View in calendar
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No gaps detected</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Great job! Your GitHub contribution streak looks consistent.
                  If you know of specific dates you missed, use the calendar view to fix them.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={toggleView}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
