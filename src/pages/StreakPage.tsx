
import React from 'react';
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
  Loader2
} from 'lucide-react';

const StreakPage = () => {
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
                      <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-md cursor-pointer hover:bg-secondary transition-colors">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <div className="text-sm font-medium">March 25, 2025</div>
                          <div className="text-xs text-muted-foreground">Tuesday (8 days ago)</div>
                        </div>
                        <Badge className="ml-auto">High Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Repository</label>
                  <Select defaultValue="personal-website">
                    <SelectTrigger>
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal-website">personal-website</SelectItem>
                      <SelectItem value="api-service">api-service</SelectItem>
                      <SelectItem value="machine-learning-experiments">machine-learning-experiments</SelectItem>
                      <SelectItem value="design-system">design-system</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Message</label>
                  <Textarea placeholder="Enter commit message" defaultValue="Update documentation with new API endpoints" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">File to Change</label>
                    <Button variant="ghost" size="sm" className="h-7 gap-1">
                      <FileEdit className="h-3.5 w-3.5" />
                      Choose file
                    </Button>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">docs/api-reference.md</div>
                      <Badge variant="outline">Selected</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Time</label>
                  <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-md">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium">2:30 PM local time</div>
                      <div className="text-xs text-muted-foreground">Matches your typical activity pattern</div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto h-7">
                      Change
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">Reset</Button>
                <Button className="gap-2">
                  <GitCommit className="h-4 w-4" />
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
                  <div className="text-sm font-medium">personal-website</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-sm font-medium">March 25, 2025</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="text-sm font-medium">2:30 PM (UTC-05:00)</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Message</div>
                  <div className="text-sm font-medium">Update documentation with new API endpoints</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">File</div>
                  <div className="text-sm font-medium">docs/api-reference.md</div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-green-500 mb-2">
                    <Check className="h-4 w-4" />
                    Valid configuration
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    This will create a legitimate commit that reflects work you did locally but didn't push.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Your recent streak management actions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Commit created successfully</div>
                      <div className="text-sm text-muted-foreground">2 hours ago</div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      Created commit for March 30, 2025 in repository <span className="font-medium">api-service</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Update API documentation</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <GitCommit className="h-3.5 w-3.5" />
                        <span>a8e7d1c</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="bg-amber-500/10 p-2 rounded-full">
                    <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Commit in progress</div>
                      <div className="text-sm text-muted-foreground">5 minutes ago</div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      Creating commit for April 5, 2025 in repository <span className="font-medium">design-system</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Update component examples</span>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="h-7 gap-1">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-red-500/10 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Commit failed</div>
                      <div className="text-sm text-muted-foreground">Yesterday</div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      Failed to create commit for March 18, 2025 in repository <span className="font-medium">mobile-app</span>
                    </div>
                    
                    <div className="bg-red-500/10 text-red-500 text-xs p-2 rounded mt-2">
                      Error: Repository access denied. Check your authentication credentials.
                    </div>
                    
                    <div className="flex justify-end mt-2">
                      <Button variant="outline" size="sm" className="h-7">
                        Retry
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
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
