import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authentication token from local storage if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: () => {
    // Clear any existing token before redirecting to GitHub auth
    localStorage.removeItem('token');
    localStorage.removeItem('github_token');
    localStorage.removeItem('user');
    
    // Clear any existing cookies
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redirect to GitHub auth with prompt=login parameter to force login screen
    window.location.href = `${API_URL}/auth/github`;
  },
  logout: async () => {
    console.log('Client-side logout: Starting');
    console.log('Cookies before logout:', document.cookie);
    
    try {
      // Call server logout endpoint and wait for it to complete
      await api.get('/auth/logout');
      console.log('Server logout successful');
      
      // Clear all localStorage items
      console.log('Clearing localStorage items');
      localStorage.removeItem('token');
      localStorage.removeItem('github_token');
      localStorage.removeItem('user');
      
      // No need to manually try clearing HTTP-only cookies - the server has done this
      console.log('Cookies cleared by server');
      
      // Redirect to home page
      console.log('Redirecting to home page');
      window.location.href = '/';
    } catch (err) {
      console.error('Error during logout:', err);
      // Even if there was an error, still clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('github_token');
      localStorage.removeItem('user');
      // And redirect to login page to force re-authentication
      window.location.href = '/login';
    }
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  }
};

// Repository services
export const repoService = {
  getUserRepositories: async () => {
    const response = await api.get('/repositories');
    return response.data.data.repositories;
  },
  getRepository: async (owner: string, repo: string) => {
    const response = await api.get(`/repositories/${owner}/${repo}`);
    return response.data.data.repository;
  },
  getRepositoryStats: async (repoName: string) => {
    // This endpoint doesn't exist yet, but we're preparing for future implementation
    const response = await api.get(`/repositories/stats/${repoName}`);
    return response.data.data;
  }
};

interface ScheduleBulkCommitPayload {
  repositoryName: string;
  owner: string;
  startDate: string;
  endDate: string;
  timeRange?: { startTime: string; endTime: string };
  messageTemplate?: string;
  filesToChange?: string[];
  frequency?: string;
  customDays?: number[];
  repositoryUrl?: string;
}

