import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  dueDate: Date;
  status: 'not started' | 'in progress' | 'completed';
  projectId: Schema.Types.ObjectId;
  assignedTo: Schema.Types.ObjectId;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['not started', 'in progress', 'completed'], required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export const Task = model<ITask>('Task', taskSchema);