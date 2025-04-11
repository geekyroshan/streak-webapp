
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitFork, Search, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      className={`p-4 border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer ${isSelected ? 'bg-secondary/50' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm">{name}</h3>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          size="sm"
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
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: languageColor }} />
          <span>{language}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5" />
          <span>{stars}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <GitFork className="w-3.5 h-3.5" />
          <span>{forks}</span>
        </div>
        
        <span className="text-muted-foreground ml-auto">Updated {updatedAt}</span>
      </div>
    </div>
  );
};

export const RepositoryBrowser = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  
  // Sample repository data for demonstration
  const repositories = [
    {
      name: 'personal-website',
      description: 'My personal website built with React and Next.js',
      stars: 12,
      forks: 4,
      language: 'TypeScript',
      languageColor: '#3178c6',
      updatedAt: '2 days ago'
    },
    {
      name: 'api-service',
      description: 'RESTful API service for data processing and analytics',
      stars: 34,
      forks: 11,
      language: 'JavaScript',
      languageColor: '#f1e05a',
      updatedAt: '1 week ago'
    },
    {
      name: 'machine-learning-experiments',
      description: 'Collection of machine learning experiments and tutorials',
      stars: 87,
      forks: 29,
      language: 'Python',
      languageColor: '#3572A5',
      updatedAt: '3 days ago'
    },
    {
      name: 'design-system',
      description: 'Reusable component library for web applications',
      stars: 53,
      forks: 17,
      language: 'TypeScript',
      languageColor: '#3178c6',
      updatedAt: '4 days ago'
    },
    {
      name: 'algorithms',
      description: 'Implementation of common algorithms and data structures',
      stars: 41,
      forks: 12,
      language: 'Java',
      languageColor: '#b07219',
      updatedAt: '2 weeks ago'
    },
    {
      name: 'mobile-app',
      description: 'Cross-platform mobile application using React Native',
      stars: 29,
      forks: 8,
      language: 'JavaScript',
      languageColor: '#f1e05a',
      updatedAt: '5 days ago'
    }
  ];
  
  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const toggleRepoSelection = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName) 
        ? prev.filter(name => name !== repoName)
        : [...prev, repoName]
    );
  };
  
  return (
    <Card className="h-[450px] flex flex-col">
      <CardHeader>
        <CardTitle>Your Repositories</CardTitle>
        <CardDescription>Select repositories to manage contributions</CardDescription>
        
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {selectedRepos.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            <div className="flex flex-wrap gap-1">
              {selectedRepos.map(repo => (
                <Badge key={repo} variant="secondary" className="text-xs">
                  {repo}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredRepositories.map((repo, index) => (
            <Repository
              key={index}
              {...repo}
              isSelected={selectedRepos.includes(repo.name)}
              onSelect={() => toggleRepoSelection(repo.name)}
            />
          ))}
          
          {filteredRepositories.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No repositories found matching '{searchQuery}'
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
