import { Request, Response } from 'express';
import { Task } from '../../domain/entities/task.entity';

export const createTask = async (req: Request, res: Response) => {
  const { title, description, dueDate, status, projectId, assignedTo } = req.body;
  const newTask = new Task({ title, description, dueDate, status, projectId, assignedTo });
  
  await newTask.save();
  res.status(201).send('Task created');
};

export const getTasks = async (req: Request, res: Response) => {
  const tasks = await Task.find();
  res.json(tasks);
};

export const getUserTasks = async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    
    const status = req.query.status;
  
    try {
      const query: any = { assignedTo: userId };
      if (status) {
        query.status = status;
      }
  
      const tasks = await Task.find(query);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving tasks', error: err });
    }
  };

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
  
  res.json(updatedTask);
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Task.findByIdAndDelete(id);
  
  res.send('Task deleted');
};