import { Schema, model, Document } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  dueDate: Date;
  status: 'not started' | 'in progress' | 'completed';
}

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['not started', 'in progress', 'completed'], required: true }
});

export const Project = model<IProject>('Project', projectSchema);