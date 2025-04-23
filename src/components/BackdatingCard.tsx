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

  // Add an effect to ensure selected repo is properly set on mount and when repositories load
  useEffect(() => {
    if (repositories && repositories.length > 0 && !selectedRepo) {
      console.log("Initializing repository selection on component mount or when repositories load");
      
      // Try to find a good repository for backdating
      const backdatingKeywords = ['streak', 'contribution', 'backup', 'github', 'activity'];
      
      // Find a repo that might be suitable for backdating
      const bestRepo = repositories.find((repo: any) => 
        backdatingKeywords.some(keyword => repo.name.toLowerCase().includes(keyword))
      );
      
      if (bestRepo) {
        console.log("Found best matching repository:", bestRepo.name);
        setSelectedRepo(bestRepo);
        forceUpdate();
      } else if (repositories.length > 0) {
        // Just use the first repo if no better match
        console.log("Using first available repository:", repositories[0].name);
        setSelectedRepo(repositories[0]);
        forceUpdate();
      }
    }
  }, [repositories, selectedRepo]);

  // Function to handle repository selection
  const handleRepoSelection = (repo: any) => {
    console.log("Selection clicked for repository:", repo.name);
    try {
      // Update the selected repository
      setSelectedRepo(repo);
      
      // Force context update
      forceUpdate();
      
      // Close dropdown
      const closeButton = document.querySelector('[data-radix-dropdown-menu-content-close]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
      
      // Update UI after a short delay to ensure state propagation
      setTimeout(() => {
        console.log("Repository should be selected now:", repo.name);
        setError(null);
      }, 100);
    } catch (error) {
      console.error("Error selecting repository:", error);
    }
  };

  // Function to fetch missed days (moved to separate function for reuse)
  const fetchMissedDays = async (lookbackMonths = 6) => {
    try {
      setLoading(true);
      
      // Calculate date for lookback period
      const lookbackDate = new Date();
      lookbackDate.setMonth(lookbackDate.getMonth() - lookbackMonths);
      const lookbackDateStr = lookbackDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`Fetching contributions since: ${lookbackDateStr} (${lookbackMonths} months ago)`);
      
      // Fetch contribution data with the specified lookback period
      // Add ignoreCurrentStreak=true to ensure we get gaps from before the current streak
      const url = `/contributions?since=${lookbackDateStr}&ignoreCurrentStreak=true&includeAllGaps=true`;
      console.log(`Using API URL: ${url}`);
      
      const response = await api.get(url);
      const data = response.data.data;
      
      const { analysis } = data;
      
      // Format gaps as missed days
      if (analysis && analysis.gaps) {
        console.log(`Found ${analysis.gaps.length} total gaps in contribution history`);
        
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
          console.log(`Displaying ${Math.min(formattedMissedDays.length, 10)} missed days out of ${formattedMissedDays.length} total gaps found`);
          // Update the global context with all missed days
          setMissedDays(formattedMissedDays);
        } else {
          // If no gaps found with current lookback, try looking back even further automatically
          if (lookbackMonths < 12) {
            console.log("No gaps found in recent history, looking back further automatically");
            // Recursively call with a longer lookback
            fetchMissedDays(12);
            return;
          } else if (lookbackMonths < 24 && analysis.gaps.length === 0) {
            console.log("No gaps found in last year, looking back even further");
            // Try with a 2-year lookback
            fetchMissedDays(24);
            return;
          } else {
            console.log("No gaps found even with extended lookback");
            setMissedDays([]);
          }
        }
      } else {
        console.warn("No gap analysis data returned from API");
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
    console.log('Initializing BackdatingCard with 12-month lookback');
    fetchMissedDays(12);
    
    // After initial load, try with a longer period if no gaps were found
    const checkForOlderGaps = setTimeout(() => {
      if (missedDays.length === 0 && !loading && !error) {
        console.log('No gaps found with initial load, trying 24-month lookback');
        fetchMissedDays(24);
      }
    }, 5000); // Wait 5 seconds after initial load
    
    return () => clearTimeout(checkForOlderGaps);
  }, []);

  // Function to fix a missed day
  const fixMissedDay = async (missedDay: any) => {
    if (!selectedRepo) {
      setError('No repository selected for backdating');
      return;
    }
    
    try {
      setIsFixingAny(true);
      setError(null);
      
      // Create a commit for this missed day
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
      
      // Instead of removing just this day, refetch all missed days
      // This will load older gaps as newer ones are fixed
      setMissedDays(missedDays.filter(day => day.id !== missedDay.id));
      
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
      
      setError(errorMessage);
      setIsFixingAny(false);
    }
  };

  // Function to fix all missed days
  const fixAllMissedDays = async () => {
    if (!selectedRepo || missedDays.length === 0) return;
    
    setIsFixingAny(true);
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
      
      // After processing all days, update the missed days
      // Remove all the successfully fixed days from the list
      const successfullyFixedIds = missedDays
        .filter(day => !failedDays.some(failedDay => failedDay.id === day.id))
        .map(day => day.id);
      
      setMissedDays(missedDays.filter(day => !successfullyFixedIds.includes(day.id)));
      
      // Show error if any days failed
      if (failedDays.length > 0) {
        if (successCount > 0) {
          setError(`Fixed ${successCount} days, but failed to fix ${failedDays.length} days. Check older missed days.`);
        } else {
          setError('Failed to fix any missed days. Please check your repository settings or try again later.');
        }
      }
      
      setIsFixingAny(false);
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
      setIsFixingAny(false);
    }
  };

  // Debug function to directly test the API by going back x years
  const debugFetchContributions = async (yearsBack = 3) => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date for lookback period
      const lookbackDate = new Date();
      lookbackDate.setFullYear(lookbackDate.getFullYear() - yearsBack);
      const lookbackDateStr = lookbackDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log(`DEBUG: Fetching contributions since: ${lookbackDateStr} (${yearsBack} years ago)`);
      
      // Get the API base URL from the config
      const API_URL = api.defaults.baseURL;
      
      // Explicitly pass the lookback date to the API with full URL and ignoreCurrentStreak
      const url = `${API_URL}/contributions?since=${lookbackDateStr}&ignoreCurrentStreak=true&includeAllGaps=true`;
      console.log(`DEBUG: Calling API directly with URL: ${url}`);
      
      // Make the API call directly
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log(`DEBUG: API response:`, response.data);
      
      // Extract gaps from the response
      const { data } = response.data;
      if (data && data.analysis && data.analysis.gaps) {
        console.log(`DEBUG: Found ${data.analysis.gaps.length} gaps in response`);
        console.log(`DEBUG: First 5 gaps:`, data.analysis.gaps.slice(0, 5));
        console.log(`DEBUG: Current streak info:`, data.analysis.currentStreak);
        
        // If we found gaps, use them to update the UI
        if (data.analysis.gaps.length > 0) {
          await fetchMissedDays(yearsBack * 12); // Convert years to months
        } else {
          setError(`No gaps found going back ${yearsBack} years. Your streak may be too long for gaps to be detected.`);
        }
      } else {
        console.error(`DEBUG: No gaps data found in API response:`, data);
        setError('The API response did not include gap analysis data');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('DEBUG: Error testing API:', error);
      setError(`API Error: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  // Add a date manually
  const addManualDate = () => {
    if (!manualDate) return;
    
    // Try to parse the date to validate it
    let parsedDate;
    
    try {
      // Try as ISO format (YYYY-MM-DD)
      parsedDate = parseISO(manualDate);
      
      // If that fails, try as MM/DD/YYYY
      if (!isValid(parsedDate)) {
        parsedDate = parse(manualDate, 'MM/dd/yyyy', new Date());
      }
      
      // If that fails, try as natural language date
      if (!isValid(parsedDate)) {
        const today = new Date();
        
        if (manualDate.toLowerCase().includes('yesterday')) {
          parsedDate = subDays(today, 1);
        } else if (manualDate.toLowerCase().includes('days ago')) {
          const daysAgoMatch = manualDate.match(/(\d+)\s+days\s+ago/i);
          if (daysAgoMatch && daysAgoMatch[1]) {
            parsedDate = subDays(today, parseInt(daysAgoMatch[1]));
          }
        }
      }
    } catch (e) {
      parsedDate = null;
    }
    
    if (!isValid(parsedDate)) {
      setError('Invalid date format. Please use YYYY-MM-DD or MM/DD/YYYY format.');
      return;
    }
    
    // Format the date consistently
    const formattedDate = format(parsedDate, 'yyyy-MM-dd');
    const displayDate = format(parsedDate, 'MMMM d, yyyy');
    const dayOfWeek = format(parsedDate, 'EEEE');
    const daysAgo = Math.ceil(Math.abs(new Date().getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if this date is already in the list
    if (manualDates.some(d => d.id === formattedDate)) {
      setError('This date is already in your list.');
      return;
    }
    
    // Add to the list
    const newDate = {
      id: formattedDate,
      date: displayDate,
      dayOfWeek: dayOfWeek,
      daysAgo: daysAgo,
      priority: daysAgo <= 7 ? 'high' : daysAgo <= 30 ? 'medium' : 'low',
      isWeekend: [0, 6].includes(parsedDate.getDay())
    };
    
    setManualDates([...manualDates, newDate]);
    setManualDate(''); // Clear the input
    setError(null); // Clear any errors
  };
  
  // Remove a manual date
  const removeManualDate = (id: string) => {
    setManualDates(manualDates.filter(date => date.id !== id));
  };
  
  // Toggle between manual and automatic mode
  const toggleMode = () => {
    setManualMode(!manualMode);
    setError(null);
  };
  
  // Fix a manual date
  const fixManualDate = async (date: any) => {
    await fixMissedDay(date);
    removeManualDate(date.id);
  };
  
  // Fix all manual dates
  const fixAllManualDates = async () => {
    if (manualDates.length === 0) return;
    
    setIsFixingAny(true);
    setError(null);
    
    let successCount = 0;
    let failedDates = [];
    
    for (const date of manualDates) {
      try {
        await streakService.createBackdatedCommit({
          repository: selectedRepo.name,
          repositoryUrl: selectedRepo.html_url,
          filePath: `streak-records/${date.id}/README.md`,
          commitMessage: `Update streak record for ${date.date}`,
          dateTime: date.id + 'T12:00:00Z',
          content: `# Streak Record\n\nDate: ${date.date}\nDay: ${date.dayOfWeek}\n\nKeeping the streak alive! This is an automated backdated commit to maintain GitHub contribution streak.`
        });
        
        successCount++;
        
        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fix date ${date.id}:`, error);
        failedDates.push(date);
      }
    }
    
    // Update the manual dates list
    setManualDates(failedDates);
    
    if (failedDates.length > 0) {
      if (successCount > 0) {
        setError(`Fixed ${successCount} days, but failed to fix ${failedDates.length} days.`);
      } else {
        setError('Failed to fix any days. Please check your repository settings.');
      }
    }
    
    setIsFixingAny(false);
  };

  // Add this useEffect to monitor repository selection
  useEffect(() => {
    console.log("BackdatingCard: selectedRepo changed:", selectedRepo?.name || "none");
  }, [selectedRepo]);

  return (
    <GlassCard variant="dark" className="border border-primary/20 shadow-lg relative overflow-hidden backdrop-blur-glass">
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      
      <GlassCardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
              <GitCommit className="h-5 w-5 text-primary" />
              GitHub Streak Backdating
            </h3>
            <p className="text-sm text-white/70">
              Fix gaps in your contribution history with legitimate commits
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/10 backdrop-blur-sm text-white border-white/20">Core Feature</Badge>
          </div>
        </div>
        <SparkleGroup className="absolute top-0 right-0 h-12 overflow-hidden" count={2} />
      </GlassCardHeader>
      
      <GlassCardContent className="relative z-10">
        {/* Repository selector always visible at the top when repositories are available */}
        {!loading && repositories && repositories.length > 0 && (
          <div className={`mb-4 ${!selectedRepo ? "bg-amber-500/20 border-amber-500/30" : "bg-primary/5 border-primary/10"} p-4 rounded-md border`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  {selectedRepo ? "Repository Selected" : "Repository Required"}
                </h4>
                <p className="text-xs text-white/80">
                  {selectedRepo 
                    ? `Using ${selectedRepo.name} for backdating contributions` 
                    : "Please select a repository to use for backdating your contributions"}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-sm border-white/20 text-white hover:bg-white/10">
                    {selectedRepo ? "Change Repository" : "Select Repository"} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                  {repositories.map((repo: any) => (
                    <DropdownMenuItem 
                      key={repo.id}
                      onSelect={() => {
                        console.log("Repository selected via dropdown:", repo.name);
                        // Set with a delay to ensure the UI updates
                        setTimeout(() => {
                          setSelectedRepo(repo);
                          forceUpdate();
                        }, 10);
                      }}
                      className={`cursor-pointer ${selectedRepo?.id === repo.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                    >
                      <span className={selectedRepo?.id === repo.id ? "font-bold" : ""}>
                        {repo.name}
                        {selectedRepo?.id === repo.id && " ✓"}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-white/80">Analyzing contribution history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <p className="text-red-400 mb-2">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="mt-2 border-white/20 text-white hover:bg-white/10"
            >
              Retry
            </Button>
          </div>
        ) : missedDays.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">
                We've detected <span className="font-semibold text-primary">{missedDays.length} missed {missedDays.length === 1 ? 'day' : 'days'}</span> in your recent GitHub activity:
              </h4>
              {missedDays.map((day) => (
                <div 
                  key={day.id} 
                  className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-md cursor-pointer hover:bg-white/10 transition-colors border border-white/10"
                  onClick={() => selectedRepo ? fixMissedDay(day) : null}
                >
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-white">
                      {day.date}
                      {day.isWeekend && (
                        <span className="ml-2 text-xs bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded">Weekend</span>
                      )}
                    </div>
                    <div className="text-xs text-white/60">{day.dayOfWeek} ({day.daysAgo} {day.daysAgo === 1 ? 'day' : 'days'} ago)</div>
                  </div>
                  <Badge 
                    className={`ml-auto backdrop-blur-sm text-white ${
                      day.priority === 'high' 
                        ? 'bg-red-600/80 hover:bg-red-600/90' 
                        : day.priority === 'medium'
                          ? 'bg-yellow-600/80 hover:bg-yellow-600/90'
                          : 'bg-blue-600/80 hover:bg-blue-600/90'
                    }`}
                    variant={day.priority === 'high' ? 'default' : 'secondary'}
                  >
                    {day.priority === 'high' ? 'High Priority' : day.priority === 'medium' ? 'Medium Priority' : 'Low Priority'}
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
            <h3 className="text-lg font-medium mb-2 text-white">Checking for older gaps in your history...</h3>
            <p className="text-sm text-white/70 mb-4">
              No missed days detected in your recent contribution history.
              The system is analyzing older data to find gaps from before your current 44-day streak.
            </p>
          </div>
        )}
      </GlassCardContent>
      
      <GlassCardFooter className="relative z-10">
        <div className="flex w-full justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-white/60">
              <Clock className="h-4 w-4 mr-1" />
              Last updated {formatDistanceToNow(lastUpdated)} ago
            </div>
            
            {!loading && (
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => debugFetchContributions(5)}
                className="text-white/70 hover:text-white h-8 px-2"
                disabled={loading}
              >
                <Loader2 className={`h-3.5 w-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Deep Scan
              </Button>
            )}
          </div>
          
          {missedDays.length > 0 && (
            <Button 
              className="glass-button gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md" 
              disabled={isFixingAny || !selectedRepo} 
              onClick={fixAllMissedDays}
            >
              {isFixingAny ? (
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
