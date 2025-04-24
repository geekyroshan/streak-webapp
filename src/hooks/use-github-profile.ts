import { useState, useEffect } from 'react';
import { githubActivityService } from '@/lib/api';
import { GitHubProfile } from '@/types/activity';

export function useGitHubProfile() {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await githubActivityService.getUserProfile();
      if (data && data.profile) {
        setProfile(data.profile);
      } else {
        setError('Profile data is missing or invalid');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GitHub profile');
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { 
    profile, 
    isLoading, 
    error, 
    refetch: fetchProfile 
  };
} 