
import React from 'react';
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
  Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityProps {
  type: 'commit' | 'pr' | 'review' | 'issue' | 'star';
  title: string;
  repo: string;
  time: string;
  branch?: string;
  icon: React.ReactNode;
}

const Activity = ({ type, title, repo, time, branch, icon }: ActivityProps) => {
  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      <div className="bg-secondary/70 p-2 rounded-full">
        {icon}
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{time}</div>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className="text-muted-foreground">{repo}</span>
          {branch && (
            <>
              <span className="text-muted-foreground">•</span>
              <span>{branch}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivityPage = () => {
  // Sample activity data
  const activities = [
    {
      type: 'commit' as const,
      title: 'Update API documentation with new endpoints',
      repo: 'api-service',
      branch: 'main',
      time: '2 hours ago',
      icon: <GitCommit className="h-5 w-5 text-primary" />
    },
    {
      type: 'pr' as const,
      title: 'Add responsive design for mobile views',
      repo: 'personal-website',
      time: 'Yesterday',
      icon: <GitPullRequest className="h-5 w-5 text-purple-500" />
    },
    {
      type: 'commit' as const,
      title: 'Fix navigation bar styling issues',
      repo: 'design-system',
      branch: 'fix/navbar',
      time: 'Yesterday',
      icon: <GitCommit className="h-5 w-5 text-primary" />
    },
    {
      type: 'review' as const,
      title: 'Code review: Implement user authentication',
      repo: 'api-service',
      time: '2 days ago',
      icon: <GitMerge className="h-5 w-5 text-blue-500" />
    },
    {
      type: 'commit' as const,
      title: 'Add unit tests for user service',
      repo: 'api-service',
      branch: 'feature/tests',
      time: '2 days ago',
      icon: <GitCommit className="h-5 w-5 text-primary" />
    },
    {
      type: 'issue' as const,
      title: 'Report bug in login functionality',
      repo: 'personal-website',
      time: '3 days ago',
      icon: <MessageSquare className="h-5 w-5 text-amber-500" />
    },
    {
      type: 'commit' as const,
      title: 'Update dependencies to latest versions',
      repo: 'design-system',
      branch: 'main',
      time: '4 days ago',
      icon: <GitCommit className="h-5 w-5 text-primary" />
    },
    {
      type: 'star' as const,
      title: 'Starred repository tensorflow/tensorflow',
      repo: 'tensorflow/tensorflow',
      time: '5 days ago',
      icon: <Star className="h-5 w-5 text-yellow-500" />
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground">Track your GitHub activity over time.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs defaultValue="all" className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-5 w-full sm:w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="commits" className="flex items-center gap-1">
              <GitCommit className="h-3.5 w-3.5" />
              <span>Commits</span>
            </TabsTrigger>
            <TabsTrigger value="prs">PRs</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All repositories</SelectItem>
              <SelectItem value="personal-website">personal-website</SelectItem>
              <SelectItem value="api-service">api-service</SelectItem>
              <SelectItem value="design-system">design-system</SelectItem>
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
                <span>42 contributions</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <Activity key={index} {...activity} />
            ))}
          </div>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-primary" />
                  <span className="font-medium">Commits</span>
                </div>
                <div className="text-2xl font-bold">124</div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5 text-purple-500" />
                  <span className="font-medium">Pull Requests</span>
                </div>
                <div className="text-2xl font-bold">23</div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Issues</span>
                </div>
                <div className="text-2xl font-bold">15</div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <GitMerge className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Code Reviews</span>
                </div>
                <div className="text-2xl font-bold">38</div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Stars Given</span>
                </div>
                <div className="text-2xl font-bold">57</div>
              </div>
            </div>
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
            <div className="flex items-center gap-4">
              <div className="bg-sidebar p-3 rounded-full">
                <Github className="h-8 w-8" />
              </div>
              
              <div>
                <div className="text-lg font-bold">johndoe</div>
                <div className="text-sm text-muted-foreground">John Doe • San Francisco, CA</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                <div className="text-2xl font-bold">34</div>
                <div className="text-sm text-muted-foreground">Public Repos</div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                <div className="text-2xl font-bold">128</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                <div className="text-2xl font-bold">982</div>
                <div className="text-sm text-muted-foreground">Contributions</div>
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-md text-center">
                <div className="text-2xl font-bold">86</div>
                <div className="text-sm text-muted-foreground">Stars Received</div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              View GitHub Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityPage;
