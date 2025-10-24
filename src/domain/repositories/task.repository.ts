import { Task } from '../entities/task.entity';

export class TaskRepository {
  async create(taskData: any) {
    const task = new Task(taskData);
    return await task.save();
  }

  async find(query: any = {}) {
    return await Task.find(query);
  }

  async findByIdAndUpdate(id: string, updateData: any) {
    return await Task.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findByIdAndDelete(id: string) {
    return await Task.findByIdAndDelete(id);
  }
}