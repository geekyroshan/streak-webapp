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
    }
  },
  { timestamps: true }
);

export default mongoose.model<ICommit>('Commit', CommitSchema); 