// models/comment.ts
import { Schema, model, Document } from 'mongoose';

interface IComment extends Document {
  content: string;
  userId: Schema.Types.ObjectId;
  projectId?: Schema.Types.ObjectId;
  taskId?: Schema.Types.ObjectId;
}

const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
});

const Comment = model<IComment>('Comment', commentSchema);

export default Comment;