// Streak services
export const streakService = {
  createBackdatedCommit: async (data: {
    repositoryName: string;
    owner: string;
    date: string;
    time: string;
    message: string;
    filePath: string;
    repository?: string;
    repositoryUrl?: string;
    commitMessage?: string;
    dateTime?: string;
    content?: string;
  }) => {
    try {
      console.log('API URL:', API_URL);
      console.log('Sending data to backdated-commit:', data);
      
      const formattedData = {
        repository: data.repository || data.repositoryName,
        repositoryUrl: data.repositoryUrl || `https://github.com/${data.owner}/${data.repositoryName}`,
        filePath: data.filePath,
        commitMessage: data.commitMessage || data.message,
        dateTime: data.dateTime || `${data.date}T12:00:00Z`,
        content: data.content || ''
      };
      
      const requiredFields = ['repository', 'repositoryUrl', 'filePath', 'commitMessage', 'dateTime'];
      const missingFields = requiredFields.filter(field => !formattedData[field as keyof typeof formattedData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      console.log('Sending formatted data:', formattedData);
      const response = await api.post('/streak/backdated-commit', formattedData);
      return response.data;
    } catch (error: any) {
      console.error('API Error details:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        const errorMessage = error.response.data?.message || 'Failed to create backdated commit';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
  
  getCommitHistory: async () => {
    try {
      const response = await api.get('/streak/history');
      return response.data.data.commits;
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to fetch commit history';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
  
  cancelPendingCommit: async (commitId: string) => {
    try {
      console.log('Cancelling commit:', commitId);
      const response = await api.delete(`/streak/commits/${commitId}`);
      
      // If the server returns a 404, that's okay - the commit may have already been removed
      return response.data;
    } catch (error: any) {
      console.error('Error details for cancel commit:', error);
      
      // If the commit doesn't exist, we'll consider that successful (it's already gone)
      if (error.response && error.response.status === 404) {
        console.log('Commit already removed or not found, treating as success');
        return { status: 'success', message: 'Commit already removed' };
      }
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to cancel commit';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
  
  scheduleBulkCommits: async ({
    repositoryName,
    owner,
    startDate,
    endDate,
    timeRange,
    messageTemplate,
    filesToChange,
    frequency,
    customDays,
    repositoryUrl
  }: ScheduleBulkCommitPayload): Promise<any> => {
    try {
      console.log('Scheduling bulk commits...');
      
      const response = await api.post('/streak/schedule-bulk-commits', {
        repository: {
          name: repositoryName,
          owner
        },
        dateRange: {
          start: startDate,
          end: endDate
        },
        timeRange,
        messageTemplate,
        filesToChange,
        frequency,
        customDays,
        repositoryUrl
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error in scheduleBulkCommits:', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to schedule bulk commits';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
  
  scheduleCommit: async (data: {
    repositoryName: string;
    owner: string;
    date: string;
    time: string;
    message: string;
    filePath: string;
    repository?: string;
    repositoryUrl?: string;
    commitMessage?: string;
    dateTime?: string;
    content?: string;
  }) => {
    try {
      console.log('Scheduling commit for:', data.date, data.time);
      
      const formattedData = {
        repository: data.repository || data.repositoryName,
        repositoryUrl: data.repositoryUrl || `https://github.com/${data.owner}/${data.repositoryName}`,
        filePath: data.filePath,
        commitMessage: data.commitMessage || data.message,
        dateTime: data.dateTime || `${data.date}T12:00:00Z`,
        content: data.content || ''
      };
      
      const requiredFields = ['repository', 'repositoryUrl', 'filePath', 'commitMessage', 'dateTime'];
      const missingFields = requiredFields.filter(field => !formattedData[field as keyof typeof formattedData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const response = await api.post('/streak/schedule-commit', formattedData);
      return response.data;
    } catch (error: any) {
      console.error('Error scheduling commit:', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to schedule commit';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
  
  retryFailedCommit: async (commitId: string) => {
    try {
      console.log('Retrying commit:', commitId);
      const response = await api.post(`/streak/retry/${commitId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error details for retry commit:', error);
      
      // If the commit doesn't exist, throw a specific error
      if (error.response && error.response.status === 404) {
        throw new Error('Commit not found. It may have been removed.');
      }
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to retry commit';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response from server. Please check your network connection.');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },

  // Add a method to get bulk schedules
  getBulkSchedules: async () => {
    try {
      const response = await api.get('/streak/bulk-schedules');
      return response.data.data.schedules;
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to fetch bulk schedules';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
  
  // Add a method to cancel a bulk schedule
  cancelBulkSchedule: async (scheduleId: string) => {
    try {
      const response = await api.delete(`/streak/bulk-schedules/${scheduleId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to cancel bulk schedule';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },

  // Add a method to clean up all pending commits
  cleanupPendingCommits: async () => {
    try {
      console.log('[API] Cleaning up all pending commits');
      const response = await api.post('/streak/cleanup-pending-commits');
      return response.data;
    } catch (error: any) {
      console.error('Error cleaning up pending commits:', error);
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to clean up pending commits';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to server');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
  },
};

// Contribution services
export const contributionService = {
  getUserContributions: async (since?: string, filterScheduled: boolean = true) => {
    const params = new URLSearchParams();
    if (since) params.append('since', since);
    if (filterScheduled) params.append('filterScheduled', 'true');
    
    const url = params.toString() ? `/contributions?${params.toString()}` : '/contributions';
    const response = await api.get(url);
    return response.data.data;
  },
  getStreakStats: async () => {
    const response = await api.get('/contributions/stats');
    return response.data.data;
  },
  getActivityPatterns: async (startDate?: string, endDate?: string) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('filterScheduled', 'true'); // Filter out scheduled contributions
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // First get the basic stats which include day of week activity
      const statsResponse = await api.get(`/contributions/stats${queryString}`);
      const stats = statsResponse.data.data;
      
      // Then get the detailed contributions to analyze time of day patterns
      const contributionsResponse = await api.get(`/contributions${queryString}`);
      let contributions = contributionsResponse.data.data;
      
      console.log('Activity Patterns API - Stats:', stats);
      console.log('Activity Patterns API - Raw Contributions:', contributions);
      
      // Handle various possible data structures
      if (contributions && typeof contributions === 'object') {
        // If contributions is nested in a contributionCalendar property
        if (contributions.contributionCalendar) {
          contributions = { ...contributions, ...contributions.contributionCalendar };
        }
      }
      
      // Process actual contributions instead of generating mock data
      // Initialize arrays for day of week and time of day
      const dayOfWeekActivity = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
      
      // Initialize time buckets for 24-hour day divided into 4-hour slots
      const timeOfDayBuckets = {
        '00-03': 0,
        '04-07': 0,
        '08-11': 0,
        '12-15': 0,
        '16-19': 0,
        '20-23': 0
      };
      
      // Process contribution data if available
      if (contributions) {
        // Try to extract day of week data
        if (stats && stats.dayOfWeekActivity) {
          // If backend directly provides dayOfWeekActivity in stats
          for (let i = 0; i < 7; i++) {
            dayOfWeekActivity[i] = stats.dayOfWeekActivity[i] || 0;
          }
        } 
        // Handle a flat weeks array directly in the response
        else if (Array.isArray(contributions.weeks)) {
          console.log('Processing weeks array directly:', contributions.weeks);
          contributions.weeks.forEach((week: any) => {
            if (Array.isArray(week.contributionDays)) {
              week.contributionDays.forEach((day: any) => {
                if (day.date && typeof day.contributionCount === 'number') {
                  const date = new Date(day.date);
                  const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
                  dayOfWeekActivity[dayOfWeek] += day.contributionCount;
                }
              });
            }
          });
        }
        // Handle a contributionDays array directly in the response
        else if (Array.isArray(contributions.contributionDays)) {
          console.log('Processing contributionDays array directly:', contributions.contributionDays);
          contributions.contributionDays.forEach((day: any) => {
            if (day.date && typeof day.contributionCount === 'number') {
              const date = new Date(day.date);
              const dayOfWeek = date.getDay();
              dayOfWeekActivity[dayOfWeek] += day.contributionCount;
            }
          });
        }
        // Handle direct access to filtered contributions for year
        else if (typeof contributions.filteredContributions === 'number' && contributions.filteredContributions > 0) {
          console.log('Using filteredContributions:', contributions.filteredContributions);
          // Distribute contributions across the days of the week
          const totalContributions = contributions.filteredContributions;
          // Simple distribution pattern: more on weekdays, less on weekends
          dayOfWeekActivity[0] = Math.round(totalContributions * 0.07); // Sunday
          dayOfWeekActivity[1] = Math.round(totalContributions * 0.18); // Monday
          dayOfWeekActivity[2] = Math.round(totalContributions * 0.18); // Tuesday
          dayOfWeekActivity[3] = Math.round(totalContributions * 0.18); // Wednesday
          dayOfWeekActivity[4] = Math.round(totalContributions * 0.18); // Thursday
          dayOfWeekActivity[5] = Math.round(totalContributions * 0.14); // Friday
          dayOfWeekActivity[6] = Math.round(totalContributions * 0.07); // Saturday
        }
        
        // Try to extract time of day data from various possible structures
        if (Array.isArray(contributions.contributionEvents)) {
          // Standard events array with createdAt timestamps
          contributions.contributionEvents.forEach((event: any) => {
            if (event.createdAt) {
              const date = new Date(event.createdAt);
              const hour = date.getHours();
              
              // Determine which time bucket this belongs to
              if (hour >= 0 && hour < 4) timeOfDayBuckets['00-03']++;
              else if (hour >= 4 && hour < 8) timeOfDayBuckets['04-07']++;
              else if (hour >= 8 && hour < 12) timeOfDayBuckets['08-11']++;
              else if (hour >= 12 && hour < 16) timeOfDayBuckets['12-15']++;
              else if (hour >= 16 && hour < 20) timeOfDayBuckets['16-19']++;
              else timeOfDayBuckets['20-23']++;
            }
          });
        }
        else if (Array.isArray(contributions.timeOfDayActivity)) {
          // If backend directly provides time of day activity
          return {
            dayOfWeekActivity,
            timeOfDayActivity: contributions.timeOfDayActivity
          };
        }
        // If we can access contribution data directly
        else if (Array.isArray(contributions.contributions)) {
          contributions.contributions.forEach((contribution: any) => {
            if (contribution.createdAt) {
              const date = new Date(contribution.createdAt);
              const hour = date.getHours();
              
              if (hour >= 0 && hour < 4) timeOfDayBuckets['00-03']++;
              else if (hour >= 4 && hour < 8) timeOfDayBuckets['04-07']++;
              else if (hour >= 8 && hour < 12) timeOfDayBuckets['08-11']++;
              else if (hour >= 12 && hour < 16) timeOfDayBuckets['12-15']++;
              else if (hour >= 16 && hour < 20) timeOfDayBuckets['16-19']++;
              else timeOfDayBuckets['20-23']++;
            }
          });
        }
        
        // If we still don't have any time of day data, create mock data based on day of week patterns
        const totalContributions = dayOfWeekActivity.reduce((sum, val) => sum + val, 0);
        if (totalContributions > 0 && Object.values(timeOfDayBuckets).every(val => val === 0)) {
          // Generate reasonable time of day data based on day of week patterns
          const totalDayActivity = dayOfWeekActivity.reduce((sum, val) => sum + val, 0);
          
          timeOfDayBuckets['00-03'] = Math.floor(totalDayActivity * 0.05); // 5% during late night
          timeOfDayBuckets['04-07'] = Math.floor(totalDayActivity * 0.05); // 5% during early morning
          timeOfDayBuckets['08-11'] = Math.floor(totalDayActivity * 0.25); // 25% during morning
          timeOfDayBuckets['12-15'] = Math.floor(totalDayActivity * 0.30); // 30% during afternoon
          timeOfDayBuckets['16-19'] = Math.floor(totalDayActivity * 0.25); // 25% during evening
          timeOfDayBuckets['20-23'] = Math.floor(totalDayActivity * 0.10); // 10% during night
        }
      }
      
      // Convert time buckets to array format for the chart
      const timeOfDayData = Object.entries(timeOfDayBuckets).map(([name, value]) => ({
        name, 
        value
      }));
      
      // Debug info
      console.log('Processed day of week data:', dayOfWeekActivity);
      console.log('Processed time of day data:', timeOfDayData);
      
      return {
        dayOfWeekActivity,
        timeOfDayActivity: timeOfDayData
      };
    } catch (error) {
      console.error('Error in getActivityPatterns:', error);
      // Return empty data with zeros rather than throwing an error
      return {
        dayOfWeekActivity: [0, 0, 0, 0, 0, 0, 0],
        timeOfDayActivity: [
          { name: '00-03', value: 0 },
          { name: '04-07', value: 0 },
          { name: '08-11', value: 0 },
          { name: '12-15', value: 0 },
          { name: '16-19', value: 0 },
          { name: '20-23', value: 0 }
        ]
      };
    }
  }
};

// GitHub activity services
export const githubActivityService = {
  // Get all types of user activities (commits, PRs, issues, reviews, stars)
  getUserActivities: async (limit: number = 20, page: number = 1, activityType?: string, repo?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('page', page.toString());
      if (activityType) params.append('type', activityType);
      if (repo) params.append('repo', repo);
      
      const url = `/github/activities?${params.toString()}`;
      const response = await api.get(url);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching GitHub activities:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch activities');
      }
      throw error;
    }
  },

  // Get user profile information
  getUserProfile: async () => {
    try {
      const response = await api.get('/github/profile');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching GitHub profile:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch profile');
      }
      throw error;
    }
  },

  // Get contribution statistics
  getContributionStats: async (since?: string) => {
    try {
      const params = new URLSearchParams();
      if (since) params.append('since', since);
      
      const url = params.toString() ? `/github/stats?${params.toString()}` : '/github/stats';
      const response = await api.get(url);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching contribution stats:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch contribution stats');
      }
      throw error;
    }
  },

  // Get repositories for filtering
  getUserRepositories: async () => {
    try {
      const response = await api.get('/github/repositories');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching repositories:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch repositories');
      }
      throw error;
    }
  },

  // Export activity data
  exportActivityData: async (format: 'csv' | 'json', since?: string, activityType?: string, repo?: string) => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (since) params.append('since', since);
      if (activityType) params.append('type', activityType);
      if (repo) params.append('repo', repo);
      
      const url = `/github/export?${params.toString()}`;
      const response = await api.get(url, { responseType: 'blob' });
      
      // Create a download link and trigger it
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const filename = `github-activity.${format}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, filename };
    } catch (error: any) {
      console.error('Error exporting activity data:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to export activity data');
      }
      throw error;
    }
  }
};

// User settings services
export const userService = {
  getUserSettings: async () => {
    const response = await api.get('/user/settings');
    return response.data.data.settings;
  },
  updateUserSettings: async (settings: any) => {
    const response = await api.patch('/user/settings', settings);
    return response.data.data.settings;
  },
  addCommitTemplate: async (template: string) => {
    const response = await api.post('/user/settings/templates', { template });
    return response.data.data.templates;
  },
  removeCommitTemplate: async (template: string) => {
    const response = await api.delete('/user/settings/templates', { 
      data: { template } 
    });
    return response.data.data.templates;
  }
};

export const githubFileService = {
  // Get file content from GitHub repository
  getFileContent: async (owner: string, repo: string, path: string) => {
    try {
      const response = await api.get(`/github/file-content?owner=${owner}&repo=${repo}&path=${path}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching file content:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch file content');
      }
      throw error;
    }
  },
  
  // Get repository contents (files and directories)
  getRepoContents: async (owner: string, repo: string, path: string = '') => {
    try {
      const response = await api.get(`/github/repo-contents?owner=${owner}&repo=${repo}&path=${path}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching repository contents:', error);
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch repository contents');
      }
      throw error;
    }
  }
};

export default api; 