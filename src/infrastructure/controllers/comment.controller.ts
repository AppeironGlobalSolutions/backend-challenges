import { Request, Response } from 'express';
import Comment from '../../domain/entities/comment.entity';

export const addComment = async (req: Request, res: Response) => {
  try {
    const { content, projectId, taskId } = req.body;
    const userId = (req as any).user.userId;

    const comment = new Comment({ content, userId, projectId, taskId });
    await comment.save();
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { projectId, taskId } = req.query;

    const comments = await Comment.find({ projectId, taskId });
    res.status(200).json(comments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};