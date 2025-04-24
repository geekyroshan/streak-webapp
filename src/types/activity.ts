export type ActivityType = 'commit' | 'pr' | 'issue' | 'review' | 'star';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  repo: string;
  repoFullName?: string;
  time: string; // Formatted time string
  timestamp: string; // ISO timestamp
  branch?: string;
  url?: string;
}

export interface GitHubProfile {
  login: string;
  name: string;
  avatarUrl: string;
  location?: string;
  publicRepos: number;
  followers: number;
  contributions: number;
  starsReceived: number;
  profileUrl: string;
}

export interface ContributionStats {
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  starsGiven: number;
  totalContributions: number;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description?: string;
  url: string;
  updatedAt: string;
}

export interface ActivityFilters {
  activityType?: ActivityType | 'all';
  repository?: string;
  since?: string;
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
} 