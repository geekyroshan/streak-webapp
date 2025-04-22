import React, { useEffect, useState } from 'react';
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GitCommit, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { SparkleGroup } from '@/components/ui/sparkle';
import { contributionService, streakService } from '@/lib/api';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export const BackdatingCard = () => {
  const [loading, setLoading] = useState(true);
  const [missedDays, setMissedDays] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isFixing, setIsFixing] = useState(false);

  // Fetch missed days from the API
  useEffect(() => {
    const fetchMissedDays = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getUserContributions();
        const { analysis } = data;
        
        // Format gaps as missed days
        if (analysis && analysis.gaps) {
          const formattedMissedDays = analysis.gaps.map((dateStr: string, index: number) => {
            const date = parseISO(dateStr);
            const daysAgo = Math.ceil(Math.abs(new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            
            return {
              id: dateStr,
              date: format(date, 'MMMM d, yyyy'),
              dayOfWeek: format(date, 'EEEE'),
              daysAgo,
              priority: daysAgo <= 7 ? 'high' : 'medium' // Higher priority for more recent gaps
            };
          });
          
          // Sort by most recent first
          formattedMissedDays.sort((a, b) => a.daysAgo - b.daysAgo);
          
          // Limit to 5 most recent missed days
          setMissedDays(formattedMissedDays.slice(0, 5));
        }
        
        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch missed days:', error);
        setLoading(false);
      }
    };
    
    fetchMissedDays();
  }, []);

  // Function to fix a missed day
  const fixMissedDay = async (missedDay: any) => {
    try {
      setIsFixing(true);
      
      // Create a commit for this missed day
      await streakService.createBackdatedCommit({
        repoUrl: 'https://github.com/username/streak-backup-repo', // This should be configurable
        filePath: `streak-records/${missedDay.id}.md`,
        commitMessage: `Update streak record for ${missedDay.date}`,
        dateTime: missedDay.id + 'T12:00:00Z', // Set to noon on the missed day
        content: `# Streak Record\n\nDate: ${missedDay.date}\nDay: ${missedDay.dayOfWeek}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
      });
      
      // Remove the fixed day from the list
      setMissedDays(missedDays.filter(day => day.id !== missedDay.id));
      
      setIsFixing(false);
    } catch (error) {
      console.error('Failed to fix missed day:', error);
      setIsFixing(false);
    }
  };

  return (
    <GlassCard variant="opaque" className="border border-primary/20 shadow-lg relative overflow-hidden backdrop-blur-glass">
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      
      <GlassCardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-primary" />
              GitHub Streak Backdating
            </h3>
            <p className="text-sm text-muted-foreground">
              Fix gaps in your contribution history with legitimate commits
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 backdrop-blur-sm">Core Feature</Badge>
        </div>
        <SparkleGroup className="absolute top-0 right-0 h-12 overflow-hidden" count={2} />
      </GlassCardHeader>
      
      <GlassCardContent className="relative z-10">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {missedDays.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  We've detected <span className="font-semibold text-primary">{missedDays.length} missed {missedDays.length === 1 ? 'day' : 'days'}</span> in your recent GitHub activity that could break your streak.
                </p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Quick Fix Missed Contributions:</h4>
                  {missedDays.map((day) => (
                    <div 
                      key={day.id} 
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-md cursor-pointer hover:bg-white/20 transition-colors border border-glass/10"
                      onClick={() => fixMissedDay(day)}
                    >
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">{day.date}</div>
                        <div className="text-xs text-muted-foreground">{day.dayOfWeek} ({day.daysAgo} {day.daysAgo === 1 ? 'day' : 'days'} ago)</div>
                      </div>
                      <Badge 
                        className={`ml-auto ${day.priority === 'high' ? 'bg-primary/80' : 'bg-secondary/50'} backdrop-blur-sm`}
                        variant={day.priority === 'high' ? 'default' : 'secondary'}
                      >
                        {day.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="bg-green-500/10 p-3 rounded-full inline-flex mb-4">
                  <GitCommit className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Your Streak is Perfect!</h3>
                <p className="text-sm text-muted-foreground">
                  No missed days detected in your recent contribution history.
                </p>
              </div>
            )}
          </div>
        )}
      </GlassCardContent>
      
      <GlassCardFooter className="relative z-10">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            Last updated {formatDistanceToNow(lastUpdated)} ago
          </div>
          {missedDays.length > 0 && (
            <Link to="/streak">
              <Button className="glass-button gap-2" disabled={isFixing}>
                {isFixing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full mr-1" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <GitCommit className="h-4 w-4" />
                    Fix All Missed Days
                  </>
                )}
              </Button>
            </Link>
          )}
        </div>
      </GlassCardFooter>
    </GlassCard>
  );
};
