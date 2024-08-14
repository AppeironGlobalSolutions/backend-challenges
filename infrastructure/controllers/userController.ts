import { Request, Response } from 'express';
import { User } from '../../domain/entities/user.entity';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    res.status(400).send('Invalid body, please send username, password and his role to register');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, role });
  
  await newUser.save();
  res.status(201).send('User registered');
};

export const loginUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).send('User not found');
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }
  
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'DEFAULT', { expiresIn: '1h' });
  res.json({ token });
};