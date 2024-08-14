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