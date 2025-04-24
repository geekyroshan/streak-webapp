import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Loader2 } from 'lucide-react';
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
  MessageSquare,
  Plus,
  Trash
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettings, UserSettings } from '@/hooks/use-settings';
import { useRepositories } from '@/hooks/use-repositories';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useGitHubProfile } from '@/hooks/use-github-profile';

const SettingsPage = () => {
  const { settings, isLoading, isSaving, error, updateSettings, addCommitTemplate, removeCommitTemplate } = useSettings();
  const { repositories, isLoading: isLoadingRepos } = useRepositories();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useGitHubProfile();
  
  // Form state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [darkMode, setDarkMode] = useState(false);
  const [defaultRepository, setDefaultRepository] = useState<string | undefined>(undefined);
  const [newCommitTemplate, setNewCommitTemplate] = useState('');
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setNotificationsEnabled(settings.notificationsEnabled);
      setReminderTime(settings.reminderTime || '18:00');
      setTimezone(settings.timezone);
      setDarkMode(settings.darkMode);
      setDefaultRepository(settings.defaultRepository);
    }
  }, [settings]);
  
  // Save changes handlers
  const handleSaveNotifications = async () => {
    await updateSettings({
      notificationsEnabled,
      reminderTime,
      timezone
    });
  };
  
  const handleSaveAppearance = async () => {
    await updateSettings({
      darkMode
    });
  };
  
  const handleSaveApplication = async () => {
    await updateSettings({
      defaultRepository
    });
  };
  
  const handleAddTemplate = async () => {
    if (newCommitTemplate.trim()) {
      await addCommitTemplate(newCommitTemplate.trim());
      setNewCommitTemplate('');
    }
  };
  
  const handleRemoveTemplate = async (template: string) => {
    await removeCommitTemplate(template);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }
  
  if (error && !settings) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load settings. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }
  
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
                <h3 className="text-sm font-medium">Notification Settings</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="notifications-enabled" className="font-medium">Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive streak-related notifications</p>
                    </div>
                    <Switch 
                      id="notifications-enabled" 
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
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
                      <Select value={reminderTime} onValueChange={setReminderTime}>
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
                      <Select value={timezone} onValueChange={setTimezone}>
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
            </CardContent>
            
            <CardFooter>
              <Button 
                className="gap-2"
                onClick={handleSaveNotifications}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                <h3 className="text-sm font-medium">Default Repository Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-repo">Default Repository for Streak Actions</Label>
                    <Select 
                      value={defaultRepository} 
                      onValueChange={setDefaultRepository}
                      disabled={isLoadingRepos}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingRepos ? (
                          <SelectItem value="loading" disabled>Loading repositories...</SelectItem>
                        ) : repositories && repositories.length > 0 ? (
                          repositories.map(repo => (
                            <SelectItem key={repo.id} value={repo.full_name}>
                              {repo.full_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No repositories found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Commit Message Templates</h3>
                {settings?.commitMessageTemplates && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {settings.commitMessageTemplates.map((template, index) => (
                        <div key={index} className="flex items-center bg-secondary/50 rounded-md px-3 py-1">
                          <span className="mr-2">{template}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => handleRemoveTemplate(template)}
                            disabled={isSaving}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Add new template..."
                        value={newCommitTemplate}
                        onChange={(e) => setNewCommitTemplate(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        className="gap-1"
                        onClick={handleAddTemplate}
                        disabled={isSaving || !newCommitTemplate.trim()}
                      >
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Templates are used for automatic commits and can include placeholders like {"{date}"} and {"{repo}"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="gap-2"
                onClick={handleSaveApplication}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                    <div className="font-medium">{user?.username || 'Not connected'}</div>
                    <div className="text-sm text-muted-foreground">
                      {user?.lastLogin 
                        ? `Connected on ${new Date(user.lastLogin).toLocaleDateString()}` 
                        : user?.githubId 
                          ? 'Connected to GitHub'
                          : 'Not logged in'}
                    </div>
                  </div>
                  
                  <a href="https://github.com/settings/connections/applications" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-1">
                      <Lock className="h-4 w-4" />
                      Manage Access
                    </Button>
                  </a>
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

              {profile && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">GitHub Stats</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{profile.publicRepos}</div>
                      <div className="text-xs text-muted-foreground">Public Repositories</div>
                    </div>
                    
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{profile.followers}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{profile.contributions}</div>
                      <div className="text-xs text-muted-foreground">Contributions</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border rounded-md overflow-hidden cursor-pointer ${darkMode ? 'bg-secondary/10 ring-2 ring-primary' : ''}`}
                    onClick={() => setDarkMode(false)}
                  >
                    <div className="h-24 bg-white"></div>
                    <div className="p-2 text-center text-sm font-medium">Light</div>
                  </div>
                  
                  <div 
                    className={`border rounded-md overflow-hidden cursor-pointer ${darkMode ? '' : 'bg-secondary/10 ring-2 ring-primary'}`}
                    onClick={() => setDarkMode(true)}
                  >
                    <div className="h-24 bg-[#161b22]"></div>
                    <div className="p-2 text-center text-sm font-medium">Dark</div>
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
              <Button 
                className="gap-2"
                onClick={handleSaveAppearance}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your GitHub profile information
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {isLoadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : profile ? (
                  <div className="flex items-start gap-4">
                    <img 
                      src={profile.avatarUrl} 
                      alt={profile.name} 
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-medium">{profile.name}</h3>
                        <div className="text-sm text-muted-foreground">@{profile.login}</div>
                      </div>
                      {profile.location && (
                        <div className="text-sm">
                          <strong>Location:</strong> {profile.location}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {user?.createdAt 
                          ? `Connected since ${new Date(user.createdAt).toLocaleDateString()}`
                          : 'GitHub User'
                        }
                      </div>
                      <div className="mt-2">
                        <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1">
                            <GithubIcon className="h-4 w-4" />
                            View GitHub Profile
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : user ? (
                  <div className="flex items-start gap-4">
                    {user.avatar && (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                    )}
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                      {user.email && (
                        <div className="text-sm">
                          <strong>Email:</strong> {user.email}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {user.createdAt 
                          ? `Connected since ${new Date(user.createdAt).toLocaleDateString()}`
                          : 'GitHub User'
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    Not logged in or unable to load profile information.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
