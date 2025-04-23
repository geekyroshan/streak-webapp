import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar as CalendarIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalMissedDays } from '@/lib/GlobalMissedDaysContext';

interface GapCalendarViewProps {
  missedDays: any[];
  onDateSelect: (date: string) => void;
  onBackClick: () => void;
  onFixDay: (date: any) => void;
  onFixAll: (dates: any[]) => void;
  isFixing: boolean;
}

export const GapCalendarView = ({
  missedDays,
  onDateSelect,
  onBackClick,
  onFixDay,
  onFixAll,
  isFixing
}: GapCalendarViewProps) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const { selectedRepo } = useGlobalMissedDays();
  
  // Convert missed days strings to Date objects for the calendar
  const highlightedDates = missedDays.map(day => parseISO(day.id));
  
  // Get all missed days from the currently visible month
  const currentMonthMissedDays = missedDays.filter(day => {
    const date = parseISO(day.id);
    return date.getMonth() === selectedMonth.getMonth() && 
           date.getFullYear() === selectedMonth.getFullYear();
  });
  
  // Toggle selection of a date
  const toggleDateSelection = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };
  
  // Select all dates in visible month
  const selectAllVisible = () => {
    const visibleDayIds = currentMonthMissedDays.map(day => day.id);
    
    if (visibleDayIds.every(id => selectedDates.includes(id))) {
      // If all are selected, deselect all
      setSelectedDates(selectedDates.filter(d => !visibleDayIds.includes(d)));
    } else {
      // Otherwise, select all that aren't already selected
      const newSelection = [...selectedDates];
      visibleDayIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      setSelectedDates(newSelection);
    }
  };
  
  // Get all selected days objects
  const getSelectedDayObjects = () => {
    return missedDays.filter(day => selectedDates.includes(day.id));
  };
  
  // Fix all selected days
  const handleFixSelected = () => {
    const selectedDayObjects = getSelectedDayObjects();
    if (selectedDayObjects.length > 0) {
      onFixAll(selectedDayObjects);
      setSelectedDates([]);
    }
  };

  // Add CSS variables for highlighted dates
  const calendarStyles = `
    :root {
      --highlighted-day-background: rgba(255, 0, 0, 0.1);
      --highlighted-day-color: #ff0000;
      --highlighted-day-border: rgba(255, 0, 0, 0.3);
      --today-background: rgba(0, 122, 255, 0.1);
      --today-color: #007aff;
    }
  `;

  // Calendar date selection handler with repository check
  const handleDateSelection = (date: Date | undefined) => {
    if (!date) return;
    
    onDateSelect(format(date, 'yyyy-MM-dd'));
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <Card className="h-[450px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>Select days to backdate contributions</CardDescription>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1" 
              onClick={onBackClick}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to List
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {!selectedRepo ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <h3 className="text-lg font-medium mb-1">No Repository Selected</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Please select a repository for backdating your contributions in the Backdating Card.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Calendar
                  mode="single"
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  highlightedDates={highlightedDates}
                  selected={undefined}
                  onSelect={handleDateSelection}
                  className="mx-auto"
                />
              </div>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">
                    Selected: <Badge variant="outline">{selectedDates.length}</Badge>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={selectAllVisible}
                    disabled={currentMonthMissedDays.length === 0}
                  >
                    {currentMonthMissedDays.every(day => selectedDates.includes(day.id)) 
                      ? 'Deselect All' 
                      : 'Select All Visible'}
                  </Button>
                </div>
                
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {currentMonthMissedDays.length > 0 ? (
                      currentMonthMissedDays.map(day => (
                        <div 
                          key={day.id}
                          className={`
                            p-2 rounded-md flex items-center justify-between text-sm
                            ${selectedDates.includes(day.id) 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'bg-accent/20 border border-accent/10'
                            }
                          `}
                          onClick={() => toggleDateSelection(day.id)}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{day.date}</div>
                              <div className="text-xs text-muted-foreground">{day.dayName}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {selectedDates.includes(day.id) && (
                              <CheckCircle className="h-4 w-4 text-primary mr-2" />
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onFixDay(day);
                              }}
                            >
                              Fix
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No missed days in this month.
                        <br />
                        Navigate to another month to see missed contributions.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          <Button 
            className="w-full"
            disabled={selectedDates.length === 0 || isFixing || !selectedRepo}
            onClick={handleFixSelected}
          >
            Fix {selectedDates.length} Selected {selectedDates.length === 1 ? 'Day' : 'Days'}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}; 