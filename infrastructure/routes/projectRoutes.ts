import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject } from '../controllers/projectController';

export const projectRouter = Router();

projectRouter.post('/', createProject);
projectRouter.get('/', getProjects);
projectRouter.put('/:id', updateProject);
projectRouter.delete('/:id', deleteProject);