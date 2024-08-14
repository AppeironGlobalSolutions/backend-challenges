import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../domain/services/user.service';

const userService = new UserService();

export const registerUser = [
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),
  body('role').isString().notEmpty(),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;

    try {
      await userService.registerUser(username, password, role);
      res.status(201).send('User registered');
    } catch (err: any) {
      res.status(500).json({ message: 'Error registering user', error: err.message });
    }
  }
];

export const loginUser = [
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const { token } = await userService.loginUser(username, password);
      res.json({ token });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
];