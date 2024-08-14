import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { TaskService } from '../../domain/services/task.service';

const taskService = new TaskService();

export const createTask = [
  body('title').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('dueDate').isISO8601().toDate(),
  body('status').isIn(['pending', 'in-progress', 'completed']),
  body('projectId').isMongoId(),
  body('assignedTo').isMongoId(),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, status, projectId, assignedTo } = req.body;

    try {
      const task = await taskService.createTask({ title, description, dueDate, status, projectId, assignedTo });
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ message: 'Error creating task', error: err });
    }
  }
];

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving tasks', error: err });
  }
};

export const getUserTasks = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const status = req.query.status;

  try {
    const tasks = await taskService.getUserTasks(userId, status as string);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving tasks', error: err });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updatedTask = await taskService.updateTask(id, req.body);
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: 'Error updating task', error: err });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await taskService.deleteTask(id);
    res.send('Task deleted');
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task', error: err });
  }
};