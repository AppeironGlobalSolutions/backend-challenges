import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject, getUserProjects } from '../controllers/projectController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authorizationMiddleware';

export const projectRouter = Router();

projectRouter.post('/', authenticateToken, authorizeRole(['admin', 'user']), createProject);
projectRouter.get('/filtered', authenticateToken, getUserProjects);
projectRouter.get('/', authenticateToken, getProjects);
projectRouter.put('/:id', authenticateToken, authorizeRole(['admin', 'user']), updateProject);
projectRouter.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteProject);