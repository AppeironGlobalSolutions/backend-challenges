import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/user.controller';

export const userRouter = Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);