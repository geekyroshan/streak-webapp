import React, { useEffect, useState } from 'react';
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GitCommit, Calendar, Clock, Loader2, AlertCircle, CalendarDays, X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { SparkleGroup } from '@/components/ui/sparkle';
import { contributionService, streakService, repoService } from '@/lib/api';
import api from '@/lib/api';
import { format, parseISO, formatDistanceToNow, subDays, isValid, parse } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGlobalMissedDays } from '@/lib/GlobalMissedDaysContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const BackdatingCard = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualDate, setManualDate] = useState<string>('');
  const [manualDates, setManualDates] = useState<any[]>([]);
  
  // Use the global context
  const { 
    missedDays, 
    setMissedDays, 
    selectedRepo, 
    setSelectedRepo, 
    isFixingAny, 
    setIsFixingAny,
    forceUpdate 
  } = useGlobalMissedDays();

  // Fetch repositories to get a suitable target for backdating
  const { data: repositories, isError: repoError } = useQuery({
    queryKey: ['repositories-for-backdating'],
    queryFn: async () => {
      try {
        const repos = await repoService.getUserRepositories();
        
        // Try to find a good repository for backdating
        // Look for repos like "streak-manager", "github-contributions", etc.
        const backdatingKeywords = ['streak', 'contribution', 'backup', 'github', 'activity'];
        
        // Find a repo that might be suitable for backdating
        const bestRepo = repos.find((repo: any) => 
          backdatingKeywords.some(keyword => repo.name.toLowerCase().includes(keyword))
        );
        
        if (bestRepo) {
          setSelectedRepo(bestRepo);
        } else if (repos.length > 0) {
          // Just use the first repo if no better match
          setSelectedRepo(repos[0]);
        }
        
        return repos;
      } catch (err) {
        setError('Failed to load your repositories. Please check your GitHub connection.');
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Function to fetch missed days (moved to separate function for reuse)
  const fetchMissedDays = async (lookbackMonths = 6) => {
    try {
      setLoading(true);
      
      // Calculate date for lookback period
      const lookbackDate = new Date();
      lookbackDate.setMonth(lookbackDate.getMonth() - lookbackMonths);
      const lookbackDateStr = lookbackDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Fetch contribution data with the specified lookback period
      // Add ignoreCurrentStreak=true to ensure we get gaps from before the current streak
      const url = `/contributions?since=${lookbackDateStr}&ignoreCurrentStreak=true&includeAllGaps=true`;
      
      const response = await api.get(url);
      const data = response.data.data;
      
      const { analysis } = data;
      
      // Format gaps as missed days
      if (analysis && analysis.gaps) {
        const formattedMissedDays = analysis.gaps.map((dateStr: string) => {
          const date = parseISO(dateStr);
          const daysAgo = Math.ceil(Math.abs(new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          // Determine priority level based on recency and day of week
          let priority: 'high' | 'medium' | 'low';
          
          if (daysAgo <= 7) {
            // Recent days (within a week) are high priority
            priority = 'high';
          } else if (daysAgo <= 14) {
            // Days within the last two weeks are medium priority
            priority = 'medium';
          } else {
            // Older days or weekend days are low priority
            priority = isWeekend ? 'low' : 'medium';
          }
          
          return {
            id: dateStr,
            date: format(date, 'MMMM d, yyyy'),
            dayOfWeek: format(date, 'EEEE'),
            daysAgo,
            priority,
            isWeekend
          };
        });
        
        // Sort by most recent first
        formattedMissedDays.sort((a, b) => a.daysAgo - b.daysAgo);
        
        // Display up to 10 missed days
        if (formattedMissedDays.length > 0) {
          // Update the global context with all missed days
          setMissedDays(formattedMissedDays);
        } else {
          // If no gaps found with current lookback, try looking back even further automatically
          if (lookbackMonths < 12) {
            // Recursively call with a longer lookback
            fetchMissedDays(12);
            return;
          } else if (lookbackMonths < 24 && analysis.gaps.length === 0) {
            // Try with a 2-year lookback
            fetchMissedDays(24);
            return;
          } else {
            setMissedDays([]);
          }
        }
      } else {
        setMissedDays([]);
      }
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch missed days:', error);
      setError('Failed to analyze your contribution history');
      setLoading(false);
    }
  };

  // Use the fetchMissedDays function in useEffect
  useEffect(() => {
    // Start with a 12-month lookback by default to get gaps from before the current streak
    fetchMissedDays(12);
    
    // After initial load, try with a longer period if no gaps were found
    const checkForOlderGaps = setTimeout(() => {
      if (missedDays.length === 0 && !loading && !error) {
        fetchMissedDays(24);
      }
    }, 5000); // Wait 5 seconds after initial load
    
    return () => clearTimeout(checkForOlderGaps);
  }, []);

  return (
    <GlassCard>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-start gap-2">
              <h2 className="text-xl font-semibold tracking-tight">GitHub Streak Backdating</h2>
              <SparkleGroup>
                <Badge variant="default" className="gap-1 text-xs">
                  <span>Pro</span>
                </Badge>
              </SparkleGroup>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Backdated contributions to maintain your streak
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/streak">
              <Button variant="outline" className="gap-1 text-sm">
                <Calendar className="h-4 w-4" />
                <span>View Streak</span>
              </Button>
            </Link>
          </div>
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="relative">
        {loading ? (
          <div className="h-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Analyzing contribution history...</p>
          </div>
        ) : error ? (
          <div className="h-24 flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button variant="outline" className="mt-3" onClick={() => fetchMissedDays(12)}>
              Try Again
            </Button>
          </div>
        ) : missedDays.length === 0 ? (
          <div className="h-24 flex flex-col items-center justify-center">
            <CalendarDays className="h-8 w-8 text-green-500" />
            <p className="text-sm text-muted-foreground mt-2">
              Great job! Your GitHub contribution streak looks consistent
            </p>
            <p className="text-xs text-muted-foreground">
              Last checked: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Identified {missedDays.length} gaps in your GitHub streak</p>
                <p className="text-xs text-muted-foreground">
                  Last checked: {format(lastUpdated, 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
                  size="sm" 
                  className="gap-1 text-xs h-8"
                  onClick={() => fetchMissedDays(12)}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Refresh</span>
            </Button>
          </div>
            </div>
            
            <div className="space-y-2">
              {missedDays.slice(0, 3).map(day => (
                <div 
                  key={day.id} 
                  className="flex justify-between items-center p-2 rounded-md bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{day.date}</span>
                    <span className="text-xs text-muted-foreground">{day.dayOfWeek}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        day.priority === 'high' ? 'destructive' : 
                        day.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs h-5"
                    >
                      {day.daysAgo} {day.daysAgo === 1 ? 'day' : 'days'} ago
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-black/5"
                      disabled={isFixingAny}
                      onClick={() => {
                        // Add your fix function here
                      }}
                    >
                      {isFixingAny ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Fix'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              
              {missedDays.length > 3 && (
                <div className="text-center pt-1">
                  <Link to="/streak">
                    <Button variant="link" className="text-xs h-6 gap-1">
                      <span>View all {missedDays.length} missed days</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </Link>
            </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="manual-mode"
                checked={manualMode}
                onCheckedChange={setManualMode}
              />
              <Label htmlFor="manual-mode" className="text-sm">Manual Mode</Label>
            </div>
            
            {manualMode && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="glass-input text-sm h-9"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => {
                      // Add your addManualDate function here
                    }}
                  >
                    Add
                  </Button>
                </div>
                
                {manualDates.length > 0 && (
                  <div className="space-y-2">
                    {manualDates.map(date => (
                      <div 
                        key={date.id}
                        className="flex justify-between items-center p-2 rounded-md bg-black/10"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{date.formattedDate}</span>
                          <span className="text-xs text-muted-foreground">{date.dayOfWeek}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-black/5"
                            onClick={() => {
                              // Add your fixManualDate function here
                            }}
                          >
                            Fix
                          </Button>
                          
              <Button
                            size="sm"
                variant="ghost" 
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              // Add your removeManualDate function here
                            }}
              >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      className="w-full text-sm h-8 mt-2"
                      onClick={() => {
                        // Add your fixAllManualDates function here
                      }}
                    >
                      Fix All Manual Dates
              </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          )}
      </GlassCardContent>
    </GlassCard>
  );
};
