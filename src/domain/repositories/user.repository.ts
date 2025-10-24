import { User } from '../../domain/entities/user.entity';

export class UserRepository {
  async create(userData: any) {
    const user = new User(userData);
    return await user.save();
  }

  async findOne(query: any) {
    return await User.findOne(query);
  }
}