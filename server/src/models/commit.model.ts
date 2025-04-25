import mongoose, { Schema, Document } from 'mongoose';

export interface ICommit extends Document {
  user: mongoose.Types.ObjectId;
  repository: string;
  repositoryUrl: string;
  filePath: string;
  commitMessage: string;
  dateTime: Date;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  scheduledTime?: Date;
  processedAt?: Date;
  bulkScheduleId?: string;
  isScheduled: boolean;
}

export interface IBulkCommitSchedule extends Document {
  user: mongoose.Types.ObjectId;
  repository: string;
  repositoryUrl: string;
  startDate: Date;
  endDate: Date;
  timeRange: {
    start?: string;
    end?: string;
    times?: string[];
  };
  messageTemplate?: string;
  messageTemplates?: string[];
  filesToChange: string[];
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  customDays?: number[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'cancelled';
  commits: mongoose.Types.ObjectId[];
}

const CommitSchema: Schema = new Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    repository: { 
      type: String, 
      required: true 
    },
    repositoryUrl: { 
      type: String, 
      required: true 
    },
    filePath: { 
      type: String, 
      required: true 
    },
    commitMessage: { 
      type: String, 
      required: true 
    },
    dateTime: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    },
    errorMessage: { 
      type: String 
    },
    scheduledTime: {
      type: Date
    },
    processedAt: {
      type: Date
    },
    bulkScheduleId: {
      type: String
    },
    isScheduled: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export const BulkCommitScheduleSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    repository: {
      type: String,
      required: true
    },
    repositoryUrl: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timeRange: {
      start: {
        type: String,
        required: false
      },
      end: {
        type: String,
        required: false
      },
      times: {
        type: [String],
        required: false
      }
    },
    messageTemplate: {
      type: String,
      required: false
    },
    messageTemplates: {
      type: [String],
      required: false
    },
    filesToChange: {
      type: [String],
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekdays', 'weekends', 'custom'],
      required: true
    },
    customDays: {
      type: [Number], // 0-6 where 0 is Sunday
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    },
    commits: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commit'
    }]
  },
  { timestamps: true }
);

export default mongoose.model<ICommit>('Commit', CommitSchema);
export const BulkCommitSchedule = mongoose.model<IBulkCommitSchedule>('BulkCommitSchedule', BulkCommitScheduleSchema); 