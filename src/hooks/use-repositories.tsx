import { useState, useEffect } from 'react';
import { repoService } from '@/lib/api';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  updated_at: string;
}

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await repoService.getUserRepositories();
      setRepositories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repositories');
      console.error('Error fetching repositories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  return { repositories, isLoading, error, refetch: fetchRepositories };
} 