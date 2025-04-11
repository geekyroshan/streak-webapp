
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  GitFork, 
  Star, 
  BarChart2, 
  Clock, 
  ArrowUpDown,
  Plus,
  Check,
  GitCommit
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RepositoryCardProps {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  updatedAt: string;
  isSelected?: boolean;
  onToggleSelect: () => void;
  activityLevel: 'high' | 'medium' | 'low' | 'none';
  lastCommit: string;
}

const RepositoryCard = ({ 
  name, 
  description, 
  stars, 
  forks, 
  language, 
  languageColor, 
  updatedAt,
  isSelected,
  onToggleSelect,
  activityLevel,
  lastCommit
}: RepositoryCardProps) => {
  const activityColors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
    none: 'bg-gray-500'
  };
  
  return (
    <Card className={isSelected ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {description || 'No description provided'}
            </CardDescription>
          </div>
          
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelect}
            className="gap-1"
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4" />
                Selected
              </>
            ) : (
              'Select'
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: languageColor }} />
            <span>{language}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{stars}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <GitFork className="w-4 h-4" />
            <span>{forks}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {updatedAt}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Last commit: {lastCommit}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${activityColors[activityLevel]}`} />
            <span>{activityLevel === 'high' ? 'Active' : activityLevel === 'medium' ? 'Moderate' : activityLevel === 'low' ? 'Low activity' : 'Inactive'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RepositoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepos, setSelectedRepos] = useState<string[]>(['personal-website']);
  
  // Sample repository data for demonstration
  const repositories = [
    {
      name: 'personal-website',
      description: 'My personal website built with React and Next.js',
      stars: 12,
      forks: 4,
      language: 'TypeScript',
      languageColor: '#3178c6',
      updatedAt: '2 days ago',
      activityLevel: 'high' as const,
      lastCommit: 'Yesterday'
    },
    {
      name: 'api-service',
      description: 'RESTful API service for data processing and analytics',
      stars: 34,
      forks: 11,
      language: 'JavaScript',
      languageColor: '#f1e05a',
      updatedAt: '1 week ago',
      activityLevel: 'medium' as const,
      lastCommit: '3 days ago'
    },
    {
      name: 'machine-learning-experiments',
      description: 'Collection of machine learning experiments and tutorials',
      stars: 87,
      forks: 29,
      language: 'Python',
      languageColor: '#3572A5',
      updatedAt: '3 days ago',
      activityLevel: 'high' as const,
      lastCommit: 'Today'
    },
    {
      name: 'design-system',
      description: 'Reusable component library for web applications',
      stars: 53,
      forks: 17,
      language: 'TypeScript',
      languageColor: '#3178c6',
      updatedAt: '4 days ago',
      activityLevel: 'low' as const,
      lastCommit: '2 weeks ago'
    },
    {
      name: 'algorithms',
      description: 'Implementation of common algorithms and data structures',
      stars: 41,
      forks: 12,
      language: 'Java',
      languageColor: '#b07219',
      updatedAt: '2 weeks ago',
      activityLevel: 'low' as const,
      lastCommit: '1 month ago'
    },
    {
      name: 'mobile-app',
      description: 'Cross-platform mobile application using React Native',
      stars: 29,
      forks: 8,
      language: 'JavaScript',
      languageColor: '#f1e05a',
      updatedAt: '5 days ago',
      activityLevel: 'medium' as const,
      lastCommit: '1 week ago'
    },
    {
      name: 'blog-posts',
      description: 'Technical blog posts and articles on various programming topics',
      stars: 15,
      forks: 3,
      language: 'Markdown',
      languageColor: '#083fa1',
      updatedAt: '1 month ago',
      activityLevel: 'none' as const,
      lastCommit: '2 months ago'
    },
    {
      name: 'coding-challenges',
      description: 'Solutions to various coding challenges and competitions',
      stars: 8,
      forks: 2,
      language: 'Python',
      languageColor: '#3572A5',
      updatedAt: '3 weeks ago',
      activityLevel: 'low' as const,
      lastCommit: '3 weeks ago'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
          <p className="text-muted-foreground">Manage your GitHub repositories for streak tracking.</p>
        </div>
        
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Add Repository
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All repositories</DropdownMenuItem>
            <DropdownMenuItem>Sources</DropdownMenuItem>
            <DropdownMenuItem>Forks</DropdownMenuItem>
            <DropdownMenuItem>Archived</DropdownMenuItem>
            <DropdownMenuItem>Mirrors</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Last updated</DropdownMenuItem>
            <DropdownMenuItem>Name</DropdownMenuItem>
            <DropdownMenuItem>Stars</DropdownMenuItem>
            <DropdownMenuItem>Forks</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {selectedRepos.length > 0 && (
        <div className="flex items-center gap-2 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedRepos.length} {selectedRepos.length === 1 ? 'repository' : 'repositories'} selected:
          </span>
          <div className="flex flex-wrap gap-1">
            {selectedRepos.map(repo => (
              <Badge 
                key={repo} 
                variant="secondary" 
                className="text-xs px-2 py-0.5"
                onClick={() => toggleRepoSelection(repo)}
              >
                {repo}
                <span className="ml-1 cursor-pointer">×</span>
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="ml-auto text-xs h-7" onClick={() => setSelectedRepos([])}>
            Clear selection
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="grid">
        <div className="flex justify-end mb-4">
          <TabsList>
            <TabsTrigger value="grid" className="px-3">
              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
                <div className="bg-current rounded-sm w-1.5 h-1.5" />
              </div>
            </TabsTrigger>
            <TabsTrigger value="list" className="px-3">
              <div className="flex flex-col gap-1 justify-center w-4 h-4">
                <div className="bg-current rounded-sm w-4 h-0.5" />
                <div className="bg-current rounded-sm w-4 h-0.5" />
                <div className="bg-current rounded-sm w-4 h-0.5" />
              </div>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepositories.map((repo, index) => (
              <RepositoryCard
                key={index}
                {...repo}
                isSelected={selectedRepos.includes(repo.name)}
                onToggleSelect={() => toggleRepoSelection(repo.name)}
              />
            ))}
            
            {filteredRepositories.length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground border rounded-md">
                No repositories found matching '{searchQuery}'
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <div className="space-y-2">
            {filteredRepositories.map((repo, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex-1">
                  <div className="font-medium">{repo.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">{repo.description}</div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm hidden md:flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: repo.languageColor }} />
                    <span>{repo.language}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{repo.stars}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <GitFork className="w-4 h-4" />
                      <span>{repo.forks}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant={selectedRepos.includes(repo.name) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRepoSelection(repo.name)}
                  >
                    {selectedRepos.includes(repo.name) ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredRepositories.length === 0 && (
              <div className="p-8 text-center text-muted-foreground border rounded-md">
                No repositories found matching '{searchQuery}'
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Repository Statistics</CardTitle>
          <CardDescription>
            Activity metrics for your selected repositories
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Contribution Frequency</h3>
              <div className="h-[200px] flex items-center justify-center">
                <BarChart2 className="h-16 w-16 text-muted-foreground/50" />
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Activity Trends</h3>
              <div className="h-[200px] flex items-center justify-center">
                <BarChart2 className="h-16 w-16 text-muted-foreground/50" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepositoriesPage;
