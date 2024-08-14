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