import { useState, useEffect, useCallback } from 'react';
import { streakService } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export interface CommitHistoryItem {
  _id: string;
  repository: string;
  repositoryUrl: string;
  filePath: string;
  commitMessage: string;
  dateTime: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  hashId?: string;
  timeAgo?: string;
}

export function useCommitHistory() {
  const [commitHistory, setCommitHistory] = useState<CommitHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a memoized fetch function to avoid recreating it on every render
  const fetchCommitHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const commits = await streakService.getCommitHistory();
      
      // Format timestamps to relative time
      const formattedCommits = commits.map((commit: CommitHistoryItem) => ({
        ...commit,
        timeAgo: formatDistanceToNow(new Date(commit.createdAt), { addSuffix: true })
      }));
      
      // Sort commits to show newest first
      const sortedCommits = formattedCommits.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Limit to the most recent 5 commits
      const recentCommits = sortedCommits.slice(0, 5);
      
      setCommitHistory(recentCommits);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch commit history');
      console.error('Error fetching commit history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCommitHistory();
  }, [fetchCommitHistory]);

  // Set up an interval to refresh the commit history every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCommitHistory();
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchCommitHistory]);

  const cancelCommit = async (commitId: string) => {
    try {
      await streakService.cancelPendingCommit(commitId);
      
      // First update local state
      setCommitHistory(prevHistory => 
        prevHistory.filter(commit => commit._id !== commitId)
      );
      
      // Then refetch after a short delay to get the updated list
      setTimeout(fetchCommitHistory, 1000);
      return true;
    } catch (err: any) {
      console.error('Error cancelling commit:', err);
      return false;
    }
  };

  const retryCommit = async (commitId: string) => {
    try {
      await streakService.retryFailedCommit(commitId);
      
      // Update the local state
      setCommitHistory(prevHistory => 
        prevHistory.map(commit => 
          commit._id === commitId
            ? { ...commit, status: 'pending', errorMessage: undefined }
            : commit
        )
      );
      
      // Refetch after a delay to get updated status
      setTimeout(fetchCommitHistory, 2000);
      return true;
    } catch (err: any) {
      console.error('Error retrying commit:', err);
      return false;
    }
  };

  return { 
    commitHistory, 
    isLoading, 
    error, 
    refetch: fetchCommitHistory,
    cancelCommit,
    retryCommit
  };
} 