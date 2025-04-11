
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Calendar, 
  Clock, 
  GithubIcon, 
  Globe, 
  Lock, 
  Moon, 
  Save, 
  User,
  MessageSquare
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>
      
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-[600px]">
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="application" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Application</span>
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-1">
            <GithubIcon className="h-4 w-4" />
            <span>GitHub</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-1">
            <Moon className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Streak Notifications</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="streak-reminder" className="font-medium">Daily Streak Reminder</Label>
                      <p className="text-sm text-muted-foreground">Receive a daily reminder to maintain your streak</p>
                    </div>
                    <Switch id="streak-reminder" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="streak-risk" className="font-medium">Streak at Risk Alert</Label>
                      <p className="text-sm text-muted-foreground">Get notified when you haven't contributed today</p>
                    </div>
                    <Switch id="streak-risk" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="streak-broken" className="font-medium">Streak Broken Alert</Label>
                      <p className="text-sm text-muted-foreground">Get notified when your streak is broken</p>
                    </div>
                    <Switch id="streak-broken" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notification Timing</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select defaultValue="18:00">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="09:00">9:00 AM</SelectItem>
                          <SelectItem value="12:00">12:00 PM</SelectItem>
                          <SelectItem value="15:00">3:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="21:00">9:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Select defaultValue="America/Los_Angeles">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notification Channels</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="email-notify" className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch id="email-notify" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="browser-notify" className="font-medium">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                    </div>
                    <Switch id="browser-notify" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="application" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                Configure application behavior and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Streak Management</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="auto-scan" className="font-medium">Automatic Repository Scanning</Label>
                      <p className="text-sm text-muted-foreground">Periodically scan repositories for new activity</p>
                    </div>
                    <Switch id="auto-scan" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="weekend-exclude" className="font-medium">Exclude Weekends from Streaks</Label>
                      <p className="text-sm text-muted-foreground">Don't count weekends in streak calculations</p>
                    </div>
                    <Switch id="weekend-exclude" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Default Repository Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-repo">Default Repository for Streak Actions</Label>
                    <Select defaultValue="personal-website">
                      <SelectTrigger>
                        <SelectValue placeholder="Select repository" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal-website">personal-website</SelectItem>
                        <SelectItem value="api-service">api-service</SelectItem>
                        <SelectItem value="design-system">design-system</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="commit-template">Default Commit Message Template</Label>
                    <Textarea
                      id="commit-template"
                      rows={3}
                      placeholder="Enter default commit message template"
                      defaultValue="Update documentation and add comments"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{date}'} and {'{repo}'} as placeholders for dynamic content
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Calendar Settings</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="start-monday" className="font-medium">Start Week on Monday</Label>
                      <p className="text-sm text-muted-foreground">Display calendar with Monday as the first day</p>
                    </div>
                    <Switch id="start-monday" />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="github" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>
                Manage your GitHub account connection and permissions
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Connected Account</h3>
                
                <div className="flex items-center gap-4 p-4 border rounded-md">
                  <div className="bg-sidebar p-2 rounded-full">
                    <GithubIcon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">johndoe</div>
                    <div className="text-sm text-muted-foreground">Connected on April 5, 2025</div>
                  </div>
                  
                  <Button variant="outline" className="gap-1">
                    <Lock className="h-4 w-4" />
                    Manage Access
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">GitHub Permissions</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 mt-0.5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
                    <div>
                      <div className="font-medium">Repository Read Access</div>
                      <div className="text-muted-foreground">Access to read your repositories and their contents</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 mt-0.5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
                    <div>
                      <div className="font-medium">Repository Write Access</div>
                      <div className="text-muted-foreground">Ability to create commits and push changes</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 mt-0.5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-xs">✓</div>
                    <div>
                      <div className="font-medium">User Profile Access</div>
                      <div className="text-muted-foreground">Access to your GitHub profile information</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">API Usage</h3>
                
                <div className="space-y-2">
                  <div className="w-full bg-secondary/50 rounded-full h-3">
                    <div className="bg-primary h-3 rounded-full w-3/4"></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    3,750 / 5,000 GitHub API requests used (75%)
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  API rate limits reset in 30 minutes.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Disconnect GitHub
              </Button>
              
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Theme</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-md overflow-hidden cursor-pointer bg-secondary/10 ring-2 ring-primary">
                    <div className="h-24 bg-[#161b22]"></div>
                    <div className="p-2 text-center text-sm font-medium">Dark (Default)</div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden cursor-pointer">
                    <div className="h-24 bg-white"></div>
                    <div className="p-2 text-center text-sm font-medium">Light</div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden cursor-pointer">
                    <div className="h-24 bg-gradient-to-b from-[#161b22] to-[#0d1117]"></div>
                    <div className="p-2 text-center text-sm font-medium">System</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Dashboard Layout</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md overflow-hidden cursor-pointer bg-secondary/10 ring-2 ring-primary">
                    <div className="p-4">
                      <div className="w-full h-6 bg-secondary/80 rounded mb-3"></div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="h-3 bg-secondary/80 rounded"></div>
                        <div className="h-3 bg-secondary/80 rounded"></div>
                        <div className="h-3 bg-secondary/80 rounded"></div>
                        <div className="h-3 bg-secondary/80 rounded"></div>
                      </div>
                      <div className="w-full h-20 bg-secondary/80 rounded mb-3"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-10 bg-secondary/80 rounded"></div>
                        <div className="h-10 bg-secondary/80 rounded"></div>
                      </div>
                    </div>
                    <div className="p-2 text-center text-sm font-medium">Default</div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden cursor-pointer">
                    <div className="p-4">
                      <div className="w-full h-6 bg-secondary/50 rounded mb-3"></div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="h-10 bg-secondary/50 rounded"></div>
                        <div className="h-10 bg-secondary/50 rounded"></div>
                      </div>
                      <div className="w-full h-20 bg-secondary/50 rounded mb-3"></div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="h-3 bg-secondary/50 rounded"></div>
                        <div className="h-3 bg-secondary/50 rounded"></div>
                        <div className="h-3 bg-secondary/50 rounded"></div>
                        <div className="h-3 bg-secondary/50 rounded"></div>
                      </div>
                    </div>
                    <div className="p-2 text-center text-sm font-medium">Compact</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Contribution Calendar Colors</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex flex-1 gap-1">
                        <div className="w-6 h-6 rounded bg-contribution-level-0"></div>
                        <div className="w-6 h-6 rounded bg-contribution-level-1"></div>
                        <div className="w-6 h-6 rounded bg-contribution-level-2"></div>
                        <div className="w-6 h-6 rounded bg-contribution-level-3"></div>
                        <div className="w-6 h-6 rounded bg-contribution-level-4"></div>
                      </div>
                      <div className="text-sm font-medium">GitHub (Default)</div>
                    </div>
                    <div className="h-6 w-6 rounded-full border bg-secondary/10 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex flex-1 gap-1">
                        <div className="w-6 h-6 rounded bg-gray-800"></div>
                        <div className="w-6 h-6 rounded bg-blue-800"></div>
                        <div className="w-6 h-6 rounded bg-blue-600"></div>
                        <div className="w-6 h-6 rounded bg-blue-400"></div>
                        <div className="w-6 h-6 rounded bg-blue-300"></div>
                      </div>
                      <div className="text-sm font-medium">Ocean Blue</div>
                    </div>
                    <div className="h-6 w-6 rounded-full border"></div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-full flex items-center justify-between gap-2">
                      <div className="flex flex-1 gap-1">
                        <div className="w-6 h-6 rounded bg-gray-800"></div>
                        <div className="w-6 h-6 rounded bg-purple-900"></div>
                        <div className="w-6 h-6 rounded bg-purple-700"></div>
                        <div className="w-6 h-6 rounded bg-purple-500"></div>
                        <div className="w-6 h-6 rounded bg-purple-400"></div>
                      </div>
                      <div className="text-sm font-medium">Cosmic Purple</div>
                    </div>
                    <div className="h-6 w-6 rounded-full border"></div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input id="full-name" defaultValue="John Doe" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input id="display-name" defaultValue="johndoe" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" defaultValue="San Francisco, CA" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Communication Preferences</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="product-updates" className="font-medium">Product Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about product updates and new features</p>
                    </div>
                    <Switch id="product-updates" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="weekly-digest" className="font-medium">Weekly Activity Digest</Label>
                      <p className="text-sm text-muted-foreground">Receive a weekly summary of your GitHub activity</p>
                    </div>
                    <Switch id="weekly-digest" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Account Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="gap-2 justify-start">
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                  </Button>
                  
                  <Button variant="outline" className="gap-2 justify-start text-destructive border-destructive/30 hover:bg-destructive/10">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
