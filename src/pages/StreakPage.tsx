import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  GitCommit, 
  Calendar,
  Clock,
  FileEdit,
  AlertTriangle,
  Check,
  MessageSquare,
  RotateCcw,
  Loader2,
  Globe,
  Lock
} from 'lucide-react';
import { useRepositories } from '@/hooks/use-repositories';
import { useToast } from '@/hooks/use-toast';
import { streakService } from '@/lib/api';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { FileSelector } from '@/components/ui/file-selector';
import { format, parseISO } from 'date-fns';
import { useCommitHistory, CommitHistoryItem } from '@/hooks/use-commit-history';

const StreakPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('Update documentation with new API endpoints');
  const [selectedFile, setSelectedFile] = useState('docs/api-reference.md');
  const [commitTime, setCommitTime] = useState('2:30 PM');
  const [isCreatingCommit, setIsCreatingCommit] = useState(false);
  
  const { repositories, isLoading: isLoadingRepos, error: repoError } = useRepositories();
  const { 
    commitHistory, 
    isLoading: isLoadingHistory, 
    error: historyError, 
    refetch: refetchHistory,
    cancelCommit,
    retryCommit
  } = useCommitHistory();
  const { toast } = useToast();
  
  const formattedDate = selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '';
  const daysSince = selectedDate ? Math.floor((new Date().getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  // Reset form function
  const handleReset = () => {
    setSelectedDate(new Date());
    setSelectedRepoId('');
    setCommitMessage('Update documentation with new API endpoints');
    setSelectedFile('docs/api-reference.md');
    setCommitTime('2:30 PM');
  };
  
  // Handle create commit with immediate refresh 
  const handleCreateCommit = async () => {
    if (!selectedRepoId || !commitMessage || !selectedFile || !selectedDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingCommit(true);
    
    try {
      const selectedRepo = repositories.find(repo => repo.id.toString() === selectedRepoId);
      
      if (!selectedRepo) {
        throw new Error('Selected repository not found');
      }
      
      // Format according to what the server expects in streak.controller.ts
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      // Convert time like "2:30 PM" to ISO datetime format
      let timeComponents = commitTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let hours = parseInt(timeComponents?.[1] || "12");
      const minutes = timeComponents?.[2] || "00";
      const period = timeComponents?.[3]?.toUpperCase() || "PM";
      
      // Adjust hours for PM
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      const dateTime = `${formattedDate}T${formattedTime}Z`;
      
      console.log('Formatted dateTime:', dateTime);
      
      await streakService.createBackdatedCommit({
        // Original fields for compatibility
        repositoryName: selectedRepo.name, 
        owner: selectedRepo.owner.login,
        date: formattedDate,
        time: commitTime,
        message: commitMessage,
        filePath: selectedFile,
        // Server-required fields
        repository: selectedRepo.name,
        repositoryUrl: selectedRepo.html_url,
        commitMessage: commitMessage,
        dateTime: dateTime,
        content: `// This file was updated via the Streak Manager\n\n// Original content preserved`
      });
      
      toast({
        title: "Success",
        description: "Commit created successfully",
      });
      
      // Reset form
      setCommitMessage('');
      setSelectedFile('');
      
      // Refresh commit history immediately and then again after a delay
      // to ensure we catch both immediate changes and status updates
      refetchHistory();
      setTimeout(() => {
        refetchHistory();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating commit:', error);
      toast({
        title: "Failed to create commit",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCommit(false);
    }
  };
  
  // Handle cancel commit
  const handleCancelCommit = async (commitId: string) => {
    try {
      // Optimistically update UI first for better UX
      toast({
        title: "Cancelling commit...",
        description: "Please wait while we cancel the commit",
      });
      
      const success = await cancelCommit(commitId);
      
      if (success) {
        toast({
          title: "Commit cancelled",
          description: "The commit has been removed from your activity list",
        });
        
        // Force refresh history after a short delay
        setTimeout(() => {
          refetchHistory();
        }, 500);
      } else {
        toast({
          title: "Failed to cancel commit",
          description: "There was an error cancelling the commit",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Cancel commit error:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Handle retry commit
  const handleRetryCommit = async (commitId: string) => {
    try {
      const success = await retryCommit(commitId);
      if (success) {
        toast({
          title: "Retry initiated",
          description: "The commit is being retried",
        });
      } else {
        toast({
          title: "Failed to retry commit",
          description: "There was an error retrying the commit",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Format dates safely
  const formatDateFromString = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Streak Manager</h1>
          <p className="text-muted-foreground">Fix gaps in your contribution timeline.</p>
        </div>
      </div>
      
      <Tabs defaultValue="fix-gaps">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fix-gaps">Fix Missed Days</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Commits</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fix-gaps" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Fix Missed Contribution</CardTitle>
                <CardDescription>
                  Create a legitimate commit for a day when local work wasn't pushed
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <div className="flex gap-4">
                    <div className="w-full">
                      <DatePicker date={selectedDate} setDate={setSelectedDate} />
                      {selectedDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(selectedDate, 'EEEE')} ({daysSince} days ago)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Repository</label>
                  <Select 
                    value={selectedRepoId} 
                    onValueChange={setSelectedRepoId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingRepos ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading repositories...</span>
                        </div>
                      ) : repoError ? (
                        <div className="text-red-500 p-2 text-sm">
                          {repoError}
                        </div>
                      ) : repositories.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No repositories found
                        </div>
                      ) : (
                        repositories.map(repo => (
                          <SelectItem key={repo.id} value={repo.id.toString()}>
                            <div className="flex items-center gap-2">
                              {repo.private ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Globe className="h-3 w-3" />
                              )}
                              {repo.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Message</label>
                  <Textarea 
                    placeholder="Enter commit message" 
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">File to Change</label>
                  </div>
                  <FileSelector 
                    file={selectedFile}
                    setFile={setSelectedFile}
                    repository={repositories.find(repo => repo.id.toString() === selectedRepoId)?.name}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Time</label>
                  <TimePicker time={commitTime} setTime={setCommitTime} />
                  <div className="text-xs text-muted-foreground mt-1">
                    Select a time that matches your typical activity pattern
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={handleReset}>Reset</Button>
                <Button 
                  className="gap-2" 
                  onClick={handleCreateCommit}
                  disabled={isCreatingCommit || !selectedRepoId}
                >
                  {isCreatingCommit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GitCommit className="h-4 w-4" />
                  )}
                  Create Commit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
                <CardDescription>
                  Check details before creating commit
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Repository</div>
                  <div className="text-sm font-medium">
                    {selectedRepoId ? 
                      repositories.find(repo => repo.id.toString() === selectedRepoId)?.name || 'Not selected' : 
                      'Not selected'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-sm font-medium">{formattedDate}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="text-sm font-medium">{commitTime}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Message</div>
                  <div className="text-sm font-medium">{commitMessage}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">File</div>
                  <div className="text-sm font-medium">{selectedFile}</div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  {selectedRepoId && commitMessage && selectedFile ? (
                    <div className="flex items-center gap-2 text-sm text-green-500 mb-2">
                      <Check className="h-4 w-4" />
                      Valid configuration
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-500 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Please complete all fields
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    This will create a legitimate commit that reflects work you did locally but didn't push.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activities</span>
                {isLoadingHistory && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Your recent streak management actions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {historyError ? (
                <div className="text-red-500 p-2">{historyError}</div>
              ) : commitHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activities found
                </div>
              ) : (
                <div className="space-y-4">
                  {commitHistory.slice(0, 5).map((commit) => (
                    <div key={commit._id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                      {commit.status === 'completed' ? (
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      ) : commit.status === 'pending' ? (
                        <div className="bg-amber-500/10 p-2 rounded-full">
                          <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="bg-red-500/10 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {commit.status === 'completed' ? 'Commit created successfully' :
                             commit.status === 'pending' ? 'Commit in progress' : 
                             'Commit failed'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {commit.timeAgo || format(new Date(commit.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          {commit.status === 'pending' ? 'Creating' : commit.status === 'completed' ? 'Created' : 'Failed to create'} commit for {formatDateFromString(commit.dateTime)} in repository <span className="font-medium">{commit.repository}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>{commit.commitMessage}</span>
                          </div>
                          
                          {commit.hashId && (
                            <div className="flex items-center gap-1">
                              <GitCommit className="h-3.5 w-3.5" />
                              <span>{commit.hashId.substring(0, 7)}</span>
                            </div>
                          )}
                        </div>
                        
                        {commit.status === 'failed' && commit.errorMessage && (
                          <div className="bg-red-500/10 text-red-500 text-xs p-2 rounded mt-2">
                            Error: {commit.errorMessage}
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-2">
                          {commit.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 gap-1"
                              onClick={() => handleCancelCommit(commit._id)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          )}
                          
                          {commit.status === 'failed' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7"
                              onClick={() => handleRetryCommit(commit._id)}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Future Commits</CardTitle>
              <CardDescription>
                Plan commits for days when you know you'll be away
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Commit scheduling calendar placeholder</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Create multiple commits across a date range
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Bulk operations form placeholder</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StreakPage;
