import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiration?: Date;
  lastLogin: Date;
  settings: {
    darkMode: boolean;
    timezone: string;
    defaultRepository?: string;
    notificationsEnabled: boolean;
    reminderTime?: string;
    commitMessageTemplates: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    githubId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    avatar: { type: String },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    tokenExpiration: { type: Date },
    lastLogin: { type: Date, default: Date.now },
    settings: {
      darkMode: { type: Boolean, default: false },
      timezone: { type: String, default: 'UTC' },
      defaultRepository: { type: String },
      notificationsEnabled: { type: Boolean, default: true },
      reminderTime: { type: String },
      commitMessageTemplates: { 
        type: [String], 
        default: [
          'Update documentation',
          'Fix typo',
          'Add comments',
          'Update README'
        ]
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema); 