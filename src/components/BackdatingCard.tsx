import React, { useEffect, useState } from 'react';
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardFooter } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GitCommit, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { SparkleGroup } from '@/components/ui/sparkle';
import { contributionService, streakService, repoService } from '@/lib/api';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

export const BackdatingCard = () => {
  const [loading, setLoading] = useState(true);
  const [missedDays, setMissedDays] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isFixing, setIsFixing] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch missed days from the API
  useEffect(() => {
    const fetchMissedDays = async () => {
      try {
        setLoading(true);
        const data = await contributionService.getUserContributions();
        const { analysis } = data;
        
        // Format gaps as missed days
        if (analysis && analysis.gaps) {
          const formattedMissedDays = analysis.gaps.map((dateStr: string) => {
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
        setError('Failed to analyze your contribution history');
        setLoading(false);
      }
    };
    
    fetchMissedDays();
  }, []);

  // Function to fix a missed day
  const fixMissedDay = async (missedDay: any) => {
    if (!selectedRepo) {
      setError('No repository selected for backdating');
      return;
    }
    
    try {
      setIsFixing(true);
      setError(null);
      
      // Create a commit for this missed day
      const repoFullName = selectedRepo.full_name;
      
      console.log("Starting backdated commit with repository:", selectedRepo.name);
      console.log("Repository URL:", selectedRepo.html_url);
      
      await streakService.createBackdatedCommit({
        repository: selectedRepo.name,
        repositoryUrl: selectedRepo.html_url,
        filePath: `streak-records/${missedDay.id}/README.md`,
        commitMessage: `Update streak record for ${missedDay.date}`,
        dateTime: missedDay.id + 'T12:00:00Z', // Set to noon on the missed day
        content: `# Streak Record\n\nDate: ${missedDay.date}\nDay: ${missedDay.dayOfWeek}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
      });
      
      // Remove the fixed day from the list
      setMissedDays(missedDays.filter(day => day.id !== missedDay.id));
      
      setIsFixing(false);
    } catch (error) {
      console.error('Failed to fix missed day:', error);
      
      // Extract more specific error message if available
      let errorMessage = 'Failed to create backdated commit. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = `Server error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
      setIsFixing(false);
    }
  };

  // Function to fix all missed days
  const fixAllMissedDays = async () => {
    if (!selectedRepo || missedDays.length === 0) return;
    
    setIsFixing(true);
    setError(null);
    
    let successCount = 0;
    let failedDays = [];
    
    try {
      // Process each missed day
      for (const day of missedDays) {
        try {
          console.log(`Processing day: ${day.id}`);
          
          await streakService.createBackdatedCommit({
            repository: selectedRepo.name,
            repositoryUrl: selectedRepo.html_url,
            filePath: `streak-records/${day.id}/README.md`,
            commitMessage: `Update streak record for ${day.date}`,
            dateTime: day.id + 'T12:00:00Z',
            content: `# Streak Record\n\nDate: ${day.date}\nDay: ${day.dayOfWeek}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
          });
          
          successCount++;
          
          // Short delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (dayError) {
          console.error(`Failed to process day ${day.id}:`, dayError);
          failedDays.push(day);
        }
      }
      
      // Update the UI based on results
      if (failedDays.length === 0) {
        // All days fixed successfully
        setMissedDays([]);
      } else {
        // Some days failed
        setMissedDays(failedDays);
        if (successCount > 0) {
          setError(`Fixed ${successCount} days, but failed to fix ${failedDays.length} days. Try again for remaining days.`);
        } else {
          setError('Failed to fix any missed days. Please check your repository settings or try again later.');
        }
      }
      
      setIsFixing(false);
    } catch (error) {
      console.error('Failed to fix all missed days:', error);
      
      // Extract more specific error message if available
      let errorMessage = 'Failed to create backdated commits. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = `Server error: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setError(errorMessage);
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
        ) : error ? (
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : missedDays.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                We've detected <span className="font-semibold text-primary">{missedDays.length} missed {missedDays.length === 1 ? 'day' : 'days'}</span> in your recent GitHub activity.
              </p>
              
              {selectedRepo && (
                <div className="flex items-center">
                  <Badge variant="outline" className="text-xs">
                    Using: {selectedRepo.name}
                  </Badge>
                </div>
              )}
            </div>
            
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
          </div>
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
      </GlassCardContent>
      
      <GlassCardFooter className="relative z-10">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            Last updated {formatDistanceToNow(lastUpdated)} ago
          </div>
          {missedDays.length > 0 && (
            <Button 
              className="glass-button gap-2" 
              disabled={isFixing || !selectedRepo} 
              onClick={fixAllMissedDays}
            >
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <GitCommit className="h-4 w-4" />
                  Fix All Missed Days
                </>
              )}
            </Button>
          )}
        </div>
      </GlassCardFooter>
    </GlassCard>
  );
};
