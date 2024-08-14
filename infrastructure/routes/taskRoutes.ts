import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask, getUserTasks } from '../controllers/taskController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authorizationMiddleware';

export const taskRouter = Router();

taskRouter.post('/', authenticateToken, authorizeRole(['admin', 'user']), createTask);
taskRouter.get('/', authenticateToken, getTasks);
taskRouter.get('/user', authenticateToken, getUserTasks);
taskRouter.put('/:id', authenticateToken, authorizeRole(['admin', 'user']), updateTask);
taskRouter.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteTask);