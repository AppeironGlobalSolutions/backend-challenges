import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ProjectService } from '../../domain/services/project.service';

const projectService = new ProjectService();

export const createProject = [
  body('title').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('dueDate').isISO8601().toDate(),
  body('status').isIn(['pending', 'in-progress', 'completed']),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, status } = req.body;

    try {
      await projectService.createProject({ title, description, dueDate, status });
      res.status(201).send('Project created');
    } catch (err) {
      res.status(500).json({ message: 'Error creating project', error: err });
    }
  }
];

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await projectService.getProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving projects', error: err });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updatedProject = await projectService.updateProject(id, req.body);
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: 'Error updating project', error: err });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await projectService.deleteProject(id);
    res.send('Project deleted');
  } catch (err) {
    res.status(500).json({ message: 'Error deleting project', error: err });
  }
};

export const getUserProjects = async (req: Request, res: Response) => {
  const projectId = (req as any).user.projectId;
  const status = req.query.status;

  try {
    const projects = await projectService.getUserProjects(projectId, status as string);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving projects', error: err });
  }
};