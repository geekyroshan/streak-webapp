// User interface matching the server model
export interface User {
  _id: string;
  githubId: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  lastLogin?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiration?: Date | string;
  settings: {
    darkMode: boolean;
    timezone: string;
    defaultRepository?: string;
    notificationsEnabled: boolean;
    reminderTime?: string;
    commitMessageTemplates: string[];
  };
} 