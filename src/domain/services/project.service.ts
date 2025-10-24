import { ProjectRepository } from '../repositories/project.repository';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  async createProject(projectData: any) {
    return await this.projectRepository.create(projectData);
  }

  async getProjects(query: any = {}) {
    return await this.projectRepository.find(query);
  }

  async getUserProjects(projectId: string, status?: string) {
    const query: any = { projectId };
    if (status) {
      query.status = status;
    }
    return await this.projectRepository.find(query);
  }

  async updateProject(id: string, updateData: any) {
    return await this.projectRepository.findByIdAndUpdate(id, updateData);
  }

  async deleteProject(id: string) {
    return await this.projectRepository.findByIdAndDelete(id);
  }
}