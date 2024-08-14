import { Request, Response } from 'express';
import { Project } from '../../domain/entities/project.entity';

export const createProject = async (req: Request, res: Response) => {
  const { title, description, dueDate, status } = req.body;
  const newProject = new Project({ title, description, dueDate, status });
  
  await newProject.save();
  res.status(201).send('Project created');
};

export const getProjects = async (req: Request, res: Response) => {
  const projects = await Project.find();
  res.json(projects);
};

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedProject = await Project.findByIdAndUpdate(id, req.body, { new: true });
  
  res.json(updatedProject);
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Project.findByIdAndDelete(id);
  
  res.send('Project deleted');
};

export const getUserProjects = async (req: Request, res: Response) => {
    const projectId = (req as any).user._id;
    const status = req.query.status;

    console.log(req);
    
  
    try {
      const query: any = { projectId };
      if (status) {
        query.status = status;
      }
  
      const projects = await Project.find(query);
      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving projects', error: err });
    }
  };