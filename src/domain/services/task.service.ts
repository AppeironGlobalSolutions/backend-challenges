import { TaskRepository } from '../repositories/task.repository';

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  async createTask(taskData: any) {
    return await this.taskRepository.create(taskData);
  }

  async getTasks(query: any = {}) {
    return await this.taskRepository.find(query);
  }

  async getUserTasks(userId: string, status?: string) {
    const query: any = { assignedTo: userId };
    if (status) {
      query.status = status;
    }
    return await this.taskRepository.find(query);
  }

  async updateTask(id: string, updateData: any) {
    return await this.taskRepository.findByIdAndUpdate(id, updateData);
  }

  async deleteTask(id: string) {
    return await this.taskRepository.findByIdAndDelete(id);
  }
}