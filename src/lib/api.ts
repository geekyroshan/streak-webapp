import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// Streak services
export const streakService = {
  createBackdatedCommit: async (data: any) => {
    const response = await api.post('/streak/backdated-commit', data);
    return response.data;
  },
  getCommitHistory: async () => {
    const response = await api.get('/streak/history');
    return response.data.data.commits;
  },
  scheduleBulkCommits: async (data: any) => {
    const response = await api.post('/streak/bulk', data);
    return response.data;
  }
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