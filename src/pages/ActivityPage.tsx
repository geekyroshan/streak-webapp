import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitCommit, 
  GitPullRequest, 
  GitMerge, 
  FileCode, 
  MessageSquare, 
  Star, 
  Github,
  Download,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { githubActivityService } from '@/lib/api';
import { ActivityType, ActivityItem, GitHubProfile, ContributionStats, Repository } from '@/types/activity';
import { formatDistanceToNow, subDays } from 'date-fns';
import ActivityCalendar from '@/components/ActivityCalendar';

// Mock data for when API fails
const generateMockActivities = (count: number, activityType?: ActivityType, repo?: string): ActivityItem[] => {
  const types: ActivityType[] = ['commit', 'pr', 'issue', 'review', 'star'];
  const repos = ['api-service', 'web-client', 'design-system', 'streak-app', 'mobile-app'];
  const branches = ['main', 'feature/auth', 'fix/navbar', 'develop', 'hotfix/login'];
  
  return Array.from({ length: count }).map((_, index) => {
    // Generate a random date between now and 30 days ago
    const date = subDays(new Date(), Math.floor(Math.random() * 30));
    const type = activityType || types[Math.floor(Math.random() * types.length)];
    const repository = repo || repos[Math.floor(Math.random() * repos.length)];
    
    let title: string;
    let branch: string | undefined;
    
    switch (type) {
      case 'commit':
        title = `${['Update', 'Fix', 'Add', 'Refactor', 'Improve'][Math.floor(Math.random() * 5)]} ${['component', 'feature', 'bug', 'performance', 'docs'][Math.floor(Math.random() * 5)]}`;
        branch = branches[Math.floor(Math.random() * branches.length)];
        break;
      case 'pr':
        title = `${['Add', 'Implement', 'Update', 'Enhance'][Math.floor(Math.random() * 4)]} ${['feature', 'component', 'page', 'API', 'integration'][Math.floor(Math.random() * 5)]}`;
        break;
      case 'issue':
        title = `${['Bug', 'Feature', 'Enhancement', 'Task'][Math.floor(Math.random() * 4)]}: ${['Add', 'Fix', 'Update', 'Implement'][Math.floor(Math.random() * 4)]} ${['functionality', 'component', 'service', 'layout', 'style'][Math.floor(Math.random() * 5)]}`;
        break;
      case 'review':
        title = `Code review: ${['Implement', 'Update', 'Fix', 'Add'][Math.floor(Math.random() * 4)]} ${['auth', 'dashboard', 'profile', 'settings', 'notifications'][Math.floor(Math.random() * 5)]}`;
        break;
      case 'star':
        title = `Starred repository ${repository}`;
        break;
      default:
        title = 'Unknown activity';
    }
    
    return {
      id: `mock-${index}-${Date.now()}`,
      type,
      title,
      repo: repository,
      repoFullName: `user/${repository}`,
      time: formatDistanceToNow(date, { addSuffix: true }),
      timestamp: date.toISOString(),
      branch,
      url: type === 'star' ? `https://github.com/user/${repository}` : undefined
    };
  });
};

const generateMockRepositories = (): Repository[] => {
  return [
    {
      id: 1,
      name: 'api-service',
      fullName: 'user/api-service',
      private: false,
      description: 'RESTful API service for the application',
      url: 'https://github.com/user/api-service',
      updatedAt: '2023-01-10T12:00:00Z'
    },
    {
      id: 2,
      name: 'web-client',
      fullName: 'user/web-client',
      private: false,
      description: 'Frontend web client built with React',
      url: 'https://github.com/user/web-client',
      updatedAt: '2023-01-15T09:30:00Z'
    },
    {
      id: 3,
      name: 'design-system',
      fullName: 'user/design-system',
      private: false,
      description: 'UI component library and design system',
      url: 'https://github.com/user/design-system',
      updatedAt: '2023-01-05T14:20:00Z'
    },
    {
      id: 4,
      name: 'streak-app',
      fullName: 'user/streak-app',
      private: true,
      description: 'GitHub streak contribution application',
      url: 'https://github.com/user/streak-app',
      updatedAt: '2023-01-20T16:45:00Z'
    },
    {
      id: 5,
      name: 'mobile-app',
      fullName: 'user/mobile-app',
      private: false,
      description: 'Mobile application built with React Native',
      url: 'https://github.com/user/mobile-app',
      updatedAt: '2023-01-08T11:15:00Z'
    }
  ];
};

