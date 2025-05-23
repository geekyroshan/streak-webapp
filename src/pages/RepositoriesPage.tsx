import React, { useState, useEffect } from 'react';
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
  GitCommit,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { repoService } from '@/lib/api';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import RepositoryStats from '@/components/RepositoryStats';

// Sort types
type SortOption = 'updated' | 'name' | 'stars' | 'forks';
type FilterOption = 'all' | 'sources' | 'forks' | 'archived' | 'mirrors';

interface Repository {
  id: number;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor: string;
  updatedAt: string;
  activityLevel: 'high' | 'medium' | 'low' | 'none';
  lastCommit: string;
  htmlUrl: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  isFork?: boolean;
  isArchived?: boolean;
  isMirror?: boolean;
}

interface RepositoryCardProps extends Repository {
  isSelected?: boolean;
  onToggleSelect: () => void;
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
  Markdown: '#083fa1'
};

// Activity level determination function
const determineActivityLevel = (updatedAt: string): 'high' | 'medium' | 'low' | 'none' => {
  const lastUpdate = new Date(updatedAt);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 7) return 'high';
  if (diffInDays < 30) return 'medium';
  if (diffInDays < 90) return 'low';
  return 'none';
};

// Format the last commit date to a human-readable string
const formatLastCommit = (date: string): string => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
};

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
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        const data = await repoService.getUserRepositories();
        
        // Transform API data to our Repository format
        const formattedRepos: Repository[] = data.map((repo: any) => {
          const activityLevel = determineActivityLevel(repo.updated_at);
          return {
            id: repo.id,
            name: repo.name,
            description: repo.description || '',
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            language: repo.language || '',
            languageColor: languageColors[repo.language] || '#ccc',
            updatedAt: format(new Date(repo.updated_at), 'MMM d, yyyy'),
            activityLevel,
            lastCommit: formatLastCommit(repo.pushed_at || repo.updated_at),
            htmlUrl: repo.html_url,
            isFork: repo.fork || false,
            isArchived: repo.archived || false,
            isMirror: repo.mirror_url ? true : false,
            owner: {
              login: repo.owner?.login || '',
              avatarUrl: repo.owner?.avatar_url || ''
            }
          };
        });
        
        setRepositories(formattedRepos);
        
        // Select the first repository if none are selected
        if (!selectedRepo && formattedRepos.length > 0) {
          setSelectedRepo(formattedRepos[0].name);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch repositories:', err);
        setError(err.message || 'Failed to load repositories');
        setLoading(false);
      }
    };
    
    fetchRepositories();
  }, []);

  // Filter repos based on search query and filter selection
  const filteredRepositories = repositories
    .filter(repo => {
      // Apply filter
      if (filterBy === 'all') return true;
      if (filterBy === 'sources') return !repo.isFork;
      if (filterBy === 'forks') return repo.isFork;
      if (filterBy === 'archived') return repo.isArchived;
      if (filterBy === 'mirrors') return repo.isMirror;
      return true;
    })
    .filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Sort repositories
  const sortedRepositories = [...filteredRepositories].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'stars') {
      return b.stars - a.stars;
    } else if (sortBy === 'forks') {
      return b.forks - a.forks;
    } else {
      // Sort by updated date by default
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
  
  // Toggle repository selection to only select one at a time
  const handleRepoSelection = (repoName: string) => {
    setSelectedRepo(repoName);
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
              {filterBy === 'all' ? 'All Repositories' : 
               filterBy === 'sources' ? 'Sources' : 
               filterBy === 'forks' ? 'Forks' : 
               filterBy === 'archived' ? 'Archived' : 'Mirrors'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterBy('all')}>
              All repositories
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('sources')}>
              Sources
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('forks')}>
              Forks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('archived')}>
              Archived
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterBy('mirrors')}>
              Mirrors
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === 'updated' ? 'Recently updated' : 
               sortBy === 'name' ? 'Name' : 
               sortBy === 'stars' ? 'Stars' : 'Forks'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortBy('updated')}>
              Recently updated
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('name')}>
              Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('stars')}>
              Stars
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('forks')}>
              Forks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
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
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading repositories...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRepositories.map((repo) => (
              <RepositoryCard
                    key={repo.id}
                {...repo}
                    isSelected={selectedRepo === repo.name}
                    onToggleSelect={() => handleRepoSelection(repo.name)}
              />
            ))}
            
                {sortedRepositories.length === 0 && !loading && (
              <div className="col-span-full p-8 text-center text-muted-foreground border rounded-md">
                No repositories found matching '{searchQuery}'
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="mt-0">
          <div className="space-y-2">
                {sortedRepositories.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-4 border rounded-md">
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
                        variant={selectedRepo === repo.name ? "default" : "outline"}
                    size="sm"
                        onClick={() => handleRepoSelection(repo.name)}
                  >
                        {selectedRepo === repo.name ? (
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
            
                {sortedRepositories.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground border rounded-md">
                No repositories found matching '{searchQuery}'
              </div>
            )}
          </div>
        </TabsContent>
          </>
        )}
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Repository Statistics</CardTitle>
          <CardDescription>
            Activity metrics for {selectedRepo ? `"${selectedRepo}"` : "your selected repository"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <RepositoryStats repositoryName={selectedRepo} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RepositoriesPage;
