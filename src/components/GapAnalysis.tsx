import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Zap, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contributionService, streakService } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface MissedDayProps {
  date: string;
  dayName: string;
  pattern?: string;
  priority: 'high' | 'medium' | 'low';
  onFix: () => void;
  isFixing?: boolean;
}

const MissedDay = ({ date, dayName, pattern, priority, onFix, isFixing }: MissedDayProps) => {
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
        
        <Button 
          size="sm" 
          variant="outline" 
          className={priorityColor[priority]}
          onClick={onFix}
          disabled={isFixing}
        >
          {isFixing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              Fixing...
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 mr-1" />
              Fix
            </>
          )}
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
  const [loading, setLoading] = useState(true);
  const [missedDays, setMissedDays] = useState<any[]>([]);
  const [fixingDay, setFixingDay] = useState<string | null>(null);

  // Fetch gaps in contribution history
  useEffect(() => {
    const fetchGaps = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getUserContributions();
        const { analysis } = data;
        
        if (analysis && analysis.gaps && analysis.gaps.length > 0) {
          // Process gaps to create missed days data
          const formattedMissedDays = analysis.gaps.map((dateStr: string) => {
            const date = parseISO(dateStr);
            const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Calculate days ago for priority
            const daysAgo = Math.ceil(Math.abs(new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            
            // Determine pattern if any
            let pattern = undefined;
            if (isWeekend) {
              pattern = 'Weekend pattern detected';
            }
            
            // Set priority based on how recent and weekday/weekend
            let priority: 'high' | 'medium' | 'low' = 'medium';
            if (daysAgo <= 7) {
              priority = 'high';
            } else if (isWeekend) {
              priority = 'low';
            }
            
            return {
              id: dateStr,
              date: format(date, 'MMMM d, yyyy'),
              dayName: format(date, 'EEEE'),
              pattern,
              priority,
              daysAgo
            };
          });
          
          // Sort by most recent first
          formattedMissedDays.sort((a, b) => a.daysAgo - b.daysAgo);
          
          setMissedDays(formattedMissedDays);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch gaps:', error);
        setLoading(false);
      }
    };
    
    fetchGaps();
  }, []);

  // Function to fix a missed day
  const fixMissedDay = async (missedDay: any) => {
    try {
      setFixingDay(missedDay.id);
      
      // Create a commit for this missed day
      await streakService.createBackdatedCommit({
        repository: 'streak-backup-repo', // This should be configured by user
        repositoryUrl: 'https://github.com/username/streak-backup-repo', // This should be user-configured
        filePath: `streak-records/${missedDay.id}.md`,
        commitMessage: `Update streak record for ${missedDay.date}`,
        dateTime: missedDay.id + 'T12:00:00Z', // Set to noon on the missed day
        content: `# Streak Record\n\nDate: ${missedDay.date}\nDay: ${missedDay.dayName}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
      });
      
      // Remove the fixed day from the list
      setMissedDays(missedDays.filter(day => day.id !== missedDay.id));
      
      setFixingDay(null);
    } catch (error) {
      console.error('Failed to fix missed day:', error);
      setFixingDay(null);
    }
  };

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
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Analyzing contribution patterns...</span>
          </div>
        ) : missedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">No Gaps Found!</h3>
            <p className="text-sm text-muted-foreground">
              Your contribution timeline looks perfect. Great job maintaining your streak!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-4">
            {missedDays.map((day, index) => (
              <MissedDay 
                key={index} 
                {...day} 
                onFix={() => fixMissedDay(day)}
                isFixing={fixingDay === day.id}
              />
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
