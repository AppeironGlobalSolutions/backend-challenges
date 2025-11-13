import { Project } from '../../domain/entities/project.entity';

export class ProjectRepository {
  async create(projectData: any) {
    const project = new Project(projectData);
    return await project.save();
  }

  async find(query: any = {}) {
    return await Project.find(query);
  }

  async findByIdAndUpdate(id: string, updateData: any) {
    return await Project.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findByIdAndDelete(id: string) {
    return await Project.findByIdAndDelete(id);
  }
}