const generateMockProfile = (): GitHubProfile => {
  return {
    login: 'johndoe',
    name: 'John Doe',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1234567',
    location: 'San Francisco, CA',
    publicRepos: 34,
    followers: 128,
    contributions: 982,
    starsReceived: 86,
    profileUrl: 'https://github.com/johndoe'
  };
};

const generateMockStats = (): ContributionStats => {
  return {
    commits: 124,
    pullRequests: 23,
    issues: 15,
    reviews: 38,
    starsGiven: 57,
    totalContributions: 257
  };
};

interface ActivityProps {
  activity: ActivityItem;
}

const Activity = ({ activity }: ActivityProps) => {
  const getIcon = (type: ActivityType) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="h-5 w-5 text-primary" />;
      case 'pr':
        return <GitPullRequest className="h-5 w-5 text-purple-500" />;
      case 'review':
        return <GitMerge className="h-5 w-5 text-blue-500" />;
      case 'issue':
        return <MessageSquare className="h-5 w-5 text-amber-500" />;
      case 'star':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileCode className="h-5 w-5 text-gray-500" />;
    }
  };

  const icon = getIcon(activity.type);
  
  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      <div className="bg-secondary/70 p-2 rounded-full">
        {icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="font-medium">
            {activity.url ? (
              <a href={activity.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                {activity.title}
              </a>
            ) : (
              activity.title
            )}
          </div>
          <div className="text-sm text-muted-foreground">{activity.time}</div>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className="text-muted-foreground">{activity.repo}</span>
          {activity.branch && (
            <>
              <span className="text-muted-foreground">•</span>
              <span>{activity.branch}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivityPage = () => {
  // State management
  const [activityType, setActivityType] = useState<ActivityType | 'all'>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  
  // Add calendar dialog state
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  
  // Load activities, repositories, profile and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Reset activities when changing filters
        if (page === 1) {
          setActivities([]);
        }
        
        // Fetch activities
        const activityTypeParam = activityType === 'all' ? undefined : activityType;
        const repoParam = selectedRepo === 'all' ? undefined : selectedRepo;
        
        let activitiesData;
        try {
          activitiesData = await githubActivityService.getUserActivities(20, page, activityTypeParam, repoParam);
        } catch (apiError) {
          // Use mock data when API fails
          
          // Generate mock activities based on filters
          const mockActivities = generateMockActivities(
            20, 
            activityType === 'all' ? undefined : activityType as ActivityType,
            selectedRepo === 'all' ? undefined : selectedRepo
          );
          
          activitiesData = {
            activities: mockActivities,
            hasMore: page < 3, // Mock pagination for 3 pages
            totalCount: 45 // Mock total count
          };
        }
        
        // Format activities data
        const formattedActivities = activitiesData.activities.map((activity: any) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          repo: activity.repo,
          repoFullName: activity.repoFullName,
          time: activity.time || formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }),
          timestamp: activity.timestamp,
          branch: activity.branch,
          url: activity.url
        }));
        
        // Append new activities if paginating, otherwise replace
        setActivities(prev => page === 1 ? formattedActivities : [...prev, ...formattedActivities]);
        setHasMore(activitiesData.hasMore || false);
        setTotalContributions(activitiesData.totalCount || 0);
        
        // Only fetch these on initial load
        if (page === 1) {
          // Fetch repositories for filter dropdown (or use mock data on error)
          try {
            const repositoriesData = await githubActivityService.getUserRepositories();
            setRepositories(repositoriesData.repositories || []);
          } catch (repoError) {
            console.error('Error fetching repositories:', repoError);
            setRepositories(generateMockRepositories());
          }
          
          // Fetch user profile (or use mock data on error)
          try {
            const profileData = await githubActivityService.getUserProfile();
            setProfile(profileData.profile || null);
          } catch (profileError) {
            console.error('Error fetching profile:', profileError);
            setProfile(generateMockProfile());
          }
          
          // Fetch contribution stats (or use mock data on error)
          try {
            const statsData = await githubActivityService.getContributionStats();
            setStats(statsData.stats || null);
          } catch (statsError) {
            console.error('Error fetching stats:', statsError);
            setStats(generateMockStats());
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching activity data:', err);
        setError(err.message || 'Failed to load activity data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [page, activityType, selectedRepo]);
  
  // Handle activity type change
  const handleActivityTypeChange = (value: string) => {
    setActivityType(value as ActivityType | 'all');
    setPage(1); // Reset to first page when changing filters
  };
  
  // Handle repository change
  const handleRepositoryChange = (value: string) => {
    setSelectedRepo(value);
    setPage(1); // Reset to first page when changing filters
  };
  
  // Load more activities
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };
  
  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const activityTypeParam = activityType === 'all' ? undefined : activityType;
      const repoParam = selectedRepo === 'all' ? undefined : selectedRepo;
      
      await githubActivityService.exportActivityData(format, undefined, activityTypeParam, repoParam);
    } catch (err: any) {
      console.error('Error exporting activity data:', err);
      // Could show a toast notification here
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground">Track your GitHub activity over time.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setShowCalendar(true)}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1" 
            onClick={() => handleExport('csv')}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={handleActivityTypeChange}>
          <TabsList className="grid grid-cols-5 w-full sm:w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="commit" className="flex items-center gap-1">
              <GitCommit className="h-3.5 w-3.5" />
              <span>Commits</span>
            </TabsTrigger>
            <TabsTrigger value="pr">PRs</TabsTrigger>
            <TabsTrigger value="issue">Issues</TabsTrigger>
            <TabsTrigger value="review">Reviews</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="all" onValueChange={handleRepositoryChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All repositories</SelectItem>
              {repositories.map(repo => (
                <SelectItem key={repo.id} value={repo.name}>{repo.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your GitHub activity in the last 30 days</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="flex items-center gap-1">
                <FileCode className="h-3.5 w-3.5" />
                <span>{totalContributions} contributions</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading && page === 1 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-muted-foreground">Loading activity data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10">
              <AlertCircle className="h-8 w-8 mb-4 text-destructive" />
              <p className="text-destructive font-medium mb-2">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileCode className="h-8 w-8 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium mb-1">No activities found</p>
              <p className="text-muted-foreground text-sm">Try changing your filters or check back later</p>
            </div>
          ) : (
            <>
          <div className="space-y-1">
                {activities.map((activity) => (
                  <Activity key={activity.id} activity={activity} />
            ))}
          </div>
              
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contribution Summary</CardTitle>
            <CardDescription>
              Activity breakdown by type
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading && !stats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-primary" />
                  <span className="font-medium">Commits</span>
                </div>
                  <div className="text-2xl font-bold">{stats.commits}</div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Pull Requests</span>
                </div>
                  <div className="text-2xl font-bold">{stats.pullRequests}</div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Issues</span>
                </div>
                  <div className="text-2xl font-bold">{stats.issues}</div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <GitMerge className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Code Reviews</span>
                </div>
                  <div className="text-2xl font-bold">{stats.reviews}</div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Stars Given</span>
                </div>
                  <div className="text-2xl font-bold">{stats.starsGiven}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-6 w-6 mb-2 text-destructive" />
                <p className="text-muted-foreground text-sm">Failed to load stats</p>
            </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>GitHub Profile Overview</CardTitle>
            <CardDescription>
              Your public GitHub stats
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loading && !profile ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : profile ? (
              <>
            <div className="flex items-center gap-4">
                  <div className="bg-sidebar p-0 rounded-full">
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.login} 
                      className="h-14 w-14 rounded-full"
                    />
              </div>
              
              <div>
                    <div className="text-lg font-bold">{profile.login}</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.name}{profile.location ? ` • ${profile.location}` : ''}
                    </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold">{profile.publicRepos}</div>
                <div className="text-sm text-muted-foreground">Public Repos</div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold">{profile.followers}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold">{profile.contributions}</div>
                <div className="text-sm text-muted-foreground">Contributions</div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                    <div className="text-2xl font-bold">{profile.starsReceived}</div>
                <div className="text-sm text-muted-foreground">Stars Received</div>
              </div>
            </div>
            
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(profile.profileUrl, '_blank')}
                >
              View GitHub Profile
            </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-6 w-6 mb-2 text-destructive" />
                <p className="text-muted-foreground text-sm">Failed to load profile</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-3xl p-0">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCalendar(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ActivityCalendar onClose={() => setShowCalendar(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityPage;
