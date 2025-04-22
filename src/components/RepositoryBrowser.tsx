import React, { useState } from 'react';
import { GlassCard, GlassCardHeader, GlassCardContent } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitFork, Search, Star, Loader2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { repoService } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface RepositoryProps {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  updatedAt: string;
  isSelected?: boolean;
  onSelect: () => void;
}

// Language color map
const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Ruby: '#701516',
  Swift: '#ffac45',
  Kotlin: '#F18E33',
  Dart: '#00B4AB',
  'C#': '#178600',
  C: '#555555',
  'C++': '#f34b7d',
  Shell: '#89e051',
};

const Repository = ({ 
  name, 
  description, 
  stars, 
  forks, 
  language, 
  languageColor, 
  updatedAt, 
  isSelected,
  onSelect 
}: RepositoryProps) => {
  return (
    <div 
      className={`p-4 border-b border-glass/10 hover:bg-white/5 transition-colors cursor-pointer backdrop-blur-sm ${isSelected ? 'bg-white/10' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm">{name}</h3>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          size="sm"
          className={isSelected ? "glass-button" : "bg-transparent"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {description || 'No description provided'}
      </p>
      
      <div className="flex items-center gap-4 text-xs">
        {language && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: languageColor }} />
            <span>{language}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          <span>{stars}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <GitFork className="w-3.5 h-3.5" />
          <span>{forks}</span>
        </div>
        
        <span className="text-muted-foreground ml-auto">{updatedAt}</span>
      </div>
    </div>
  );
};

export const RepositoryBrowser = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  
  // Fetch repositories from API
  const { data: repositories, isLoading, error, isError } = useQuery({
    queryKey: ['repositories'],
    queryFn: repoService.getUserRepositories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry failed requests twice
  });
  
  // Format API repositories data
  const formattedRepos = repositories?.map(repo => ({
    name: repo.name,
    description: repo.description || '',
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    language: repo.language || '',
    languageColor: languageColors[repo.language] || '#ccc',
    updatedAt: repo.updated_at ? format(parseISO(repo.updated_at), 'MMM d, yyyy') : 'Unknown date'
  })) || [];
  
  // Filter repositories based on search query
  const filteredRepositories = formattedRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Toggle repository selection
  const toggleRepoSelection = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName) 
        ? prev.filter(name => name !== repoName)
        : [...prev, repoName]
    );
  };
  
  return (
    <GlassCard className="h-[450px] flex flex-col">
      <GlassCardHeader>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Your Repositories</h2>
          <p className="text-sm text-muted-foreground">Select repositories to manage contributions</p>
        </div>
        
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9 glass-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading || isError}
          />
        </div>
        
        {selectedRepos.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            <div className="flex flex-wrap gap-1">
              {selectedRepos.map(repo => (
                <Badge key={repo} variant="secondary" className="text-xs bg-primary/20 hover:bg-primary/30">
                  {repo}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </GlassCardHeader>
      
      <GlassCardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">Loading repositories...</span>
            </div>
          ) : isError ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-red-500 font-medium">Failed to load repositories</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please check your GitHub connection or try again later
              </p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchQuery 
                ? `No repositories found matching '${searchQuery}'`
                : 'No repositories found'}
            </div>
          ) : (
            filteredRepositories.map((repo, index) => (
              <Repository
                key={index}
                {...repo}
                isSelected={selectedRepos.includes(repo.name)}
                onSelect={() => toggleRepoSelection(repo.name)}
              />
            ))
          )}
        </ScrollArea>
      </GlassCardContent>
    </GlassCard>
  );
};
