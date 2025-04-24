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
  login: () => window.location.href = `${API_URL}/auth/github`,
  logout: async () => {
    await api.get('/auth/logout');
    localStorage.removeItem('token');
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
  }
};

interface ScheduleBulkCommitPayload {
  repositoryName: string;
  owner: string;
  startDate: string;
  endDate: string;
  timeRange: {
    start?: string;
    end?: string;
    times?: string[];
  };
  messageTemplate: string;
  filesToChange: string[];
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
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
  
  async scheduleBulkCommits({
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
  }: ScheduleBulkCommitPayload): Promise<any> {
    try {
      console.log(`Scheduling bulk commits from ${startDate} to ${endDate}`);
      
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
};

// Contribution services
export const contributionService = {
  getUserContributions: async (since?: string) => {
    const url = since ? `/contributions?since=${since}` : '/contributions';
    const response = await api.get(url);
    return response.data.data;
  },
  getStreakStats: async () => {
    const response = await api.get('/contributions/stats');
    return response.data.data;
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

export default api; 